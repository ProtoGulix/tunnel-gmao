"""Installation automatique et idempotente de la base (ADR 0002).

Lancé à chaque démarrage du conteneur API, avant uvicorn :

    cd backend && python -m scripts.bootstrap

Variables d'environnement :
    DATABASE_URL_OWNER  rôle propriétaire (migrations, rôles, seeds)
    DATABASE_URL        rôle applicatif, créé ou mis à jour (mot de passe) ici
    ADMIN_EMAIL         email du premier admin (requis tant qu'aucun admin actif n'existe)

Code de sortie 0 si la base est prête, 1 sinon. Relancé sur une base déjà
installée, il ne change rien d'important : pas de nouvel admin, aucune permission modifiée
par un admin n'est réécrite (seules les permissions jamais touchées suivent la matrice par défaut).
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

# Page d'accueil de départ par rôle. Un rôle absent suit la vue par défaut (technicien).
ROLE_HOME_VIEWS = {
    "ADMIN": "direction_technique",
    "RESP": "direction_technique",
    "TECH": "technicien",
    "ACHETEUR": "acheteur",
}


# Tables de journal : le rôle applicatif les lit et y ajoute, sans modifier ni supprimer.
APPEND_ONLY_TABLES = ("audit_log", "permission_audit_log", "security_log")


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
        # Journaux infalsifiables par l'application (ADR 0007, point 6) : ajout seul.
        # Les privilèges par défaut ne sont pas concernés : ils ne portent que sur les
        # tables futures, et ces trois tables existent déjà.
        for table in APPEND_ONLY_TABLES:
            cur.execute(
                sql.SQL("REVOKE UPDATE, DELETE, TRUNCATE ON {} FROM {}").format(
                    sql.Identifier(table), role
                )
            )
    conn.commit()
    say(f"rôle applicatif {app_user} prêt ({verb.lower()}), droits accordés")
    say(f"journaux en ajout seul pour {app_user} : {', '.join(APPEND_ONLY_TABLES)}")


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


def sync_and_apply_default_permissions(conn) -> None:
    """Synchronise le catalogue des endpoints, puis ouvre/ferme les permissions jamais touchées.

    Une permission est « jamais touchée » si permission_audit_log n'a aucune ligne pour
    ce couple rôle/endpoint : api/admin/repo.py y écrit à chaque modification par un admin.
    Idempotent : rejouable à chaque démarrage, une valeur choisie par un admin est conservée.
    """
    from api.app import app
    from api.endpoints_catalog import sync_catalog
    from db.default_permissions import Endpoint, default_allowed

    count = sync_catalog(app.routes, conn)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT tp.id, r.code, tp.allowed, e.code, e.method, e.path, e.module
            FROM tunnel_permission tp
            JOIN tunnel_role r ON r.id = tp.role_id
            JOIN tunnel_endpoint e ON e.id = tp.endpoint_id
            WHERE NOT EXISTS (
                SELECT 1 FROM permission_audit_log pal
                WHERE pal.role_id = tp.role_id AND pal.endpoint_id = tp.endpoint_id
            )
            """
        )
        rows = cur.fetchall()
        opened: dict[str, int] = {}
        closed: dict[str, int] = {}
        to_open, to_close = [], []
        for perm_id, role, current, code, method, path, module in rows:
            wanted = default_allowed(role, Endpoint(code, method, path, module))
            if wanted == current:
                continue
            (to_open if wanted else to_close).append(perm_id)
            counter = opened if wanted else closed
            counter[role] = counter.get(role, 0) + 1
        for ids, value in ((to_open, True), (to_close, False)):
            if ids:
                cur.execute(
                    "UPDATE tunnel_permission SET allowed = %s WHERE id = ANY(%s::uuid[])",
                    (value, ids),
                )
    conn.commit()
    say(f"catalogue synchronisé ({count} endpoints), {len(rows)} permissions jamais modifiées")
    for role in sorted(set(opened) | set(closed)):
        say(
            f"droits par défaut {role} : {opened.get(role, 0)} ouverts, "
            f"{closed.get(role, 0)} fermés"
        )
    if not opened and not closed:
        say("droits par défaut déjà à jour")


def seed_first_install(conn) -> None:
    """Pages d'accueil de départ, une seule fois (avant le premier admin).

    Exécuté seulement tant qu'aucun admin actif n'existe : aucun admin n'a donc pu
    modifier ces réglages, et une instance en service n'est jamais touchée.
    """
    with conn.cursor() as cur:
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
            email = None
            if has_active_admin(conn):
                say("un admin actif existe déjà : rien à créer")
            else:
                email = validate_admin_email(require_env("ADMIN_EMAIL"))
                ensure_admin_email_is_free(conn, email)
            sync_and_apply_default_permissions(conn)
            if email:
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
