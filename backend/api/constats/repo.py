import logging
from typing import Any, Dict, List, Optional

from api.audits.cascade import record_cascade_changes
from api.audits.events import record_audit_event
from api.constats.validators import ConstatValidator
from api.db import get_connection, release_connection
from api.errors.exceptions import (
    ConflictError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
    raise_db_error,
)

logger = logging.getLogger(__name__)

# Type préconisé des idées d'amélioration que le référent peut rattacher (ADR 0043 point 6)
IMPROVEMENT_TYPE = "PRO"
# Une idée est « ouverte » tant que sa demande n'est ni rejetée ni clôturée
OPEN_IDEA_STATUSES = ("nouvelle", "en_attente", "acceptee")
# Statuts de la demande d'un constat que le référent peut encore rejeter en doublon
REJECTABLE_STATUSES = ("nouvelle", "en_attente")

# Colonnes lues d'un constat avec sa machine, son auteur et sa demande. Les clauses WHERE
# passées à `_fetch` sont écrites ici, jamais construites depuis une entrée client.
_CONSTAT_SELECT = """
    SELECT c.id, c.intervention_id, c.machine_id, m.code AS machine_code, m.name AS machine_name,
           c.created_by, u.first_name AS author_first_name, u.last_name AS author_last_name,
           c.created_at, c.supersedes_id, c.request_id, ir.code AS request_code,
           ir.statut AS request_status, ir.suggested_type_inter, c.linked_request_id,
           lr.code AS linked_request_code,
           rs.label AS request_status_label, rs.color AS request_status_color,
           ir.intervention_id AS request_intervention_id,
           ri.code AS request_intervention_code, src.code AS source_intervention_code,
           src.printed_fiche AS source_archived,
           rj.label AS request_status_reason,
           NULLIF(btrim(rj.reason_text), '') AS request_status_comment,
           rj.author_name AS request_status_by, rj.logged_at AS request_status_at
    FROM constat c
    JOIN machine m ON m.id = c.machine_id
    JOIN tunnel_user u ON u.id = c.created_by
    LEFT JOIN intervention_request ir ON ir.id = c.request_id
    LEFT JOIN intervention_request lr ON lr.id = c.linked_request_id
    LEFT JOIN request_status_ref rs ON rs.code = ir.statut
    LEFT JOIN intervention ri ON ri.id = ir.intervention_id
    LEFT JOIN intervention src ON src.id = c.intervention_id
    LEFT JOIN LATERAL (
        SELECT arc.label, al.reason_text, al.logged_at,
               NULLIF(concat_ws(' ', au.first_name, au.last_name), '') AS author_name
        FROM audit_log al
        LEFT JOIN audit_reason_code arc ON arc.id = al.reason_code_id
        LEFT JOIN tunnel_user au ON au.id = al.changed_by
        WHERE al.entity_type = 'request' AND al.entity_id = ir.id
          AND al.decision_type IN ('created', 'statut_changed')
        ORDER BY al.logged_at DESC, al.decision_type = 'statut_changed' DESC
        LIMIT 1
    ) rj ON true
"""
_NOT_SUPERSEDED = "NOT EXISTS (SELECT 1 FROM constat s WHERE s.supersedes_id = c.id)"
_BY_INTERVENTION = f"WHERE c.intervention_id = %s AND {_NOT_SUPERSEDED} ORDER BY c.created_at"
_BY_REQUEST = f"WHERE c.request_id = %s AND {_NOT_SUPERSEDED}"
_BY_ID = "WHERE c.id = %s"


def _rows(cur: Any) -> List[Dict[str, Any]]:
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


