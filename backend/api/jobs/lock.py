"""Verrou inter-processus du passage quotidien (ADR 0023, point 1).

L'API tourne avec plusieurs processus, chacun lance la boucle : un passage commence par
pg_try_advisory_lock sur une clé constante, et celui qui ne l'obtient pas ne fait rien.
Le verrou est lié à une session : il est tenu par une connexion dédiée, rendue au pool
après le déverrouillage ; si le processus meurt, la base libère le verrou avec la session.
Les deux fonctions sont bloquantes (à lancer dans le threadpool).
"""

from __future__ import annotations

import logging

from api.db import get_connection, release_connection

logger = logging.getLogger(__name__)

# Clé arbitraire et constante, propre à cette tâche (« TUNL » + 1).
DAILY_JOB_LOCK_KEY = 0x54554E4C01


def acquire_daily_lock():
    """Retourne la connexion qui tient le verrou, ou None si un autre passage le tient."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_try_advisory_lock(%s)", (DAILY_JOB_LOCK_KEY,))
            acquired = bool(cur.fetchone()[0])
        # Le verrou de session survit au commit ; la transaction ouverte par le SELECT non.
        conn.commit()
    except Exception:
        release_connection(conn)
        raise
    if not acquired:
        release_connection(conn)
        return None
    return conn


def release_daily_lock(conn) -> None:
    """Libère le verrou puis rend la connexion au pool."""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_unlock(%s)", (DAILY_JOB_LOCK_KEY,))
        conn.commit()
    except Exception:
        # Connexion cassée : la fermer libère le verrou côté serveur.
        logger.exception("Déverrouillage du passage quotidien impossible")
        try:
            conn.close()
        except Exception:
            pass
    finally:
        release_connection(conn)
