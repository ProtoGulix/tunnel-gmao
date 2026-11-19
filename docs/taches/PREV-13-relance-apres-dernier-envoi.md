# PREV-13. Relance un intervalle après le dernier envoi

- Statut : faite (2026-11-19)
- Agents : agent principal
- Branche : fix/relance-7-jours-apres-envoi (depuis develop)
- Dépend de : PREV-10 (stock notifié au premier passage)

## Contexte

Constat de l'utilisateur en dev le 2026-11-19 : 56 notifications la veille, 75 ce matin.
Le passage de 5 h a réémis 21 éléments notifiés la veille (7 interventions, 14 préventifs) :
le premier passage avait émis leur dernier palier atteint (12/11), le palier suivant
(19/11) tombait le lendemain. Accord de l'utilisateur pour corriger avant la mise à jour
de la production : une relance part un intervalle après le dernier envoi.

Périmètre : backend/api/jobs/, backend/api/notifications/repo.py, tests d'intégration des
tâches planifiées, ADR 0023 (précision), CHANGELOG, ETAT, cette fiche. Pas de migration,
pas de changement d'API ni de front.

## Critères d'acceptation

- [x] Un élément rattrapé à un palier ancien ne revient pas avant un intervalle entier
      depuis l'envoi ; la relance suivante porte le dernier palier atteint (tests
      d'intégration, préventif et sans action)
- [x] Les relances régulières (J+1, J+8 ; J+7, J+14) et la remise à zéro par une action
      sont inchangées (tests existants verts)
- [x] Les notifications déjà en base (sans jour d'envoi) sont datées par leur création
- [x] check.sh et test-integration.sh verts

## Compte rendu final

`notify_active_users_once` reçoit `quiet_since` et `sent_on` : rien n'est émis si une
notification du même (type, entité) a été envoyée depuis `quiet_since` (jour d'envoi rangé
dans `data.sent_on`, à défaut date de création ; masquées comprises). Les deux étapes
passent `today - (REMINDER_INTERVAL_DAYS - 1)`. Deux tests de rattrapage adaptés à la règle
(ils vérifiaient la relance 5 et 6 jours après l'envoi). check.sh vert, 410 tests
d'intégration verts ; test dédié du repli sur la date de création ajouté après la relecture (APPROUVÉ). Les 23 notifications de ce matin restent en base de dev.
