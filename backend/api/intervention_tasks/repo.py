import hashlib
import logging
import math
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from api.db import get_connection, release_connection
from api.errors.exceptions import ConflictError, NotFoundError, ValidationError, raise_db_error
from api.intervention_tasks.schemas import InterventionTaskIn, InterventionTaskPatch
from api.intervention_tasks.validators import task_delete_blocker
from api.interventions.validators import is_intervention_locked
from api.utils.search import build_search_clause

logger = logging.getLogger(__name__)


_TASK_SELECT = """
    SELECT
        it.id, it.intervention_id, it.label, it.origin, it.status,
        it.optional, it.due_date, it.sort_order, it.skip_reason,
        it.gamme_step_id, it.occurrence_id,
        it.closed_by, it.created_by, it.created_at, it.updated_at,
        i.status_actual AS intervention_status,
        COALESCE(agg.action_count, 0)  AS action_count,
        COALESCE(agg.time_spent, 0.0)  AS time_spent,
        u.id        AS assigned_id,
        u.first_name AS assigned_first_name,
        u.last_name  AS assigned_last_name,
        u.email      AS assigned_email,
        u.initial    AS assigned_initial,
        NULL::text   AS assigned_status,
        NULL::text   AS assigned_role
    FROM intervention_task it
    LEFT JOIN intervention i ON it.intervention_id = i.id
    LEFT JOIN tunnel_user u ON u.id = it.assigned_to
    LEFT JOIN LATERAL (
        SELECT
            COUNT(DISTINCT iat.action_id)    AS action_count,
            COALESCE(SUM(ia.time_spent), 0)  AS time_spent
        FROM intervention_action_task iat
        INNER JOIN intervention_action ia ON ia.id = iat.action_id
        WHERE iat.task_id = it.id
    ) agg ON TRUE
"""


def _map_task(row: Dict[str, Any]) -> Dict[str, Any]:
    """Mappe les colonnes assigned_* en objet assigned_to imbriqué.
    Convertit aussi les Decimal psycopg2 en float pour Pydantic.
    """
    # Indicateur de suppression : même règle que le refus (task_delete_blocker)
    row["can_delete"] = (
        task_delete_blocker(
            row.get("status"),
            int(row.get("action_count") or 0),
            is_intervention_locked(row.pop("intervention_status", None)),
        )
        is None
    )
    if row.get("time_spent") is not None:
        row["time_spent"] = float(row["time_spent"])
    if row.get("assigned_id"):
        row["assigned_to"] = {
            "id": row.pop("assigned_id"),
            "first_name": row.pop("assigned_first_name", None),
            "last_name": row.pop("assigned_last_name", None),
            "email": row.pop("assigned_email", None),
            "initial": row.pop("assigned_initial", None),
            "status": row.pop("assigned_status", "active"),
            "role": row.pop("assigned_role", None),
        }
    else:
        row["assigned_to"] = None
        for k in (
            "assigned_id",
            "assigned_first_name",
            "assigned_last_name",
            "assigned_email",
            "assigned_initial",
            "assigned_status",
            "assigned_role",
        ):
            row.pop(k, None)
    return row


