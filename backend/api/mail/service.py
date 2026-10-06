"""Service d'envoi de mail réutilisable (SMTP via aiosmtplib).

Factorise la logique auparavant inline dans `api/admin/routes.py`
(route `/admin/settings/mail/test`). Toute nouvelle notification par mail
(ex: DI à traiter) doit passer par `send_mail()`.

- No-op silencieux si `MAIL_ENABLED=false` (config volontairement désactivée) :
  ni exception, ni tentative de connexion SMTP.
- En cas d'échec réel (SMTP indisponible, dépendance manquante...), `send_mail`
  logue puis **lève** `MailError` — à l'appelant de décider s'il doit
  remonter l'erreur au client (cas d'une route synchrone comme le test mail
  admin) ou simplement l'avaler pour ne pas casser un traitement qui a déjà
  réussi par ailleurs (cas d'une `BackgroundTask` déclenchée après la
  création réussie d'une DI : l'échec d'envoi du mail ne doit jamais annuler
  la création, déjà commitée en DB).
"""

import logging

from api.settings import settings

logger = logging.getLogger(__name__)


class MailError(Exception):
    """Erreur d'envoi mail (dépendance manquante, échec SMTP...)."""


async def send_mail(to: str, subject: str, body: str) -> None:
    """Envoie un email texte brut à `to`.

    No-op si `MAIL_ENABLED=false`. Lève `MailError` en cas d'échec
    (dépendance `aiosmtplib` manquante ou erreur SMTP) — à l'appelant de
    décider comment réagir (voir docstring de module).
    """
    if not settings.MAIL_ENABLED:
        logger.debug(
            "send_mail ignoré (MAIL_ENABLED=false) — destinataire=%s, sujet=%s",
            to,
            subject,
        )
        return

    if not to:
        raise MailError("send_mail appelé sans adresse destinataire")

    try:
        from email.mime.text import MIMEText

        import aiosmtplib
    except ImportError as e:
        raise MailError("aiosmtplib non installé — ajouter au requirements.txt") from e

    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
        msg["To"] = to

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=settings.SMTP_STARTTLS,
        )
        logger.info("Email envoyé à %s — sujet=%s", to, subject)
    except Exception as e:
        logger.error("Erreur envoi mail à %s (sujet=%s) : %s", to, subject, e)
        raise MailError(f"Erreur envoi mail : {e}") from e
