# AUDC-00. Preuve technique : une transaction par requête portée par le middleware

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : refactor/audit-centralise
- Dépend de : ADR 0018 (proposé)
- Périmètre d'écriture : `backend/tests/spike/` (nouveau dossier, prototype et tests),
  `docs/spikes/0002-transaction-par-requete.md`. Aucun code de production modifié.

## Contexte

L'ADR 0018 repose sur une hypothèse : le middleware (BaseHTTPMiddleware, FastAPI
0.109.0) ouvre une connexion psycopg2, la place dans un ContextVar, et les routes
synchrones (exécutées dans le threadpool) la récupèrent par `db.get_connection()`, avec
un `commit()` de repo différé et une validation unique par le middleware après
l'écriture de l'audit. Si ce n'est pas fiable, l'alternative est de passer la connexion
explicitement aux repos.

## Critères d'acceptation

- [x] prototype minimal (mini application FastAPI dans le dossier de test, middleware,
      routes synchrones et asynchrones, faux repo qui fait `get_connection()`, `commit()`,
      `release_connection()`), sur la vraie base de test isolée
- [x] prouvé par des tests : la route reçoit la même connexion que le middleware ; le
      `commit()` du repo ne valide pas ; le middleware écrit une ligne « audit » puis
      valide : les deux sont en base ; une exception dans la route annule tout ; un échec
      de l'écriture d'audit annule la mutation ; deux requêtes simultanées ne partagent
      pas leur connexion ; une requête GET n'ouvre pas de transaction
- [x] vérifié et rapporté : BackgroundTasks, StreamingResponse, routes qui appellent
      plusieurs repos, effet d'une exception attrapée par un repo qui fait `rollback()`,
      épuisement du pool
- [x] rapport docs/spikes/0002 : ce qui marche, ce qui échoue, NON VÉRIFIÉ, recommandation
      (ContextVar ou connexion explicite)
- [x] scripts/check.sh vert (les tests de preuve tournent avec test-integration.sh)

## Compte rendu final

backend-dev (2026-11-13) : prototype dans backend/tests/spike/ (21 tests d'intégration,
base jetable), rapport docs/spikes/0002. Prouvé (fastapi 0.109.0, starlette 0.35.1) :
même connexion route et middleware (sync et async), commit de repo différé, audit et
mutation validés ensemble, annulation sur exception de route, HTTPException ou échec
d'audit, connexions distinctes en concurrence, pas de fuite sur pool épuisé, GET sans
transaction, plusieurs repos partagent la transaction. Infirmé puis paré : un
rollback() de repo au milieu efface le travail précédent (parade SAVEPOINT prouvée) ;
décision de l'utilisateur : tout rollback annule la requête (ADR 0018 point 1 bis).
BackgroundTasks et flux : après la validation ; usages actuels en lecture (vérifié par
l'agent principal). NON VÉRIFIÉ : chaîne réelle des middlewares, multipart,
déconnexion client, verrous longs.
Contrôle de l'agent principal : check.sh vert ; test-integration.sh 128 passed.
