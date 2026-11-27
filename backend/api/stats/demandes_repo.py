"""Bilan des demandes à qualifier (ADR 0046) : lecture seule, agrégats SQL.

Stock = demandes `nouvelle` ou `en_attente`. Sortie = première transition vers `acceptee`
ou `rejetee` du journal des statuts. Aucune donnée par personne.
"""

from datetime import date, timedelta
from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.errors.exceptions import raise_db_error

# Statuts du stock : les autres statuts sont des sorties.
STOCK_STATUSES = ("nouvelle", "en_attente")
TOP_EQUIPMENTS = 10

# Tranches d'âge en jours : borne basse incluse, borne haute exclue (None : sans limite).
AGE_BUCKETS = (
    ("lt_7", "< 7 j", 0, 7),
    ("7_30", "7–30 j", 7, 30),
    ("30_90", "30–90 j", 30, 90),
    ("gt_90", "> 90 j", 90, None),
)

# Une ligne par demande existante (une demande supprimée n'y est plus). Le stock suit le statut
# courant ; la date de sortie vient du journal, à défaut de la dernière mise à jour de la
# demande (repli compté dans `has_gap`). `root_id` : équipement racine (site) de la machine.
_REQ_CTE = """
    tree(id, root_id) AS (
        SELECT id, id FROM machine WHERE equipement_mere IS NULL
        UNION ALL
        SELECT m.id, t.root_id FROM machine m JOIN tree t ON m.equipement_mere = t.id
    ),
    req AS (
        SELECT ir.id, ir.machine_id, COALESCE(t.root_id, ir.machine_id) AS root_id,
               ir.created_at,
               st.in_stock,
               CASE WHEN st.in_stock THEN NULL ELSE COALESCE(x.at, ir.updated_at) END AS exit_at,
               CASE WHEN st.in_stock THEN NULL
                    WHEN x.to_status IS NOT NULL THEN x.to_status
                    WHEN ir.statut = 'rejetee' THEN 'rejetee'
                    ELSE 'acceptee' END AS exit_to,
               (st.in_stock = (x.at IS NOT NULL)) AS has_gap
        FROM intervention_request ir
        CROSS JOIN LATERAL (
            SELECT ir.statut = ANY(%s) AS in_stock
        ) st
        LEFT JOIN tree t ON t.id = ir.machine_id
        LEFT JOIN LATERAL (
            SELECT l.date AS at, l.status_to AS to_status
            FROM request_status_log l
            WHERE l.request_id = ir.id AND l.status_to IN ('acceptee', 'rejetee')
            ORDER BY l.date LIMIT 1
        ) x ON TRUE
        WHERE {scope}
    )
"""

_AGE_SQL = "GREATEST(0, FLOOR(EXTRACT(EPOCH FROM now() - req.created_at) / 86400))::int"


def week_starts(today: date, weeks: int) -> List[date]:
    """Lundis des `weeks` dernières semaines ISO, semaine courante comprise, dans l'ordre."""
    monday = today - timedelta(days=today.weekday())
    return [monday - timedelta(weeks=n) for n in range(weeks - 1, -1, -1)]


def bucket_ages(ages: List[int]) -> List[Dict[str, Any]]:
    """Répartit les âges (jours) dans les tranches : count, min_days, max_days (None si vide)."""
    result = []
    for code, label, low, high in AGE_BUCKETS:
        inside = [a for a in ages if a >= low and (high is None or a < high)]
        result.append(
            {
                "code": code,
                "label": label,
                "from_days": low,
                "to_days": high,
                "count": len(inside),
                "min_days": min(inside) if inside else None,
                "max_days": max(inside) if inside else None,
            }
        )
    return result


