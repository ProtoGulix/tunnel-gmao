"""Installation automatique et idempotente de la base (ADR 0002).

Lancé à chaque démarrage du conteneur API, avant uvicorn :

    cd backend && python -m scripts.bootstrap

Variables d'environnement :
    DATABASE_URL_OWNER  rôle propriétaire (migrations, rôles, seeds)
    DATABASE_URL        rôle applicatif, créé ou mis à jour (mot de passe) ici
    ADMIN_EMAIL         email du premier admin (requis tant qu'aucun admin actif n'existe)

Code de sortie 0 si la base est prête, 1 sinon. Relancé sur une base déjà
installée, il ne change rien : pas de nouvel admin, aucune permission écrasée.
"""

import os
import secrets
import string
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

import bcrypt
import psycopg2
from psycopg2 import sql
from pydantic import BaseModel, EmailStr, ValidationError

BACKEND_DIR = Path(__file__).resolve().parents[1]
WAIT_SECONDS = 60

# Droits MCP de départ (lecture seule), repris de la base de dev (spike 0001).
MCP_ALLOWED_ENDPOINTS = (
    "action-categories:list_categories",
    "action-categories:get_category",
    "action-categories:get_category_subcategories",
    "dashboard:get_dashboard_summary",
)

# Page d'accueil de départ par rôle. Un rôle absent suit la vue par défaut (technicien).
ROLE_HOME_VIEWS = {
    "ADMIN": "direction_technique",
    "RESP": "direction_technique",
    "TECH": "technicien",
    "ACHETEUR": "acheteur",
}


class BootstrapError(Exception):
    """Erreur d'installation, message destiné à l'opérateur."""


def say(message: str) -> None:
    sys.stdout.write(f"[bootstrap] {message}\n")
    sys.stdout.flush()


def require_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise BootstrapError(f"variable d'environnement {name} manquante")
    return value


def wait_for_database(owner_url: str) -> None:
    """Attend que la base accepte une connexion du rôle propriétaire (60 s max)."""
    deadline = time.monotonic() + WAIT_SECONDS
    while True:
        try:
            psycopg2.connect(owner_url, connect_timeout=5).close()
            say("base joignable")
            return
        except psycopg2.OperationalError as exc:
            if time.monotonic() >= deadline:
                raise BootstrapError(
                    f"base injoignable après {WAIT_SECONDS} s : {str(exc).strip()}"
                ) from exc
            time.sleep(2)


def run_migrations() -> None:
    """alembic upgrade head. env.py lit DATABASE_URL_OWNER en priorité."""
    from alembic.config import Config

    from alembic import command

    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(config, "head")
    say("migrations appliquées (alembic upgrade head)")


def parse_app_credentials(app_url: str) -> tuple[str, str]:
    parsed = urlparse(app_url)
    if not parsed.username or not parsed.password:
        raise BootstrapError("DATABASE_URL doit contenir l'utilisateur et le mot de passe")
    return unquote(parsed.username), unquote(parsed.password)


def ensure_app_role(conn, app_user: str, app_password: str) -> None:
    """Crée ou met à jour le rôle applicatif et lui donne les droits d'exécution."""
    role = sql.Identifier(app_user)
    with conn.cursor() as cur:
        cur.execute("SELECT current_user, current_database()")
        owner, database = cur.fetchone()
        if owner == app_user:
            say("DATABASE_URL utilise le rôle propriétaire : aucun rôle applicatif à créer")
            return
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", (app_user,))
        verb = "ALTER" if cur.fetchone() else "CREATE"
        cur.execute(
            sql.SQL(
                "{} ROLE {} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION "
                "NOBYPASSRLS PASSWORD {}"
            ).format(sql.SQL(verb), role, sql.Literal(app_password))
        )
        owner_id = sql.Identifier(owner)
        statements = [
            "GRANT CONNECT ON DATABASE {db} TO {role}",
            "GRANT USAGE ON SCHEMA public TO {role}",
            "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO {role}",
            "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO {role}",
            "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO {role}",
            # Objets que le propriétaire créera dans de futures migrations.
            "ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA public "
            "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO {role}",
            "ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA public "
            "GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO {role}",
            "ALTER DEFAULT PRIVILEGES FOR ROLE {owner} IN SCHEMA public "
            "GRANT EXECUTE ON FUNCTIONS TO {role}",
        ]
        for statement in statements:
            cur.execute(
                sql.SQL(statement).format(role=role, owner=owner_id, db=sql.Identifier(database))
            )
    conn.commit()
    say(f"rôle applicatif {app_user} prêt ({verb.lower()}), droits accordés")


class _AdminEmail(BaseModel):
    """Même validation que le login (LoginPayload.email) : sinon l'admin créé ne pourrait pas se connecter."""

    email: EmailStr


