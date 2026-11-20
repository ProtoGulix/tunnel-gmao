# Clôture d'une intervention par le journal de statut sans contrôle des tâches

Relevé pendant INT-04 (2026-11-20), reproduit dans le code par l'agent principal.

`POST /intervention-status-log` avec `status_to = 'ferme'` clôt l'intervention par le
trigger `trg_sync_status_log_to_intervention` sans passer par
`InterventionRepository._check_closable` (backend/api/interventions/repo.py l.1083), qui
refuse la clôture tant que des tâches non optionnelles sont à faire ou en cours. Seul le
trigger de gamme protège. La route est en `events_only` : si une règle d'audit exige un
jour un motif pour clore, elle ne le demandera pas. Le bouton « Statut » du mobile
(InterventionDetailPage, StatusSheet) l'utilise ; TECH, RESP et ADMIN y ont droit (base de
dev, 2026-11-20).

Piste : appliquer `_check_closable` (et la règle d'audit de la clôture) sur cette route,
ou faire passer le mobile par `PUT /interventions/{id}` comme le web. Décision à prendre.
