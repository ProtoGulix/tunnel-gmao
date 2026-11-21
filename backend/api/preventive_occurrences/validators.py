"""Règles métier du lancement en avance d'une occurrence préventive."""

from typing import Any, Dict, List, Optional

from fastapi import HTTPException

from api.errors.exceptions import ValidationError

# Décision d'audit portée par les motifs proposés pour ignorer une occurrence.
DECISION_SKIPPED = "occurrence_skipped"


class UnprocessableError(HTTPException):
    """Demande bien formée mais refusée par une règle métier (422)."""

    def __init__(self, detail: str):
        super().__init__(status_code=422, detail=detail)


def validate_anticipation(plan: Dict[str, Any], machine: Dict[str, Any]) -> None:
    """Refuse le lancement si le plan ou la machine ne s'y prêtent pas (422)."""
    if not plan["active"]:
        raise UnprocessableError("Le plan est inactif")
    if plan["trigger_type"] != "periodicity":
        raise UnprocessableError("Seuls les plans à périodicité peuvent être lancés en avance")
    if not machine["in_service"]:
        raise UnprocessableError("L'équipement n'est pas en service")
    if machine["equipement_class_id"] != plan["equipement_class_id"]:
        raise UnprocessableError("L'équipement n'est pas de la classe du plan")


def skip_reason_from_choice(
    reason_code: Optional[str], reason_text: Optional[str], reasons: List[Dict[str, Any]]
) -> str:
    """Texte de `skip_reason` (exigé par la contrainte CHECK) déduit du motif choisi.

    `reasons` = motifs actifs applicables à l'occurrence. Seul un motif de la décision
    occurrence_skipped et de catégorie manual ou user est accepté (jamais ROUTINE ni un motif
    système). Retourne le libellé, ou le texte libre pour OTHER (obligatoire).
    """
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if (
        reason is None
        or reason.get("category") not in ("manual", "user")
        or DECISION_SKIPPED not in (reason.get("decision_types") or [])
    ):
        raise ValidationError(f"Motif '{reason_code}' non applicable à l'abandon d'une occurrence")
    text = (reason_text or "").strip()
    if reason_code == "OTHER":
        if not text:
            raise ValidationError("reason_text obligatoire quand reason_code = OTHER")
        return text
    return reason["label"]
