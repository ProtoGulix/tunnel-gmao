# CSV-03. Auteur réel de chaque changement d'état d'une demande

- Statut : faite
- Agent : backend-dev (sonnet)
- Branche : fix/constat-suivi-et-vues-csv03 (worktree depuis fix/constat-suivi-et-vues)
- Dépend de : ADR 0005 (identité prise du jeton), CLAUDE.md 6.2
- Périmètre d'écriture : backend/api/intervention_requests/, backend/api/interventions/repo.py
  et backend/api/preventive_occurrences/repo.py (insertions dans request_status_log seulement),
  backend/tests/, docs/api/endpoints/intervention-requests.md. Pas de migration.

## Contexte

Demande de l'utilisateur du 2026-11-23 : l'historique de toute demande montre qui a fait
changer l'état. Constat en dev : 16 lignes sur 893 de request_status_log ont `changed_by` ;
le rejet le laisse vide. La route POST /intervention-requests/{id}/transition passe
`body.changed_by` (champ déclaratif hérité) au lieu de l'utilisateur du jeton.

## Travail

1. Toute insertion dans request_status_log faite par l'API porte l'auteur réel :
   `request.state.user_id` (jeton), jamais un champ du corps. Chemins connus :
   intervention_requests/repo.py (l.824, 1134, 1219, 1344), interventions/repo.py:1064,
   preventive_occurrences/repo.py:1225, et la création de la demande (ligne « nouvelle »,
   y compris par trigger si c'est un trigger qui l'écrit : dans ce cas le signaler, ne pas
   écrire de migration). Une tâche système sans utilisateur garde `changed_by` NULL.
   `body.changed_by` de StatusTransitionIn est ignoré pour l'auteur (le laisser accepté pour ne
   pas casser les clients ; le dire dans la doc).
2. Détail d'une demande : chaque entrée de `status_log` gagne `changed_by_name` (prénom nom
   depuis tunnel_user, null sinon). Requête paramétrée, une seule lecture.

## Critères d'acceptation

- [x] rejet, acceptation, clôture, création : `changed_by` = utilisateur du jeton, même si le
      corps envoie un autre `changed_by` (test d'intégration, celui-ci doit échouer avant)
- [x] `changed_by_name` renvoyé dans le détail (test)
- [x] chemins non couverts (trigger, système) listés dans le compte rendu
- [x] doc d'endpoint à jour ; check.sh et test-integration.sh verts, aucune assertion affaiblie

## Compte rendu final

Fait : la route de transition prend l'auteur du jeton (`request.state.user_id`) ; `body.changed_by`
reste accepté mais ignoré. `status_log[].changed_by_name` ajouté (jointure tunnel_user, même lecture).
Les autres insertions étaient déjà correctes : création par le trigger `fn_init_request_status_log`
(app.user_id, migration 0022), clôtures automatiques et /repair (app.user_id), acceptation par création
d'intervention et réouverture (user_id du jeton transmis par le repo appelant).
Chemins non couverts : tâches système sans utilisateur (jobs/executor, `changed_by=None`) gardent
NULL ; `deploy/demo/load_demo.py` et `deploy/rattrapage-029.sql` écrivent hors API (hors périmètre).
Aucun trigger SQL modifié, aucune migration. Tests : test_csv03_auteur_historique_demande_integration.py
(rejet et acceptation échouaient avant le correctif ; création et clôture gardent le comportement).
