import logging
from contextlib import nullcontext
from datetime import date
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import HTTPException

from api.audits.events import record_audit_event, system_reason_code
from api.constants import CLOSED_STATUS_CODE, PRIORITY_TYPES
from api.db import get_connection, release_connection
from api.equipements.repo import EquipementRepository
from api.errors.exceptions import (
    ConflictError,
    DatabaseError,
    NotFoundError,
    ValidationError,
    raise_db_error,
)
from api.intervention_actions.repo import InterventionActionRepository
from api.intervention_status_log.repo import InterventionStatusLogRepository
from api.intervention_tasks.validators import task_delete_blocker
from api.interventions.types import check_allowed_for_machine, check_assignable, check_known
from api.interventions.validators import is_intervention_locked, is_reopening
from api.preventive_occurrences.cascade import attach_occurrence
from api.utils.search import build_search_clause
from api.utils.status_log import skip_request_status_log


def _request_routine_reason() -> str:
    """Motif de la règle d'audit routinière des demandes (table audit_rule)."""
    from api.utils.audit import resolve_reason_code

    rule = resolve_reason_code("request", [])
    if rule is None or not rule.get("default_reason_code"):
        raise DatabaseError("Aucune règle d'audit routinière pour les demandes")
    return rule["default_reason_code"]


# Issues de la demande liée à la suppression d'une intervention (ADR 0019).
REQUEST_OUTCOMES = ("reopen", "delete")

logger = logging.getLogger(__name__)

# LATERAL join pour récupérer la liste complète des tâches d'une intervention
_TASKS_JSON_LATERAL = """
    LEFT JOIN LATERAL (
        SELECT COALESCE(
            json_agg(
                json_build_object(
                    'id',            it.id,
                    'intervention_id', it.intervention_id,
                    'label',         it.label,
                    'origin',        it.origin,
                    'status',        it.status,
                    'optional',      it.optional,
                    'due_date',      it.due_date,
                    'sort_order',    it.sort_order,
                    'skip_reason',   it.skip_reason,
                    'gamme_step_id', it.gamme_step_id,
                    'occurrence_id', it.occurrence_id,
                    'closed_by',     it.closed_by,
                    'created_by',    it.created_by,
                    'created_at',    it.created_at,
                    'updated_at',    it.updated_at,
                    'action_count',  COALESCE(tagg.action_count, 0),
                    'time_spent',    COALESCE(tagg.time_spent, 0.0),
                    'assigned_to',   CASE WHEN u.id IS NOT NULL THEN json_build_object(
                        'id',         u.id,
                        'first_name', u.first_name,
                        'last_name',  u.last_name,
                        'email',      u.email,
                        'initial',    u.initial
                    ) END
                )
                ORDER BY it.sort_order, it.created_at
            ),
            '[]'::json
        ) AS tasks_json
        FROM intervention_task it
        LEFT JOIN tunnel_user u ON u.id = it.assigned_to
        LEFT JOIN LATERAL (
            SELECT
                COUNT(DISTINCT iat.action_id) AS action_count,
                COALESCE(SUM(ia.time_spent), 0) AS time_spent
            FROM intervention_action_task iat
            INNER JOIN intervention_action ia ON ia.id = iat.action_id
            WHERE iat.task_id = it.id
        ) tagg ON TRUE
        WHERE it.intervention_id = i.id
    ) it_agg ON TRUE
"""


