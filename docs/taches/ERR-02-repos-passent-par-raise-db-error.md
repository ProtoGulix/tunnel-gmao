# ERR-02. Les repo passent par raise_db_error

- Statut : faite (2026-11-22)
- Agent : backend-dev (sonnet)
- Branche : fix/erreurs-metier-en-500-err02 (worktree depuis fix/erreurs-metier-en-500)
- Dépend de : ERR-01
- Périmètre d'écriture : backend/api/**/repo.py, backend/api/exports/planning_repo.py,
  backend/api/stock_items/template_service.py, backend/api/stock_items/stock_item_service.py.
  Exclus : api/errors/exceptions.py, api/db.py (échec de connexion : reste une DatabaseError),
  tests existants, routes, schémas, validators, toute migration.

## Contexte

ERR-01 fait relancer les erreurs métier par `raise_db_error`. Restent environ 97 blocs
`except Exception as e: raise DatabaseError(f"...{str(e)}")` qui transforment eux aussi une
HTTPException levée dans le try en 500. Décision de l'utilisateur du 2026-11-22 : un seul
mécanisme, `raise_db_error(e, "<contexte>")`, plutôt que 97 `except HTTPException`.
Effet voulu, à noter au CHANGELOG : ces blocs renvoient aussi 409 (unicité), 400 (clé
étrangère, RAISE EXCEPTION) au lieu de 500.

## Critères d'acceptation

- [x] plus aucun `raise DatabaseError(` dans le périmètre (grep vide), sauf cas justifié dans le compte rendu
- [x] chaque remplacement garde le rollback et l'ordre existants ; le contexte décrit l'opération en français
- [x] les `except NotFoundError: raise` / `except HTTPException: raise` devenus inutiles peuvent rester (pas de ménage hors sujet)
- [x] aucun test existant modifié ; scripts/check.sh vert ; scripts/test-integration.sh vert
- [x] CHANGELOG (« Non publié ») : une entrée sous Corrections

## Compte rendu final

Fait : 94 `raise DatabaseError(f"...{str(e)}")` dans un `except Exception as e` remplacés par
`raise_db_error(e, "<contexte>")` dans 23 fichiers (repo.py, planning_repo.py, deux services
stock_items), imports ajustés (ruff F401). Rollback et ordre inchangés. Contexte : début du
message d'origine ; pour les anciens « Erreur base de données » (stats, catégories, users...),
« accès base (<fonction>) ».

Laissés tels quels (9 `raise DatabaseError`, grep non vide) :
- interventions/repo.py 787 et 791 : diagnostics volontaires (table absente, connexion) en
  tête d'un except, avant le `raise_db_error` final qui reste.
- interventions/repo.py 30, 902, 997, 1003, 1010, 1021 et intervention_requests/repo.py 878 :
  levés dans le corps du try, hors d'un except ; ils restent des 500 voulus (règle d'audit
  ou statut de référence manquant, données incohérentes), le client reçoit le message générique.

Point d'attention : quelques `except (DatabaseError, ...)` en aval (stock_families 127,
stock_sub_families 92/144/204, intervention_requests 832, interventions 1209) n'attrapent plus
les 409/400 produits par raise_db_error ; ils les laissent remonter, ce qui est voulu.
test-integration.sh non lancé (agent principal).


Contrôle de l'agent principal (2026-11-22) : 25 fichiers, tous dans le périmètre ; aucun
test modifié ; 9 `raise DatabaseError` restants relus (corps de try ou diagnostic) ; blocs
`except (..., DatabaseError): raise` en aval relus : un 409 ou 400 sous-jacent passe par
`except Exception` puis est relancé tel quel, rollback compris. test-integration.sh vert (622).

Relecture (reviewer, 2026-11-22) : APPROUVÉ. Constat mineur corrigé dans la branche :
interventions/repo.py `get_by_id` relance toute HTTPException avant de trier les messages
de base. Constat reporté : docs/backlog/liaison-demande-refus-en-500.md.
