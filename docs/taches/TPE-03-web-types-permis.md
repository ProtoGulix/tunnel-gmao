# TPE-03. Web : sélecteur filtré et réglage des classes

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : frontend-dev
- Branche : feat/types-par-equipement (worktree ../wt-tpe-03, après TPE-02)
- Dépend de : ADR 0031 (point 6), TPE-02
- Périmètre d'écriture : web/src, CHANGELOG.md, cette fiche. Exclu : backend, mobile.

## Critères d'acceptation

- [x] Le sélecteur de type (TypeField, web/src/components/interventions/InterventionCreateForm.jsx
      et les autres formulaires qui choisissent un type) lit les types filtrés par
      l'équipement choisi et se recharge quand l'équipement change ; un type choisi devenu
      non permis est vidé ; le type actuel d'une intervention existante reste affiché.
- [x] Type suggéré non permis : pas de cadenas, choix libre parmi les types permis.
- [x] Administration des classes (là où une classe se modifie aujourd'hui) : choix des types
      permis (aucun coché = tous permis, dit en clair à l'écran).
- [x] Build web vert, tests front verts, scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Fait : TypeField filtré par équipement (hook usePermittedInterventionTypes, règle pure
selectableTypes testée) ; type non permis vidé, type imposé/désactivé conservé ; seul formulaire
qui choisit un type : la création (aucun autre sélecteur trouvé dans web/src). Cases des types
actifs dans la modification d'une classe (visibles si droit sur le PUT), enregistrées par
PUT /equipement-class/{id}/intervention-types, réglage seulement en modification (pas à la
création). Codes de permission ajoutés. Vérifications : voir compte rendu de l'agent.
