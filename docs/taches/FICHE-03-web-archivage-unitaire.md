# FICHE-03. Web : bouton d'archivage sur la nouvelle route

- Statut : faite (2026-11-27)
- Agent : principal
- Branche : fix/fiche-pdf-et-archivage
- Dépend de : FICHE-02
- Périmètre d'écriture : web/src/api/interventions.js, web/src/components/interventions/ (InterventionDetailPanel, archiveRules et son test, tabs/SheetTab), web/src/hooks/interventions/ si besoin, docs/site/responsable/interventions-taches.md, CHANGELOG.md, docs/ETAT.md, cette fiche.

## Critères d'acceptation

- [x] « Marquer comme imprimée » visible seulement sur une intervention fermée, non imprimée, avec le droit de la nouvelle route ; appelle `POST /interventions/{id}/mark-printed` après confirmation
- [x] tests archiveRules : ouverte → pas de bouton ; fermée sans droit → pas de bouton
- [x] scripts/check.sh vert, ESLint propre, build Vite vert

## Compte rendu final

`markInterventionPrinted` (api/interventions.js) appelle la route ; `printed_fiche` retiré du
corps du PUT. `canMarkPrinted` exige intervention fermée, fiche non imprimée et droit
`interventions:mark_intervention_printed` (permissionCodes.js) ; confirmation toujours
demandée (SheetTab). Guide et CHANGELOG à jour. check.sh vert (tests archiveRules : 5),
ESLint sans erreur nouvelle (erreurs antérieures dans api/interventions.js et
permissionCodes.js, sur des lignes non touchées), build Vite vert.

NON VÉRIFIÉ : essai à l'écran (dépend des droits de dev de la nouvelle route).
