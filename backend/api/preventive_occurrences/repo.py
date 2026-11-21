import logging
from datetime import date
from typing import Any, Dict, List, Optional
from uuid import uuid4

from api.audits.cascade import record_cascade, record_cascade_changes
from api.audits.events import record_audit_event, system_reason_code
from api.db import get_connection, release_connection
from api.errors.exceptions import ConflictError, NotFoundError, ValidationError, raise_db_error
from api.preventive_occurrences import schedule, validators
from api.preventive_occurrences.cascade import (
    as_text,
    attach_occurrence,
    attach_tasks,
)
from api.settings import settings
from api.utils.status_log import skip_request_status_log

logger = logging.getLogger(__name__)


# Dernière occurrence terminée d'un couple plan (pp) x machine (m) : sa scheduled_date et,
# si elle est completed, la date de clôture de sa demande. Source unique de la référence
# de l'échéance glissante, partagée par l'échéancier et la génération (ADR 0023). Une
# occurrence ignorée parce que sa demande a été rejetée (PREV-08) n'est pas une référence :
# le préventif n'a pas été fait, l'échéance reste celle d'avant.
_LAST_TERMINATED_LATERAL = """LEFT JOIN LATERAL (
                    SELECT po.scheduled_date,
                           CASE WHEN po.status = 'completed' THEN (
                               SELECT MAX(rsl.date)::date FROM request_status_log rsl
                               WHERE rsl.request_id = po.di_id AND rsl.status_to = 'cloturee'
                           ) END AS closed_on
                    FROM preventive_occurrence po
                    WHERE po.plan_id = pp.id AND po.machine_id = m.id
                      AND po.status IN ('completed', 'skipped')
                      AND NOT (po.status = 'skipped' AND EXISTS (
                          SELECT 1 FROM intervention_request ir
                          WHERE ir.id = po.di_id AND ir.statut = 'rejetee'
                      ))
                    ORDER BY po.scheduled_date DESC
                    LIMIT 1
                ) last ON true"""


