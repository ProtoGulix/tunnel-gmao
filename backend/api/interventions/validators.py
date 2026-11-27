from typing import Any, Dict, List, Optional

from api.audits.schemas import AuditRules
from api.constants import CLOSED_STATUS_CODE, PRIORITY_TYPES
from api.db import get_connection, release_connection
from api.errors.exceptions import AuditReasonRequiredError, ConflictError, ValidationError
from api.interventions.types import check_allowed_for_machine, check_assignable

# Décision d'audit (decision_types) d'une réouverture (ADR 0028)
REOPEN_DECISION = "intervention_reopened"


def is_intervention_locked(status_actual: Optional[str]) -> bool:
    """Vrai si l'intervention est fermée : plus aucune écriture sur elle ni ses actions/tâches.

    Règle unique (ADR 0030) : sert aux refus d'écriture et à l'indicateur `is_locked`.
    """
    return str(status_actual or "").strip().lower() == CLOSED_STATUS_CODE


def is_reopening(current_status: Optional[str], new_status: Optional[str]) -> bool:
    """Vrai si la mise à jour fait sortir l'intervention de « ferme »."""
    return (
        new_status is not None
        and current_status == CLOSED_STATUS_CODE
        and str(new_status) != CLOSED_STATUS_CODE
    )


def ensure_reopen_reason(
    reason_code: Optional[str],
    reason_text: Optional[str],
    reasons: List[Dict[str, Any]],
) -> None:
    """Vérifie le motif explicite d'une réouverture (ADR 0028, même mécanisme que ADR 0016).

    Rouvrir n'est jamais routinier : sans motif choisi par l'utilisateur (ROUTINE injecté
    par le middleware, motif auto ou system), on répond la demande de motif standard.
    `reasons` = motifs actifs de l'entité intervention ; seuls ceux dont decision_types
    contient `intervention_reopened` sont proposés et acceptés.
    """
    from api.utils.audit import build_picker_reasons

    proposed = [r for r in reasons if REOPEN_DECISION in (r.get("decision_types") or [])]
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if reason is None:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une intervention")
    if reason.get("category") not in ("manual", "user"):
        raise AuditReasonRequiredError(
            AuditRules(
                required=True,
                silent=False,
                default_reason_code=None,
                reasons=build_picker_reasons(proposed),
            ).model_dump()
        )
    if reason not in proposed:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une réouverture")
    if reason_code == "OTHER" and not (reason_text or "").strip():
        raise ValidationError("reason_text obligatoire quand reason_code = OTHER")


