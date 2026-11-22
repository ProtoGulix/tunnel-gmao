# ARCH-02. Web : archiver sans exporter

- Statut : faite (2026-11-22)
- Agent : frontend-dev (sonnet)
- Branche : feat/archivage-en-masse-arch02 (worktree depuis feat/archivage-en-masse)
- Dépend de : ADR 0040, ARCH-01
- Périmètre d'écriture : web/src/components/interventions/ExportClosedInterventionsDialog.jsx
  (et un sous-composant nouveau dans le même dossier si la limite de taille l'exige),
  web/src/hooks/interventions/useMarkExportedPrinted.js, tests node web éventuels,
  CHANGELOG.md (« Non publié »). Exclus : backend, mobile, docs/site, toute autre partie du web.

## Contexte

ADR 0040 : archiver = marquer la fiche imprimée. La route
`POST /exports/interventions/closed/mark-printed` (fonction `markClosedInterventionsPrinted`
de web/src/api/interventions.js) marque déjà la sélection de l'export (période de fermeture,
équipement, plafond de 100, ADMIN et RESP). Le web ne la propose qu'après un export réussi
(`canMark` dans useMarkExportedPrinted.js). Le backend reste seul juge : son message d'erreur
(plafond dépassé, période invalide, droit refusé) est affiché tel quel.

## Critères d'acceptation

- [x] la fenêtre d'export des fiches fermées propose « Archiver sans exporter » dès que la période est valide, sans export préalable
- [x] une confirmation rappelle la période, l'équipement éventuel et que les fiches sortiront de la liste ; annuler ne fait aucun appel
- [x] après succès : le nombre de fiches archivées s'affiche (même format que le marquage après export) et la liste se rafraîchit (`onMarked` existant)
- [x] le marquage après export reste inchangé ; aucune autre route ni règle métier ajoutée côté front
- [x] libellés : « archiver » pour l'action de masse, cohérents avec le groupe « À archiver »
- [x] tests web verts (scripts/check.sh) ; build du web sans erreur
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Bouton « Archiver sans exporter » dans la fenêtre d'export (actif dès que les deux dates sont
saisies) ; confirmation intégrée à la fenêtre (nouveau ArchiveConfirmation.jsx : période,
équipement, sortie de la liste), annuler ne fait aucun appel. Le hook réutilise la route de
marquage (archiveWithoutExport) ; résultat « N fiches archivées », liste rafraîchie via onMarked.
Marquage après export inchangé. Erreur du backend affichée telle quelle. check.sh et build verts.
Non vérifié : rendu à l'écran (aucun test de composant dans le dépôt web).
Confirmation : précise que l'archivage ne se défait pas depuis l'écran (complément du coordinateur, ADR 0040 point 3).