class PreventiveOccurrenceRepository:
    """Requêtes pour le domaine occurrences de maintenance préventive"""

    def _get_connection(self):
        return get_connection()

    # ── Lecture ──────────────────────────────────────────────────

    def get_list(
        self,
        plan_id: Optional[str] = None,
        machine_id: Optional[str] = None,
        status: Optional[str] = None,
        scheduled_date_from: Optional[date] = None,
        scheduled_date_to: Optional[date] = None,
        include_descendants: bool = False,
    ) -> List[Dict[str, Any]]:
        """Liste les occurrences avec filtres optionnels (machine_id + descendants si demandé)"""
        machine_sql, machine_params = "", []
        if machine_id:
            # Import lazy : equipements.repo n'est utile qu'à ce filtre
            from api.equipements.repo import EquipementRepository

            machine_sql, machine_params = EquipementRepository().machine_scope(
                "po.machine_id", machine_id, include_descendants
            )
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            where = []
            params: List[Any] = []

            if plan_id:
                where.append("po.plan_id = %s")
                params.append(plan_id)
            if machine_id:
                where.append(machine_sql)
                params.extend(machine_params)
            if status:
                where.append("po.status = %s")
                params.append(status)
            if scheduled_date_from:
                where.append("po.scheduled_date >= %s")
                params.append(scheduled_date_from)
            if scheduled_date_to:
                where.append("po.scheduled_date <= %s")
                params.append(scheduled_date_to)

            where_sql = ("WHERE " + " AND ".join(where)) if where else ""

            cur.execute(
                f"""
                SELECT
                    po.id, po.plan_id, pp.label AS plan_label,
                    po.machine_id, m.code AS machine_code, m.name AS machine_name,
                    po.scheduled_date, po.triggered_at, po.hours_at_trigger,
                    po.di_id, ir.code AS di_code, ir.statut AS di_statut,
                    po.intervention_id,
                    po.status, po.skip_reason, po.created_at
                FROM preventive_occurrence po
                LEFT JOIN preventive_plan pp ON pp.id = po.plan_id
                LEFT JOIN machine m ON m.id = po.machine_id
                LEFT JOIN intervention_request ir ON ir.id = po.di_id
                {where_sql}
                ORDER BY po.scheduled_date DESC
                """,
                params,
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            occurrences = [dict(zip(cols, row)) for row in rows]

            if occurrences:
                occ_ids = [str(o["id"]) for o in occurrences]
                tasks_by_occ = self._fetch_tasks_batch(cur, occ_ids)
                for occ in occurrences:
                    occ["tasks"] = tasks_by_occ.get(str(occ["id"]), [])
            return occurrences
        except Exception as e:
            raise_db_error(e, "liste des occurrences préventives")
        finally:
            release_connection(conn)

    def get_by_id(self, occurrence_id: str) -> Dict[str, Any]:
        """Récupère une occurrence par ID"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT
                    po.id, po.plan_id, pp.label AS plan_label,
                    po.machine_id, m.code AS machine_code, m.name AS machine_name,
                    po.scheduled_date, po.triggered_at, po.hours_at_trigger,
                    po.di_id, ir.code AS di_code, ir.statut AS di_statut,
                    po.intervention_id,
                    po.status, po.skip_reason, po.created_at
                FROM preventive_occurrence po
                LEFT JOIN preventive_plan pp ON pp.id = po.plan_id
                LEFT JOIN machine m ON m.id = po.machine_id
                LEFT JOIN intervention_request ir ON ir.id = po.di_id
                WHERE po.id = %s
                """,
                (occurrence_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Occurrence {occurrence_id} non trouvée")
            cols = [d[0] for d in cur.description]
            occ = dict(zip(cols, row))
            tasks_by_occ = self._fetch_tasks_batch(cur, [occurrence_id])
            occ["tasks"] = tasks_by_occ.get(occurrence_id, [])
            return occ
        except Exception as e:
            raise_db_error(e, "récupération de l'occurrence")
        finally:
            release_connection(conn)

    def _fetch_tasks_batch(
        self, cur: Any, occurrence_ids: List[str]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Charge les intervention_task pour une liste d'occurrence_ids en une seule requête.
        Retourne un dict { occurrence_id: [tasks...] }.
        """
        placeholders = ",".join(["%s"] * len(occurrence_ids))
        cur.execute(
            f"""
            SELECT
                it.id, it.gamme_step_id,
                it.label, it.origin,
                it.sort_order,
                it.optional,
                it.occurrence_id, it.intervention_id,
                it.status, it.skip_reason, it.updated_at, it.closed_by
            FROM intervention_task it
            WHERE it.occurrence_id IN ({placeholders})
            ORDER BY it.occurrence_id, it.sort_order ASC
            """,
            occurrence_ids,
        )
        rows = cur.fetchall()
        cols = [d[0] for d in cur.description]
        result: Dict[str, List[Dict[str, Any]]] = {}
        for row in rows:
            task = dict(zip(cols, row))
            occ_key = str(task["occurrence_id"])
            result.setdefault(occ_key, []).append(task)
        return result

    # ── Échéancier ───────────────────────────────────────────────

    def get_schedule(
        self,
        today: date,
        lead_days: int,
        machine_id: Optional[str] = None,
        include_descendants: bool = False,
        state: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Échéancier : une ligne par plan actif x machine de la classe du plan.

        Lecture seule. Le calcul de l'échéance est délégué à schedule.py (fonction pure).
        Référence d'un couple : date de clôture de la demande de la dernière occurrence
        completed (request_status_log), à défaut sa scheduled_date. Une occurrence active
        l'emporte : l'échéance est sa scheduled_date.
        """
        machine_sql, machine_params = "", []
        if machine_id:
            from api.equipements.repo import EquipementRepository

            machine_sql, machine_params = EquipementRepository().machine_scope(
                "m.id", machine_id, include_descendants
            )
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            where_machine = f"AND {machine_sql}" if machine_id else ""
            rows = self._fetch_schedule_rows(cur, where_machine, machine_params)
        except Exception as e:
            raise_db_error(e, "chargement de l'échéancier du préventif")
        finally:
            release_connection(conn)
        return self._build_schedule(rows, today, lead_days, state)

    @staticmethod
    def _fetch_schedule_rows(cur, where_machine: str, params: List[Any]) -> List[Dict[str, Any]]:
        """Lignes brutes de l'échéancier (plan actif x machine en service de la classe).

        `where_machine` est un fragment SQL construit par le code (jamais une saisie), ses
        valeurs passent par `params`. Partagé par l'échéancier et la santé des équipements.
        """
        cur.execute(
            f"""
            SELECT pp.id AS plan_id, pp.code AS plan_code, pp.label AS plan_label,
                   pp.trigger_type, pp.periodicity_days,
                   m.id AS machine_id, m.code AS machine_code, m.name AS machine_name,
                   act.id AS occurrence_id, act.di_id, act.intervention_id,
                   act.scheduled_date AS active_date,
                   last.scheduled_date AS last_scheduled_date,
                   last.closed_on
            FROM preventive_plan pp
            JOIN machine m ON m.equipement_class_id = pp.equipement_class_id
            JOIN equipement_statuts es ON es.id = m.statut_id AND es.code = 'EN_SERVICE'
            LEFT JOIN LATERAL (
                SELECT po.id, po.di_id, po.intervention_id, po.scheduled_date
                FROM preventive_occurrence po
                WHERE po.plan_id = pp.id AND po.machine_id = m.id
                  AND po.status IN ('pending', 'generated', 'in_progress')
                ORDER BY po.scheduled_date ASC
                LIMIT 1
            ) act ON true
            {_LAST_TERMINATED_LATERAL}
            WHERE pp.active = true {where_machine}
            """,
            params,
        )
        cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in cur.fetchall()]

    def overdue_counts(self, cur, machine_ids: List[str], today: date) -> Dict[str, int]:
        """Nombre de préventifs en retard par machine (clé : id texte), même règle que
        l'échéancier. Utilise le curseur de l'appelant (calcul de santé en lot)."""
        if not machine_ids:
            return {}
        rows = self._fetch_schedule_rows(cur, "AND m.id = ANY(%s::uuid[])", [list(machine_ids)])
        counts: Dict[str, int] = {}
        for line in self._build_schedule(
            rows, today, settings.PREVENTIVE_LEAD_DAYS, schedule.STATE_OVERDUE
        ):
            key = str(line["machine_id"])
            counts[key] = counts.get(key, 0) + 1
        return counts

    @staticmethod
    def _build_schedule(
        rows: List[Dict[str, Any]], today: date, lead_days: int, state: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Applique le calcul pur à chaque ligne, filtre par état et trie par échéance."""
        out = []
        for r in rows:
            reference = None
            if r["trigger_type"] != "periodicity":
                due = schedule.not_computed()
            elif r["active_date"] is not None:
                due = schedule.classify_due(r["active_date"], today, lead_days)
            else:
                reference = r["closed_on"] or r["last_scheduled_date"]
                due = schedule.compute_due(reference, r["periodicity_days"], today, lead_days)
            if state and due.state != state:
                continue
            out.append(
                {
                    "plan_id": r["plan_id"],
                    "plan_code": r["plan_code"],
                    "plan_label": r["plan_label"],
                    "machine_id": r["machine_id"],
                    "machine_code": r["machine_code"],
                    "machine_name": r["machine_name"],
                    "reference_date": reference,
                    "due_date": due.due_date,
                    "state": due.state,
                    "days_overdue": due.days_overdue,
                    "occurrence_id": r["occurrence_id"],
                    "di_id": r["di_id"],
                    "intervention_id": r["intervention_id"],
                }
            )
        # Échéances vides (heures) en fin de liste ; à égalité, ordre stable par plan puis machine.
        out.sort(
            key=lambda x: (
                x["due_date"] is None,
                x["due_date"] or date.max,
                x["plan_code"],
                x["machine_code"],
            )
        )
        return out

    # ── Historique d'une machine ─────────────────────────────────

    def get_history(self, machine_id: str) -> List[Dict[str, Any]]:
        """Historique préventif d'une machine : une ligne par occurrence, échéance récente d'abord.

        done_on = date de clôture de la demande (même référence que la génération, seulement
        pour une occurrence completed) ; delta_days = done_on - scheduled_date (négatif : en avance).
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1 FROM machine WHERE id = %s", (machine_id,))
            if not cur.fetchone():
                raise NotFoundError(f"Équipement {machine_id} non trouvé")
            cur.execute(
                """
                SELECT po.id AS occurrence_id, po.plan_id, pp.code AS plan_code,
                       pp.label AS plan_label, po.status, po.scheduled_date, c.done_on,
                       (c.done_on - po.scheduled_date) AS delta_days,
                       po.skip_reason, po.di_id, po.intervention_id,
                       i.code AS intervention_code
                FROM preventive_occurrence po
                JOIN preventive_plan pp ON pp.id = po.plan_id
                LEFT JOIN intervention i ON i.id = po.intervention_id
                LEFT JOIN LATERAL (
                    SELECT CASE WHEN po.status = 'completed' THEN (
                        SELECT MAX(rsl.date)::date FROM request_status_log rsl
                        WHERE rsl.request_id = po.di_id AND rsl.status_to = 'cloturee'
                    ) END AS done_on
                ) c ON true
                WHERE po.machine_id = %s
                ORDER BY po.scheduled_date DESC, po.created_at DESC
                """,
                (machine_id,),
            )
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        except NotFoundError:
            raise
        except Exception as e:
            raise_db_error(e, "historique préventif d'une machine")
        finally:
            release_connection(conn)

    # ── Lancement en avance ──────────────────────────────────────

    def anticipate(self, plan_id: str, machine_id: str) -> tuple[Dict[str, Any], str]:
        """Crée tout de suite l'occurrence d'un plan à périodicité sur une machine.

        Même création que la génération (_create_occurrence), sans attendre la prévenance.
        scheduled_date = échéance glissante théorique, ou aujourd'hui si elle est passée ou sans
        historique. Retourne (occurrence créée, id de la demande système).
        """
        today = date.today()
        plan = self._load_plan(plan_id)
        machine = self._load_machine(machine_id)
        validators.validate_anticipation(plan, machine)

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id FROM preventive_occurrence
                WHERE plan_id = %s AND machine_id = %s
                  AND status IN ('pending', 'generated', 'in_progress')
                LIMIT 1
                """,
                (plan_id, machine_id),
            )
            active = cur.fetchone()
            if active:
                raise ConflictError(f"Une occurrence active existe déjà : {active[0]}")
            reference = self._reference_date(cur, plan_id, machine_id)
        except ConflictError:
            raise
        except Exception as e:
            raise_db_error(e, "contrôle du lancement en avance")
        finally:
            release_connection(conn)

        due = schedule.compute_due(
            reference, plan["periodicity_days"], today, settings.PREVENTIVE_LEAD_DAYS
        )
        scheduled_date = max(due.due_date, today)
        status, di_id = self._create_occurrence(plan, machine_id, scheduled_date, None, True, today)
        if status == "conflict":
            raise ConflictError(
                "Une occurrence existe déjà à cette date pour ce plan et cette machine"
            )
        return self._occurrence_of_request(di_id), di_id

    def _occurrence_of_request(self, di_id: str) -> Dict[str, Any]:
        """Occurrence liée à une demande (relue après création et acceptation automatique)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT id FROM preventive_occurrence WHERE di_id = %s", (di_id,))
            occurrence_id = str(cur.fetchone()[0])
        except Exception as e:
            raise_db_error(e, "lecture de l'occurrence créée")
        finally:
            release_connection(conn)
        return self.get_by_id(occurrence_id)

    def _load_plan(self, plan_id: str) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, label, trigger_type, periodicity_days, hours_threshold,
                       auto_accept, equipement_class_id, active
                FROM preventive_plan WHERE id = %s
                """,
                (plan_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Plan {plan_id} non trouvé")
            return dict(zip([d[0] for d in cur.description], row))
        except NotFoundError:
            raise
        except Exception as e:
            raise_db_error(e, "chargement du plan préventif")
        finally:
            release_connection(conn)

    def _load_machine(self, machine_id: str) -> Dict[str, Any]:
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT m.id, m.equipement_class_id, (es.code = 'EN_SERVICE') AS in_service
                FROM machine m
                LEFT JOIN equipement_statuts es ON es.id = m.statut_id
                WHERE m.id = %s
                """,
                (machine_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Équipement {machine_id} non trouvé")
            return dict(zip([d[0] for d in cur.description], row))
        except NotFoundError:
            raise
        except Exception as e:
            raise_db_error(e, "chargement de l'équipement")
        finally:
            release_connection(conn)

    # ── Skip ─────────────────────────────────────────────────────

    def skip_occurrence(self, occurrence_id: str, skip_reason: str) -> Dict[str, Any]:
        """Ignore une occurrence en statut 'pending'.

        `skip_reason` vient du motif d'audit choisi (voir la route) ; l'audit de la requête
        (motif, avant, après) est écrit par le middleware.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT status FROM preventive_occurrence WHERE id = %s",
                (occurrence_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Occurrence {occurrence_id} non trouvée")
            if row[0] != "pending":
                raise ValidationError("Seule une occurrence en statut pending peut être ignorée")

            cur.execute(
                """
                UPDATE preventive_occurrence
                SET status = 'skipped', skip_reason = %s
                WHERE id = %s
                """,
                (skip_reason, occurrence_id),
            )
            conn.commit()
        except (NotFoundError, ValidationError, ConflictError):
            raise
        except Exception as e:
            raise_db_error(e, "mise à jour du statut de l'occurrence")
        finally:
            release_connection(conn)

        return self.get_by_id(occurrence_id)

    # ── Génération ───────────────────────────────────────────────

    def generate_occurrences(self) -> Dict[str, Any]:
        """
        Génère les occurrences en attente pour tous les plans actifs, tout ou rien.

        Tout se passe dans la transaction de la requête : les cas prévisibles sont vérifiés
        avant d'écrire et comptés dans le rapport ; une erreur SQL remonte et annule tout.
        """
        today = date.today()
        plans = self._load_active_plans()

        generated = 0
        skipped_conflicts = 0
        skipped_active = 0
        # Conservé dans la réponse pour les clients existants ; toujours vide depuis AUDC-24
        # (une erreur annule la génération au lieu d'être listée).
        errors: List[str] = []
        created_di_ids: List[str] = []

        for plan in plans:
            if plan["equipement_class_id"] is None:
                # Plan sans classe d'équipement : aucune machine à traiter, rien à écrire.
                logger.info("Plan %s sans classe d'équipement : ignoré", plan["label"])
                continue

            for machine in self._load_machines_for_class(str(plan["equipement_class_id"])):
                result, di_id = self._generate_for_machine(plan, str(machine["id"]), today)
                if result == "generated":
                    generated += 1
                    if di_id:
                        created_di_ids.append(di_id)
                elif result == "conflict":
                    skipped_conflicts += 1
                elif result == "skipped_active_exists":
                    skipped_active += 1
                # "skipped_not_due" et "skipped_no_hours" : pas comptés

        return {
            "generated": generated,
            "skipped_conflicts": skipped_conflicts,
            "skipped_active": skipped_active,
            "errors": errors,
            # Ids des DI système créées — utilisé par la route pour déclencher
            # les mails di_a_traiter via BackgroundTasks (non exposé au schema
            # Pydantic GenerateOccurrencesResult, purement interne à la route).
            "created_di_ids": created_di_ids,
        }

    def _load_active_plans(self) -> List[Dict[str, Any]]:
        """Charge tous les plans actifs depuis la DB"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT id, label, trigger_type, periodicity_days,
                       hours_threshold, auto_accept, equipement_class_id
                FROM preventive_plan
                WHERE active = true
                """
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "chargement des plans préventifs actifs")
        finally:
            release_connection(conn)

    def _load_machines_for_class(self, class_id: str) -> List[Dict[str, Any]]:
        """Charge les machines EN_SERVICE d'une classe d'équipement (une erreur SQL remonte)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT m.id, m.code, m.name FROM machine m "
                "JOIN equipement_statuts es ON es.id = m.statut_id AND es.code = 'EN_SERVICE' "
                "WHERE m.equipement_class_id = %s",
                (class_id,),
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "chargement des machines d'une classe")
        finally:
            release_connection(conn)

    def _generate_for_machine(
        self, plan: Dict[str, Any], machine_id: str, today: date
    ) -> tuple[str, Optional[str]]:
        """
        Génère une occurrence pour une machine donnée.
        Retourne (status, di_id) :
          status : 'generated', 'conflict', 'skipped_not_due', 'skipped_no_hours',
                   'skipped_active_exists'
          di_id  : id de la DI système créée si status == 'generated', sinon None
        """
        plan_id = str(plan["id"])
        current_hours = None
        due_from_period = False

        conn = self._get_connection()
        try:
            cur = conn.cursor()

            # Ne pas générer si une occurrence non terminée existe déjà pour ce plan/machine.
            # Sans ce garde, une occurrence en 'generated' ou 'in_progress' dont la DI est
            # clôturée (mais l'occurrence pas encore 'completed') ferait repartir le compteur
            # et produirait une deuxième occurrence dès que la période est écoulée.
            cur.execute(
                """
                SELECT 1 FROM preventive_occurrence
                WHERE plan_id = %s AND machine_id = %s
                  AND status IN ('pending', 'generated', 'in_progress')
                LIMIT 1
                """,
                (plan_id, machine_id),
            )
            if cur.fetchone():
                return "skipped_active_exists", None

            if plan["trigger_type"] == "periodicity":
                # Échéance glissante : le calcul vient de schedule.py, comme l'échéancier.
                # Une occurrence est créée dès que l'échéance entre dans la prévenance ;
                # scheduled_date = échéance (date future possible).
                reference = self._reference_date(cur, plan_id, machine_id)
                due = schedule.compute_due(
                    reference, plan["periodicity_days"], today, settings.PREVENTIVE_LEAD_DAYS
                )
                if due.state == schedule.STATE_OK:
                    return "skipped_not_due", None
                scheduled_date = due.due_date
                due_from_period = True

            else:  # hours
                # Référence : dernière occurrence terminée (completed ou skipped)
                cur.execute(
                    """
                    SELECT hours_at_trigger
                    FROM preventive_occurrence
                    WHERE plan_id = %s AND machine_id = %s
                      AND status IN ('completed', 'skipped')
                      AND NOT (status = 'skipped' AND EXISTS (
                          SELECT 1 FROM intervention_request ir
                          WHERE ir.id = di_id AND ir.statut = 'rejetee'
                      ))
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    (plan_id, machine_id),
                )
                row = cur.fetchone()
                last_hours = row[0] if row else None

                cur.execute(
                    "SELECT hours_total FROM machine_hours WHERE machine_id = %s",
                    (machine_id,),
                )
                mh_row = cur.fetchone()
                current_hours = mh_row[0] if mh_row else None

                if current_hours is None:
                    return "skipped_no_hours", None

                last_hours_val = last_hours or 0
                if (current_hours - last_hours_val) < plan["hours_threshold"]:
                    return "skipped_not_due", None

                scheduled_date = today
        finally:
            release_connection(conn)

        return self._create_occurrence(
            plan,
            machine_id,
            scheduled_date,
            current_hours if plan["trigger_type"] == "hours" else None,
            due_from_period,
            today,
        )

    @staticmethod
    def _reference_date(cur: Any, plan_id: str, machine_id: str) -> Optional[date]:
        """Référence de l'échéance glissante d'un couple plan x machine : clôture de la demande
        de la dernière occurrence terminée, à défaut sa scheduled_date, None sans historique."""
        cur.execute(
            f"""
            SELECT last.scheduled_date, last.closed_on
            FROM preventive_plan pp
            JOIN machine m ON m.id = %s
            {_LAST_TERMINATED_LATERAL}
            WHERE pp.id = %s
            """,
            (machine_id, plan_id),
        )
        row = cur.fetchone()
        return (row[1] or row[0]) if row else None

    def _create_occurrence(
        self,
        plan: Dict[str, Any],
        machine_id: str,
        scheduled_date: date,
        hours_at_trigger: Optional[float],
        due_from_period: bool,
        today: date,
    ) -> tuple[str, Optional[str]]:
        """Crée l'occurrence, sa demande système et ses tâches (génération et lancement en avance).

        Retourne ('generated', di_id) ou ('conflict', None). Les règles d'audit et l'acceptation
        automatique du plan sont celles de la génération : un seul code de création.
        """
        plan_id = str(plan["id"])
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            # Conflit prévisible : une occurrence existe déjà à cette date (même annulée), la
            # contrainte d'unicité (plan, machine, date) refuserait l'insertion. Vérifié avant
            # d'écrire, sans rollback : le cas est rapporté, pas traité comme une erreur.
            cur.execute(
                """
                SELECT 1 FROM preventive_occurrence
                WHERE plan_id = %s AND machine_id = %s AND scheduled_date = %s
                """,
                (plan_id, machine_id, scheduled_date),
            )
            if cur.fetchone():
                if due_from_period:
                    # Échéance déjà prise par une occurrence du couple (ex. celle d'une demande
                    # rejetée, ignorée) : la nouvelle est créée aujourd'hui, sans conflit.
                    scheduled_date = today
                    cur.execute(
                        """
                        SELECT 1 FROM preventive_occurrence
                        WHERE plan_id = %s AND machine_id = %s AND scheduled_date = %s
                        """,
                        (plan_id, machine_id, scheduled_date),
                    )
                    if cur.fetchone():
                        return "conflict", None
                else:
                    return "conflict", None

            occurrence_id = str(uuid4())
            cur.execute(
                """
                INSERT INTO preventive_occurrence
                    (id, plan_id, machine_id, scheduled_date, triggered_at,
                     hours_at_trigger, status)
                VALUES (%s, %s, %s, %s, NOW(), %s, 'pending')
                """,
                (
                    occurrence_id,
                    plan_id,
                    machine_id,
                    scheduled_date,
                    hours_at_trigger,
                ),
            )
            cur.execute(
                """
                INSERT INTO intervention_request
                    (machine_id, demandeur_nom, description, is_system, suggested_type_inter,
                     code, statut, deadline)
                VALUES (%s, 'Système préventif', %s, true, 'PRE', 'PLACEHOLDER', 'nouvelle', %s)
                RETURNING id
                """,
                (machine_id, plan["label"], scheduled_date),
            )
            di_id = str(cur.fetchone()[0])

            cur.execute(
                "UPDATE preventive_occurrence SET di_id = %s, status = 'generated' WHERE id = %s",
                (di_id, occurrence_id),
            )

            # Générer les intervention_task liées (une par step de gamme du plan)
            cur.execute(
                """
                SELECT id FROM preventive_plan_gamme_step
                WHERE plan_id = %s
                ORDER BY sort_order ASC
                """,
                (plan_id,),
            )
            steps = cur.fetchall()
            for step_row in steps:
                step_id = str(step_row[0])
                cur.execute(
                    """
                    INSERT INTO intervention_task
                        (gamme_step_id, occurrence_id, intervention_id, label, origin, status,
                         optional, sort_order)
                    SELECT
                        %s, %s, NULL, pgs.label, 'plan', 'todo', pgs.optional, pgs.sort_order
                    FROM preventive_plan_gamme_step pgs
                    WHERE pgs.id = %s
                    ON CONFLICT (gamme_step_id, occurrence_id) DO NOTHING
                    RETURNING id
                    """,
                    (step_id, occurrence_id, step_id),
                )
                task_row = cur.fetchone()
                if task_row:
                    # Une ligne `created` par tâche de gamme réellement créée (décision du
                    # 2026-11-18), y compris celles que l'acceptation automatique rattache.
                    self._record_system_created(cur, "task", str(task_row[0]))
            logger.info(
                "Tâches préventives : %s tâche(s) générée(s) pour l'occurrence %s",
                len(steps),
                occurrence_id,
            )

            self._record_system_created(cur, "preventive_occurrence", occurrence_id)
            self._record_system_created(cur, "request", di_id)
            conn.commit()
        finally:
            release_connection(conn)

        if plan["auto_accept"]:
            self._auto_accept_occurrence(occurrence_id, di_id, machine_id, plan["id"])

        return "generated", di_id

    # Tables des entités dont la génération dépose l'événement `created` (liste blanche).
    _CREATED_TABLES = {
        "preventive_occurrence": "preventive_occurrence",
        "request": "intervention_request",
        "intervention": "intervention",
        "task": "intervention_task",
    }

    def _record_system_created(self, cur: Any, entity_type: str, entity_id: str) -> None:
        """Dépose la ligne `created` d'une entité créée par la génération (événement du système).

        Le motif vient du contexte (system_reason_code) : SYSTEM_CASCADE dans la requête du
        bouton « Générer », où l'auteur est l'utilisateur du jeton ; SYSTEM_SCHEDULE dans la
        tâche planifiée, sans auteur. La valeur est la ligne créée, sans identifiant ni
        horodatages techniques.
        """
        table = self._CREATED_TABLES[entity_type]
        cur.execute(f"SELECT row_to_json(t) FROM {table} t WHERE id = %s", (entity_id,))
        created = cur.fetchone()[0]
        for technical in ("id", "created_at", "updated_at"):
            created.pop(technical, None)
        record_audit_event(
            entity_type,
            entity_id,
            "created",
            new_value=created,
            is_system=True,
            reason_code=system_reason_code(),
        )

    def _plan_label(self, plan_id: str) -> str:
        """Libellé du plan, repris comme titre de l'intervention (colonne obligatoire)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT label FROM preventive_plan WHERE id = %s", (str(plan_id),))
            return cur.fetchone()[0]
        except Exception as e:
            raise_db_error(e, "lecture du libellé du plan")
        finally:
            release_connection(conn)

    def _auto_accept_occurrence(
        self, occurrence_id: str, di_id: str, machine_id: str, plan_id: str
    ) -> None:
        """
        Crée une intervention en acceptant la DI liée à l'occurrence.
        Import lazy pour éviter la circularité avec interventions.repo.
        Tout ou rien : une erreur remonte et annule la génération entière.
        """
        from api.interventions.repo import InterventionRepository

        label = self._plan_label(plan_id)
        intervention = InterventionRepository().add(
            {
                "title": label,
                "machine_id": machine_id,
                "type_inter": "PRE",
                "tech_initials": "SYS",
                "priority": "normale",
                "request_id": di_id,
                "plan_id": plan_id,
            },
            system_acceptance=True,
        )
        intervention_id = str(intervention["id"])

        conn = self._get_connection()
        try:
            cur = conn.cursor()
            attach_occurrence(cur, occurrence_id, intervention_id, fill_assignment=True)
            self._record_system_created(cur, "intervention", intervention_id)
            conn.commit()
        finally:
            release_connection(conn)
        logger.info(
            "Rattachement tâches auto-accept : intervention %s liée à l'occurrence %s",
            intervention_id,
            occurrence_id,
        )

    # ── Repair ───────────────────────────────────────────────────

    @staticmethod
    def _record_plan_fixed(rows) -> None:
        """Un événement par intervention dont la réparation rétablit le plan (plan_id était vide)."""
        for intervention_id, plan_id in rows:
            record_cascade(
                "intervention",
                intervention_id,
                "plan_id_changed",
                old_value={"plan_id": None},
                new_value={"plan_id": as_text(plan_id)},
            )

    @staticmethod
    def _record_tasks_relinked(rows) -> None:
        """Un événement par tâche que la réparation rattache à son intervention."""
        for task_id, intervention_id in rows:
            record_cascade_changes(
                "task",
                task_id,
                {"intervention_id": None},
                {"intervention_id": as_text(intervention_id)},
            )

    def repair_orphaned_data(self) -> dict:
        """
        Répare les données corrompues par plusieurs bugs désormais corrigés :

        Bug 1 — intervention_task sans intervention_id :
          Lors de l'acceptation manuelle d'une DI préventive, le curseur partagé
          causait un fetchone() vide → les tâches restaient avec intervention_id = NULL
          même si l'occurrence était liée à une intervention.
          Fix : UPDATE intervention_task SET intervention_id depuis l'occurrence.

        Bug 2 — occurrence préventive bloquée à 'generated' après fermeture :
          _notify_if_closed() comparait un UUID au code texte 'ferme' → toujours faux
          → on_intervention_closed() jamais appelé → occurrence jamais passée à 'completed'.
          Fix : détecter les interventions fermées liées à une occurrence 'generated'
          et les passer à 'completed' + clôturer la demande liée si encore 'acceptee'.

        Bug 3 — plan_id null sur une intervention préventive :
          Lors de l'acceptation manuelle via POST /interventions (chemin direct sans
          passer par transition_status), plan_id n'était pas résolu depuis l'occurrence.
          Fix : UPDATE intervention SET plan_id depuis preventive_occurrence.

        Bug 4 — tâches orphelines non rattachées à une intervention acceptée via DI :
          Même origine que Bug 1 mais côté DI : si l'acceptation passait par
          transition_status et que le curseur partagé plantait le rattachement.
          Fix : couvrir aussi le cas où occurrence.intervention_id IS NULL mais
          la DI a un intervention_id.

        Bug 5 — optional désynchronisé entre tâche et step de gamme :
          Si un step de plan a été modifié (optionnel → obligatoire ou inverse)
          après la génération des tâches, les intervention_task origin='plan'
          conservent l'ancienne valeur et bloquent (ou ne bloquent pas) à tort.
          Fix : resynchroniser optional depuis preventive_plan_gamme_step.

        Bug 6 — référence à l'ancienne table gamme_step_validation dans repair :
          L'étape 3 de repair utilisait encore l'ancien nom de table (avant migration
          du 2026-04-25). Le UPDATE ne touchait rien. Fix : corriger le nom.

        Bug 7 — intervention_task absentes pour une occurrence liée à une intervention :
          Si les étapes de gamme ont été ajoutées au plan APRÈS la génération de
          l'occurrence, la boucle d'insertion dans trigger_occurrence() n'a trouvé
          0 steps → 0 tâches créées. L'occurrence et l'intervention existent mais la
          gamme est invisible dans le frontend.
          Fix : INSERT manquants pour toute occurrence (intervention_id NOT NULL,
          plan_id NOT NULL) sans aucune intervention_task.
        """
        conn = self._get_connection()
        tasks_relinked = 0
        occurrences_relinked = 0
        occurrences_set_in_progress = 0
        occurrences_completed = 0
        requests_closed = 0
        interventions_plan_fixed = 0
        tasks_optional_resynced = 0
        tasks_generated_missing = 0
        details = []

        try:
            cur = conn.cursor()

            # ── Bug 3 : plan_id null sur intervention préventive ───────────────
            # Interventions créées via POST /interventions avec request_id avant le fix
            # qui résout plan_id depuis l'occurrence liée.
            cur.execute(
                """
                UPDATE intervention i
                SET plan_id = po.plan_id
                FROM preventive_occurrence po
                WHERE po.intervention_id = i.id
                  AND i.plan_id IS NULL
                  AND po.plan_id IS NOT NULL
                RETURNING i.id, po.plan_id
                """
            )
            plan_rows = cur.fetchall()
            self._record_plan_fixed(plan_rows)
            interventions_plan_fixed = len(plan_rows)
            if plan_rows:
                details.append(
                    f"Bug 3 : {interventions_plan_fixed} intervention(s) — plan_id rétabli"
                )
                logger.info(
                    "Repair Bug 3 : %s intervention(s) avec plan_id corrigé",
                    interventions_plan_fixed,
                )

            # Couvrir aussi le chemin DI → occurrence.intervention_id NULL mais
            # ir.intervention_id renseigné (Bug 3 via transition_status)
            cur.execute(
                """
                UPDATE intervention i
                SET plan_id = po.plan_id
                FROM preventive_occurrence po
                JOIN intervention_request ir ON ir.id = po.di_id
                WHERE ir.intervention_id = i.id
                  AND po.intervention_id IS NULL
                  AND i.plan_id IS NULL
                  AND po.plan_id IS NOT NULL
                RETURNING i.id, po.plan_id
                """
            )
            plan_rows2 = cur.fetchall()
            self._record_plan_fixed(plan_rows2)
            if plan_rows2:
                interventions_plan_fixed += len(plan_rows2)
                details.append(
                    f"Bug 3b : {len(plan_rows2)} intervention(s) — plan_id rétabli via DI"
                )

            # ── Bug 1 : tâches orphelines sans intervention_id ──────────────────
            cur.execute(
                """
                UPDATE intervention_task it
                SET intervention_id = po.intervention_id
                FROM preventive_occurrence po
                WHERE it.occurrence_id = po.id
                  AND po.intervention_id IS NOT NULL
                  AND it.intervention_id IS NULL
                RETURNING it.id, po.intervention_id
                """
            )
            rows = cur.fetchall()
            self._record_tasks_relinked(rows)
            tasks_relinked = len(rows)
            if rows:
                affected_interventions = list({str(r[1]) for r in rows})
                details.append(
                    f"Bug 1 : {tasks_relinked} tâche(s) rattachée(s) aux interventions : "
                    + ", ".join(affected_interventions)
                )
                logger.info("Repair Bug 1 : %s intervention_task rattachés", tasks_relinked)

            # Bug 1 variante : occurrence sans intervention_id mais DI a intervention_id
            cur.execute(
                """
                UPDATE intervention_task it
                SET intervention_id = ir.intervention_id
                FROM preventive_occurrence po
                JOIN intervention_request ir ON ir.id = po.di_id
                WHERE it.occurrence_id = po.id
                  AND po.intervention_id IS NULL
                  AND ir.intervention_id IS NOT NULL
                  AND it.intervention_id IS NULL
                RETURNING it.id, ir.intervention_id
                """
            )
            rows2 = cur.fetchall()
            self._record_tasks_relinked(rows2)
            if rows2:
                tasks_relinked += len(rows2)
                affected_interventions2 = list({str(r[1]) for r in rows2})
                details.append(
                    f"Bug 1b : {len(rows2)} tâche(s) rattachée(s) via DI → interventions : "
                    + ", ".join(affected_interventions2)
                )
                logger.info("Repair Bug 1b : %s intervention_task rattachés via DI", len(rows2))

            # ── Étape 3 : occurrences dont la DI est acceptée mais intervention_id manquant ──
            # Cas : acceptation manuelle de DI préventive sans mise à jour de l'occurrence.
            # Fix : lier occurrence + gamme_steps + plan_id de l'intervention.
            cur.execute(
                """
                SELECT po.id, po.plan_id, ir.intervention_id, po.status
                FROM preventive_occurrence po
                JOIN intervention_request ir ON ir.id = po.di_id
                WHERE po.intervention_id IS NULL
                  AND ir.intervention_id IS NOT NULL
                """
            )
            orphan_rows = cur.fetchall()
            for occ_id, occ_plan_id, linked_intervention_id, occ_status in orphan_rows:
                occ_id = str(occ_id)
                linked_intervention_id = str(linked_intervention_id)
                new_status = 'in_progress' if occ_status in ('pending', 'generated') else occ_status

                cur.execute(
                    "UPDATE preventive_occurrence SET intervention_id = %s, status = %s WHERE id = %s",
                    (linked_intervention_id, new_status, occ_id),
                )
                record_cascade(
                    "preventive_occurrence",
                    occ_id,
                    "status_changed",
                    old_value={"status": occ_status, "intervention_id": None},
                    new_value={"status": new_status, "intervention_id": linked_intervention_id},
                )
                attach_tasks(cur, occ_id, linked_intervention_id)
                if occ_plan_id:
                    cur.execute(
                        "UPDATE intervention SET plan_id = %s WHERE id = %s AND plan_id IS NULL "
                        "RETURNING id, plan_id",
                        (str(occ_plan_id), linked_intervention_id),
                    )
                    self._record_plan_fixed(cur.fetchall())
                occurrences_set_in_progress += 1
                details.append(
                    f"Étape 3 : occurrence {occ_id} liée à l'intervention {linked_intervention_id} (acceptation manuelle)"
                )
            if orphan_rows:
                logger.info(
                    "Repair étape 3 : %s occurrence(s) liées à leur intervention (acceptation manuelle)",
                    len(orphan_rows),
                )

            # ── Bug 2 : occurrences bloquées à 'generated' ou 'in_progress' ──────
            cur.execute(
                """
                SELECT
                    po.id,
                    COALESCE(po.intervention_id, ir.intervention_id) AS intervention_id,
                    po.di_id,
                    (po.intervention_id IS NULL) AS needs_relink,
                    po.status
                FROM preventive_occurrence po
                LEFT JOIN intervention_request ir
                    ON ir.id = po.di_id AND po.intervention_id IS NULL
                JOIN intervention i
                    ON i.id = COALESCE(po.intervention_id, ir.intervention_id)
                JOIN intervention_status_ref isr ON isr.id = i.status_actual
                WHERE po.status IN ('generated', 'in_progress')
                  AND isr.code = 'ferme'
                """
            )
            stale_occurrences = cur.fetchall()

            for occ_id, intervention_id, di_id, needs_relink, old_status in stale_occurrences:
                occ_id = str(occ_id)
                intervention_id = str(intervention_id)

                if needs_relink:
                    cur.execute(
                        "UPDATE preventive_occurrence SET intervention_id = %s WHERE id = %s",
                        (intervention_id, occ_id),
                    )
                    record_cascade(
                        "preventive_occurrence",
                        occ_id,
                        "intervention_id_changed",
                        old_value={"intervention_id": None},
                        new_value={"intervention_id": intervention_id},
                    )
                    occurrences_relinked += 1

                cur.execute(
                    "UPDATE preventive_occurrence SET status = 'completed' WHERE id = %s",
                    (occ_id,),
                )
                record_cascade(
                    "preventive_occurrence",
                    occ_id,
                    "status_changed",
                    old_value={"status": old_status},
                    new_value={"status": "completed"},
                )
                occurrences_completed += 1
                details.append(
                    f"Bug 2 : occurrence {occ_id} → 'completed' "
                    f"(intervention fermée : {intervention_id})"
                )

                if di_id:
                    cur.execute(
                        """
                        SELECT id, statut FROM intervention_request
                        WHERE id = %s AND statut = 'acceptee'
                        LIMIT 1
                        """,
                        (str(di_id),),
                    )
                    req_row = cur.fetchone()
                    if req_row:
                        req_id, req_statut = str(req_row[0]), req_row[1]
                        with skip_request_status_log(cur):
                            cur.execute(
                                "UPDATE intervention_request SET statut = 'cloturee' WHERE id = %s",
                                (req_id,),
                            )
                            cur.execute(
                                """
                                INSERT INTO request_status_log
                                    (request_id, status_from, status_to, changed_by, notes)
                                VALUES (%s, %s, 'cloturee',
                                        NULLIF(current_setting('app.user_id', true), '')::uuid, %s)
                                """,
                                (
                                    req_id,
                                    req_statut,
                                    "Clôture automatique — procédure de réparation (bug cascade fermeture)",
                                ),
                            )
                        record_cascade(
                            "request",
                            req_id,
                            "status_transitioned",
                            old_value={"statut": req_statut},
                            new_value={
                                "statut": "cloturee",
                                "notes": "Clôture automatique (procédure de réparation)",
                            },
                        )
                        requests_closed += 1
                        details.append(
                            f"Bug 2 : demande {req_id} → 'cloturee' (liée à l'occurrence {occ_id})"
                        )

            # ── Bug 7 : tâches de gamme absentes (steps ajoutés après génération) ────
            # Occurrences déjà liées à une intervention mais sans aucune intervention_task.
            cur.execute(
                """
                SELECT po.id AS occurrence_id, po.intervention_id, po.plan_id
                FROM preventive_occurrence po
                WHERE po.intervention_id IS NOT NULL
                  AND po.plan_id IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM intervention_task it
                      WHERE it.occurrence_id = po.id
                  )
                """
            )
            missing_task_rows = cur.fetchall()
            for occ_id, intervention_id, plan_id in missing_task_rows:
                occ_id = str(occ_id)
                intervention_id = str(intervention_id)
                cur.execute(
                    """
                    INSERT INTO intervention_task
                        (gamme_step_id, occurrence_id, intervention_id, label, origin,
                         status, optional, sort_order)
                    SELECT
                        pgs.id, %s, %s, pgs.label, 'plan', 'todo', pgs.optional, pgs.sort_order
                    FROM preventive_plan_gamme_step pgs
                    WHERE pgs.plan_id = %s
                    ON CONFLICT (gamme_step_id, occurrence_id) DO NOTHING
                    RETURNING id
                    """,
                    (occ_id, intervention_id, str(plan_id)),
                )
                created_tasks = cur.fetchall()
                for (task_id,) in created_tasks:
                    self._record_system_created(cur, "task", str(task_id))
                inserted = len(created_tasks)
                tasks_generated_missing += inserted
                if inserted:
                    details.append(
                        f"Bug 7 : {inserted} tâche(s) générée(s) pour l'occurrence {occ_id} "
                        f"(intervention {intervention_id})"
                    )
            if missing_task_rows:
                logger.info(
                    "Repair Bug 7 : %s tâche(s) de gamme générée(s) pour %s occurrence(s) sans tâches",
                    tasks_generated_missing,
                    len(missing_task_rows),
                )

            # ── Bug 5 : optional désynchronisé entre tâche et step de gamme ──────
            # Si le plan a été modifié après génération, les tâches origin='plan'
            # conservent l'ancienne valeur de optional et bloquent à tort la fermeture.
            cur.execute(
                """
                UPDATE intervention_task it
                SET optional = pgs.optional
                FROM preventive_plan_gamme_step pgs
                WHERE it.gamme_step_id = pgs.id
                  AND it.origin = 'plan'
                  AND it.optional != pgs.optional
                RETURNING it.id, pgs.optional
                """
            )
            opt_rows = cur.fetchall()
            for task_id, new_optional in opt_rows:
                record_cascade(
                    "task",
                    task_id,
                    "optional_changed",
                    old_value={"optional": not new_optional},
                    new_value={"optional": new_optional},
                )
            tasks_optional_resynced = len(opt_rows)
            if opt_rows:
                details.append(
                    f"Bug 5 : {tasks_optional_resynced} tâche(s) — optional resynchronisé depuis le plan"
                )
                logger.info(
                    "Repair Bug 5 : %s tâche(s) optional resynchronisé(es)",
                    tasks_optional_resynced,
                )

            conn.commit()
            logger.info(
                "Repair terminé : %s tâches rattachées, %s occurrences reliées, "
                "%s → in_progress, %s complétées, %s demandes clôturées, %s plan_id corrigés, "
                "%s optional resynchronisés, %s tâches générées (Bug 7)",
                tasks_relinked,
                occurrences_relinked,
                occurrences_set_in_progress,
                occurrences_completed,
                requests_closed,
                interventions_plan_fixed,
                tasks_optional_resynced,
                tasks_generated_missing,
            )

        except Exception as e:
            raise_db_error(e, "procédure de réparation des occurrences")
        finally:
            release_connection(conn)

        return {
            "tasks_relinked": tasks_relinked,
            "occurrences_relinked": occurrences_relinked,
            "occurrences_set_in_progress": occurrences_set_in_progress,
            "occurrences_completed": occurrences_completed,
            "requests_closed": requests_closed,
            "tasks_optional_resynced": tasks_optional_resynced,
            "interventions_plan_fixed": interventions_plan_fixed,
            "tasks_generated_missing": tasks_generated_missing,
            "details": details,
        }
