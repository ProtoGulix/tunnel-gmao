"""Boucle de la tâche quotidienne du système (ADR 0023, points 1 et 3).

Lancée par le lifespan de l'API seulement si SCHEDULED_JOBS_ENABLED : un passage au démarrage,
puis un par jour à SCHEDULED_JOBS_HOUR. Chaque processus de l'API lance sa boucle ; le verrou
consultatif PostgreSQL n'en laisse passer qu'une. Tout le travail bloquant (psycopg2) tourne
dans le threadpool : la boucle asyncio n'est jamais bloquée.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Awaitable, Callable, Dict, List, Optional

import anyio
from fastapi.concurrency import run_in_threadpool

from api.jobs import steps
from api.jobs.executor import run_system_step
from api.jobs.lock import acquire_daily_lock, release_daily_lock
from api.notifications.mailer import send_di_a_traiter_mails
from api.settings import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class JobStep:
    """Une étape : travail transactionnel (thread), puis suite facultative hors transaction."""

    name: str
    run: Callable[[], object]
    after: Optional[Callable[[object], Awaitable[None]]] = None


@dataclass
class PassReport:
    """Résultat d'un passage : `ran` faux si un autre processus tenait le verrou."""

    ran: bool
    failed: List[str] = field(default_factory=list)
    results: Dict[str, object] = field(default_factory=dict)


async def _send_generation_mails(result: object) -> None:
    """Mails `di_a_traiter` des demandes créées, comme après le bouton « Générer »."""
    for di_id in result.pop("created_di_ids", []):  # type: ignore[attr-defined]
        await send_di_a_traiter_mails(di_id)


def default_steps() -> List[JobStep]:
    return [
        JobStep("generation", steps.generate_preventive, _send_generation_mails),
        JobStep("retards", steps.notify_preventive_overdue),
        JobStep("sans_action", steps.notify_idle_interventions),
    ]


def seconds_until_next_run(now: datetime, hour: int) -> float:
    """Secondes jusqu'à la prochaine occurrence de `hour` h (strictement dans le futur)."""
    target = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return (target - now).total_seconds()


async def run_daily_pass(job_steps: Optional[List[JobStep]] = None) -> PassReport:
    """Un passage : verrou, puis chaque étape dans sa transaction ; une étape en échec est
    journalisée et n'arrête pas les suivantes."""
    job_steps = job_steps if job_steps is not None else default_steps()
    lock_conn = await run_in_threadpool(acquire_daily_lock)
    if lock_conn is None:
        logger.info("Passage quotidien : un autre processus le fait, rien à faire")
        return PassReport(ran=False)
    try:
        report = PassReport(ran=True)
        for job_step in job_steps:
            try:
                result = await run_in_threadpool(run_system_step, job_step.run)
                report.results[job_step.name] = result
                if job_step.after:
                    await job_step.after(result)
            except Exception:
                logger.exception("Passage quotidien : l'étape %s a échoué", job_step.name)
                report.failed.append(job_step.name)
        return report
    finally:
        # Bouclier : sous annulation (arrêt de l'API), le verrou doit quand même être rendu.
        with anyio.CancelScope(shield=True):
            await run_in_threadpool(release_daily_lock, lock_conn)


async def daily_loop() -> None:
    """Passage au démarrage puis chaque jour ; ne s'arrête que par annulation."""
    while True:
        try:
            await run_daily_pass()
        except Exception:
            logger.exception("Passage quotidien : échec inattendu, la boucle continue")
        await asyncio.sleep(seconds_until_next_run(datetime.now(), settings.SCHEDULED_JOBS_HOUR))
