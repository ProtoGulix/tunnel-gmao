from typing import Any, Dict, List, Optional

from api.audits.schemas import AuditRules
from api.constants import CLOSED_STATUS_CODE
from api.errors.exceptions import AuditReasonRequiredError, ValidationError
from api.interventions.types import check_assignable

# Transitions autorisées : statut_from → [statuts_to possibles]
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "nouvelle": ["en_attente", "acceptee", "rejetee"],
    "en_attente": ["acceptee", "rejetee"],
    "acceptee": ["cloturee"],
    "rejetee": [],
    "cloturee": [],
}

# Décision d'audit (decision_types) d'un rejet de demande (ADR 0038)
REJECT_DECISION = "request_rejected"

CLOSE_VIA_INTERVENTION_MESSAGE = "Clore l'intervention : elle clôturera la demande."


def _is_closable(intervention_status: Optional[str], has_intervention: bool) -> bool:
    """Vrai si la demande peut être clôturée : sans intervention, ou intervention fermée.

    La demande ne ferme jamais son intervention (ADR 0029) : c'est la clôture de
    l'intervention, par sa porte unique, qui clôture la demande.
    """
    return not has_intervention or intervention_status == CLOSED_STATUS_CODE


def compute_allowed_transitions(
    statut: str,
    has_intervention: bool,
    intervention_status: Optional[str],
    can_transition: bool,
) -> List[str]:
    """Transitions que l'utilisateur peut déclencher maintenant sur une demande.

    Fonction unique : le tableau ALLOWED_TRANSITIONS donne le graphe, puis on retire la
    clôture tant que l'intervention liée est ouverte, et tout si l'utilisateur n'a pas la
    permission de transition. Les fronts n'ont plus à recopier ces règles.
    """
    if not can_transition:
        return []
    return [
        target
        for target in ALLOWED_TRANSITIONS.get(statut, [])
        if target != "cloturee" or _is_closable(intervention_status, has_intervention)
    ]


def ensure_reject_reason(
    reason_code: Optional[str],
    reason_text: Optional[str],
    reasons: List[Dict[str, Any]],
) -> None:
    """Vérifie le motif explicite d'un rejet de demande (ADR 0038, même mécanisme que ADR 0028).

    Rejeter n'est jamais routinier : sans motif choisi par l'utilisateur (ROUTINE injecté
    par le middleware, motif auto ou system), on répond la demande de motif standard.
    `reasons` = motifs actifs de l'entité demande ; seuls ceux dont decision_types
    contient `request_rejected` sont proposés et acceptés.
    """
    from api.utils.audit import build_picker_reasons

    proposed = [r for r in reasons if REJECT_DECISION in (r.get("decision_types") or [])]
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if reason is None:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une demande")
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
        raise ValidationError(f"Motif '{reason_code}' non applicable à un rejet")
    if reason_code == "OTHER" and not (reason_text or "").strip():
        raise ValidationError("reason_text obligatoire quand reason_code = OTHER")


class InterventionRequestValidator:
    """
    Validation des règles métier pour les demandes d'intervention.

    Règles de liaison :
    - Une demande liée à une intervention est verrouillée : elle ne peut plus être liée à une autre.
    - Une intervention liée à une demande est verrouillée : elle ne peut plus être liée à une autre demande.
    Ces vérifications sont effectuées dans InterventionRepository._link_request() et
    InterventionRequestRepository.transition_status() au moment de l'acceptation.
    """

    @staticmethod
    def validate_transition(
        current_statut: str,
        status_to: str,
        notes: Optional[str],
        intervention_data: Optional[Dict[str, Any]],
        current_intervention_id: Optional[Any] = None,
        reason_code: Optional[str] = None,
        intervention_status: Optional[str] = None,
    ) -> None:
        """
        Valide qu'une transition de statut est autorisée et que les données
        associées sont cohérentes avec le statut cible.
        """
        allowed = ALLOWED_TRANSITIONS.get(current_statut, [])
        if status_to not in allowed:
            raise ValidationError(
                f"Transition '{current_statut}' → '{status_to}' non autorisée. "
                f"Transitions possibles : {allowed or 'aucune'}"
            )

        # La demande ne ferme pas son intervention : on clôture l'intervention d'abord.
        if status_to == "cloturee" and not _is_closable(
            intervention_status, current_intervention_id is not None
        ):
            raise ValidationError(CLOSE_VIA_INTERVENTION_MESSAGE)

        # Liaison verrouillée : une demande déjà liée ne peut pas être re-acceptée
        if status_to == "acceptee" and current_intervention_id is not None:
            raise ValidationError(
                f"Cette demande est déjà liée à l'intervention '{current_intervention_id}'. "
                f"Une demande ne peut être liée qu'à une seule intervention."
            )

        # Motif obligatoire pour rejet — porté par reason_text (raison d'audit), voir routes.py.
        # Cohérent avec la règle système fn_audit_log_decision() / GET /audit/rules
        # (AuditRuleReason.requires_text) : le texte libre n'est exigé que pour reason_code=OTHER,
        # les autres raisons du picker se suffisent à elles-mêmes.
        if status_to == "rejetee" and reason_code == "OTHER" and not (notes or "").strip():
            raise ValidationError(
                "Un motif de rejet est obligatoire (reason_text) lorsque la raison sélectionnée est 'Autre raison'"
            )

        # Champs obligatoires pour acceptation (création intervention)
        if status_to == "acceptee":
            if not intervention_data or not intervention_data.get("type_inter"):
                raise ValidationError("type_inter est obligatoire pour accepter une demande")
            if not (intervention_data.get("tech_id") or intervention_data.get("tech_initials")):
                raise ValidationError(
                    "tech_id ou tech_initials est obligatoire pour accepter une demande"
                )

    @staticmethod
    def validate_create(data: Dict[str, Any]) -> None:
        """Valide les règles métier avant création d'une demande d'intervention."""
        demandeur_nom = (data.get("demandeur_nom") or "").strip()
        description = (data.get("description") or "").strip()

        if not demandeur_nom:
            raise ValidationError("demandeur_nom est obligatoire")
        if not description:
            raise ValidationError("description est obligatoire")
        if not data.get("machine_id"):
            raise ValidationError("machine_id est obligatoire")
        if data.get("suggested_type_inter"):
            # Nouvelle demande : le type suggéré doit exister en base et être actif.
            check_assignable(data["suggested_type_inter"])

        from api.equipement_statuts.repo import check_equipement_statut_allows_interventions

        check_equipement_statut_allows_interventions(str(data["machine_id"]))
