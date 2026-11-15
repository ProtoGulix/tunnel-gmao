"""Catalogue des endpoints : UPSERT de tunnel_endpoint depuis les routes FastAPI.

Utilisé par le démarrage de l'API (api.app) et par scripts.bootstrap.
"""

import logging
import re

logger = logging.getLogger(__name__)


def endpoint_code(route, method: str) -> str:
    """Code d'endpoint d'une route FastAPI pour une méthode HTTP.

    Source unique : utilisé par la synchronisation du catalogue et par le contrôle
    des droits (ADR 0007), pour que les deux produisent exactement les mêmes codes.
    Format : "{tag ou 1er segment du chemin}:{nom de la fonction}", en minuscules,
    caractères hors [a-z0-9:_-] remplacés par "_", tronqué à 100 ; suffixé par
    "_{méthode}" si la route déclare plusieurs méthodes.
    """
    path = route.path
    tags = getattr(route, "tags", None) or []
    module = tags[0] if tags else None
    operation_id = getattr(route, "name", None) or ""
    prefix = module or (path.split("/")[1] if path.count("/") >= 1 else "root")
    code_raw = f"{prefix}:{operation_id}"
    code = re.sub(r"[^a-z0-9:_\-]", "_", code_raw.lower())[:100]
    return f"{code}_{method.lower()}" if len(route.methods or set()) > 1 else code


def purge_removed_endpoints(codes, conn) -> int:
    """Supprime de tunnel_endpoint les endpoints absents du code (`codes` = codes des
    routes actuelles) et leurs lignes tunnel_permission (aucune clé étrangère en base :
    suppression explicite). Ne valide pas la transaction ; renvoie le nombre d'endpoints
    retirés. L'historique permission_audit_log est conservé."""
    codes = list(codes)
    if not codes:
        # Liste vide = application mal chargée, jamais un catalogue vide voulu : on ne
        # purge rien plutôt que d'effacer toute la matrice des droits.
        logger.warning("purge_removed_endpoints : aucune route fournie, purge ignorée")
        return 0
    with conn.cursor() as cur:
        cur.execute(
            """
            DELETE FROM tunnel_permission
            WHERE endpoint_id IN (SELECT id FROM tunnel_endpoint WHERE code <> ALL(%s))
            """,
            (codes,),
        )
        cur.execute("DELETE FROM tunnel_endpoint WHERE code <> ALL(%s)", (codes,))
        return cur.rowcount or 0


def sync_catalog(routes, conn) -> int:
    """Fait un UPSERT dans tunnel_endpoint pour chaque route, crée les lignes
    tunnel_permission manquantes (allowed=False) pour chaque rôle et retire les
    endpoints disparus du code avec leurs droits. Valide la transaction et renvoie le
    nombre d'endpoints synchronisés."""
    upserted = 0
    current_codes = []
    for route in routes:
        if not hasattr(route, "methods") or not hasattr(route, "path"):
            continue
        path = route.path
        tags = getattr(route, "tags", None) or []
        module = tags[0] if tags else None
        summary = getattr(route, "summary", None) or getattr(route, "name", None)
        is_sensitive = path.startswith("/admin")

        for method in route.methods or {"GET"}:
            code = endpoint_code(route, method)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO tunnel_endpoint
                        (code, method, path, description, module, is_sensitive)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (code) DO UPDATE SET
                        method       = EXCLUDED.method,
                        path         = EXCLUDED.path,
                        description  = EXCLUDED.description,
                        module       = EXCLUDED.module,
                        is_sensitive = EXCLUDED.is_sensitive
                    RETURNING id
                    """,
                    (code, method, path, summary, module, is_sensitive),
                )
                row = cur.fetchone()
                if row:
                    endpoint_id = row[0]
                    # Créer les permissions manquantes pour chaque rôle (allowed=False par défaut)
                    cur.execute(
                        """
                        INSERT INTO tunnel_permission (role_id, endpoint_id, allowed)
                        SELECT tr.id, %s::uuid, false
                        FROM tunnel_role tr
                        WHERE NOT EXISTS (
                            SELECT 1 FROM tunnel_permission tp
                            WHERE tp.role_id = tr.id AND tp.endpoint_id = %s::uuid
                        )
                        """,
                        (endpoint_id, endpoint_id),
                    )
            current_codes.append(code)
            upserted += 1
    removed = purge_removed_endpoints(current_codes, conn)
    if removed:
        logger.info("sync_catalog : %d endpoints disparus du code retirés du catalogue", removed)
    conn.commit()
    return upserted
