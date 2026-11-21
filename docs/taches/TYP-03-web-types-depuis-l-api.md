# TYP-03. Web : types lus depuis l'API, type vide à la création

- Statut : faite, relue, migration 0020 jouée en dev, essai à l'écran validé (2026-11-20)
- Agent : frontend-dev (sonnet)
- Branche : feat/types-intervention-en-base, worktree de la sous-branche
  feat/types-intervention-en-base-typ03
- Dépend de : contrat de TYP-02, ADR 0026
- Périmètre d'écriture : web/src/ (config/interventionTypes.js et ses ~30 importateurs,
  composants de création, écran d'administration du référentiel des types, api/), tests
  front, cette fiche. Exclu : backend, mobile, dépendances.

## Critères d'acceptation

- [x] Plus de liste de types en dur : chargée une fois depuis GET /interventions/types
      (include_inactive pour l'affichage), partagée par toute l'application ; si le
      chargement échoue, le code brut s'affiche, rien ne casse
- [x] Création (InterventionCreateForm / InterventionCreationPanel) : type vide par
      défaut, obligatoire (« Choisissez le type d'intervention »), description courte sous
      chaque type dans le sélecteur, types actifs seulement ; type suggéré d'une demande
      prérempli, verrouillé pour une demande système
- [x] Administration → Référentiel : description modifiable, code en lecture seule
- [x] Build, lint sans nouvelle erreur, npm test, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur

## Compte rendu final


Fait : types chargés une fois par un cache partagé (web/src/lib/interventionTypesStore.js,
hook hooks/shared/useInterventionTypeRefs.js, composant shared/InterventionTypeLabel.jsx),
`GET /interventions/types?include_inactive=true` ; échec ou chargement en cours : code brut,
gris, rechargement au prochain montage. Liste en dur retirée de config/interventionTypes.js
(STATUS_CONFIG etc. conservés), importeurs convertis. Création (InterventionCreateForm,
InterventionCreationPanel, ActionFormContext) : type vide, obligatoire (« Choisissez le type
d'intervention »), types actifs seulement, description sous le libellé ; type suggéré
prérempli, verrouillé pour une demande système. Administration : description modifiable,
code en lecture seule, rechargement du cache après modification.

Résultats : npm run build OK, npm test 55/55 (3 tests ajoutés : chargement unique, repli sur
échec, code inconnu), lint 498 problèmes avant et après (aucun nouveau).

Suppositions : le contrat admin (/admin/intervention-types) renvoie `code`, `label`,
`is_active` et désormais `description` ; PATCH envoie `{ label, description }` (le code n'est
plus envoyé), POST `{ code, label, description }`.

Restes signalés, non traités (hors périmètre) : repli 'CUR' dans api/interventionMappers.js,
planning/TaskSearchColumn.jsx et interventionCellRenderers.jsx (affichage de données
manquantes) ; OrganisationCharts.jsx (séries CUR/PRE/PRO en dur) ; useInterventionsList.js
(règle PRO/PIL/MES) ; CoordinationPage.jsx l.85 (type déduit du code).

Suites de l'essai à l'écran (2026-11-20) : composant commun DescribedSelect (pastille,
libellé, description, largeur fixe, mode cadenassé) pour le type et la priorité ;
descriptions de priorité proposées par l'agent principal et vues à l'écran par l'utilisateur.