class InterventionValidator:
    """Validation des règles métier pour les interventions"""

    @staticmethod
    def validate_unique_code(
        machine_id: str,
        type_inter: str,
        tech_initials: str,
        exclude_id: Optional[str] = None,
    ) -> None:
        """
        RÈGLE MÉTIER : Le code intervention ({machine.code}-{type_inter}-{YYYYMMDD}-{tech_initials})
        doit être unique. Lève ConflictError 409 si une intervention avec le même code existe déjà.
        """
        from api.db import get_connection, release_connection

        conn = get_connection()
        try:
            cur = conn.cursor()
            # Reconstitue le code tel que le trigger le génère
            cur.execute(
                """
                SELECT i.id, i.code
                FROM intervention i
                JOIN machine m ON m.id = i.machine_id
                WHERE m.id = %s
                  AND i.type_inter = %s
                  AND i.tech_initials = %s
                  AND DATE(i.reported_date) = CURRENT_DATE
                  AND (%s IS NULL OR i.id != %s)
                LIMIT 1
                """,
                (machine_id, type_inter, tech_initials, exclude_id, exclude_id),
            )
            row = cur.fetchone()
            if row:
                raise ConflictError(
                    f"Une intervention avec le code '{row[1]}' existe déjà "
                    f"pour cette machine, ce type et ces initiales aujourd'hui. "
                    f"Choisissez des initiales différentes ou modifiez le type."
                )
        finally:
            release_connection(conn)

    @staticmethod
    def validate_type_inter(type_inter: str, current: str | None = None) -> None:
        """Valide que le type est connu en base et actif (sauf s'il est inchangé : `current`)."""
        check_assignable(type_inter, current)

    @staticmethod
    def validate_priority(priority: Optional[str]) -> None:
        """RÈGLE MÉTIER (ADR 0039) : la priorité est l'une de PRIORITY_TYPES ; absente = défaut.

        Refuse notamment l'ancienne valeur `normale`, remplacée par `normal`."""
        if priority is None:
            return
        allowed = [p["id"] for p in PRIORITY_TYPES]
        if priority not in allowed:
            raise ValidationError(
                f"Priorité '{priority}' invalide : valeurs permises {', '.join(allowed)}"
            )

    @staticmethod
    def validate_request_required(data: Dict[str, Any], has_new_request: bool = False) -> None:
        """RÈGLE MÉTIER : Toute intervention est issue d'une demande : existante (request_id)
        ou créée dans le même geste (ADR 0025, has_new_request)."""
        if not data.get('request_id') and not has_new_request:
            raise ValidationError(
                "Une intervention doit obligatoirement être liée à une demande d'intervention (request_id manquant)."
            )

    @staticmethod
    def validate_reported_date_not_null(fields_set: set, data: Dict[str, Any]) -> None:
        """Refuse reported_date explicitement null en mise à jour (champ absent = inchangé).

        fields_set vient de model_fields_set : exclude_none ne distingue pas absent et null."""
        if "reported_date" in fields_set and data.get("reported_date") is None:
            raise ValidationError("La date de signalement ne peut pas être vide")

    @staticmethod
    def reject_printed_fiche(fields_set: set) -> None:
        """Refuse printed_fiche en création et mise à jour : l'archivage passe par
        POST /interventions/{id}/mark-printed (réservé ADMIN et RESP, intervention fermée)."""
        if "printed_fiche" in fields_set:
            raise ValidationError(
                "printed_fiche n'est plus modifiable ici : utiliser /interventions/{id}/mark-printed"
            )

    @staticmethod
    def validate_closed_for_archive(status_actual: Optional[str]) -> None:
        """Règle unique d'archivage (unitaire et masse) : seule une intervention fermée."""
        if not is_intervention_locked(status_actual):
            raise ValidationError("Seule une intervention fermée peut être archivée")

    @staticmethod
    def validate_deletable(intervention_id: str) -> None:
        """
        RÈGLE MÉTIER : Une intervention ne peut être supprimée que si elle
        n'est pas fermée et n'a ni action ni demande d'achat liée.
        """
        conn = get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT
                    i.status_actual,
                    COUNT(DISTINCT ia.id) AS action_count,
                    COUNT(DISTINCT iapr.purchase_request_id) AS purchase_count
                FROM intervention i
                LEFT JOIN intervention_action ia ON ia.intervention_id = i.id
                LEFT JOIN intervention_action_purchase_request iapr ON iapr.intervention_action_id = ia.id
                WHERE i.id = %s
                GROUP BY i.status_actual
                """,
                (intervention_id,),
            )
            row = cur.fetchone()
            if row is None:
                return
            status_actual, action_count, purchase_count = row[0], row[1] or 0, row[2] or 0

            if status_actual == CLOSED_STATUS_CODE:
                raise ValidationError(
                    "Impossible de supprimer cette intervention : elle est fermée."
                )

            if action_count > 0:
                raise ValidationError(
                    f"Impossible de supprimer cette intervention : "
                    f"elle possède {action_count} action(s) liée(s). "
                    f"Supprimez d'abord les actions."
                )
            if purchase_count > 0:
                raise ValidationError(
                    f"Impossible de supprimer cette intervention : "
                    f"elle possède {purchase_count} demande(s) d'achat liée(s). "
                    f"Supprimez d'abord les demandes d'achat."
                )
        finally:
            release_connection(conn)

    @classmethod
    def validate_create(
        cls, data: Dict[str, Any], suggested_type: str | None = None, from_plan: bool = False
    ) -> None:
        """Valide les règles métier avant création d'une intervention.

        `suggested_type` : type suggéré par la demande liée, accepté même désactivé.
        `from_plan` : intervention issue d'un plan préventif (type PRE toujours permis)."""
        cls.validate_priority(data.get("priority"))
        if data.get("type_inter"):
            cls.validate_type_inter(data["type_inter"], suggested_type)
            # Le type de la classe de l'équipement l'emporte, même sur le type suggéré (ADR 0031).
            check_allowed_for_machine(
                data["type_inter"], data.get("machine_id"), from_plan=from_plan
            )
        if data.get("machine_id"):
            from api.equipement_statuts.repo import check_equipement_statut_allows_interventions

            check_equipement_statut_allows_interventions(str(data["machine_id"]))
        if data.get("machine_id") and data.get("type_inter") and data.get("tech_initials"):
            cls.validate_unique_code(
                machine_id=str(data["machine_id"]),
                type_inter=data["type_inter"],
                tech_initials=data["tech_initials"],
            )
