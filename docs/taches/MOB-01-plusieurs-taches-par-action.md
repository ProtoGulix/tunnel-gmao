# MOB-01. Plusieurs tâches par action sur le mobile

- Statut : faite (2026-11-23)
- Agent : principal
- Branche : fix/mobile-plusieurs-taches-par-action (depuis develop)
- Dépend de : POST /intervention-actions (`tasks` en liste), ADR 0025 point 5
- Périmètre d'écriture : mobile/src/components/actions/ActionForm.jsx, docs/site/technicien/saisir-une-action.md,
  CHANGELOG.md, docs/ETAT.md, docs/backlog/. Aucun changement backend ni API.

## Contexte

Constat de l'utilisateur du 2026-11-22 : le mobile ne lie une action qu'à une tâche alors
qu'une action en termine souvent plusieurs. L'API et le web acceptent déjà une liste.

## Critères d'acceptation

- [x] plusieurs tâches cochables ; une tâche cochée se décoche au toucher
- [x] état propre à chaque tâche cochée, « En cours » (défaut) ou « Terminée », comme le web
- [x] une tâche créée depuis le formulaire est cochée, les autres le restent
- [x] au moins une tâche exigée (message inchangé)
- [x] `tasks` envoie toutes les tâches cochées avec leur `close_task`
- [x] proposition de clore l'intervention si une tâche cochée est terminée et qu'il ne reste aucune tâche ouverte
- [x] check.sh vert, build du mobile vert ; essai sur téléphone par l'utilisateur
- [x] guide technicien et CHANGELOG à jour, fiche du backlog retirée

## Compte rendu final

Fait : `TaskSection` gère une liste `[{task_id, close_task}]` envoyée telle quelle dans `tasks` ;
choix « En cours » / « Terminée » sous chaque tâche cochée, cadre bleu ou vert (retour de
l'utilisateur du 2026-11-23 : la case à cocher n'était pas conforme au web ; « Annulée » reste
sur le web, décision de l'utilisateur) ; la proposition de clore
l'intervention se déclenche si une tâche cochée est terminée. Seul ActionForm.jsx change.
Tests : check.sh vert, `vite build` du mobile vert ; le mobile n'a pas de tests unitaires.
Essai sur téléphone validé par l'utilisateur le 2026-11-23.
