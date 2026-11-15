# AUDC-11. Transaction par requête et ordre des middlewares

- Statut : faite (2026-11-13)
- Agent : backend-dev
- Branche : refactor/audit-centralise
- Dépend de : AUDC-10, docs/spikes/0002
- Périmètre d'écriture : `backend/api/db.py`, `backend/api/app.py`, un module de
  middleware de transaction dans `backend/api/` ; tests unitaires nouveaux. Exclus : les
  repos (sauf constat), le middleware d'audit (AUDC-13), fronts.

## Critères d'acceptation

- [x] unité de travail par requête qui modifie, selon l'ADR 0018 points 1 et 1 bis et
      les conditions de docs/spikes/0002 ; GET inchangés
- [x] transaction en erreur jamais validée (statut vérifié avant le commit) ; tâches
      de fond lancées après la validation, ContextVar vide ; /auth/login, /auth/refresh,
      /auth/logout hors transaction de requête (test : un échec de connexion reste
      enregistré) — ADR 0018 points 1 quater, 1 quinquies, 1 ter
- [x] constat : liste des SAVEPOINT et SET LOCAL de repo restants (traités domaine par
      domaine aux étapes 2 et 3, pas ici)
- [x] middlewares dans l'ordre CORS, JWT, droits, transaction, audit, route (vérifié
      par un test sur la chaîne réelle)
- [x] tests AUDC-10 de la tâche passent sans xfail (marqueurs retirés par l'agent
      principal) ; aucune assertion existante modifiée
- [x] check.sh et test-integration.sh verts

## Compte rendu final

backend-dev (2026-11-13) : `RequestConnection` et ContextVar dans api/db.py ;
api/transaction.py, middleware ASGI pur (POST, PUT, PATCH, DELETE ; /auth/login,
/auth/refresh, /auth/logout exclus) qui valide seulement si réponse < 400 et
transaction saine (IDLE ou INTRANS), sinon annule ; 2xx avec transaction en échec →
500 générique, tâches de fond non lancées. Débordement accepté par l'agent principal :
api/auth/permission_middleware.py et permissions.py (`check_matrix`), nécessaire pour
répondre 403 avant la validation du motif. Ordre dans app.py : CORS, en-têtes de
sécurité, JWT, droits, transaction, audit, route (en-têtes de sécurité déplacés
au-dessus de JWT). L'audit actuel écrit déjà par get_connection : son échec annule la
mutation. Tests : 14 unitaires (test_transaction_unit.py), 8 d'intégration
(test_audc_transaction_integration.py) ; aucun test existant cassé.
Agent principal : 4 marqueurs xfail AUDC-11 retirés ; check.sh vert ;
test-integration.sh 141 passed, 5 xfailed (AUDC-13).
Constat : SAVEPOINT seulement dans purchase_requests/repo.py (dispatch) ; SET LOCAL
aux 5 endroits connus ; génération préventive et import CSV échouent désormais en 500
sur un échec partiel : AUDC-15.
NON VÉRIFIÉ : déconnexion client, charge, Starlette autre que 0.35.1.
