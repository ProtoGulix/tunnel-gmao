# AUDC-12. Déclaration d'audit par route et test de couverture

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : refactor/audit-centralise
- Dépend de : AUDC-11
- Périmètre d'écriture : mécanisme de déclaration (module dans `backend/api/audits/`),
  test de couverture, `backend/scripts/audit_routes.py` (statut lu dans les
  déclarations), liste d'exceptions initiale. Exclus : routes métier (étape 2).

## Critères d'acceptation

- [x] une route déclare son audit (entité, origine de l'identifiant : paramètre de
      chemin ou identifiant créé déposé par la route) de façon explicite et lisible
- [x] test : toute route POST, PUT, PATCH, DELETE est déclarée ou dans la liste
      d'exceptions, avec sa raison ; liste initiale = les 125 routes « à traiter »
- [x] l'inventaire AUDC-routes.md affiche le statut réel
- [x] check.sh et test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : dépendance FastAPI dans le décorateur,
`dependencies=[audit("intervention", id_from_path="intervention_id", table=...)]` ou
`audit("x", id_from_created=True)` avec `declare_created_id(request, id)` dans la route
(api/audits/declaration.py, dataclass figée, une seule origine d'identifiant, sans effet
à l'exécution, retrouvée par `find_declaration(route)`). Écartés : openapi_extra
(mélange audit et documentation), registre central (sépare déclaration et route).
api/audits/exclusions.py : 125 entrées (122 à traiter par étape, 3 exclues auth ; les 4
POST sans écriture restent à traiter, « à valider »). Test de couverture
backend/tests/test_audit_coverage.py (route non classée, entrée orpheline, double
classement). Inventaire régénéré par le mécanisme.
Agent principal : check.sh vert ; inventaire 34 / 42 / 46 à traiter, 3 exclues ;
conteneurs actifs préexistants (autres projets), aucun conteneur de test.
