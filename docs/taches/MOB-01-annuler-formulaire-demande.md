# MOB-01. Mobile : « Annuler » du formulaire de demande de l'onglet « Demandes »

- Statut : faite (2026-11-21)
- Agent : principal
- Branche : fix/mobile-annuler-demande (depuis develop)
- Dépend de : backlog dette-mobile (relevé GUIDE-03), accord de l'utilisateur du 2026-11-21
- Périmètre d'écriture : mobile/src/pages/interventions/InterventionsPage.jsx, docs/backlog/dette-mobile.md, CHANGELOG.md, cette fiche

## Critères d'acceptation

- [x] `DIForm` reçoit `onClose` (propriété attendue) comme sur la page des demandes
- [x] build mobile et check.sh verts
- [ ] essai à l'écran (utilisateur) : « Annuler » ferme le formulaire

## Compte rendu final

Une propriété mal nommée (`onCancel` au lieu de `onClose`) : le bouton « Annuler » et la
fermeture gardée du formulaire n'avaient aucun effet. Pas d'outillage de test du mobile
(backlog tests-mobile) : vérifié par lecture et construction seulement, NON VÉRIFIÉ à l'écran.