class InterventionTaskRepository:
    """Requêtes pour le domaine intervention_task"""

    def _get_connection(self):
        return get_connection()

    def _ensure_intervention_editable(self, cur, intervention_id: str) -> None:
        """Bloque toute écriture sur une intervention fermée."""
        cur.execute(
            "SELECT status_actual FROM intervention WHERE id = %s",
            (intervention_id,),
        )
        row = cur.fetchone()
        if not row:
            raise NotFoundError(f"Intervention {intervention_id} non trouvée")

        if is_intervention_locked(row[0]):
            raise ValidationError(
                "Intervention fermée : aucune modification des tâches n'est autorisée"
            )

    # ── Lecture ──────────────────────────────────────────────────

    def get_list(
        self,
        intervention_id: Optional[str] = None,
        assigned_to: Optional[str] = None,
        statuses: Optional[List[str]] = None,
        origins: Optional[List[str]] = None,
        include_done: bool = False,
    ) -> List[Dict[str, Any]]:
        """Liste les tâches avec filtres optionnels."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            where: List[str] = []
            params: List[Any] = []

            if intervention_id:
                where.append("it.intervention_id = %s")
                params.append(intervention_id)
            if assigned_to:
                where.append("it.assigned_to = %s")
                params.append(assigned_to)
            if statuses:
                ph = ",".join(["%s"] * len(statuses))
                where.append(f"it.status IN ({ph})")
                params.extend(statuses)
            if origins:
                ph = ",".join(["%s"] * len(origins))
                where.append(f"it.origin IN ({ph})")
                params.extend(origins)
            if not include_done:
                where.append("it.status NOT IN ('done', 'skipped')")

            where_sql = ("WHERE " + " AND ".join(where)) if where else ""

            cur.execute(
                f"{_TASK_SELECT} {where_sql} ORDER BY it.sort_order ASC, it.created_at ASC",
                params,
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            return [_map_task(dict(zip(cols, row))) for row in rows]
        except Exception as e:
            raise_db_error(e, "liste des tâches")
        finally:
            release_connection(conn)

    def get_by_id(self, task_id: str) -> Dict[str, Any]:
        """Récupère une tâche par ID avec agrégats."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(f"{_TASK_SELECT} WHERE it.id = %s", (task_id,))
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Tâche {task_id} non trouvée")
            cols = [d[0] for d in cur.description]
            return _map_task(dict(zip(cols, row)))
        except NotFoundError:
            raise
        except Exception as e:
            raise_db_error(e, "récupération de la tâche")
        finally:
            release_connection(conn)

    def get_by_intervention(self, intervention_id: str) -> List[Dict[str, Any]]:
        """Récupère toutes les tâches d'une intervention, triées par sort_order."""
        return self.get_list(intervention_id=intervention_id, include_done=True)

    def get_progress(self, intervention_id: str) -> Dict[str, Any]:
        """Calcule la progression des tâches pour une intervention."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT
                    COUNT(*)                                                             AS total,
                    COUNT(*) FILTER (WHERE status = 'todo')                             AS todo,
                    COUNT(*) FILTER (WHERE status = 'in_progress')                      AS in_progress,
                    COUNT(*) FILTER (WHERE status = 'done')                             AS done,
                    COUNT(*) FILTER (WHERE status = 'skipped')                          AS skipped,
                    COUNT(*) FILTER (WHERE status IN ('todo','in_progress')
                                     AND optional = FALSE)                              AS blocking_pending
                FROM intervention_task
                WHERE intervention_id = %s
                """,
                (intervention_id,),
            )
            row = cur.fetchone()
            total, todo, in_progress, done, skipped, blocking_pending = (
                row[0],
                row[1],
                row[2],
                row[3],
                row[4],
                row[5],
            )
            return {
                "total": total,
                "todo": todo,
                "in_progress": in_progress,
                "done": done,
                "skipped": skipped,
                "blocking_pending": blocking_pending,
                "is_complete": blocking_pending == 0 and total > 0,
            }
        except Exception as e:
            raise_db_error(e, "calcul de la progression des tâches")
        finally:
            release_connection(conn)

    def get_progress_by_occurrence(self, occurrence_id: str) -> Dict[str, Any]:
        """Calcule la progression des tâches pour une occurrence (avant acceptation DI)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT
                    COUNT(*)                                                             AS total,
                    COUNT(*) FILTER (WHERE status = 'todo')                             AS todo,
                    COUNT(*) FILTER (WHERE status = 'in_progress')                      AS in_progress,
                    COUNT(*) FILTER (WHERE status = 'done')                             AS done,
                    COUNT(*) FILTER (WHERE status = 'skipped')                          AS skipped,
                    COUNT(*) FILTER (WHERE status IN ('todo','in_progress')
                                     AND optional = FALSE)                              AS blocking_pending
                FROM intervention_task
                WHERE occurrence_id = %s
                """,
                (occurrence_id,),
            )
            row = cur.fetchone()
            total, todo, in_progress, done, skipped, blocking_pending = (
                row[0],
                row[1],
                row[2],
                row[3],
                row[4],
                row[5],
            )
            return {
                "total": total,
                "todo": todo,
                "in_progress": in_progress,
                "done": done,
                "skipped": skipped,
                "blocking_pending": blocking_pending,
                "is_complete": blocking_pending == 0 and total > 0,
            }
        except Exception as e:
            raise_db_error(e, "calcul de la progression des tâches par occurrence")
        finally:
            release_connection(conn)

    def rattach_to_intervention(self, occurrence_id: str, intervention_id: str) -> int:
        """
        Rattache toutes les tâches d'une occurrence à l'intervention créée lors
        de l'acceptation de la DI. Retourne le nombre de lignes mises à jour.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE intervention_task
                SET intervention_id = %s
                WHERE occurrence_id = %s
                AND intervention_id IS NULL
                """,
                (intervention_id, occurrence_id),
            )
            count = cur.rowcount
            conn.commit()
            logger.info(
                "Rattachement tâches : %s tâche(s) liées à l'intervention %s",
                count,
                intervention_id,
            )
            return count
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "rattachement des tâches à l'intervention")
        finally:
            release_connection(conn)

    # ── Création ─────────────────────────────────────────────────

    def insert_task(
        self,
        cur: Any,
        intervention_id: str,
        data: Any,
        created_by: Optional[str] = None,
    ) -> str:
        """Insère une tâche manuelle avec le curseur fourni (ni commit ni rollback), renvoie son id.

        Seule fonction qui écrit une tâche manuelle : `create` et la création atomique d'une
        intervention (ADR 0025) la partagent. `data` porte label, origin, optional,
        assigned_to, due_date, sort_order (InterventionTaskIn ou schéma de tâche embarquée).
        """
        self._ensure_intervention_editable(cur, intervention_id)

        # Auto-assigner au pilote de l'intervention si assigned_to absent
        assigned_to = str(data.assigned_to) if data.assigned_to else None
        if not assigned_to:
            cur.execute("SELECT tech_id FROM intervention WHERE id = %s", (intervention_id,))
            pilot = cur.fetchone()
            if pilot and pilot[0]:
                assigned_to = str(pilot[0])

        task_id = str(uuid4())
        cur.execute(
            """
            INSERT INTO intervention_task
                (id, intervention_id, label, origin, status, optional,
                 assigned_to, due_date, sort_order, created_by, created_at, updated_at)
            VALUES (%s, %s, %s, %s, 'todo', %s, %s, %s, %s, %s, NOW(), NOW())
            """,
            (
                task_id,
                intervention_id,
                data.label,
                data.origin,
                data.optional,
                assigned_to,
                data.due_date,
                data.sort_order,
                created_by,
            ),
        )
        return task_id

    def create(self, data: InterventionTaskIn, created_by: Optional[str] = None) -> Dict[str, Any]:
        """Crée une tâche manuelle (origin resp ou tech)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            task_id = self.insert_task(cur, str(data.intervention_id), data, created_by)
            conn.commit()
        except (NotFoundError, ValidationError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "création de la tâche")
        finally:
            release_connection(conn)

        return self.get_by_id(task_id)

    # ── Mise à jour ───────────────────────────────────────────────

    def patch(
        self, task_id: str, data: InterventionTaskPatch, closed_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Met à jour partiellement une tâche."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT status, intervention_id, label, assigned_to, due_date, sort_order, skip_reason,
                       closed_by
                FROM intervention_task WHERE id = %s
                """,
                (task_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Tâche {task_id} non trouvée")

            (
                old_status,
                intervention_id,
                old_label,
                old_assigned,
                old_due_date,
                old_sort,
                old_skip,
                old_closed_by,
            ) = row
            self._ensure_intervention_editable(cur, str(intervention_id))

            set_parts: List[str] = []
            params: List[Any] = []
            if data.label is not None and data.label != old_label:
                set_parts.append("label = %s")
                params.append(data.label)
            if data.status is not None and data.status != old_status:
                set_parts.append("status = %s")
                params.append(data.status)
                if data.status in ("done", "skipped"):
                    set_parts.append("closed_by = %s")
                    params.append(closed_by)
            if data.skip_reason is not None and data.skip_reason != old_skip:
                set_parts.append("skip_reason = %s")
                params.append(data.skip_reason)
            if data.assigned_to is not None and str(data.assigned_to) != str(old_assigned or ""):
                set_parts.append("assigned_to = %s")
                params.append(str(data.assigned_to))
            if data.due_date is not None and data.due_date != old_due_date:
                set_parts.append("due_date = %s")
                params.append(data.due_date)
            if data.sort_order is not None and data.sort_order != old_sort:
                set_parts.append("sort_order = %s")
                params.append(data.sort_order)

            if not set_parts:
                return self.get_by_id(task_id)

            set_parts.append("updated_at = NOW()")
            params.append(task_id)

            cur.execute(
                f"UPDATE intervention_task SET {', '.join(set_parts)} WHERE id = %s",
                params,
            )

            conn.commit()
        except (NotFoundError, ValidationError, ConflictError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "mise à jour de la tâche")
        finally:
            release_connection(conn)

        return self.get_by_id(task_id)

    # ── Suppression ───────────────────────────────────────────────

    def delete(self, task_id: str) -> None:
        """Supprime une tâche « à faire », sans action, d'une intervention non fermée."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT status, intervention_id, label FROM intervention_task WHERE id = %s",
                (task_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Tâche {task_id} non trouvée")

            status, intervention_id, label = row
            cur.execute(
                "SELECT status_actual FROM intervention WHERE id = %s",
                (str(intervention_id),),
            )
            locked = is_intervention_locked(cur.fetchone()[0])

            cur.execute(
                "SELECT COUNT(*) FROM intervention_action_task WHERE task_id = %s",
                (task_id,),
            )
            blocker = task_delete_blocker(status, cur.fetchone()[0], locked)
            if blocker:
                raise ValidationError(blocker)

            cur.execute("DELETE FROM intervention_task WHERE id = %s", (task_id,))
            conn.commit()
        except (NotFoundError, ValidationError, ConflictError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "suppression de la tâche")
        finally:
            release_connection(conn)

    # ── Workspace (vue technicien cross-interventions) ────────────

    def get_workspace(
        self,
        q: Optional[str] = None,
        status: Optional[List[str]] = None,
        origin: Optional[List[str]] = None,
        assignee_id: Optional[str] = None,
        intervention_id: Optional[str] = None,
        machine_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 20,
        include_closed: bool = False,
        include_actions: bool = False,
        include_options: bool = False,
        include_counters: bool = False,
    ) -> Dict[str, Any]:
        """Tâches groupées par intervention avec pagination offset sur les interventions.
        Source de vérité unique partagée avec GET /tasks/workspace.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()

            task_where: List[str] = []
            params: List[Any] = []

            if not include_closed:
                task_where.append("it.status NOT IN ('done', 'skipped')")
            if intervention_id:
                task_where.append("it.intervention_id = %s")
                params.append(intervention_id)
            if status:
                ph = ",".join(["%s"] * len(status))
                task_where.append(f"it.status IN ({ph})")
                params.extend(status)
            if origin:
                ph = ",".join(["%s"] * len(origin))
                task_where.append(f"it.origin IN ({ph})")
                params.extend(origin)
            if assignee_id == "unassigned":
                task_where.append("it.assigned_to IS NULL")
            elif assignee_id:
                task_where.append("it.assigned_to = %s")
                params.append(assignee_id)
            if machine_id:
                task_where.append("i.machine_id = %s")
                params.append(machine_id)
            if q and q.strip():
                clause, search_params = build_search_clause(
                    q,
                    ["it.label ILIKE %s", "i.title ILIKE %s", "i.code ILIKE %s"],
                )
                task_where.append(clause)
                params.extend(search_params)

            # Exclure les tâches orphelines (intervention_id NULL — données incohérentes)
            task_where.append("it.intervention_id IS NOT NULL")
            task_where_sql = "WHERE " + " AND ".join(task_where)

            # Compter les interventions distinctes (pagination)
            cur.execute(
                f"""
                SELECT COUNT(DISTINCT it.intervention_id)
                FROM intervention_task it
                LEFT JOIN intervention i ON it.intervention_id = i.id
                {task_where_sql}
                """,
                params,
            )
            total_interventions = cur.fetchone()[0] or 0

            # Interventions de la page
            cur.execute(
                f"""
                SELECT DISTINCT
                    i.id        AS interv_id,
                    i.code      AS interv_code,
                    i.title     AS interv_title,
                    i.status_actual AS interv_status,
                    i.priority  AS interv_priority,
                    m.id        AS equip_id,
                    m.name      AS equip_name,
                    m.code      AS equip_code
                FROM intervention_task it
                LEFT JOIN intervention i ON it.intervention_id = i.id
                LEFT JOIN machine m ON i.machine_id = m.id
                {task_where_sql}
                ORDER BY i.id
                LIMIT %s OFFSET %s
                """,
                (*params, limit, skip),
            )
            interv_rows = cur.fetchall()
            interv_cols = [d[0] for d in cur.description]
            interventions_page = [dict(zip(interv_cols, r)) for r in interv_rows]

            items: List[Dict[str, Any]] = []
            if interventions_page:
                interv_ids = [
                    str(r["interv_id"]) for r in interventions_page if r["interv_id"] is not None
                ]

                # Tâches de ces interventions via _TASK_SELECT (source de vérité)
                task_extra_where = list(task_where) + [
                    f"it.intervention_id IN ({','.join(['%s'] * len(interv_ids))})"
                ]
                cur.execute(
                    f"{_TASK_SELECT} WHERE {' AND '.join(task_extra_where)} ORDER BY it.sort_order ASC, it.created_at ASC",
                    [*params, *interv_ids],
                )
                task_rows = cur.fetchall()
                task_cols = [d[0] for d in cur.description]

                tasks_by_interv: Dict[str, List[Dict[str, Any]]] = {iid: [] for iid in interv_ids}
                all_task_ids: List[str] = []
                raw_tasks: Dict[str, Dict[str, Any]] = {}
                for row in task_rows:
                    t = _map_task(dict(zip(task_cols, row)))
                    iid = str(t.get("intervention_id", ""))
                    if iid in tasks_by_interv:
                        tasks_by_interv[iid].append(t)
                    tid = str(t["id"])
                    all_task_ids.append(tid)
                    raw_tasks[tid] = t

                # Actions liées (optionnel)
                if include_actions and all_task_ids:
                    ph = ",".join(["%s"] * len(all_task_ids))
                    cur.execute(
                        f"""
                        SELECT
                            ia.id, ia.created_at, ia.description, ia.time_spent,
                            u.id AS tech_id, u.initial, u.first_name, u.last_name,
                            iat.task_id
                        FROM intervention_action_task iat
                        INNER JOIN intervention_action ia ON ia.id = iat.action_id
                        LEFT JOIN tunnel_user u ON ia.tech = u.id
                        WHERE iat.task_id IN ({ph})
                        ORDER BY ia.created_at DESC
                        """,
                        all_task_ids,
                    )
                    actions_by_task: Dict[str, List[Dict[str, Any]]] = {}
                    for ar in cur.fetchall():
                        tid = str(ar[8])
                        tech = None
                        if ar[4]:
                            tech = {
                                "id": ar[4],
                                "initials": ar[5],
                                "first_name": ar[6],
                                "last_name": ar[7],
                            }
                        actions_by_task.setdefault(tid, []).append(
                            {
                                "id": ar[0],
                                "created_at": ar[1],
                                "description": ar[2],
                                "time_spent": float(ar[3]) if ar[3] is not None else None,
                                "tech": tech,
                            }
                        )
                    for tid, acts in actions_by_task.items():
                        if tid in raw_tasks:
                            raw_tasks[tid]["actions"] = acts

                for r in interventions_page:
                    iid = str(r["interv_id"])
                    equip = None
                    if r.get("equip_id"):
                        equip = {
                            "id": r["equip_id"],
                            "name": r.get("equip_name"),
                            "code": r.get("equip_code"),
                        }
                    items.append(
                        {
                            "id": r["interv_id"],
                            "code": r.get("interv_code"),
                            "title": r.get("interv_title"),
                            "status": r.get("interv_status"),
                            "is_locked": is_intervention_locked(r.get("interv_status")),
                            "priority": r.get("interv_priority"),
                            "equipement": equip,
                            "tasks": tasks_by_interv.get(iid, []),
                        }
                    )

            # Options (optionnel)
            options = None
            if include_options:
                cur.execute(
                    """
                    SELECT DISTINCT u.id, u.initial, u.first_name, u.last_name
                    FROM tunnel_user u WHERE u.is_active = true
                    ORDER BY u.first_name, u.last_name LIMIT 100
                    """
                )
                users = [
                    {"id": r[0], "initials": r[1], "first_name": r[2], "last_name": r[3]}
                    for r in cur.fetchall()
                ]
                cur.execute(
                    """
                    SELECT DISTINCT i.id, i.code, i.title, i.status_actual
                    FROM intervention i
                    WHERE i.status_actual != (SELECT id FROM intervention_status_ref WHERE code = 'ferme' LIMIT 1)
                    ORDER BY i.id LIMIT 100
                    """
                )
                interventions_opt = [
                    {"id": r[0], "code": r[1], "title": r[2], "status": r[3]}
                    for r in cur.fetchall()
                ]
                options = {"users": users, "interventions": interventions_opt}

            # Compteurs globaux (optionnel)
            counters = None
            if include_counters:
                cur.execute(
                    """
                    SELECT
                        COUNT(*),
                        COUNT(*) FILTER (WHERE status = 'todo'),
                        COUNT(*) FILTER (WHERE status = 'in_progress'),
                        COUNT(*) FILTER (WHERE status = 'done'),
                        COUNT(*) FILTER (WHERE status = 'skipped'),
                        COUNT(*) FILTER (WHERE status = 'todo' AND assigned_to IS NULL)
                    FROM intervention_task
                    """
                )
                row = cur.fetchone()
                counters = {
                    "total": row[0] or 0,
                    "todo": row[1] or 0,
                    "in_progress": row[2] or 0,
                    "done": row[3] or 0,
                    "skipped": row[4] or 0,
                    "backlog_unassigned_todo": row[5] or 0,
                }

            total_pages = math.ceil(total_interventions / limit) if limit else 1
            page = (skip // limit) + 1 if limit else 1
            etag_payload = "".join(
                str(g["id"]) + "".join(str(t["id"]) for t in g["tasks"]) for g in items
            )
            conn.commit()
            return {
                "items": items,
                "pagination": {
                    "total": total_interventions,
                    "page": page,
                    "page_size": limit,
                    "total_pages": total_pages,
                    "offset": skip,
                    "count": len(items),
                },
                "counters": counters,
                "options": options,
                "meta": {
                    "generated_at": datetime.now(),
                    "etag": hashlib.md5(etag_payload.encode()).hexdigest(),
                },
                "errors": None,
            }
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "chargement workspace tâches")
        finally:
            release_connection(conn)

    # ── Transition automatique ────────────────────────────────────
    # La transition todo→in_progress est gérée par le trigger DB
    # trg_task_status_on_action_link (migration j5e6f7a8b9c0).
    # Cette méthode Python n'est plus nécessaire.
