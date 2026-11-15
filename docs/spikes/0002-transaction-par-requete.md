# Spike AUDC-00 : une transaction par requête portée par le middleware

Date : 2026-11-13. Rôle : backend-dev. Statut : prototype, aucun code de production modifié.
Prototype et tests : `backend/tests/spike/` (21 tests `integration`, base jetable de
`scripts/test-integration.sh`, jamais la base de dev).

## Contexte

L'ADR 0018 (point 1) suppose qu'un `BaseHTTPMiddleware` peut ouvrir une connexion psycopg2,
la placer dans un ContextVar, et que `db.get_connection()` la renvoie aux repos (commit
différé, release sans effet), le middleware écrivant l'audit puis validant ou annulant tout.

## Versions

fastapi 0.109.0, starlette 0.35.1, anyio 4.15.1, psycopg2-binary 2.9.11, Python 3.13,
PostgreSQL 15. Pool de test : 4 connexions maximum.

## Ce qui marche (prouvé par un test)

- Le ContextVar posé par le middleware avant `call_next` est vu par les routes sync (copie du
  contexte par `anyio.to_thread`) et async : même `pg_backend_pid` côté route et côté middleware.
- `commit()` du repo différé : une autre connexion ne voit rien pendant la route ; après la
  réponse, mutation et ligne d'audit sont là ensemble.
- Exception de route (500), `HTTPException` (409, réponse >= 400), exception relevée par un repo :
  rien en base. Échec de l'écriture d'audit : mutation annulée, réponse 500.
- Deux POST réellement simultanés (barrière dans la route) : connexions et pids distincts ;
  rafale de 12 POST sur 4 threads et pool de 4 : lignes et audits tous présents, pool vide à la fin.
- GET : aucune transaction ouverte par le middleware (une seule connexion utilisée, celle de la route).
- Plusieurs repos dans une route : ils partagent la transaction et voient les écritures non
  validées des autres.
- Pool épuisé : `DatabaseError` à l'emprunt du middleware, réponse 500, rien d'écrit, aucune
  fuite, le pool se rétablit. Sous charge (6 POST de 0,5 s, pool de 4) : au plus 4 réussissent,
  les autres reçoivent 500.

## Ce qui échoue ou piège

1. `rollback()` d'un repo au milieu de la requête. Avec la connexion enveloppée qui délègue
   le vrai `rollback()`, tout le travail précédent de la requête est perdu, et la route répond
   quand même 200 (perte silencieuse, testée). Même effet si un repo avale l'exception après
   `rollback()`. Il y a 150 `conn.rollback()` dans api/. Parade prouvée : un SAVEPOINT à chaque
   `get_connection()`, `rollback()` du repo = `ROLLBACK TO SAVEPOINT` ; seul le repo fautif est
   annulé, la transaction reste saine, et audit et mutations des autres repos sont validés.
   Conséquence : un repo qui attrape l'erreur et continue produit une validation partielle
   (comportement actuel équivalent, mais désormais à décider explicitement).
2. BackgroundTasks et StreamingResponse. `call_next` rend la main avant l'envoi du corps et
   avant les tâches de fond ; le middleware a déjà validé et rendu la connexion. Ce qu'ils
   écrivent n'est ni dans la transaction ni couvert par l'audit. Le prototype replie sur une
   connexion propre du pool (commit réel par le repo) : ça fonctionne, mais sans atomicité.
   Règle à imposer : aucune écriture en tâche de fond ni dans un générateur sur une route
   auditée (ou une écriture autonome et assumée).
3. Un `ContextVar.set()` fait dans la route ne remonte pas au middleware (tâches distinctes,
   contexte copié). Il faut passer par un objet partagé par référence (ici `tx.events`), ce
   qui marche. ADR 0018 point 4 (événements déposés par les repos) est donc réalisable
   ainsi, pas avec un `set()`.
4. Les exceptions : en 0.35.1 `call_next` relève l'exception de la route dans `dispatch`
   (rollback puis re-raise OK) ; les `HTTPException` sont déjà transformées en réponse par
   l'ExceptionMiddleware interne, donc visibles uniquement par `status_code`. Règle retenue :
   commit seulement si statut < 400.
5. Blocage : psycopg2 est synchrone ; emprunt, audit et commit du middleware passent par
   `run_in_threadpool`, sinon la boucle est bloquée. Une route `async def` qui appelle un repo
   bloque la boucle (déjà le cas aujourd'hui).
6. Ordre des middlewares : l'ordre d'ajout Starlette inverse l'exécution (dernier ajouté =
   le plus externe). Pour l'ADR 0018 point 2 (après JWT et droits), le middleware de
   transaction doit être ajouté AVANT JWTMiddleware. Prototype testé seul : NON VÉRIFIÉ
   avec la chaîne réelle (voir plus bas).
7. Les repos font `from api.db import get_connection` : le nom est lié à l'import, la logique
   ContextVar doit donc vivre dans `api/db.py` (aussi `db_connection`, qui appelle le
   `get_connection` du module). Dans le prototype, ces fonctions sont recopiées.
8. Une transaction longue retient une connexion par POST pour toute la durée de la requête :
   le nombre de POST simultanés est borné par `maxconn` (10), pas par le threadpool (40).
   `getconn` ne bloque pas : échec immédiat, sans file d'attente.

## NON VÉRIFIÉ

- Chaîne réelle (JWTMiddleware, AuditMiddleware, SecurityHeadersMiddleware) et ordre d'ajout.
- Corps multipart, très gros corps, déconnexion du client en cours de route (annulation de la
  tâche du middleware : le `finally` rend la connexion, mais non testé).
- `statement_timeout` de 30 s et verrous (une transaction plus longue garde ses verrous plus
  longtemps : risque d'attente entre requêtes).
- Routes `async def` qui appellent des repos en nombre (blocage de boucle inchangé, non mesuré).
- Effets externes (courriel) avant l'annulation tardive. Version de Starlette autre que 0.35.1.

## Recommandation

ContextVar, avec les conditions suivantes : (a) logique dans `api/db.py` ; (b) SAVEPOINT par
`get_connection()` pour contenir les 150 `rollback()` de repos ; (c) interdiction des écritures
en BackgroundTasks et en génération de flux sur les routes auditées (test de parcours) ;
(d) objet partagé par référence pour les événements d'audit ; (e) middleware de transaction
placé après JWT et droits, à vérifier sur la chaîne réelle dès AUDC-01.
Raison : le mécanisme est prouvé avec les versions du dépôt, et la connexion explicite
obligerait à modifier la signature de tous les repos (325 `conn.cursor`) et routes. Repli si
la chaîne réelle ou le point (b) échoue : connexion explicite passée aux repos.
