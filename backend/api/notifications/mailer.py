"""Déclenchement des mails applicatifs liés aux notifications.

Le trigger DB `fn_notify_di_a_traiter` (migration 023) fan-oute déjà les
lignes `notification` en base pour chaque technicien actif dès l'INSERT
d'une DI d'origine 'signalee'. Il ne peut en revanche pas envoyer de mail
(pas d'accès SMTP depuis PL/pgSQL) : ce module ferme la boucle côté
applicatif, à appeler en `BackgroundTasks` après la création réussie d'une
DI (voir `api/intervention_requests/routes.py` et
`api/preventive_occurrences/routes.py`).
"""

import logging

from api.mail.service import MailError, send_mail
from api.notifications.repo import NotificationRepository

logger = logging.getLogger(__name__)


async def send_di_a_traiter_mails(di_id: str) -> None:
    """Envoie un mail à chaque technicien notifié pour la DI `di_id`.

    Relit les notifications `di_a_traiter` déjà créées par le trigger DB pour
    cette DI (plutôt que de recalculer la liste des techniciens actifs :
    évite toute divergence entre la liste notifiée en base et celle mailée).
    Chaque échec d'envoi est logué et n'interrompt pas les suivants — cette
    fonction est destinée à tourner en `BackgroundTasks`, après la création
    de la DI déjà commitée : un échec mail ne doit jamais remonter au client.
    """
    repo = NotificationRepository()
    try:
        recipients = repo.list_recipients_for_entity("di_a_traiter", di_id)
    except Exception:
        logger.error(
            "Impossible de récupérer les destinataires di_a_traiter pour la DI %s",
            di_id,
            exc_info=True,
        )
        return

    for recipient in recipients:
        email = recipient.get("email")
        message = recipient.get("message") or "Nouvelle demande d'intervention à traiter"
        code = recipient.get("entity_code") or di_id
        if not email:
            continue
        try:
            await send_mail(
                to=email,
                subject=f"Nouvelle DI à traiter — {code}",
                body=message,
            )
        except MailError:
            # Déjà logué par send_mail — on continue avec les autres destinataires.
            continue
