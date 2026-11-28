"""Interventions bloquées (ADR 0047) : lecture seule, une cause par groupe.

`attente_pieces` : cause = demandes d'achat liées. `attente_prod` : cause = note du passage.
Aucune donnée par personne.
"""

from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.errors.exceptions import raise_db_error
from api.settings import settings

STATUS_PARTS = "attente_pieces"
STATUS_PRODUCTION = "attente_prod"

# Notes du journal écrites par la base (déclencheurs de intervention_status_log) : ce ne sont
# pas des notes humaines, on ne les renvoie jamais comme cause.
SYSTEM_NOTES = ("Changement statut automatique", "Création intervention")

# Compteurs de demandes d'achat : clé de l'API -> statut dérivé (vue purchase_request_derived_status),
# mêmes statuts que `stats.purchase_requests` de la liste des interventions. Valeurs fixes du
# code, jamais issues de l'utilisateur : elles sont injectées dans le SQL.
PURCHASE_COUNTERS = (
    ("received", "RECEIVED"),
    ("to_qualify", "TO_QUALIFY"),
    ("no_supplier_ref", "NO_SUPPLIER_REF"),
    ("pending_dispatch", "PENDING_DISPATCH"),
    ("rejected", "REJECTED"),
    ("consultation", "CONSULTATION"),
    ("partial", "PARTIAL"),
    ("ordered", "ORDERED"),
    ("quoted", "QUOTED"),
    ("open", "OPEN"),
)

# Durée révolue dans le statut, en jours, sur l'heure locale de la session (le journal stocke
# NOW() dans un timestamp sans fuseau).
_DAYS_SQL = "FLOOR(EXTRACT(EPOCH FROM localtimestamp - since.at) / 86400)::int"


def _purchase_lateral() -> str:
    filters = ",\n".join(
        f"COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = '{status}') AS pr_{key}"
        for key, status in PURCHASE_COUNTERS
    )
    return f"""
        LEFT JOIN LATERAL (
            SELECT COUNT(DISTINCT prd.id) AS pr_total, {filters}
            FROM intervention_action_purchase_request iapr
            JOIN intervention_action ia ON ia.id = iapr.intervention_action_id
            JOIN purchase_request_derived_status prd ON prd.id = iapr.purchase_request_id
            WHERE ia.intervention_id = i.id
        ) pr ON TRUE
    """


def clean_note(note: Optional[str]) -> Optional[str]:
    """Note humaine du passage dans le statut, sinon None (vide ou écrite par la base)."""
    text = (note or "").strip()
    return None if not text or text in SYSTEM_NOTES else text


class BlocagesStatsRepository:
    """Interventions en attente de pièces ou de production depuis au moins N jours."""

    def _scope(self, site_id: Optional[str]):
        """Filtre sur le site (équipement racine et descendants), vide sans site."""
        if not site_id:
            return "TRUE", []
        # Import lazy : equipements.repo n'est utile qu'à ce filtre
        from api.equipements.repo import EquipementRepository

        return EquipementRepository().machine_scope("i.machine_id", site_id, True)

    def get_blocages(self, site_id: Optional[str] = None) -> Dict[str, Any]:
        threshold = settings.BLOCKED_ALERT_DAYS
        scope_sql, scope_params = self._scope(site_id)
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                parts = self._fetch(cur, STATUS_PARTS, threshold, scope_sql, scope_params, True)
                production = self._fetch(
                    cur, STATUS_PRODUCTION, threshold, scope_sql, scope_params, False
                )
            conn.commit()
            return {"threshold_days": threshold, "parts": parts, "production": production}
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "interventions bloquées")
        finally:
            if conn:
                release_connection(conn)

    def _fetch(
        self, cur, status: str, threshold: int, scope_sql: str, scope_params: list, with_prs: bool
    ) -> List[Dict[str, Any]]:
        """Un groupe, trié : `urgent` d'abord, puis durée décroissante, puis code.

        Borne : `days_in_status >= threshold` (jours révolus, seuil inclus).
        `since` : dernière ligne du journal vers le statut courant, à défaut `reported_date`.
        """
        pr_cols = ", pr.pr_total" + "".join(f", pr.pr_{k}" for k, _ in PURCHASE_COUNTERS)
        cur.execute(
            f"""
            SELECT i.id, i.code, i.title, i.priority,
                   m.id, m.code, m.name,
                   since.at, {_DAYS_SQL} AS days, since.notes
                   {pr_cols if with_prs else ""}
            FROM intervention i
            LEFT JOIN machine m ON m.id = i.machine_id
            LEFT JOIN LATERAL (
                SELECT l.date AS at, l.notes
                FROM intervention_status_log l
                WHERE l.intervention_id = i.id AND l.status_to = i.status_actual
                ORDER BY l.date DESC NULLS LAST LIMIT 1
            ) log ON TRUE
            CROSS JOIN LATERAL (
                SELECT COALESCE(log.at, i.reported_date::timestamp) AS at,
                       CASE WHEN log.at IS NULL THEN NULL ELSE log.notes END AS notes
            ) since
            {_purchase_lateral() if with_prs else ""}
            WHERE i.status_actual = %s
              AND since.at IS NOT NULL
              AND {_DAYS_SQL} >= %s
              AND {scope_sql}
            ORDER BY COALESCE(i.priority = 'urgent', FALSE) DESC, days DESC, i.code
            """,
            [status, threshold] + scope_params,
        )
        return [self._item(row, with_prs) for row in cur.fetchall()]

    @staticmethod
    def _item(row, with_prs: bool) -> Dict[str, Any]:
        iid, code, title, priority, mid, mcode, mname, since, days, note = row[:10]
        item = {
            "id": str(iid),
            "code": code,
            "title": title,
            "equipement": None if mid is None else {"id": str(mid), "code": mcode, "name": mname},
            "priority": priority,
            "status_since": since,
            "days_in_status": days,
        }
        if with_prs:
            keys = ["total"] + [k for k, _ in PURCHASE_COUNTERS]
            item["purchase_requests"] = {k: int(v or 0) for k, v in zip(keys, row[10:])}
        else:
            item["note"] = clean_note(note)
        return item