class DemandesStatsRepository:
    """Lecture du bilan des demandes à qualifier."""

    def _scope(self, site_id: Optional[str]):
        """Filtre sur le site (équipement racine et descendants), vide sans site."""
        if not site_id:
            return "TRUE", []
        # Import lazy : equipements.repo n'est utile qu'à ce filtre
        from api.equipements.repo import EquipementRepository

        return EquipementRepository().machine_scope("ir.machine_id", site_id, True)

    def get_demandes(self, weeks: int, site_id: Optional[str] = None) -> Dict[str, Any]:
        scope_sql, scope_params = self._scope(site_id)
        cte = "WITH RECURSIVE " + _REQ_CTE.replace("{scope}", scope_sql)
        base = [list(STOCK_STATUSES)] + scope_params
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                # Jour courant lu dans la base : les bornes de semaine suivent le fuseau de la
                # session PostgreSQL, comme les conversions ::timestamptz qui les utilisent.
                cur.execute("SELECT current_date")
                starts = week_starts(cur.fetchone()[0], weeks)
                flow = self._flow(cur, cte, base, starts)
                stock_start = self._stock_at(cur, cte, base, starts[0])
                ages = self._ages(cur, cte, base)
                cur.execute(f"{cte} SELECT count(*) FILTER (WHERE has_gap) FROM req", base)
                gaps = cur.fetchone()[0]
                sites = self._where(cur, cte, base, "req.root_id", None)
                equipments = self._where(cur, cte, base, "req.machine_id", TOP_EQUIPMENTS)
            conn.commit()
            return {
                "weeks": weeks,
                "flow": flow,
                "trend": flow[-1]["stock_end"] - stock_start,
                "stock": len(ages),
                "age_buckets": bucket_ages(ages),
                "sites": sites,
                "equipments": equipments,
                "journal_gaps": gaps,
            }
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "bilan des demandes")
        finally:
            if conn:
                release_connection(conn)

    def _flow(self, cur, cte, base, starts: List[date]) -> List[Dict[str, Any]]:
        cur.execute(
            f"""
            {cte}
            SELECT g.d,
                   count(req.id) FILTER (WHERE req.created_at >= g.ws AND req.created_at < g.we),
                   count(req.id) FILTER (WHERE req.exit_to = 'acceptee'
                                         AND req.exit_at >= g.ws AND req.exit_at < g.we),
                   count(req.id) FILTER (WHERE req.exit_to = 'rejetee'
                                         AND req.exit_at >= g.ws AND req.exit_at < g.we),
                   count(req.id) FILTER (WHERE req.created_at < g.we
                                         AND (req.exit_at IS NULL OR req.exit_at >= g.we))
            FROM (
                SELECT d, d::timestamptz AS ws, (d + 7)::timestamptz AS we
                FROM (SELECT %s::date + i * 7 AS d FROM generate_series(0, %s) i) s
            ) g
            LEFT JOIN req ON TRUE
            GROUP BY g.d ORDER BY g.d
            """,
            base + [starts[0], len(starts) - 1],
        )
        return [
            {"week_start": d, "created": c, "accepted": a, "rejected": r, "stock_end": s}
            for d, c, a, r, s in cur.fetchall()
        ]

    def _stock_at(self, cur, cte, base, moment: date) -> int:
        """Stock au début du jour donné (minuit)."""
        cur.execute(
            f"""
            {cte}
            SELECT count(*) FROM req
            WHERE req.created_at < %s::date::timestamptz
              AND (req.exit_at IS NULL OR req.exit_at >= %s::date::timestamptz)
            """,
            base + [moment, moment],
        )
        return cur.fetchone()[0]

    def _ages(self, cur, cte, base) -> List[int]:
        cur.execute(f"{cte} SELECT {_AGE_SQL} FROM req WHERE req.in_stock", base)
        return [row[0] for row in cur.fetchall()]

    def _where(self, cur, cte, base, column: str, limit: Optional[int]) -> List[Dict[str, Any]]:
        """Stock par équipement (`column` en liste blanche : constante du code), du plus chargé."""
        if column not in ("req.root_id", "req.machine_id"):
            raise ValueError(column)
        cur.execute(
            f"""
            {cte}
            SELECT m.id, m.code, m.name, count(*) AS n, max({_AGE_SQL}) AS oldest
            FROM req JOIN machine m ON m.id = {column}
            WHERE req.in_stock
            GROUP BY m.id, m.code, m.name
            ORDER BY n DESC, oldest DESC, m.code
            {"LIMIT %s" if limit else ""}
            """,
            base + ([limit] if limit else []),
        )
        return [
            {"id": str(i), "code": code, "name": name, "count": n, "oldest_days": oldest}
            for i, code, name, n, oldest in cur.fetchall()
        ]
