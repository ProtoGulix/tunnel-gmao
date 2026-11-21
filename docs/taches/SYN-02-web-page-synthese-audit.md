# SYN-02. Page web « Synthèse de l'audit »

- Statut : fait
- Agent : frontend-dev
- Branche : feat/synthese-audit (worktree ../wt-syn-02, après SYN-01)
- Dépend de : ADR 0032, SYN-01
- Périmètre d'écriture : web/src, CHANGELOG.md, cette fiche, docs/backlog/page-synthese-audit.md
  (marquer traité). Exclu : backend, mobile.

## Contexte

Modèle : la page « Organisation » (ADR 0021, ORG-02) : mise en page, sélecteur de période,
définitions écrites à côté de chaque indicateur, droit, entrée de menu.

## Critères d'acceptation

- [x] Page « Synthèse de l'audit », entrée de menu à côté de « Organisation », visible avec
      le droit `stats:get_audit_synthese`.
- [x] Période par défaut 3 mois, réglable ; chiffres par mois ; graphiques avec la
      bibliothèque déjà utilisée par la page Organisation.
- [x] Chaque indicateur avec sa définition en clair ; mois antérieurs au 2026-11-20
      signalés « données incomplètes ».
- [x] Ton neutre : aucun indicateur présenté comme une faute (affecté ≠ exécutant est
      normal).
- [x] Build web vert, `npm test` vert, scripts/check.sh vert
- [x] CHANGELOG (« Non publié ») à jour ; backlog marqué traité

## Compte rendu final


Page `AuditSynthesePage` (route `/audit-synthese`, menu Production sous Organisation, droit
`stats:get_audit_synthese`), calquée sur Organisation : sélecteur 3/6/12 mois (défaut 3),
chiffres de période avec définitions, cinq graphiques de parts (blocs `ShareChart` de
OrganisationCharts, désormais exportés), tableau par mois avec pastille « données incomplètes »,
tableau des décisions par type (table `AUDIT_DECISION_LABELS` existante) et motif. Null affiché
« — ». Test node sur le regroupement des décisions. Build, `npm test` (58) et check.sh verts.
Non vérifié : rendu à l'écran, droit réel côté serveur.
