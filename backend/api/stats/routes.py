from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Request

from api.auth.permissions import require_authenticated
from api.equipements.validators import resolve_dashboard_period
from api.errors.exceptions import ValidationError
from api.limiter import limiter
from api.stats.organisation_repo import OrganisationRepository
from api.stats.repo import StatsRepository
from api.stats.schemas import (
    AnomaliesSaisieResponse,
    ChargeTechniqueResponse,
    OrganisationResponse,
    QualiteDonneesResponse,
    ServiceStatusResponse,
)

router = APIRouter(prefix="/stats", tags=["stats"], dependencies=[Depends(require_authenticated)])


@router.get("/service-status", response_model=ServiceStatusResponse)
@limiter.limit("10/minute")
def get_service_status(
    request: Request,
    start_date: date = Query(None, description="Date de début (format: YYYY-MM-DD)"),
    end_date: date = Query(None, description="Date de fin (format: YYYY-MM-DD)"),
):
    """Calcule les métriques de santé du service de maintenance."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=90)
    repo = StatsRepository()
    return repo.get_service_status(start_date, end_date)


@router.get("/charge-technique", response_model=ChargeTechniqueResponse)
@limiter.limit("10/minute")
def get_charge_technique(
    request: Request,
    start_date: date = Query(None, description="Date de début (format: YYYY-MM-DD)"),
    end_date: date = Query(None, description="Date de fin (format: YYYY-MM-DD)"),
    period_type: str = Query("custom", description="Découpage: month, week, quarter, custom"),
):
    """[BETA] Analyse de la charge technique: où va le temps de maintenance et quelle part est évitable."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=90)

    valid_types = ("month", "week", "quarter", "custom")
    if period_type not in valid_types:
        raise ValidationError(f"period_type doit être un de: {', '.join(valid_types)}")

    repo = StatsRepository()
    return repo.get_charge_technique(start_date, end_date, period_type)


@router.get("/anomalies-saisie", response_model=AnomaliesSaisieResponse)
@limiter.limit("10/minute")
def get_anomalies_saisie(
    request: Request,
    start_date: date = Query(None, description="Date de début (format: YYYY-MM-DD)"),
    end_date: date = Query(None, description="Date de fin (format: YYYY-MM-DD)"),
):
    """[BETA] Détecte les anomalies de saisie des actions d'intervention."""
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=90)
    repo = StatsRepository()
    return repo.get_anomalies_saisie(start_date, end_date)


@router.get("/qualite-donnees", response_model=QualiteDonneesResponse)
@limiter.limit("10/minute")
def get_qualite_donnees(
    request: Request,
    severite: Optional[str] = Query(None, description="Filtrer par sévérité: high, medium"),
    entite: Optional[str] = Query(
        None,
        description="Filtrer par entité: intervention_action, intervention, stock_item, purchase_request",
    ),
    code: Optional[str] = Query(None, description="Filtrer par code anomalie spécifique"),
):
    """Détecte les problèmes de complétude et de cohérence des données."""
    valid_severites = ("high", "medium")
    if severite and severite not in valid_severites:
        raise ValidationError(f"severite doit être un de: {', '.join(valid_severites)}")

    valid_entites = ("intervention_action", "intervention", "stock_item", "purchase_request")
    if entite and entite not in valid_entites:
        raise ValidationError(f"entite doit être un de: {', '.join(valid_entites)}")

    repo = StatsRepository()
    return repo.get_qualite_donnees(severite=severite, entite=entite, code=code)


@router.get("/organisation", response_model=OrganisationResponse)
@limiter.limit("10/minute")
def get_organisation(
    request: Request,
    start_date: Optional[date] = Query(
        None, description="Début de période (AAAA-MM-JJ). Défaut : 12 mois calendaires"
    ),
    end_date: Optional[date] = Query(
        None, description="Fin de période (AAAA-MM-JJ). Défaut : aujourd'hui"
    ),
):
    """Indicateurs d'organisation de l'équipe (ADR 0021) : chiffres d'équipe, jamais par technicien."""
    start, end = resolve_dashboard_period(start_date, end_date)
    return OrganisationRepository().get_organisation(start, end)
