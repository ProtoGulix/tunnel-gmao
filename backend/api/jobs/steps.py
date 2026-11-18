"""Étapes de la tâche quotidienne (ADR 0023, point 3). Chacune s'exécute dans l'exécuteur
système : une transaction, un audit, tout ou rien."""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any, Dict, Optional

from api.jobs.milestones import milestone_to_notify
from api.jobs.repo import JobsRepository
from api.notifications.repo import NotificationRepository
from api.preventive_occurrences.repo import PreventiveOccurrenceRepository
from api.settings import settings

logger = logging.getLogger(__name__)

PREVENTIVE_OVERDUE_TYPE = "preventif_echeance"
INTERVENTION_IDLE_TYPE = "intervention_a_cloturer"


def _text(value: Any) -> Optional[str]:
    return str(value) if value is not None else None


def generate_preventive() -> Dict[str, Any]:
    """Étape 1 : génération des occurrences, même code que le bouton « Générer »."""
    return PreventiveOccurrenceRepository().generate_occurrences()


def notify_preventive_overdue(today: Optional[date] = None) -> Dict[str, int]:
    """Étape 2 : notifie les occurrences actives en retard, à chaque palier hebdomadaire.

    Paliers : échéance + 1, + 8, + 15 jours... Un palier est émis s'il tombe dans les
    REMINDER_CATCHUP_DAYS derniers jours et n'a pas déjà été émis. Une occurrence close
    (terminée, ignorée, annulée) n'est plus lue : plus rien n'est émis.
    """
    today = today or date.today()
    notifications = NotificationRepository()
    notified = 0
    for occ in JobsRepository().list_overdue_occurrences(today):
        due = occ["scheduled_date"]
        milestone = milestone_to_notify(
            due + timedelta(days=1),
            settings.REMINDER_INTERVAL_DAYS,
            today,
            settings.REMINDER_CATCHUP_DAYS,
        )
        if milestone is None:
            continue
        days_late = (today - due).days
        message = (
            f"Préventif en retard de {days_late} jour(s) : {occ['plan_label']} "
            f"({occ['machine_code']}), échéance le {due.strftime('%d/%m/%Y')}"
        )
        notified += notifications.notify_active_users_once(
            PREVENTIVE_OVERDUE_TYPE,
            "preventive_occurrence",
            str(occ["id"]),
            message,
            milestone,
            # Contenu lu par le front pour bâtir le lien : intervention, sinon demande, sinon
            # échéancier.
            data={
                "intervention_id": _text(occ["intervention_id"]),
                "di_id": _text(occ["di_id"]),
                "plan_label": occ["plan_label"],
                "machine_code": occ["machine_code"],
                "due_date": due.isoformat(),
                "days_overdue": days_late,
            },
        )
    return {"notified": notified}


def notify_idle_interventions(today: Optional[date] = None) -> Dict[str, int]:
    """Étape 3 : alarme « sans action » sur les interventions non fermées (PREV-05).

    Paliers : dernière activité + 7, + 14, + 21 jours... (REMINDER_INTERVAL_DAYS, même pas que
    les retards du préventif), émis s'ils tombent dans les REMINDER_CATCHUP_DAYS derniers jours.
    Une nouvelle action déplace la dernière activité donc remet le compte à zéro ; une
    intervention fermée n'est plus lue.
    """
    today = today or date.today()
    notifications = NotificationRepository()
    notified = 0
    for inter in JobsRepository().list_open_interventions_activity():
        last = inter["last_activity"]
        step = settings.REMINDER_INTERVAL_DAYS
        milestone = milestone_to_notify(
            last + timedelta(days=step), step, today, settings.REMINDER_CATCHUP_DAYS
        )
        if milestone is None:
            continue
        days_idle = (today - last).days
        code = inter["code"] or "sans code"
        machine = inter["machine_code"] or "sans équipement"
        notified += notifications.notify_active_users_once(
            INTERVENTION_IDLE_TYPE,
            "intervention",
            str(inter["id"]),
            f"Sans action depuis {days_idle} jours : on en est où ? ({code}, {machine})",
            milestone,
            data={
                "intervention_code": inter["code"],
                "machine_code": inter["machine_code"],
                "days_without_action": days_idle,
                "last_activity_date": last.isoformat(),
            },
        )
    return {"notified": notified}
