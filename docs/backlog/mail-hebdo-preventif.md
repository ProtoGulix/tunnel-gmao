# Mail hebdomadaire du préventif

Décision de l'utilisateur du 2026-11-18 : pas de mail pour l'instant, un mail
hebdomadaire viendra plus tard (préventifs en retard, ceux de la semaine, interventions
sans action).

Piste : une étape de plus dans la tâche quotidienne (ADR 0023), exécutée un jour fixe
de la semaine, qui réutilise `api/mail/service.py` (désactivé si `MAIL_ENABLED` est
faux). À cadrer : destinataires, jour d'envoi, contenu.
