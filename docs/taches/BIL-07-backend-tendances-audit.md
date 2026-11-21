# BIL-07. API : tendances de la synthèse de l'audit

- Statut : faite
- Agent : backend-dev
- Branche : feat/bilan-audit-allege (depuis develop, ADR 0008)
- Dépend de : ADR 0035 point 4
- Périmètre d'écriture : backend/api/stats/ (audit_synthese_repo.py, schemas.py, trends.py),
  backend/tests/, docs/api/endpoints/stats.md, CHANGELOG.md (« Non publié »), cette fiche.
  Exclus : web/, mobile/, migrations, dépendances.

## Contexte

ADR 0035 point 4 (forme exacte de `trends`, à ne pas changer : le web est écrit en
parallèle). Calcul de tendance existant : backend/api/stats/trends.py (ADR 0034 point 10).

## Critères d'acceptation

- [x] `trends` conforme ; réutilise trends.py ; seuils nommés (2 points, 2 décisions).
- [x] Tests unitaires (seuil des décisions, part nulle ignorée) et d'intégration (présence et
      valeurs de `trends`) ; aucune assertion existante affaiblie.
- [x] Doc d'endpoint et CHANGELOG à jour ; `ruff format` ; scripts/check.sh et
      test-integration.sh verts.

## Compte rendu final

Ajout de `trends` à `GET /stats/audit-synthese` : `compute_audit_trends` dans trends.py
(seuils nommés SHARE_STABLE_BELOW = 2 points, DECISIONS_STABLE_BELOW = 2 décisions),
`AuditSyntheseTrends` dans schemas.py, appel dans audit_synthese_repo.py. Tests unitaires
(seuil des décisions, part nulle ignorée, clés) et d'intégration (clés, valeurs sur trois
mois). Doc d'endpoint et CHANGELOG à jour. Aucune assertion existante modifiée.
