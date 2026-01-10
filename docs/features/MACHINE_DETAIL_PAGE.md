# Page Détail machine - Documentation

## Vue d'ensemble

Consultation détaillée d'une machine.

- Route: `/machines/:id`
- ID: `machine-detail`
- Composant: `MachineDetail`
- Accès: Privé (auth requis)
- Menu: masquée (`showInMenu: false`), icône `Settings`

## En-tête

- Titre: "Détail de la machine"
- Sous-titre: dynamique selon l'ID

## Notes

- Affiche interventions et actions liées à la machine.
