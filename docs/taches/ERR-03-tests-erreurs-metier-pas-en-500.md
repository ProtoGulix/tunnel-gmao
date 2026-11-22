# ERR-03. Tests : une erreur métier n'est pas une 500

- Statut : faite (2026-11-22)
- Agent : test-writer (sonnet)
- Branche : fix/erreurs-metier-en-500-err03 (worktree depuis fix/erreurs-metier-en-500)
- Dépend de : ERR-01
- Périmètre d'écriture : un nouveau fichier backend/tests/test_erreurs_metier_pas_en_500.py
  (et au besoin un fichier dans backend/tests/integration/). Exclus : tout code de production,
  tout test existant.

## Contexte

Cas repérés le 2026-11-22 où une erreur métier levée dans un `try / except Exception`
devenait une 500. Directs : admin/repo.py:124 (création, rôle inconnu), admin/repo.py:208
(changement de rôle, rôle inconnu), preventive_occurrences/repo.py:131 (occurrence absente),
preventive_plans/repo.py:161 (plan absent). Indirects (méthode levant NotFoundError ou
« intervention non modifiable » appelée dans le try) : parts 387, 465, 489 ;
stock_items 389, 428, 492 ; purchase_requests 93, 174, 238, 877 ; intervention_tasks 368 ;
intervention_status_log 227 ; services 107 ; stock_item_suppliers 290 ;
stock_sub_families 173 ; supplier_orders 474 ; suppliers 157 ; users 108 ; admin 124.

## Critères d'acceptation

- [x] un test par cas direct (4) et au moins 6 cas indirects de domaines différents, qui vérifie le code attendu (404, 400 ou 409) et non 500
- [x] tests unitaires sans base (connexion simulée), dans le style de tests/test_error_leaks.py ; intégration seulement si un cas l'exige
- [x] preuve d'échec avant correctif : les tests lancés sur le commit de develop (avant ERR-01) échouent ; ceux qui dépendent de ERR-02 (blocs `raise DatabaseError`) sont signalés comme tels et échouent sur la branche actuelle
- [x] scripts/check.sh vert sur les tests qui ne dépendent que d'ERR-01

## Compte rendu final

Fait : backend/tests/test_erreurs_metier_pas_en_500.py, 11 tests au niveau repo (connexion et curseur simulés).
Cas directs (4) : admin create et set_role (rôle inconnu), preventive_occurrences et preventive_plans get_by_id (absent), tous 404.
Cas indirects : parts.create, admin.update, stock_families.create (400) verts ; stock_items.add, suppliers.update, supplier_orders.update en xfail strict « corrigé par ERR-02 » (leur repo fait encore `raise DatabaseError`) ; un test de relance de ConflictError par raise_db_error.
Résultat : 8 verts, 3 xfail. Preuve d'échec : avec exceptions.py d'avant ERR-01 (3167b63), 6 tests échouent (4 directs, parts.create, relance de ConflictError) ; admin.update et stock_families.create passent déjà (leurs repos relancent eux-mêmes l'erreur métier : garde-fous).
Écart : domaines couverts = admin, preventive_occurrences, preventive_plans, parts, stock_items, suppliers, supplier_orders, stock_families (6 indirects de domaines différents). Les cas de la fiche déjà gérés par un `except NotFoundError: raise` (users, purchase_requests, services, stock_sub_families) n'ont pas de bug à prouver.
scripts/check.sh racine : vert (599 passés, 3 xfail).

Contrôle de l'agent principal (2026-11-22) : après fusion d'ERR-02, les 3 xfail retirés,
11/11 verts ; check.sh vert (602 passés) ; test-integration.sh vert (622 passés) ; diff
limité au nouveau fichier de tests et à la fiche, aucun test existant touché.
