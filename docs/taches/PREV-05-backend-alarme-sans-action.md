# PREV-05. Backend : alarme « sans action depuis 7 jours, on en est où ? »

- Statut : faite (2026-11-18)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev05
- Dépend de : PREV-04 (boucle et exécuteur)
- Périmètre d'écriture : backend/api/jobs/, backend/api/notifications/repo.py,
  backend/api/settings.py, backend/tests/, CHANGELOG.md (« Non publié »). Exclu : web,
  mobile, migrations.

## Contexte

La périodicité glissante part de la clôture : une intervention qui reste ouverte fait
glisser le préventif suivant et perd sa valeur de trace. Décisions de l'utilisateur du
2026-11-18 : alarme après 7 jours sans action, relance chaque semaine, toutes les
interventions non fermées (attentes de pièces et de production comprises), tous les
utilisateurs actifs notifiés, chaque élément à son palier hebdomadaire (pas d'envoi massif du stock). Le type
`intervention_a_cloturer` existe déjà dans la contrainte de `notification` et n'est
émis nulle part : aucune migration.

## Critères d'acceptation

- [x] Étape de la tâche quotidienne, dans l'exécuteur système ; paliers par
      `api/jobs/milestones.py` (fonction partagée avec PREV-04), notifications par
      `NotificationRepository.notify_active_users_once`
- [x] Intervention visée : statut différent de `ferme`. Dernière activité : date de la
      dernière action (`created_at::date`, définition d'ADR 0021), à défaut la
      `reported_date` de l'intervention
- [x] Paliers : dernière activité + 7, + 14, + 21 jours… ; notification
      `intervention_a_cloturer` (entité `intervention`) à chaque utilisateur actif
      quand un palier tombe le jour du passage (rattrapage `REMINDER_CATCHUP_DAYS`, 1 jour par défaut) et n'a pas déjà été notifié
      (palier rangé dans `data`) ; une nouvelle action remet le compte à zéro
- [x] Message : « Sans action depuis N jours : on en est où ? » avec code
      d'intervention et code machine
- [x] Seuil lu dans settings.py (défaut 7 jours), test du réglage
- [x] Tests : pas d'alarme à J+6 ; alarme à J+7 ; relance à J+14 ; pas de doublon au
      second passage ; plus d'alarme après une nouvelle action ou la fermeture
- [x] scripts/check.sh et test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Étape `sans_action` ajoutée après `retards` (`steps.notify_idle_interventions`, lecture
`JobsRepository.list_open_interventions_activity`). Pas de seuil dédié : le pas est
`REMINDER_INTERVAL_DAYS` (7), rattrapage `REMINDER_CATCHUP_DAYS` (1). Interventions
`status_actual` différent de `ferme` ; dernière activité = MAX(`created_at::date`) des actions,
sinon `reported_date` (une intervention sans aucune des deux n'est pas lue). Notification
`intervention_a_cloturer`, entité `intervention`, dédupliquée par palier, sans audit.
Tests : 5 d'intégration (J+6/J+7/J+14/doublon, nouvelle action, attente puis fermeture,
stock de 30 jours notifié à J+35, ordre des étapes) et 1 unitaire (réglage). check.sh vert ;
test-integration.sh : 391 passés.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre, aucun test
existant modifié ; après fusion, check.sh vert et test-integration.sh vert (391 passed).
Commande en échec de l'agent, corrigée : test « nouvelle action » avec time_spent à 0
refusé par le trigger (minimum 0,25 h). NON VÉRIFIÉ : données réelles, passage de minuit.
