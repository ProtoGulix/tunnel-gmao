# PREV-09. Activation de la tâche quotidienne

- Statut : faite (2026-11-18), réserve : verrou à constater en production
- Agent : principal
- Branche : chore/activer-taches-planifiees (depuis develop, ADR 0008)
- Dépend de : PREV-04, PREV-05, PREV-08 (fusionnés dans develop le 2026-11-18)
- Périmètre d'écriture : deploy/docker-compose.yml, deploy/.env.example, CHANGELOG.md,
  docs/ETAT.md, cette fiche. Exclu : code de l'API.

## Contexte

La tâche quotidienne (ADR 0023) est désactivée par défaut dans le code, et Compose ne
transmettait pas son réglage. Décision et accord de l'utilisateur du 2026-11-18 :
« branche les notifications », d'abord en dev (changement de configuration Docker).
Estimation du premier passage sur la base de dev (lecture seule, 2026-11-18) : 1
occurrence et sa demande (BRO_GRAISSAGE sur BRO354), 0 notification de retard, 8
interventions sans action à notifier (7 utilisateurs actifs).

## Critères d'acceptation

- [x] Compose transmet `SCHEDULED_JOBS_ENABLED` (défaut `true` : une installation neuve
      l'a active) et `SCHEDULED_JOBS_HOUR` (défaut 5) ; documentés dans .env.example
- [x] API de dev redémarrée : premier passage journalisé, sans erreur ; base de dev
      relue : occurrence et notifications attendues, audit SYSTEM_SCHEDULE présent
- [ ] Un seul passage malgré deux processus (verrou) constaté dans les journaux : NON
      VÉRIFIABLE en dev (rechargement à chaud, un seul processus) ; à constater en production
- [x] scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

API de dev redémarrée le 2026-11-18 à 09:28 UTC (`docker compose -p tunnel -f
docker-compose.yml -f docker-compose.dev.yml up -d api`), santé 200, aucune erreur dans
les journaux. Base de dev relue (lecture seule) : 1 occurrence `generated` BRO_GRAISSAGE
sur BRO354, échéance 2026-10-30 (DI-2026-0294, `deadline` renseignée) et ses 6 tâches de
gamme ; audit SYSTEM_SCHEDULE sans auteur : 1 occurrence, 1 demande, 6 tâches ;
notifications : 56 `intervention_a_cloturer` (8 interventions × 7 utilisateurs actifs),
1 `di_a_traiter` (trigger existant), 0 retard du préventif (aucun palier ce jour) : conforme
à l'estimation. Heure du passage : 5 h à l'heure du conteneur, qui est en UTC (6 h à Paris
l'hiver, 7 h l'été).

Écart signalé par le reviewer : l'ADR 0023 (Conséquences) dit qu'aucune modification de
Docker ni du .env n'est obligatoire et garde la tâche désactivée dans le code. Cela reste
vrai (le code garde `false`) ; l'activation par défaut est un choix de configuration de
l'installation, décidé par l'utilisateur le 2026-11-18, porté par Compose seulement. Les
installations existantes la reçoivent active à leur mise à jour : CHANGELOG précise comment
la couper. Production : premier passage à la mise à jour, volume à estimer avant (lecture
seule) comme en dev.
