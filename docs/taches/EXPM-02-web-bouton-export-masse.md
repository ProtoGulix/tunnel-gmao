# EXPM-02. Web : bouton d'export de masse dans l'en-tête de la liste des interventions

- Statut : faite (2026-11-16), reviewer APPROUVÉ, validée à l'écran par l'utilisateur
- Agent : frontend-dev
- Branche : feat/export-masse-fiches (depuis develop, ADR 0008)
- Dépend de : EXPM-01
- Périmètre d'écriture : web/src/pages/interventions/InterventionsListPage.jsx,
  web/src/api/interventions.js, un composant nouveau dans web/src/components/interventions/,
  tests front éventuels, CHANGELOG.md (« Non publié »). Exclu : backend, mobile.

## Contexte

L'utilisateur veut un bouton dans l'en-tête de page (PageHeader) de la liste des
interventions qui ouvre l'export de masse des fiches fermées (route de EXPM-01).

## Critères d'acceptation

- [x] Bouton « Exporter les fiches fermées » dans l'en-tête de la page liste des
      interventions, visible pour ADMIN et RESP seulement (le backend reste seul juge).
- [x] Il ouvre une fenêtre : date de fermeture du / au (obligatoires), équipement optionnel,
      deux actions « Télécharger (ZIP) » et « Imprimer (PDF) ».
- [x] ZIP : téléchargement du fichier ; PDF : ouverture dans un nouvel onglet pour impression.
- [x] État de chargement pendant la génération (peut prendre du temps), message d'erreur
      du backend affiché tel quel (plafond dépassé, aucune fiche, période invalide).
- [x] Respect de docs/guides/architecture-web.md et conventions-web.md ; réutilise les
      composants existants (fenêtre, sélecteur d'équipement) plutôt que d'en créer.
- [x] Lint et build du web verts ; scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait : bouton « Exporter les fiches fermées » dans le PageHeader (visible si le droit exports:export_closed_interventions est accordé), fenêtre ExportClosedInterventionsDialog (dates obligatoires, EquipementSearch réutilisé, ZIP et PDF), appel fetchClosedInterventionsExport (blob, message d'erreur du backend relu depuis le Blob). PDF : onglet ouvert au clic puis URL objet placée après la réponse. Tests : build web et scripts/check.sh verts ; lint web en erreur déjà avant la tâche (aucune erreur nouvelle dans mes fichiers). Non vérifié : parcours dans un navigateur, test automatisé front.

Contrôle de l'agent principal (2026-11-15) : diff conforme au périmètre, code de droit
front identique à endpoint_code du catalogue, check.sh et build web verts, eslint sans
erreur sur les nouveaux fichiers (le lint global du web était déjà en échec avant, non
recontrôlé). Essai à l'écran validé par l'utilisateur le 2026-11-16.
