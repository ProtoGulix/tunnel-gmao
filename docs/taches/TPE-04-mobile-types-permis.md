# TPE-04. Mobile : sélecteur de type filtré par l'équipement

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ, essai à l'écran validé)
- Agent : frontend-dev
- Branche : feat/types-par-equipement (worktree ../wt-tpe-04, après TPE-02)
- Dépend de : ADR 0031 (point 6), TPE-02
- Périmètre d'écriture : mobile/src, CHANGELOG.md, cette fiche. Exclu : backend, web.

## Critères d'acceptation

- [x] Les sélecteurs de type (mobile/src/components/actions/InterventionCreateForm.jsx,
      mobile/src/components/interventions/InterventionForm.jsx, hook
      useInterventionTypes) lisent les types filtrés par l'équipement, rechargés au
      changement d'équipement ; type devenu non permis vidé ; type actuel d'une intervention
      existante affiché.
- [x] Type suggéré non permis : pas de verrou.
- [x] Build mobile vert, scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Fait : `getInterventionTypes({ machineId })` ; hook `usePermittedTypes(machineId)` (rechargé au
changement d'équipement) utilisé par InterventionCreateForm et InterventionForm (nouvelle prop
`machineId`, passée par l'acceptation d'une demande depuis `item.equipement.id`). Type choisi
devenu non permis vidé (sauf type suggéré, pour l'exemption préventive) ; type courant toujours
listé (`listedTypes`) ; verrou du type suggéré seulement s'il est permis. Les erreurs 400 du
backend s'affichent déjà via les messages d'erreur existants.
Non vérifié : comportement à l'écran.