def validate_admin_email(email: str) -> str:
    try:
        return _AdminEmail(email=email).email
    except ValidationError as exc:
        raise BootstrapError(
            f"ADMIN_EMAIL {email!r} refusé par la validation du login "
            "(les domaines réservés comme .local, .test ou .localhost ne sont pas acceptés)"
        ) from exc


def has_active_admin(conn) -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT 1 FROM tunnel_user u JOIN tunnel_role r ON r.id = u.role_id
            WHERE r.code = 'ADMIN' AND u.is_active LIMIT 1
            """
        )
        return cur.fetchone() is not None


def seed_first_install(conn) -> None:
    """Droits MCP et pages d'accueil de départ, une seule fois (avant le premier admin).

    Exécuté seulement tant qu'aucun admin actif n'existe : aucun admin n'a donc pu
    modifier ces réglages, et une instance en service n'est jamais touchée.
    """
    from api.app import app
    from api.endpoints_catalog import sync_catalog

    count = sync_catalog(app.routes, conn)
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE tunnel_permission tp SET allowed = true
            FROM tunnel_role r, tunnel_endpoint e
            WHERE r.id = tp.role_id AND e.id = tp.endpoint_id
              AND r.code = 'MCP' AND e.code = ANY(%s)
            """,
            (list(MCP_ALLOWED_ENDPOINTS),),
        )
        mcp_updated = cur.rowcount
        for role_code, view in ROLE_HOME_VIEWS.items():
            cur.execute(
                """
                INSERT INTO role_home_view (role_id, home_view)
                SELECT id, %s FROM tunnel_role WHERE code = %s
                ON CONFLICT (role_id) DO NOTHING
                """,
                (view, role_code),
            )
    conn.commit()
    say(f"catalogue synchronisé ({count} endpoints), {mcp_updated} droits MCP en lecture posés")
    say("pages d'accueil par rôle initialisées")


def ensure_admin_email_is_free(conn, email: str) -> None:
    """Vérifié avant toute écriture : un échec ne doit laisser aucune donnée de départ posée."""
    with conn.cursor() as cur:
        cur.execute("SELECT 1 FROM tunnel_user WHERE lower(email) = lower(%s)", (email,))
        if cur.fetchone():
            raise BootstrapError(
                f"ADMIN_EMAIL {email} existe déjà sans être un admin actif : "
                "corriger ce compte ou choisir un autre email"
            )


def create_first_admin(conn, email: str) -> str:
    """Crée l'admin avec un mot de passe aléatoire haché en bcrypt (comme api/admin/repo.py)."""
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(20))
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM tunnel_role WHERE code = 'ADMIN'")
        row = cur.fetchone()
        if not row:
            raise BootstrapError("rôle ADMIN absent : les données de référence manquent")
        cur.execute(
            """
            INSERT INTO tunnel_user (email, password_hash, first_name, last_name, initial, role_id)
            VALUES (%s, %s, 'Administrateur', NULL, 'ADM', %s)
            """,
            (email, password_hash, row[0]),
        )
    conn.commit()
    return password


def announce_admin(email: str, password: str) -> None:
    sys.stdout.write(
        "\n"
        "==============================================================\n"
        " PREMIER ADMINISTRATEUR CRÉÉ : notez ce mot de passe maintenant,\n"
        " il ne sera plus jamais affiché. Changez-le après la connexion.\n"
        f"   email        : {email}\n"
        f"   mot de passe : {password}\n"
        "==============================================================\n\n"
    )
    sys.stdout.flush()


def main() -> int:
    try:
        owner_url = require_env("DATABASE_URL_OWNER")
        app_url = require_env("DATABASE_URL")
        app_user, app_password = parse_app_credentials(app_url)
        wait_for_database(owner_url)
        run_migrations()
        conn = psycopg2.connect(owner_url)
        try:
            ensure_app_role(conn, app_user, app_password)
            if has_active_admin(conn):
                say("un admin actif existe déjà : rien à créer")
            else:
                email = validate_admin_email(require_env("ADMIN_EMAIL"))
                ensure_admin_email_is_free(conn, email)
                seed_first_install(conn)
                announce_admin(email, create_first_admin(conn, email))
        finally:
            conn.close()
    except BootstrapError as exc:
        sys.stderr.write(f"[bootstrap] ERREUR : {exc}\n")
        return 1
    except Exception as exc:  # message court pour l'opérateur, détail dans la trace
        sys.stderr.write(f"[bootstrap] ERREUR inattendue : {type(exc).__name__}: {exc}\n")
        return 1
    say("base prête")
    return 0


if __name__ == "__main__":
    sys.exit(main())