class InterventionRepository:
    """Requêtes pour le domaine interventions"""

    def _get_connection(self):
        return get_connection()

    @staticmethod
    def _type_and_date_filters(
        types: List[str] | None, reported_from: date | None, reported_to: date | None
    ) -> tuple[List[str], List[Any]]:
        """Filtres type_inter (codes vérifiés dans la table intervention_type) et reported_date (bornes incluses).

        Lève ValidationError (400) pour un type inconnu ou une période inversée."""
        clauses: List[str] = []
        params: List[Any] = []
        if types:
            check_known(types)
            clauses.append(f"i.type_inter IN ({','.join(['%s'] * len(types))})")
            params.extend(types)
        if reported_from and reported_to and reported_from > reported_to:
            raise ValidationError("reported_from doit précéder reported_to")
        if reported_from:
            clauses.append("i.reported_date >= %s")
            params.append(reported_from)
        if reported_to:
            clauses.append("i.reported_date <= %s")
            params.append(reported_to)
        return clauses, params

    def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        search: str | None = None,
        equipement_id: str | None = None,
        statuses: List[str] | None = None,
        priorities: List[str] | None = None,
        sort: str | None = None,
        include_stats: bool = True,
        include_tasks: bool = False,
        printed: bool | None = None,
        tech_id: str | None = None,
        include_descendants: bool = False,
        types: List[str] | None = None,
        reported_from: date | None = None,
        reported_to: date | None = None,
    ) -> List[Dict[str, Any]]:
        """Récupère interventions avec filtres/sort et stats calculées en SQL (sans actions)"""
        # Garde-fou: limit max 1000
        limit = min(limit, 1000)

        # Valider priorités via PRIORITY_TYPES (source de vérité unique)
        priorities_norm = None
        if priorities:
            allowed_ids = {p['id'] for p in PRIORITY_TYPES}
            priorities_norm = [p for p in priorities if p in allowed_ids]

        # Construire SQL
        where_clauses = []
        params: List[Any] = []
        joins = []

        if search:
            clause, search_params = build_search_clause(
                search,
                ["i.code ILIKE %s", "i.title ILIKE %s", "m.code ILIKE %s", "m.name ILIKE %s"],
            )
            where_clauses.append(clause)
            params.extend(search_params)

        if equipement_id:
            # include_descendants : l'équipement et toutes ses filles (ADR 0011, 2.4)
            scope_sql, scope_params = EquipementRepository().machine_scope(
                "i.machine_id", equipement_id, include_descendants
            )
            where_clauses.append(scope_sql)
            params.extend(scope_params)

        if statuses and len(statuses) > 0:
            placeholders = ",".join(["%s"] * len(statuses))
            where_clauses.append(f"LOWER(i.status_actual) IN ({placeholders})")
            params.extend([s.lower() for s in statuses])

        if priorities_norm and len(priorities_norm) > 0:
            placeholders = ",".join(["%s"] * len(priorities_norm))
            where_clauses.append(f"i.priority IN ({placeholders})")
            params.extend(priorities_norm)

        if printed is not None:
            where_clauses.append("i.printed_fiche = %s")
            params.append(printed)

        if tech_id:
            where_clauses.append("i.tech_id = %s")
            params.append(tech_id)

        extra_clauses, extra_params = self._type_and_date_filters(types, reported_from, reported_to)
        where_clauses.extend(extra_clauses)
        params.extend(extra_params)

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        # Tri
        order_sql_parts = []
        if sort:
            for item in [s.strip() for s in sort.split(',') if s.strip()]:
                desc = item.startswith('-')
                key = item[1:] if desc else item
                if key == 'reported_date':
                    order_sql_parts.append(f"i.reported_date {'DESC' if desc else 'ASC'}")
                elif key == 'priority':
                    # Tri de sévérité: urgent > important > normal > faible
                    case_expr = (
                        "CASE i.priority "
                        "WHEN 'urgent' THEN 0 "
                        "WHEN 'important' THEN 1 "
                        "WHEN 'normal' THEN 2 "
                        "WHEN 'faible' THEN 3 "
                        "ELSE 4 END"
                    )
                    order_sql_parts.append(f"{case_expr} {'ASC' if desc else 'DESC'}")
                elif key == 'next_due_date':
                    # NULLS LAST : interventions sans tâches avec due_date toujours en fin
                    order_sql_parts.append(
                        f"task_agg.next_due_date {'DESC' if desc else 'ASC'} NULLS LAST"
                    )
        if not order_sql_parts:
            order_sql_parts.append("i.reported_date DESC")
        order_sql = " ORDER BY " + ", ".join(order_sql_parts)

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            query = f"""
                SELECT
                    i.*,
                    ir.id        AS req_id,
                    ir.code      AS req_code,
                    ir.demandeur_nom, ir.demandeur_service_legacy AS demandeur_service, ir.description AS req_description,
                    ir.statut    AS req_statut,
                    rs2.label    AS req_statut_label,
                    rs2.color    AS req_statut_color,
                    ir.intervention_id AS req_intervention_id,
                    ir.is_system AS req_is_system,
                    ir.created_at AS req_created_at,
                    ir.updated_at AS req_updated_at,
                    m.code as m_code, m.name as m_name,
                    pm.id   AS m_parent_id,
                    pm.code AS m_parent_code,
                    pm.name AS m_parent_name,
                    ec.id as ec_id, ec.code as ec_code, ec.label as ec_label,
                    COALESCE(SUM(ia.time_spent), 0) as total_time,
                    COUNT(DISTINCT ia.id) as action_count,
                    ROUND(AVG(ia.complexity_score)::numeric, 2)::float as avg_complexity,
                    task_agg.task_total,
                    task_agg.task_todo,
                    task_agg.task_in_progress,
                    task_agg.task_done,
                    task_agg.task_skipped,
                    task_agg.task_blocking_pending,
                    task_agg.next_due_date,
                    pr_agg.pr_total,
                    pr_agg.pr_received,
                    pr_agg.pr_to_qualify,
                    pr_agg.pr_no_supplier_ref,
                    pr_agg.pr_pending_dispatch,
                    pr_agg.pr_rejected,
                    pr_agg.pr_consultation,
                    pr_agg.pr_partial,
                    pr_agg.pr_ordered,
                    pr_agg.pr_quoted,
                    pr_agg.pr_open
                    {', it_agg.tasks_json::text AS tasks_json' if include_tasks else ''}
                FROM intervention i
                LEFT JOIN intervention_request ir ON ir.intervention_id = i.id
                LEFT JOIN request_status_ref rs2 ON rs2.code = ir.statut
                LEFT JOIN machine m ON i.machine_id = m.id
                LEFT JOIN machine pm ON pm.id = m.equipement_mere
                LEFT JOIN equipement_class ec ON ec.id = m.equipement_class_id
                LEFT JOIN intervention_action ia ON i.id = ia.intervention_id
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(*)                                                          AS task_total,
                        COUNT(*) FILTER (WHERE status = 'todo')                          AS task_todo,
                        COUNT(*) FILTER (WHERE status = 'in_progress')                   AS task_in_progress,
                        COUNT(*) FILTER (WHERE status = 'done')                          AS task_done,
                        COUNT(*) FILTER (WHERE status = 'skipped')                       AS task_skipped,
                        COUNT(*) FILTER (WHERE status IN ('todo','in_progress')
                                         AND optional = FALSE)                           AS task_blocking_pending,
                        MIN(due_date)                                                     AS next_due_date
                    FROM intervention_task
                    WHERE intervention_id = i.id
                ) task_agg ON TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        COUNT(DISTINCT prd.id)                                                                  AS pr_total,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'RECEIVED')                  AS pr_received,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'TO_QUALIFY')                AS pr_to_qualify,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'NO_SUPPLIER_REF')           AS pr_no_supplier_ref,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'PENDING_DISPATCH')          AS pr_pending_dispatch,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'REJECTED')                  AS pr_rejected,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'CONSULTATION')              AS pr_consultation,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'PARTIAL')                   AS pr_partial,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'ORDERED')                   AS pr_ordered,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'QUOTED')                    AS pr_quoted,
                        COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'OPEN')                      AS pr_open
                    FROM intervention_action_purchase_request iapr2
                    INNER JOIN intervention_action ia2 ON ia2.id = iapr2.intervention_action_id
                    INNER JOIN purchase_request_derived_status prd ON prd.id = iapr2.purchase_request_id
                    WHERE ia2.intervention_id = i.id
                ) pr_agg ON TRUE
                {_TASKS_JSON_LATERAL if include_tasks else ''}
                {" ".join(joins)}
                {where_sql}
                GROUP BY i.id, ir.id, ir.code, ir.demandeur_nom, ir.demandeur_service_legacy, ir.description, ir.statut, rs2.label, rs2.color, ir.intervention_id, ir.created_at, ir.updated_at, m.id, pm.id, pm.code, pm.name, ec.id, task_agg.task_total, task_agg.task_todo, task_agg.task_in_progress, task_agg.task_done, task_agg.task_skipped, task_agg.task_blocking_pending, task_agg.next_due_date, pr_agg.pr_total, pr_agg.pr_received, pr_agg.pr_to_qualify, pr_agg.pr_no_supplier_ref, pr_agg.pr_pending_dispatch, pr_agg.pr_rejected, pr_agg.pr_consultation, pr_agg.pr_partial, pr_agg.pr_ordered, pr_agg.pr_quoted, pr_agg.pr_open
                {',' + 'it_agg.tasks_json::text' if include_tasks else ''}
                {order_sql}
                LIMIT %s OFFSET %s
            """
            cur.execute(query, (*params, limit, offset))
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]

            raw_rows = [dict(zip(cols, row)) for row in rows]

            # Logique health centralisée des équipements.
            equipement_repo = EquipementRepository()
            equipement_ids = [
                str(r['machine_id']) for r in raw_rows if r.get('machine_id') is not None
            ]
            health_map = equipement_repo.get_health_map(cur, equipement_ids)

            result = []
            for row_dict in raw_rows:
                # Construire l'objet equipement depuis les colonnes préfixées
                if row_dict.get('machine_id') is not None:
                    machine_id = str(row_dict.get('machine_id'))
                    health = health_map.get(
                        machine_id,
                        {
                            'level': 'ok',
                            'reason': 'Aucune intervention ouverte',
                            'open_interventions_count': 0,
                            'urgent_count': 0,
                            'open_requests_count': 0,
                            'new_requests_count': 0,
                            'request_status_counts': {},
                            'open_tasks_count': 0,
                            'overdue_tasks_count': 0,
                            'unassigned_tasks_count': 0,
                            'open_purchase_requests_count': 0,
                            'purchase_request_status_counts': {},
                            'has_affectation': False,
                            'rules_triggered': [],
                        },
                    )

                    ec_id = row_dict.pop('ec_id', None)
                    ec_code = row_dict.pop('ec_code', None)
                    ec_label = row_dict.pop('ec_label', None)

                    p_id = row_dict.pop('m_parent_id', None)
                    p_code = row_dict.pop('m_parent_code', None)
                    p_name = row_dict.pop('m_parent_name', None)

                    row_dict['equipements'] = {
                        'id': row_dict.pop('machine_id'),
                        'code': row_dict.pop('m_code', None),
                        'name': row_dict.pop('m_name', None),
                        'health': health,
                        'parent': {'id': p_id, 'code': p_code, 'name': p_name} if p_id else None,
                        'equipement_class': {'id': ec_id, 'code': ec_code, 'label': ec_label}
                        if ec_id
                        else None,
                    }
                else:
                    row_dict['equipements'] = None
                    for key in list(row_dict.keys()):
                        if key.startswith('m_') or key.startswith('ec_'):
                            row_dict.pop(key)

                # Créer l'objet stats si demandé
                if include_stats:
                    pr_total = int(row_dict.pop('pr_total', 0) or 0)
                    pr_received = int(row_dict.pop('pr_received', 0) or 0)
                    row_dict['stats'] = {
                        'action_count': row_dict.pop('action_count', 0),
                        'total_time': row_dict.pop('total_time', 0),
                        'avg_complexity': row_dict.pop('avg_complexity', None),
                        'purchase_count': pr_total,
                        'tasks': {
                            'total': int(row_dict.pop('task_total', 0) or 0),
                            'todo': int(row_dict.pop('task_todo', 0) or 0),
                            'in_progress': int(row_dict.pop('task_in_progress', 0) or 0),
                            'done': int(row_dict.pop('task_done', 0) or 0),
                            'skipped': int(row_dict.pop('task_skipped', 0) or 0),
                            'blocking_pending': int(row_dict.pop('task_blocking_pending', 0) or 0),
                        },
                        'purchase_requests': {
                            'total': pr_total,
                            'received': pr_received,
                            'to_qualify': int(row_dict.pop('pr_to_qualify', 0) or 0),
                            'no_supplier_ref': int(row_dict.pop('pr_no_supplier_ref', 0) or 0),
                            'pending_dispatch': int(row_dict.pop('pr_pending_dispatch', 0) or 0),
                            'rejected': int(row_dict.pop('pr_rejected', 0) or 0),
                            'consultation': int(row_dict.pop('pr_consultation', 0) or 0),
                            'partial': int(row_dict.pop('pr_partial', 0) or 0),
                            'ordered': int(row_dict.pop('pr_ordered', 0) or 0),
                            'quoted': int(row_dict.pop('pr_quoted', 0) or 0),
                            'open': int(row_dict.pop('pr_open', 0) or 0),
                        },
                    }
                else:
                    # Nettoyer les colonnes stats si non demandées
                    for _k in (
                        'action_count',
                        'total_time',
                        'avg_complexity',
                        'task_total',
                        'task_todo',
                        'task_in_progress',
                        'task_done',
                        'task_skipped',
                        'task_blocking_pending',
                        'pr_total',
                        'pr_received',
                        'pr_to_qualify',
                        'pr_no_supplier_ref',
                        'pr_pending_dispatch',
                        'pr_rejected',
                        'pr_consultation',
                        'pr_partial',
                        'pr_ordered',
                        'pr_quoted',
                        'pr_open',
                    ):
                        row_dict.pop(_k, None)

                # Champs de planification — toujours présents quelle que soit include_stats
                next_due_date = row_dict.pop('next_due_date', None)
                row_dict['next_due_date'] = next_due_date
                row_dict['overdue'] = next_due_date is not None and next_due_date < date.today()

                # Construire l'objet request depuis les colonnes préfixées req_
                req_id = row_dict.pop('req_id', None)
                if req_id is not None:
                    row_dict['request'] = {
                        'id': req_id,
                        'code': row_dict.pop('req_code', None),
                        'demandeur_nom': row_dict.pop('demandeur_nom', None),
                        'demandeur_service': row_dict.pop('demandeur_service', None),
                        'description': row_dict.pop('req_description', None),
                        'statut': row_dict.pop('req_statut', None),
                        'statut_label': row_dict.pop('req_statut_label', None),
                        'statut_color': row_dict.pop('req_statut_color', None),
                        'intervention_id': row_dict.pop('req_intervention_id', None),
                        'is_system': row_dict.pop('req_is_system', False),
                        'created_at': row_dict.pop('req_created_at', None),
                        'updated_at': row_dict.pop('req_updated_at', None),
                        'equipement': None,
                    }
                else:
                    row_dict['request'] = None
                    for key in [
                        'req_code',
                        'demandeur_nom',
                        'demandeur_service',
                        'req_description',
                        'req_statut',
                        'req_statut_label',
                        'req_statut_color',
                        'req_intervention_id',
                        'req_is_system',
                        'req_created_at',
                        'req_updated_at',
                    ]:
                        row_dict.pop(key, None)

                row_dict['is_locked'] = is_intervention_locked(row_dict.get('status_actual'))
                row_dict['actions'] = []  # Vide pour get_all
                row_dict['status_logs'] = []  # Vide pour get_all

                # Tâches détaillées — uniquement si include_tasks=True
                if include_tasks:
                    raw_tasks = row_dict.pop('tasks_json', None)
                    if isinstance(raw_tasks, str):
                        import json as _json

                        raw_tasks = _json.loads(raw_tasks)
                    row_dict['tasks'] = raw_tasks or []
                    for task in row_dict['tasks']:
                        task['can_delete'] = (
                            task_delete_blocker(
                                task.get('status'),
                                int(task.get('action_count') or 0),
                                row_dict['is_locked'],
                            )
                            is None
                        )
                else:
                    row_dict.pop('tasks_json', None)

                result.append(row_dict)

            return result
        except HTTPException:
            raise
        except Exception as e:
            raise_db_error(e, "opération")
        finally:
            release_connection(conn)

    def count_all(
        self,
        search: str | None = None,
        equipement_id: str | None = None,
        statuses: List[str] | None = None,
        priorities: List[str] | None = None,
        printed: bool | None = None,
        tech_id: str | None = None,
        include_descendants: bool = False,
        types: List[str] | None = None,
        reported_from: date | None = None,
        reported_to: date | None = None,
    ) -> int:
        """Compte le nombre total d'interventions correspondant aux filtres de get_all()"""
        priorities_norm = None
        if priorities:
            allowed_ids = {p['id'] for p in PRIORITY_TYPES}
            priorities_norm = [p for p in priorities if p in allowed_ids]

        where_clauses = []
        params: List[Any] = []

        if search:
            clause, search_params = build_search_clause(
                search,
                ["i.code ILIKE %s", "i.title ILIKE %s", "m.code ILIKE %s", "m.name ILIKE %s"],
            )
            where_clauses.append(clause)
            params.extend(search_params)

        if equipement_id:
            # include_descendants : l'équipement et toutes ses filles (ADR 0011, 2.4)
            scope_sql, scope_params = EquipementRepository().machine_scope(
                "i.machine_id", equipement_id, include_descendants
            )
            where_clauses.append(scope_sql)
            params.extend(scope_params)

        if statuses and len(statuses) > 0:
            placeholders = ",".join(["%s"] * len(statuses))
            where_clauses.append(f"LOWER(i.status_actual) IN ({placeholders})")
            params.extend([s.lower() for s in statuses])

        if priorities_norm and len(priorities_norm) > 0:
            placeholders = ",".join(["%s"] * len(priorities_norm))
            where_clauses.append(f"i.priority IN ({placeholders})")
            params.extend(priorities_norm)

        if printed is not None:
            where_clauses.append("i.printed_fiche = %s")
            params.append(printed)

        if tech_id:
            where_clauses.append("i.tech_id = %s")
            params.append(tech_id)

        extra_clauses, extra_params = self._type_and_date_filters(types, reported_from, reported_to)
        where_clauses.extend(extra_clauses)
        params.extend(extra_params)

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            query = f"""
                SELECT COUNT(DISTINCT i.id)
                FROM intervention i
                LEFT JOIN machine m ON i.machine_id = m.id
                {where_sql}
            """
            cur.execute(query, params)
            row = cur.fetchone()
            return int(row[0]) if row else 0
        except Exception as e:
            raise_db_error(e, "comptage interventions")
        finally:
            release_connection(conn)

    def get_by_id(self, intervention_id: str, include_actions: bool = True) -> Dict[str, Any]:
        """Récupère une intervention par ID avec équipement et stats calculées depuis les actions"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT
                    i.*,
                    ir.id           AS req_id,
                    ir.code         AS req_code,
                    ir.demandeur_nom,
                    ir.demandeur_service_legacy AS demandeur_service,
                    ir.description  AS req_description,
                    ir.statut       AS req_statut,
                    rs2.label       AS req_statut_label,
                    rs2.color       AS req_statut_color,
                    ir.intervention_id AS req_intervention_id,
                    ir.is_system    AS req_is_system,
                    ir.created_at   AS req_created_at,
                    ir.updated_at   AS req_updated_at
                FROM intervention i
                LEFT JOIN intervention_request ir ON ir.intervention_id = i.id
                LEFT JOIN request_status_ref rs2 ON rs2.code = ir.statut
                WHERE i.id = %s
                """,
                (intervention_id,),
            )
            row = cur.fetchone()

            if not row:
                raise NotFoundError(f"Intervention {intervention_id} non trouvée")

            cols = [desc[0] for desc in cur.description]
            intervention = dict(zip(cols, row))
            intervention['is_locked'] = is_intervention_locked(intervention.get('status_actual'))

            # Construire l'objet request
            req_id = intervention.pop('req_id', None)
            if req_id is not None:
                intervention['request'] = {
                    'id': req_id,
                    'code': intervention.pop('req_code', None),
                    'demandeur_nom': intervention.pop('demandeur_nom', None),
                    'demandeur_service': intervention.pop('demandeur_service', None),
                    'description': intervention.pop('req_description', None),
                    'statut': intervention.pop('req_statut', None),
                    'statut_label': intervention.pop('req_statut_label', None),
                    'statut_color': intervention.pop('req_statut_color', None),
                    'intervention_id': intervention.pop('req_intervention_id', None),
                    'is_system': intervention.pop('req_is_system', False),
                    'created_at': intervention.pop('req_created_at', None),
                    'updated_at': intervention.pop('req_updated_at', None),
                    'equipement': None,
                }
            else:
                intervention['request'] = None
                for key in [
                    'req_code',
                    'demandeur_nom',
                    'demandeur_service',
                    'req_description',
                    'req_statut',
                    'req_statut_label',
                    'req_statut_color',
                    'req_intervention_id',
                    'req_is_system',
                    'req_created_at',
                    'req_updated_at',
                ]:
                    intervention.pop(key, None)

            # Récupérer l'équipement via EquipementRepository pour garantir la cohérence
            if intervention.get('machine_id'):
                equipement_repo = EquipementRepository()
                try:
                    intervention['equipements'] = equipement_repo.get_by_id(
                        intervention['machine_id'], include_descendants=False
                    )
                except NotFoundError:
                    intervention['equipements'] = None
            else:
                intervention['equipements'] = None

            # Récupérer les actions via InterventionActionRepository
            # Stats tâches et demandes d'achat — toujours calculées en SQL
            cur.execute(
                """
                SELECT
                    COUNT(*)                                                          AS task_total,
                    COUNT(*) FILTER (WHERE status = 'todo')                          AS task_todo,
                    COUNT(*) FILTER (WHERE status = 'in_progress')                   AS task_in_progress,
                    COUNT(*) FILTER (WHERE status = 'done')                          AS task_done,
                    COUNT(*) FILTER (WHERE status = 'skipped')                       AS task_skipped,
                    COUNT(*) FILTER (WHERE status IN ('todo','in_progress')
                                     AND optional = FALSE)                           AS task_blocking_pending
                FROM intervention_task WHERE intervention_id = %s
                """,
                (intervention_id,),
            )
            tr = cur.fetchone()
            task_stats = {
                'total': int(tr[0] or 0),
                'todo': int(tr[1] or 0),
                'in_progress': int(tr[2] or 0),
                'done': int(tr[3] or 0),
                'skipped': int(tr[4] or 0),
                'blocking_pending': int(tr[5] or 0),
            }

            cur.execute(
                """
                SELECT
                    COUNT(DISTINCT prd.id)                                                                 AS pr_total,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'RECEIVED')                 AS pr_received,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'TO_QUALIFY')               AS pr_to_qualify,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'NO_SUPPLIER_REF')          AS pr_no_supplier_ref,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'PENDING_DISPATCH')         AS pr_pending_dispatch,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'REJECTED')                 AS pr_rejected,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'CONSULTATION')             AS pr_consultation,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'PARTIAL')                  AS pr_partial,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'ORDERED')                  AS pr_ordered,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'QUOTED')                   AS pr_quoted,
                    COUNT(DISTINCT prd.id) FILTER (WHERE prd.derived_status = 'OPEN')                     AS pr_open
                FROM intervention_action_purchase_request iapr
                INNER JOIN intervention_action ia ON ia.id = iapr.intervention_action_id
                INNER JOIN purchase_request_derived_status prd ON prd.id = iapr.purchase_request_id
                WHERE ia.intervention_id = %s
                """,
                (intervention_id,),
            )
            pr_row = cur.fetchone()
            pr_total = int(pr_row[0] or 0)
            pr_stats = {
                'total': pr_total,
                'received': int(pr_row[1] or 0),
                'to_qualify': int(pr_row[2] or 0),
                'no_supplier_ref': int(pr_row[3] or 0),
                'pending_dispatch': int(pr_row[4] or 0),
                'rejected': int(pr_row[5] or 0),
                'consultation': int(pr_row[6] or 0),
                'partial': int(pr_row[7] or 0),
                'ordered': int(pr_row[8] or 0),
                'quoted': int(pr_row[9] or 0),
                'open': int(pr_row[10] or 0),
            }

            if include_actions:
                action_repo = InterventionActionRepository()
                actions = action_repo.get_by_intervention(intervention_id)
                intervention['actions'] = actions

                intervention['stats'] = {
                    'action_count': len(actions),
                    'total_time': sum(a.get('time_spent', 0) or 0 for a in actions),
                    'avg_complexity': (
                        round(
                            sum(
                                a.get('complexity_score', 0) or 0
                                for a in actions
                                if a.get('complexity_score')
                            )
                            / len([a for a in actions if a.get('complexity_score')]),
                            2,
                        )
                        if any(a.get('complexity_score') for a in actions)
                        else None
                    ),
                    'purchase_count': pr_stats['total'],
                    'tasks': task_stats,
                    'purchase_requests': pr_stats,
                }
            else:
                intervention['actions'] = []
                intervention['stats'] = {
                    'action_count': 0,
                    'total_time': 0,
                    'avg_complexity': None,
                    'purchase_count': pr_stats['total'],
                    'tasks': task_stats,
                    'purchase_requests': pr_stats,
                }

            # Récupérer les status logs via InterventionStatusLogRepository
            status_log_repo = InterventionStatusLogRepository()
            intervention['status_logs'] = status_log_repo.get_by_intervention(intervention_id)

            # Charger les tâches liées à l'intervention (plan préventif ou tâches ad hoc)
            # On ne conditionne PAS sur plan_id : une intervention créée manuellement via
            # acceptation DI peut avoir des intervention_task sans que plan_id soit renseigné.
            # Import lazy pour éviter la circularité avec intervention_tasks.repo
            from api.intervention_tasks.repo import InterventionTaskRepository

            task_repo = InterventionTaskRepository()
            tasks = task_repo.get_by_intervention(intervention_id)
            intervention['tasks'] = tasks
            if tasks:
                intervention['task_progress'] = task_repo.get_progress(intervention_id)
            else:
                intervention['task_progress'] = None

            return intervention
        except HTTPException:
            # Toute erreur métier (404, 400...) passe avant le tri des messages de base.
            raise
        except Exception as e:
            error_msg = str(e)
            if "does not exist" in error_msg:
                raise DatabaseError(
                    "Table 'intervention' inexistante - vérifier la structure de la base"
                ) from e
            if "connection" in error_msg.lower():
                raise DatabaseError("Impossible de se connecter à la base de données") from e
            raise_db_error(e, "opération")
        finally:
            release_connection(conn)

    def _resolve_tech_initials(self, cur: Any, data: Dict[str, Any]) -> None:
        """Résout tech_initials depuis tunnel_user.initial si tech_id est fourni."""
        tech_id = data.get('tech_id')
        if not tech_id:
            return
        cur.execute(
            "SELECT initial FROM tunnel_user WHERE id = %s",
            (str(tech_id),),
        )
        row = cur.fetchone()
        if not row:
            raise ValidationError(f"Utilisateur {tech_id} introuvable")
        data['tech_initials'] = row[0]

    def insert_intervention(self, cur: Any, data: Dict[str, Any]) -> str:
        """Insère une intervention avec le curseur fourni (ni commit ni rollback), renvoie son id.

        Seule fonction qui écrit une intervention (ADR 0025) : la création directe, la création
        atomique avec sa demande et l'acceptation d'une demande l'appellent toutes. `data` porte
        machine_id, type_inter, tech_id (ou tech_initials), et facultativement title, priority,
        reported_by, status_actual, printed_fiche, reported_date, plan_id, request_id (cherche
        le plan de l'occurrence préventive de la demande).
        """
        intervention_id = str(uuid4())

        # Résoudre tech_initials depuis l'UUID avant validation (le trigger en a besoin)
        self._resolve_tech_initials(cur, data)

        from api.interventions.validators import InterventionValidator

        request_id = str(data['request_id']) if data.get('request_id') else None
        # Le type suggéré par la demande reste utilisable même désactivé depuis (ADR 0026,
        # décision de l'utilisateur du 2026-11-20) : une demande ne devient pas inacceptable.
        suggested_type = None
        if request_id:
            cur.execute(
                "SELECT suggested_type_inter FROM intervention_request WHERE id = %s",
                (request_id,),
            )
            req_row = cur.fetchone()
            suggested_type = req_row[0] if req_row else None

        from api.interventions.types import is_preventive_origin

        InterventionValidator.validate_create(
            data,
            suggested_type=suggested_type,
            from_plan=is_preventive_origin(cur, request_id, data.get('plan_id')),
        )

        # Créée déjà fermée : aucun constat ne peut exister, la porte de clôture s'applique
        if str(data.get('status_actual') or '') == CLOSED_STATUS_CODE:
            self._ensure_constat_given(cur, intervention_id, data.get('type_inter'))

        # Résoudre plan_id depuis l'occurrence préventive liée à la DI si non fourni
        # (cas acceptation d'une DI système préventive)
        plan_id = data.get('plan_id')
        if plan_id is None and request_id:
            cur.execute(
                "SELECT plan_id FROM preventive_occurrence WHERE di_id = %s LIMIT 1",
                (request_id,),
            )
            occ_row = cur.fetchone()
            plan_id = str(occ_row[0]) if occ_row and occ_row[0] else None

        cur.execute(
            """
            INSERT INTO intervention
            (id, title, machine_id, type_inter, priority,
             reported_by, tech_initials, tech_id, status_actual,
             printed_fiche, reported_date, plan_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                intervention_id,
                data.get('title'),
                data.get('machine_id'),
                data.get('type_inter'),
                data.get('priority'),
                data.get('reported_by'),
                data.get('tech_initials'),
                str(data['tech_id']) if data.get('tech_id') else None,
                data.get('status_actual', 'ouvert'),
                data.get('printed_fiche', False),
                data.get('reported_date') or date.today(),
                plan_id,
            ),
        )
        return intervention_id

    @staticmethod
    def record_created_event(cur: Any, entity_type: str, entity_id: str) -> None:
        """Dépose la ligne d'audit `created` d'une entité créée en plus de celle de la route.

        La route déclare l'intervention : la demande et les tâches créées dans le même geste
        n'auraient aucune trace de leur création sans cet événement. Le motif vient de la
        règle d'audit routinière de l'entité, jamais d'une valeur codée en dur ; l'auteur est
        celui du jeton, ajouté par le middleware. `entity_type` passe par une liste blanche
        qui fixe aussi la table lue.
        """
        from api.utils.audit import resolve_reason_code

        tables = {
            "intervention": "intervention",
            "request": "intervention_request",
            "task": "intervention_task",
        }
        table = tables[entity_type]
        rule = resolve_reason_code(entity_type, [])
        if rule is None:
            raise DatabaseError(f"Aucune règle d'audit routinière pour la création : {entity_type}")
        cur.execute(f"SELECT row_to_json(t) FROM {table} t WHERE id = %s", (entity_id,))
        created = cur.fetchone()[0]
        for technical in ("id", "created_at", "updated_at"):
            created.pop(technical, None)
        record_audit_event(
            entity_type,
            entity_id,
            "created",
            new_value=created,
            reason_code=rule["default_reason_code"],
        )

    def add(
        self,
        data: Dict[str, Any],
        user_id: Optional[str] = None,
        system_acceptance: bool = False,
        new_request: Optional[Dict[str, Any]] = None,
        tasks: Optional[List[Any]] = None,
    ) -> Dict[str, Any]:
        """Crée une nouvelle intervention, dans une seule transaction.

        `user_id` : auteur (jeton) de l'acceptation de la demande liée, dans son historique.
        `system_acceptance` : acceptation faite par le système (génération préventive en
        acceptation automatique) ; son événement d'audit porte alors le motif system.
        `new_request` : contenu d'une demande à créer dans le même geste (origine « directe »,
        donc sans notification) ; exclusif avec `data["request_id"]`.
        `tasks` : tâches à créer (objets portant label, origin, optional, assigned_to,
        due_date, sort_order). Un échec, quel qu'il soit, n'écrit rien (ADR 0025).
        """
        if new_request is not None and data.get('request_id'):
            raise ValidationError("request_id et request sont exclusifs")

        conn = self._get_connection()
        try:
            cur = conn.cursor()

            if new_request is not None:
                from api.intervention_requests.repo import InterventionRequestRepository

                data = {**data}
                data['request_id'] = InterventionRequestRepository.insert_request(
                    cur, {**new_request, 'machine_id': data.get('machine_id')}, user_id, 'directe'
                )
                self.record_created_event(cur, "request", data['request_id'])
            request_id = str(data['request_id']) if data.get('request_id') else None

            intervention_id = self.insert_intervention(cur, data)

            if request_id:
                self._link_request(cur, intervention_id, request_id, user_id, system_acceptance)

            if tasks:
                from api.intervention_tasks.repo import InterventionTaskRepository

                task_repo = InterventionTaskRepository()
                for task in tasks:
                    task_id = task_repo.insert_task(cur, intervention_id, task, user_id)
                    self.record_created_event(cur, "task", task_id)

            conn.commit()
        except HTTPException:
            # Erreurs métier (validation, conflit, introuvable) : leur message est destiné
            # à l'utilisateur, il ne doit pas devenir une erreur 500 générique.
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "Erreur lors de la création de l'intervention")
        finally:
            release_connection(conn)

        return self.get_by_id(intervention_id)

    def _link_request(
        self,
        cur: Any,
        intervention_id: str,
        request_id: str,
        user_id: Optional[str] = None,
        system_acceptance: bool = False,
    ) -> None:
        """
        Lie une demande d'intervention à l'intervention créée :
        - Vérifie que la demande existe et est dans un état linkable
        - Met à jour intervention_request.intervention_id
        - Insère le log de transition vers 'acceptee'
        """
        cur.execute(
            "SELECT id, statut, intervention_id FROM intervention_request WHERE id = %s",
            (request_id,),
        )
        row = cur.fetchone()
        if not row:
            raise NotFoundError(f"Demande d'intervention {request_id} introuvable")

        current_statut = row[1]
        existing_intervention_id = row[2]

        if existing_intervention_id is not None:
            raise ConflictError(
                f"La demande '{request_id}' est déjà liée à l'intervention '{existing_intervention_id}'. "
                f"Une demande ne peut être liée qu'à une seule intervention."
            )

        linkable = ("nouvelle", "en_attente")
        if current_statut not in linkable:
            raise ValidationError(
                f"La demande '{request_id}' est au statut '{current_statut}' "
                "et ne peut pas être liée (statuts acceptés : nouvelle, en_attente)"
            )

        # Vérifier que l'intervention n'est pas déjà liée à une autre demande
        cur.execute(
            "SELECT id FROM intervention_request WHERE intervention_id = %s AND id != %s LIMIT 1",
            (intervention_id, request_id),
        )
        if cur.fetchone():
            raise ConflictError(
                f"L'intervention '{intervention_id}' est déjà liée à une autre demande d'intervention."
            )

        cur.execute(
            "UPDATE intervention_request SET intervention_id = %s WHERE id = %s",
            (intervention_id, request_id),
        )

        # DI liée à une intervention alors qu'elle est encore nouvelle/en_attente
        # (cf. `linkable` ci-dessus) : elle vient d'être créée et immédiatement prise
        # en charge par le même geste (ex: technicien qui crée sa DI puis enchaîne
        # sur `POST /interventions`) — le trigger `fn_notify_di_a_traiter` a déjà
        # fan-outé la notification `di_a_traiter` au moment de l'INSERT de la DI,
        # avant qu'on sache qu'elle serait liée dans la foulée. On purge ici les
        # notifications non lues déjà émises pour cette DI : personne n'a besoin
        # d'être notifié d'une demande déjà traitée. On ne touche pas aux
        # notifications déjà lues (traçabilité de ce qui a été vu).
        cur.execute(
            """
            DELETE FROM notification
            WHERE type = 'di_a_traiter'
              AND entity_type = 'intervention_request'
              AND entity_id = %s
              AND read_at IS NULL
            """,
            (request_id,),
        )

        with skip_request_status_log(cur):
            cur.execute(
                """
                INSERT INTO request_status_log (request_id, status_from, status_to, changed_by, notes)
                VALUES (%s, %s, 'acceptee', %s, %s)
                """,
                (request_id, current_statut, user_id, "Intervention créée manuellement"),
            )

        # Acceptation de la demande par la création de l'intervention (chemin normal) :
        # événement d'audit sur la demande, écrit par le middleware (ADR 0018 point 4). Le
        # motif de la requête vaut pour l'intervention et peut ne pas s'appliquer à la
        # demande : on prend celui de la règle d'audit des demandes, jamais une valeur en dur.
        # Mêmes types de décision que l'acceptation par transition (le middleware y écrit
        # statut_changed et intervention_id_changed).
        reason_code = system_reason_code() if system_acceptance else _request_routine_reason()
        for decision_type, old_value, new_value in (
            ("statut_changed", {"statut": current_statut}, {"statut": "acceptee"}),
            (
                "intervention_id_changed",
                {"intervention_id": None},
                {"intervention_id": intervention_id},
            ),
        ):
            record_audit_event(
                "request",
                request_id,
                decision_type,
                old_value=old_value,
                new_value=new_value,
                is_system=system_acceptance,
                reason_code=reason_code,
            )

        # Vérifier si la DI appartient à une occurrence préventive non encore liée
        cur.execute(
            "SELECT id, plan_id FROM preventive_occurrence WHERE di_id = %s AND intervention_id IS NULL",
            (request_id,),
        )
        occ_row = cur.fetchone()
        if occ_row:
            occ_id = str(occ_row[0])
            occ_plan_id = occ_row[1]

            attach_occurrence(cur, occ_id, intervention_id, fill_assignment=True)
            if occ_plan_id:
                cur.execute(
                    "UPDATE intervention SET plan_id = %s WHERE id = %s",
                    (str(occ_plan_id), intervention_id),
                )

    def update(self, intervention_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Met à jour une intervention existante"""
        existing = self.get_by_id(intervention_id, include_actions=False)

        from api.interventions.validators import InterventionValidator

        InterventionValidator.validate_priority(data.get('priority'))

        # Un type n'est vérifié (existant, actif) que s'il change : un type désactivé depuis
        # reste valable sur une intervention qui le porte déjà.
        if data.get('type_inter') and data['type_inter'] != existing.get('type_inter'):
            check_assignable(data["type_inter"], existing.get("type_inter"))

        # Types permis par la classe de l'équipement (ADR 0031) : vérifiés seulement si le type
        # ou l'équipement change ; une intervention existante non permise reste modifiable.
        new_type = data.get('type_inter') or existing.get('type_inter')
        new_machine = data.get('machine_id') or existing.get('machine_id')
        changed = (data.get('type_inter') and data['type_inter'] != existing.get('type_inter')) or (
            data.get('machine_id') and str(data['machine_id']) != str(existing.get('machine_id'))
        )
        if changed and new_type and new_machine:
            check_allowed_for_machine(new_type, new_machine)

        # Bloquer la fermeture si des tâches non-optionnelles sont en attente
        if 'status_actual' in data:
            # Le constat n'est exigé qu'au passage à « fermé » : une intervention déjà fermée
            # (avant ADR 0043) reste modifiable sans lui.
            needs_constat = existing.get('status_actual') != CLOSED_STATUS_CODE
            self._check_closable(
                intervention_id, data['status_actual'], new_type if needs_constat else False
            )

        # La demande liée est clôturée par le trigger de la base pendant l'écriture : sa trace
        # système (SYSTEM_CASCADE) est déposée ici, comme pour toute clôture (ADR 0027).
        reopening = is_reopening(existing.get('status_actual'), data.get('status_actual'))
        with self._watch_closure(intervention_id, data):
            if not self._write_update(intervention_id, data, reopening):
                return self.get_by_id(intervention_id)

        result = self.get_by_id(intervention_id)

        # Si le statut vient de changer vers 'ferme', clôturer la demande liée
        if 'status_actual' in data:
            new_status = result.get('status_actual')
            old_status = existing.get('status_actual')
            if new_status != old_status:
                # Résoudre le code du nouveau statut
                self._notify_if_closed(intervention_id, new_status)

        return result

    @staticmethod
    def _watch_closure(intervention_id: str, data: Dict[str, Any]):
        """Contexte qui trace la clôture de la demande liée quand l'écriture ferme l'intervention."""
        if str(data.get('status_actual')) != CLOSED_STATUS_CODE:
            return nullcontext()
        from api.intervention_requests.repo import InterventionRequestRepository

        return InterventionRequestRepository().watch_trigger_closure(intervention_id)

    def _write_update(
        self, intervention_id: str, data: Dict[str, Any], reopening: bool = False
    ) -> bool:
        """Écrit les champs modifiables présents dans `data` ; faux si aucun n'est fourni.

        Une réouverture repasse la demande liée « acceptee » sur le même curseur, donc dans
        la même transaction : si l'un des deux UPDATE échoue, rien n'est écrit (ADR 0028).
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()

            updatable_fields = [
                'title',
                'machine_id',
                'type_inter',
                'priority',
                'reported_by',
                'tech_initials',
                'tech_id',
                'status_actual',
                'printed_fiche',
                'reported_date',
            ]

            set_clauses = []
            params = []

            for field in updatable_fields:
                if field in data:
                    set_clauses.append(f"{field} = %s")
                    params.append(data[field])

            if not set_clauses:
                return False

            params.append(intervention_id)

            query = f"""
                UPDATE intervention
                SET {', '.join(set_clauses)}
                WHERE id = %s
            """

            cur.execute(query, params)
            if reopening:
                from api.intervention_requests.repo import InterventionRequestRepository
                from api.preventive_occurrences.cascade import reopen_occurrences

                InterventionRequestRepository().reopen_linked_request(cur, intervention_id)
                reopen_occurrences(cur, intervention_id)
            conn.commit()
            return True
        except (ValidationError, DatabaseError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "mise à jour intervention")
        finally:
            release_connection(conn)

    @staticmethod
    def _ensure_constat_given(cur: Any, intervention_id: str, type_inter: Any) -> None:
        """Lève ValidationError si le type exige un constat (ADR 0043) et qu'il n'y en a aucun.

        Un constat remplacé par une correction laisse sa version courante : l'existence d'une
        ligne suffit. Règle de la porte unique de clôture, aussi posée à la création.
        """
        cur.execute("SELECT constat_required FROM intervention_type WHERE code = %s", (type_inter,))
        row = cur.fetchone()
        if not (row and row[0]):
            return
        cur.execute("SELECT 1 FROM constat WHERE intervention_id = %s LIMIT 1", (intervention_id,))
        if cur.fetchone() is None:
            raise ValidationError(
                "Impossible de fermer : un constat est obligatoire pour ce type d'intervention."
            )

    def _check_closable(
        self, intervention_id: str, status_actual: Any, type_inter: Any = None
    ) -> None:
        """Lève ValidationError si des tâches non-optionnelles ou un constat manquant bloquent
        la fermeture. `type_inter` : type après la mise à jour (celui de la base si absent),
        False pour ne pas contrôler le constat."""
        if not status_actual:
            return
        # intervention.status_actual stocke directement le code texte (ex: 'ferme')
        if str(status_actual) != CLOSED_STATUS_CODE:
            return

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) FROM intervention_task
                    WHERE intervention_id = %s
                      AND status IN ('todo', 'in_progress')
                      AND optional = FALSE
                    """,
                    (intervention_id,),
                )
                blocking = cur.fetchone()[0]
                if blocking == 0 and type_inter is not False:
                    if type_inter is None:
                        cur.execute(
                            "SELECT type_inter FROM intervention WHERE id = %s", (intervention_id,)
                        )
                        row = cur.fetchone()
                        type_inter = row[0] if row else None
                    self._ensure_constat_given(cur, intervention_id, type_inter)
        finally:
            release_connection(conn)

        if blocking > 0:
            raise ValidationError(
                f"Impossible de fermer : {blocking} tâche(s) non-optionnelle(s) en attente."
            )

    def _notify_if_closed(self, intervention_id: str, status_actual: Any) -> None:
        """Notifie le repo des demandes si l'intervention vient d'être fermée.

        intervention.status_actual stocke directement le code texte (ex: 'ferme'),
        identique à intervention_status_ref.id — pas besoin de résolution via DB.
        Une erreur de la cascade n'est pas avalée : elle annule toute la requête (ADR 0018).
        """
        if status_actual and str(status_actual) == CLOSED_STATUS_CODE:
            from api.intervention_requests.repo import InterventionRequestRepository

            InterventionRequestRepository().on_intervention_closed(intervention_id)

    def force_close_request(self, intervention_id: str) -> Dict[str, Any]:
        """Force la clôture de la demande liée à une intervention fermée.

        À utiliser quand la cascade automatique a échoué : l'intervention est
        déjà au statut 'ferme' mais la demande est restée bloquée en 'acceptee'.
        Lève ValidationError si l'intervention n'est pas fermée ou si aucune
        demande 'acceptee' n'est liée.
        """
        existing = self.get_by_id(intervention_id, include_actions=False)
        if existing.get("status_actual") != CLOSED_STATUS_CODE:
            raise ValidationError(
                "Le forçage de clôture n'est possible que si l'intervention est déjà fermée."
            )

        from api.intervention_requests.repo import InterventionRequestRepository

        req_repo = InterventionRequestRepository()

        conn = get_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, statut FROM intervention_request
                    WHERE intervention_id = %s AND statut = 'acceptee'
                    LIMIT 1
                    """,
                    (intervention_id,),
                )
                row = cur.fetchone()

            if not row:
                raise ValidationError(
                    "Aucune demande en statut 'acceptee' n'est liée à cette intervention."
                )
        finally:
            release_connection(conn)

        req_repo.on_intervention_closed(intervention_id)
        return self.get_by_id(intervention_id)

    def request_pointage(self, intervention_id: str, tech_ids: List[str], requested_by: str) -> int:
        """
        Demande un pointage à une liste de techniciens pour une intervention.

        Crée une notification `pointage_demande` par technicien fourni (aucune
        exclusion du pilote de l'intervention — décision produit assumée : le
        pilote peut légitimement figurer dans `tech_ids`, ex. pour se rappeler
        à lui-même de pointer).

        Vérifie que l'intervention existe (NotFoundError sinon). Lève
        ValidationError si `requested_by` (l'utilisateur courant) est
        introuvable dans tunnel_user.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()

            cur.execute(
                "SELECT code FROM intervention WHERE id = %s",
                (intervention_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Intervention {intervention_id} non trouvée")
            intervention_code = row[0]

            cur.execute(
                "SELECT first_name, last_name, initial FROM tunnel_user WHERE id = %s",
                (requested_by,),
            )
            requester_row = cur.fetchone()
            if not requester_row:
                raise ValidationError(f"Utilisateur {requested_by} introuvable")
            first_name, last_name, initial = requester_row
            requester_label = (
                f"{first_name} {last_name}".strip() if (first_name or last_name) else initial
            )

            message = (
                f"Pointage demandé par {requester_label} sur l'intervention "
                f"{intervention_code or intervention_id}"
            )

            created = 0
            for tech_id in tech_ids:
                cur.execute(
                    """
                    INSERT INTO notification (user_id, type, entity_type, entity_id, message)
                    VALUES (%s, 'pointage_demande', 'intervention', %s, %s)
                    """,
                    (str(tech_id), intervention_id, message),
                )
                created += cur.rowcount

            conn.commit()
            return created
        except (NotFoundError, ValidationError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "demande de pointage")
        finally:
            release_connection(conn)

    def delete(
        self,
        intervention_id: str,
        request_outcome: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> bool:
        """Supprime une intervention (interdit si actions ou demandes d'achat liées).

        Si une demande est liée, `request_outcome` est obligatoire (ADR 0019) :
        `reopen` remet la demande à « nouvelle », `delete` la supprime avec l'intervention.
        Une intervention ancienne, sans demande, se supprime sans issue. Tout est fait dans la
        transaction de la requête : si l'issue échoue, l'intervention reste en place.
        """
        from api.intervention_requests.repo import InterventionRequestRepository
        from api.interventions.validators import InterventionValidator

        self.get_by_id(intervention_id, include_actions=False)
        InterventionValidator.validate_deletable(intervention_id)

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            request_repo = InterventionRequestRepository()
            linked = request_repo.get_linked_to_intervention(cur, intervention_id)
            # Un constat reste toujours visible : l'intervention qui le porte ne se supprime pas
            cur.execute(
                """
                SELECT 1 FROM constat c
                WHERE c.intervention_id = %s
                   OR c.request_id = %s OR c.linked_request_id = %s
                LIMIT 1
                """,
                (
                    intervention_id,
                    linked["id"] if linked else None,
                    linked["id"] if linked else None,
                ),
            )
            if cur.fetchone():
                raise ValidationError("Intervention liée à un constat : suppression impossible.")
            if linked and request_outcome not in REQUEST_OUTCOMES:
                raise ValidationError(
                    "Cette intervention est liée à une demande : précisez son issue avec "
                    "request_outcome=reopen (rouvrir la demande) ou request_outcome=delete "
                    "(supprimer aussi la demande)."
                )
            if (
                linked
                and request_outcome == "delete"
                and request_repo.has_preventive_occurrence(cur, linked["id"])
            ):
                raise ValidationError(
                    "Cette demande est liée à une occurrence préventive : elle ne peut pas "
                    "être supprimée avec l'intervention. Utilisez request_outcome=reopen."
                )
            cur.execute("DELETE FROM intervention WHERE id = %s", (intervention_id,))
            if linked and request_outcome == "reopen":
                request_repo.reopen_after_intervention_deleted(cur, linked, user_id)
            elif linked:
                request_repo.delete_after_intervention_deleted(cur, linked)
            conn.commit()
            return True
        except ValidationError:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "Erreur lors de la suppression")
        finally:
            release_connection(conn)
