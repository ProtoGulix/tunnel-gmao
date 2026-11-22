# MSG-01. Mobile : « Aucun motif disponible » au lieu du message brut

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : fix/mobile-message-sans-motif (depuis develop)
- Dépend de : docs/backlog/mobile-message-sans-motif.md ; accord de l'utilisateur du 2026-11-22
- Périmètre d'écriture : mobile/src (lecture des erreurs d'audit et composants qui ouvrent AuditReasonSheet), CHANGELOG.md. Exclus : backend, web.

## Contexte

Quand l'API exige un motif sans en proposer (400 « reason_code obligatoire pour cette
mutation », `audit.reasons` vide ou absent), la feuille de motif ne s'ouvre pas et le mobile
affiche le message brut. Plusieurs composants lisent `err.data.audit.reasons` chacun de leur
côté (TaskStatusButtons, InterventionDetailPage, autres : à inventorier).

## Critères d'acceptation

- [x] un seul endroit traduit ce cas en « Aucun motif disponible » (texte court, CLAUDE.md 8.7), utilisé par tous les composants concernés
- [x] avec des motifs, comportement inchangé ; autres erreurs de l'API affichées telles quelles
- [x] build du mobile ; scripts/check.sh vert ; CHANGELOG (« Non publié », Corrigé), une ligne

## Compte rendu final

Détection centralisée dans mobile/src/lib/api/errors.js : `getAuditReasons` (motifs proposés) et `getErrorMessage` (400 « reason_code obligatoire » sans motif donne « Aucun motif disponible »). Utilisés par TaskStatusButtons, CloseInterventionPrompt et InterventionDetailPage. Pas de lanceur de tests node dans le mobile : aucun test ajouté.

