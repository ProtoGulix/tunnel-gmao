# ADV-01. API : sens de la tendance du stock de demandes

- Statut : faite (2026-11-27)
- Agent : principal
- Branche : feat/accueil-direction-visuel
- Dépend de : ADR 0046 ; demande de l'utilisateur du 2026-11-27 (améliorer le visuel)
- Périmètre d'écriture : backend/api/stats/ (trends.py, demandes_repo.py, schemas.py), backend/tests/test_stats_demandes.py, docs/api/endpoints/stats.md, CHANGELOG.md, cette fiche.

## Contexte

Le front déduisait « en hausse » du seul signe de `trend` : 56 → 58 s'affichait en hausse.
Le seuil de stabilité est une règle métier : il vient de l'API, comme pour le Bilan.

## Critères d'acceptation

- [x] `trend_direction` (`up`, `down`, `stable`, `null`) dans `GET /stats/demandes`, calcul partagé de trends.py, stable sous 3 demandes d'écart estimé
- [x] test sur la série réelle de dev (stable), hausse, baisse, série trop courte
- [x] docs/api/endpoints et CHANGELOG à jour ; scripts/check.sh vert

## Compte rendu final

`compute_request_stock_trend` (trends.py, seuil `REQUEST_STOCK_STABLE_BELOW`) appliqué aux
`stock_end` hebdomadaires. Test unitaire ajouté (8 passés). Champ facultatif ajouté, sans
effet sur les clients existants.
