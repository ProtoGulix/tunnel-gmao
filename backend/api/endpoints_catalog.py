"""Catalogue des endpoints : UPSERT de tunnel_endpoint depuis les routes FastAPI.

Utilisé par le démarrage de l'API (api.app) et par scripts.bootstrap.
"""

import re


def sync_catalog(routes, conn) -> int:
    """Fait un UPSERT dans tunnel_endpoint pour chaque route et crée les lignes
    tunnel_permission manquantes (allowed=False) pour chaque rôle. Valide la
    transaction et renvoie le nombre d'endpoints synchronisés."""
    upserted = 0
    for route in routes:
        if not hasattr(route, "methods") or not hasattr(route, "path"):
            continue
        path = route.path
        tags = getattr(route, "tags", None) or []
        module = tags[0] if tags else None
        summary = getattr(route, "summary", None) or getattr(route, "name", None)
        operation_id = getattr(route, "name", None) or ""
        is_sensitive = path.startswith("/admin")

        # code = "{module}:{operation_id}" normalisé
        prefix = module or (path.split("/")[1] if path.count("/") >= 1 else "root")
        code_raw = f"{prefix}:{operation_id}"
        code = re.sub(r"[^a-z0-9:_\-]", "_", code_raw.lower())[:100]

        for method in route.methods or {"GET"}:
            endpoint_code = f"{code}_{method.lower()}" if len(route.methods or set()) > 1 else code
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
                    (endpoint_code, method, path, summary, module, is_sensitive),
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
            upserted += 1
    conn.commit()
    return upserted
