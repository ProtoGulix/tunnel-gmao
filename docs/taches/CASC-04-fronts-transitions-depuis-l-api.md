# CASC-04. Web et mobile affichent les transitions données par l'API

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ)
- Agent : frontend-dev
- Branche : fix/audit-des-cascades (worktree ../wt-casc-04, après CASC-02)
- Dépend de : ADR 0029 (point 2), CASC-02
- Périmètre d'écriture : web/src/ et mobile/src/ (demandes d'intervention), CHANGELOG.md,
  cette fiche. Exclu : backend.

## Contexte

web/src/components/intervention-requests/InterventionRequestDetail.jsx:22 (`TRANSITIONS`)
et mobile/src/pages/intervention-requests/InterventionRequestsPage.jsx:21
(`ALLOWED_TRANSITIONS`) recopient la règle de l'API et divergent.

## Critères d'acceptation

- [x] Les deux copies supprimées ; chaque bouton de transition n'apparaît que si sa cible
      est dans `allowed_transitions` de la demande.
- [x] Web : garde sa présentation (seul « Rejeter » à la main, acceptation par la
      création d'une intervention), filtrée par la liste.
- [x] Mobile : « Clôturer » absent d'une demande dont l'intervention est ouverte ; une
      erreur 400 du backend reste affichée.
- [x] Lint et build des deux fronts verts ; scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Fait : `TRANSITIONS` (web) et `ALLOWED_TRANSITIONS` (mobile) supprimés. Web : « Rejeter »
affiché si `rejetee` est dans `detail.allowed_transitions`. Mobile : « Créer l'intervention »
affiché si `acceptee` y figure ; le mobile n'a aucun bouton « Clôturer » (donc rien à
masquer) ; l'erreur 400 reste affichée par la feuille d'acceptation ; après transition, la
demande est rechargée (donc nouvelle liste). Sans le champ, aucun bouton.
Fichiers : web/.../InterventionRequestDetail.jsx, mobile/.../InterventionRequestsPage.jsx,
CHANGELOG.md, cette fiche. Aucun autre endroit du web ne décide d'une transition.
Reste à voir à l'écran : web demande nouvelle/en attente (Rejeter) et acceptée/clôturée (rien) ;
mobile demande acceptée avec intervention ouverte.
