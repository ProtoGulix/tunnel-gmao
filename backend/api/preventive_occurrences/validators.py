"""Règles métier du lancement en avance d'une occurrence préventive."""

from typing import Any, Dict

from fastapi import HTTPException


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
