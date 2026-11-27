# ADB-01. API : statistiques des demandes à qualifier

- Statut : faite (2026-11-27)
- Agent : backend-dev
- Branche : feat/accueil-direction-bilan (travail sur feat/accueil-direction-bilan-adb01)
- Dépend de : ADR 0046
- Périmètre d'écriture : backend/api/stats/ (routes, schemas, nouveau repo dédié), backend/tests/, docs/api/endpoints/ (stats), CHANGELOG.md, cette fiche. Exclu : migrations, autres domaines, default_permissions.py (lecture déjà ouverte par défaut : à vérifier, sinon s'arrêter et signaler), fronts.

## Contexte

ADR 0046. Stock = demandes au statut `nouvelle` ou `en_attente`. Sortie = première
transition vers `acceptee` ou `rejetee` (request_status_log). Lecture seule.

## Critères d'acceptation

- [x] `GET /stats/demandes?weeks=8&site_id=` (site = équipement racine, descendants compris ; weeks borné, défaut 8)
- [x] flux : une ligne par semaine ISO (lundi) : `created`, `accepted`, `rejected`, `stock_end` (stock en fin de semaine) ; plus `trend` (variation du stock sur la période)
- [x] âge du stock courant par tranches calculées par l'API (bornes en constantes nommées, renvoyées avec chaque tranche : `< 7 j`, `7–30 j`, `30–90 j`, `> 90 j`) : `count`, `min_days`, `max_days`
- [x] où : par site (équipement racine) puis les 10 équipements les plus chargés : `id`, `code`, `name`, `count`, `oldest_days`
- [x] le `stock_end` de la semaine courante égale le stock courant (test) ; tranches et sites somment au stock courant (test)
- [x] aucune donnée par personne ; requêtes paramétrées ; erreurs sans message SQL brut
- [x] tests d'intégration : flux sur un jeu daté, tranches aux bornes, filtre de site, demande supprimée absente
- [x] lecture ouverte aux connectés par la règle par défaut (vérifié par un test ou par default_allowed)
- [x] docs/api/endpoints à jour ; scripts/check.sh et scripts/test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : `GET /stats/demandes` (repo dédié `demandes_repo.py`, schémas, route limitée à 10/min, droit `stats:get_demandes` par la règle de lecture par défaut, testé pour les 5 rôles et la clé MCP).

Choix : site = équipement racine ; `site_id` accepte tout équipement, descendants compris (machine_scope). Stock selon le statut courant, sortie selon le journal. Tranches : borne basse incluse, haute exclue (« > 90 j » = 90 j et plus). Les demandes système (préventif) comptent.

Écart de données : `journal_gaps` compte les demandes dont statut et journal divergent (sortie sans ligne de journal, ou l'inverse). Le stock suit le statut ; sans ligne de sortie, la date de sortie est la dernière mise à jour de la demande (compté, pas masqué). Non mesuré sur la base de dev (aucun accès).

Tests : `tests/test_stats_demandes.py` (7), `tests/integration/test_stats_demandes_integration.py` (13).
