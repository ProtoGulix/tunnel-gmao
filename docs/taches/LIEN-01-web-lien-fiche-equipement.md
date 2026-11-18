# LIEN-01. Web : aller de la fiche d'intervention à la fiche équipement

- Statut : fait
- Agent : principal
- Branche : feat/lien-fiche-equipement (depuis develop, ADR 0008)
- Dépend de : LIST-01 (en-tête du panneau)
- Périmètre d'écriture : web/src/components/interventions/InterventionPanelHeaderParts.jsx,
  cette fiche, docs/ETAT.md, CHANGELOG.md ; ni API, ni backend

## Contexte

Demande de l'utilisateur du 2026-11-17 : pouvoir ouvrir la fiche équipement depuis la
fiche d'intervention. Choix de l'utilisateur : le code et le nom de l'équipement de
l'en-tête forment un lien (icône de lien externe, infobulle « Ouvrir la fiche équipement », souligné au
survol), vers `/equipements?id=…`, adresse déjà utilisée depuis le détail d'une DI.

## Critères d'acceptation

- [x] Code et nom de l'équipement cliquables dans l'en-tête du panneau d'intervention,
      vers la fiche équipement ; texte simple si l'intervention n'a pas d'équipement
- [x] Troncature du nom conservée ; eslint sans erreur ; scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur (validé le 2026-11-18)
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait le 2026-11-18. `MachineHeading` (InterventionPanelHeaderParts.jsx) rend le code et
le nom de l'équipement comme un lien routeur vers `/equipements?id=…`, avec l'icône
ExternalLink demandée par l'utilisateur, une infobulle et un `aria-label` ; texte simple
sans équipement. eslint sans erreur, scripts/check.sh vert. Reviewer : APPROUVÉ (constats
mineurs : fiche à compléter, `aria-label` ajouté depuis). Essai à l'écran validé par
l'utilisateur.
