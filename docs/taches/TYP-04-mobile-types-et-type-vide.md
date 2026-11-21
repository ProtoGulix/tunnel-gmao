# TYP-04. Mobile : type vide à la création, description des types

- Statut : faite, relue, migration 0020 jouée en dev, essai à l'écran validé (2026-11-20)
- Agent : frontend-dev (sonnet)
- Branche : feat/types-intervention-en-base, worktree de la sous-branche
  feat/types-intervention-en-base-typ04
- Dépend de : contrat de TYP-02, ADR 0026
- Périmètre d'écriture : mobile/src/ (config/badges.js, components/actions/
  InterventionCreateForm.jsx, pages/interventions/InterventionsPage.jsx, api/), cette
  fiche. Exclu : backend, web, dépendances.

## Critères d'acceptation

- [x] Plus de liste de types en dur : lue depuis GET /interventions/types ; échec de
      chargement lisible
- [x] Création : type vide par défaut, obligatoire, description sous chaque type, types
      actifs seulement ; type suggéré d'une demande prérempli (verrouillé si système)
- [x] Build mobile, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur

## Compte rendu final

Liste de l'API (include_inactive=true) chargée une fois et partagée par le hook
useInterventionTypes (repli : code brut et gris si échec) ; liste en dur retirée de
badges.js. Formulaire de création : type vide et obligatoire (« Choisissez le type
d'intervention »), types actifs seulement (is_active absent toléré), description sous
chaque type (SheetPicker accepte une description optionnelle), préremplissage et
verrouillage inchangés. InterventionForm.jsx (autre formulaire) non touché. Reste :
essai à l'écran par l'utilisateur.

Suites de l'essai à l'écran (2026-11-20) : le type imposé et l'acceptation d'une demande
(InterventionForm.jsx) passent par SheetPicker en mode verrouillé ; le type suggéré
désactivé reste proposé (listedTypes), accepté par l'API.