class ConstatRepository:
    """Questions du formulaire, constats d'une intervention et demandes qui en sont issues."""

    # ── Lectures ─────────────────────────────────────────────────────────────

    @staticmethod
    def _load_form(cur: Any) -> List[Dict[str, Any]]:
        """Toutes les questions (actives ou non) avec leurs choix : base des validations."""
        cur.execute(
            """
            SELECT q.id, q.code, q.label, q.is_multiple, pc.code AS parent_choice_code,
                   q.sort_order, q.is_active
            FROM constat_question q
            LEFT JOIN constat_choice pc ON pc.id = q.parent_choice_id
            ORDER BY q.sort_order, q.id
            """
        )
        questions = _rows(cur)
        by_id = {q["id"]: q for q in questions}
        for q in questions:
            q["choices"] = []
        cur.execute(
            """
            SELECT question_id, code, label, sort_order, is_active, suggested_type_inter,
                   creates_request, is_exclusive
            FROM constat_choice ORDER BY sort_order, id
            """
        )
        for choice in _rows(cur):
            by_id[choice.pop("question_id")]["choices"].append(choice)
        return questions

    def list_questions(self) -> List[Dict[str, Any]]:
        """Questions et choix actifs, dans l'ordre de l'écran. Le type préconisé reste côté API."""
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                form = self._load_form(cur)
            return [
                {
                    "code": q["code"],
                    "label": q["label"],
                    "is_multiple": q["is_multiple"],
                    "parent_choice_code": q["parent_choice_code"],
                    "sort_order": q["sort_order"],
                    "choices": [
                        {
                            "code": c["code"],
                            "label": c["label"],
                            "sort_order": c["sort_order"],
                            "creates_request": c["creates_request"],
                            "is_exclusive": c["is_exclusive"],
                        }
                        for c in q["choices"]
                        if c["is_active"]
                    ],
                }
                for q in form
                if q["is_active"]
            ]
        except Exception as e:
            raise_db_error(e, "lecture des questions du constat")
        finally:
            if conn:
                release_connection(conn)

    @staticmethod
    def _fetch(cur: Any, where: str, param: str) -> List[Dict[str, Any]]:
        """Constats (versions courantes) avec leurs réponses ; `where` vient du code."""
        cur.execute(_CONSTAT_SELECT + where, (param,))
        constats = _rows(cur)
        if not constats:
            return []
        cur.execute(
            """
            SELECT a.constat_id, q.code AS question_code, q.label AS question_label, ch.code AS choice_code, ch.label
            FROM constat_answer a
            JOIN constat_choice ch ON ch.code = a.choice_code
            JOIN constat_question q ON q.id = ch.question_id
            WHERE a.constat_id = ANY(%s::uuid[])
            ORDER BY q.sort_order, ch.sort_order
            """,
            ([str(c["id"]) for c in constats],),
        )
        answers = _rows(cur)
        for c in constats:
            c["answers"] = [
                {k: a[k] for k in ("question_code", "question_label", "choice_code", "label")}
                for a in answers
                if a["constat_id"] == c["id"]
            ]
        return constats

    @staticmethod
    def _decorate(constats: List[Dict[str, Any]], user_id: Any, role: Optional[str]) -> None:
        """Ajoute `can_correct` (même règle que la correction) pour l'utilisateur courant."""
        for c in constats:
            c["can_correct"] = ConstatValidator.can_correct(
                c["created_by"], user_id, role, c["request_status"], bool(c["source_archived"])
            )
            del c["source_archived"]

    def list_for_intervention(
        self, intervention_id: str, user_id: Any, role: Optional[str]
    ) -> List[Dict[str, Any]]:
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM intervention WHERE id = %s", (intervention_id,))
                if cur.fetchone() is None:
                    raise NotFoundError(f"Intervention {intervention_id} non trouvée")
                constats = self._fetch(cur, _BY_INTERVENTION, intervention_id)
            self._decorate(constats, user_id, role)
            return constats
        except Exception as e:
            raise_db_error(e, "lecture des constats")
        finally:
            if conn:
                release_connection(conn)

    def get_by_id(self, constat_id: str, user_id: Any, role: Optional[str]) -> Dict[str, Any]:
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                constats = self._fetch(cur, _BY_ID, constat_id)
            if not constats:
                raise NotFoundError(f"Constat {constat_id} non trouvé")
            self._decorate(constats, user_id, role)
            return constats[0]
        except Exception as e:
            raise_db_error(e, "lecture du constat")
        finally:
            if conn:
                release_connection(conn)

    def get_by_request(self, request_id: str, user_id: Any, role: Optional[str]) -> Dict[str, Any]:
        """Version courante du constat dont est issue une demande."""
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                constats = self._fetch(cur, _BY_REQUEST, request_id)
            if not constats:
                raise NotFoundError("Aucun constat pour cette demande")
            self._decorate(constats, user_id, role)
            return constats[0]
        except Exception as e:
            raise_db_error(e, "lecture du constat")
        finally:
            if conn:
                release_connection(conn)

    def list_improvement_ideas(self, constat_id: str) -> List[Dict[str, Any]]:
        """Idées d'amélioration ouvertes de la machine du constat (hors sa propre demande)."""
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT machine_id, request_id FROM constat WHERE id = %s", (constat_id,)
                )
                row = cur.fetchone()
                if row is None:
                    raise NotFoundError(f"Constat {constat_id} non trouvé")
                cur.execute(
                    """
                    SELECT ir.id, ir.code, ir.description, ir.statut, ir.created_at
                    FROM intervention_request ir
                    WHERE ir.machine_id = %s AND ir.suggested_type_inter = %s
                      AND ir.statut = ANY(%s) AND ir.id IS DISTINCT FROM %s::uuid
                    ORDER BY ir.created_at DESC
                    """,
                    (
                        str(row[0]),
                        IMPROVEMENT_TYPE,
                        list(OPEN_IDEA_STATUSES),
                        str(row[1]) if row[1] else None,
                    ),
                )
                return _rows(cur)
        except Exception as e:
            raise_db_error(e, "lecture des idées d'amélioration")
        finally:
            if conn:
                release_connection(conn)

    # ── Écritures ────────────────────────────────────────────────────────────

    @staticmethod
    def _author_name(cur: Any, user_id: str) -> str:
        cur.execute(
            "SELECT first_name, last_name, email FROM tunnel_user WHERE id = %s", (user_id,)
        )
        row = cur.fetchone()
        if row is None:
            raise UnauthorizedError("Authentification requise")
        return " ".join(p for p in (row[0], row[1]) if p).strip() or row[2]

    @staticmethod
    def _ensure_machine(cur: Any, machine_id: str) -> None:
        cur.execute("SELECT 1 FROM machine WHERE id = %s", (machine_id,))
        if cur.fetchone() is None:
            raise ValidationError("Machine inconnue")

    @staticmethod
    def _usable_type(cur: Any, type_code: Optional[str]) -> Optional[str]:
        """Type préconisé s'il est encore actif ; un type désactivé depuis ne bloque pas la saisie."""
        if not type_code:
            return None
        cur.execute("SELECT 1 FROM intervention_type WHERE code = %s AND is_active", (type_code,))
        return type_code if cur.fetchone() else None

    @staticmethod
    def _insert_version(
        cur: Any,
        intervention_id: str,
        machine_id: str,
        user_id: str,
        request_id: Optional[str],
        selected: List[Dict[str, Any]],
        supersedes_id: Optional[str] = None,
    ) -> str:
        cur.execute(
            """
            INSERT INTO constat (intervention_id, machine_id, created_by, request_id, supersedes_id)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
            """,
            (intervention_id, machine_id, user_id, request_id, supersedes_id),
        )
        constat_id = str(cur.fetchone()[0])
        cur.executemany(
            "INSERT INTO constat_answer (constat_id, choice_code) VALUES (%s, %s)",
            [(constat_id, s["choice"]["code"]) for s in selected],
        )
        return constat_id

    def _create_request(
        self,
        cur: Any,
        intervention_id: str,
        intervention_code: str,
        machine_id: str,
        user_id: str,
        prepared: Dict[str, Any],
    ) -> str:
        """Demande issue du constat (même transaction) ; renvoie son id."""
        # Import lazy pour éviter la circularité avec intervention_requests.repo
        from api.intervention_requests.repo import InterventionRequestRepository
        from api.interventions.repo import InterventionRepository

        request_id = InterventionRequestRepository.insert_request(
            cur,
            {
                "machine_id": machine_id,
                "demandeur_nom": self._author_name(cur, user_id),
                "description": ConstatValidator.build_description(
                    intervention_code, prepared["selected"]
                ),
                "suggested_type_inter": self._usable_type(cur, prepared["suggested_type_inter"]),
                "source_intervention_id": intervention_id,
            },
            user_id,
        )
        InterventionRepository.record_created_event(cur, "request", request_id)
        return request_id

    def create(
        self,
        intervention_id: str,
        machine_id: Optional[str],
        choice_codes: List[str],
        user_id: Optional[str],
    ) -> str:
        """Crée le constat, et sa demande si un choix la génère, dans une transaction."""
        if not user_id:
            raise UnauthorizedError("Authentification requise")
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT code, machine_id, printed_fiche FROM intervention WHERE id = %s",
                    (intervention_id,),
                )
                intervention = cur.fetchone()
                if intervention is None:
                    raise NotFoundError(f"Intervention {intervention_id} non trouvée")
                ConstatValidator.ensure_intervention_open_to_constat(intervention[2])
                machine = machine_id or str(intervention[1])
                self._ensure_machine(cur, machine)
                prepared = ConstatValidator.validate_and_prepare(choice_codes, self._load_form(cur))
                request_id = (
                    self._create_request(
                        cur, intervention_id, intervention[0], machine, user_id, prepared
                    )
                    if prepared["creates_request"]
                    else None
                )
                constat_id = self._insert_version(
                    cur, intervention_id, machine, user_id, request_id, prepared["selected"]
                )
            conn.commit()
            logger.info("Constat %s créé sur l'intervention %s", constat_id, intervention_id)
            return constat_id
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "création du constat")
        finally:
            if conn:
                release_connection(conn)

    def correct(
        self,
        constat_id: str,
        machine_id: Optional[str],
        choice_codes: List[str],
        user_id: Optional[str],
        role: Optional[str],
    ) -> str:
        """Nouvelle version du constat, qui remplace l'ancienne.

        Avec demande : elle est mise à jour (jamais retirée). Sans demande : elle est créée si
        la nouvelle version en génère une (ADR 0045 point 4).
        """
        if not user_id:
            raise UnauthorizedError("Authentification requise")
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.intervention_id, c.machine_id, c.created_by, c.request_id,
                           i.code, i.printed_fiche
                    FROM constat c JOIN intervention i ON i.id = c.intervention_id
                    WHERE c.id = %s FOR UPDATE OF c
                    """,
                    (constat_id,),
                )
                old = cur.fetchone()
                if old is None:
                    raise NotFoundError(f"Constat {constat_id} non trouvé")
                cur.execute("SELECT 1 FROM constat WHERE supersedes_id = %s", (constat_id,))
                if cur.fetchone():
                    raise ConflictError("Ce constat a déjà été corrigé : rechargez")
                request = None
                if old[3] is not None:
                    cur.execute(
                        """
                        SELECT statut, machine_id, description, suggested_type_inter
                        FROM intervention_request WHERE id = %s FOR UPDATE
                        """,
                        (str(old[3]),),
                    )
                    request = cur.fetchone()
                ConstatValidator.ensure_intervention_open_to_constat(old[5])
                ConstatValidator.ensure_can_correct(
                    old[2], user_id, role, request[0] if request else None
                )
                machine = machine_id or str(old[1])
                if machine != str(old[1]):
                    self._ensure_machine(cur, machine)
                    # Import lazy pour éviter la circularité entre domaines
                    from api.equipement_statuts.repo import (
                        check_equipement_statut_allows_interventions,
                    )

                    check_equipement_statut_allows_interventions(machine)
                prepared = ConstatValidator.validate_and_prepare(choice_codes, self._load_form(cur))
                request_id = str(old[3]) if old[3] is not None else None
                if request_id is None and prepared["creates_request"]:
                    request_id = self._create_request(
                        cur, str(old[0]), old[4], machine, user_id, prepared
                    )
                new_id = self._insert_version(
                    cur,
                    str(old[0]),
                    machine,
                    user_id,
                    request_id,
                    prepared["selected"],
                    supersedes_id=constat_id,
                )
                if request is not None:
                    self._update_request(cur, str(old[3]), request, machine, old[4], prepared)
                record_audit_event(
                    "constat",
                    constat_id,
                    "constat_corrected",
                    old_value={"constat_id": constat_id},
                    new_value={"constat_id": new_id},
                )
            conn.commit()
            logger.info("Constat %s corrigé : version %s", constat_id, new_id)
            return new_id
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "correction du constat")
        finally:
            if conn:
                release_connection(conn)

    @staticmethod
    def _update_request(
        cur: Any,
        request_id: str,
        request: Any,
        machine_id: str,
        intervention_code: str,
        prepared: Dict[str, Any],
    ) -> None:
        """Met la demande existante à jour. Si la version ne génère plus de demande, elle reste
        telle quelle : machine et description seulement, le type et le statut ne bougent pas."""
        after = {
            "machine_id": machine_id,
            "description": ConstatValidator.build_description(
                intervention_code, prepared["selected"]
            ),
        }
        before = {"machine_id": str(request[1]), "description": request[2]}
        cur.execute(
            "UPDATE intervention_request SET machine_id = %s, description = %s WHERE id = %s",
            (after["machine_id"], after["description"], request_id),
        )
        if prepared["creates_request"]:
            after["suggested_type_inter"] = ConstatRepository._usable_type(
                cur, prepared["suggested_type_inter"]
            )
            before["suggested_type_inter"] = request[3]
            cur.execute(
                "UPDATE intervention_request SET suggested_type_inter = %s WHERE id = %s",
                (after["suggested_type_inter"], request_id),
            )
        record_cascade_changes("request", request_id, before, after)

    def link_to_idea(self, constat_id: str, idea_id: str, user_id: Optional[str]) -> None:
        """Rattache le constat à une idée ouverte de sa machine et rejette sa demande (doublon).

        Le rejet passe par la transition existante (ADR 0038, motif REJECT_DUPLICATE). Lien et
        rejet partagent la transaction de la requête (ADR 0018) : un échec annule les deux.
        """
        if not user_id:
            raise UnauthorizedError("Authentification requise")
        # Import lazy pour éviter la circularité avec intervention_requests
        from api.intervention_requests.repo import InterventionRequestRepository
        from api.intervention_requests.validators import ensure_reject_reason
        from api.utils.audit import list_entity_reasons

        # Le motif de doublon doit exister et rester actif dans les données de référence
        reason_code = "REJECT_DUPLICATE"
        ensure_reject_reason(reason_code, None, list_entity_reasons("request"))
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT c.machine_id, c.request_id, c.linked_request_id, ir.statut, ir.code
                    FROM constat c LEFT JOIN intervention_request ir ON ir.id = c.request_id
                    WHERE c.id = %s FOR UPDATE OF c
                    """,
                    (constat_id,),
                )
                row = cur.fetchone()
                if row is None:
                    raise NotFoundError(f"Constat {constat_id} non trouvé")
                machine_id, request_id, linked, request_status = row[0], row[1], row[2], row[3]
                if request_id is None:
                    raise ValidationError("Constat sans demande : rattachement impossible")
                cur.execute("SELECT 1 FROM constat WHERE supersedes_id = %s", (constat_id,))
                if cur.fetchone():
                    raise ConflictError("Ce constat a été corrigé : rechargez")
                if linked is not None:
                    raise ValidationError("Constat déjà rattaché")
                if request_status not in REJECTABLE_STATUSES:
                    raise ValidationError("Demande déjà traitée : rattachement impossible")
                cur.execute(
                    """
                    SELECT code FROM intervention_request
                    WHERE id = %s AND machine_id = %s AND suggested_type_inter = %s
                      AND statut = ANY(%s) AND id <> %s
                    """,
                    (
                        idea_id,
                        str(machine_id),
                        IMPROVEMENT_TYPE,
                        list(OPEN_IDEA_STATUSES),
                        str(request_id),
                    ),
                )
                idea = cur.fetchone()
                if idea is None:
                    raise ValidationError("Idée d'amélioration introuvable pour cette machine")
                cur.execute(
                    "UPDATE constat SET linked_request_id = %s WHERE id = %s", (idea_id, constat_id)
                )
                InterventionRequestRepository().transition_status(
                    request_id=str(request_id),
                    status_to="rejetee",
                    notes=f"Doublon : rattaché à {idea[0]}",
                    changed_by=user_id,
                    reason_code=reason_code,
                )
                record_audit_event(
                    "request",
                    request_id,
                    "statut_changed",
                    old_value={"statut": request_status},
                    new_value={"statut": "rejetee"},
                    reason_code=reason_code,
                )
            conn.commit()
            logger.info("Constat %s rattaché à l'idée %s", constat_id, idea_id)
        except Exception as e:
            if conn:
                conn.rollback()
            raise_db_error(e, "rattachement du constat")
        finally:
            if conn:
                release_connection(conn)
