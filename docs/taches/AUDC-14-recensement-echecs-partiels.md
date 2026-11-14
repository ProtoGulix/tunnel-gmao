# AUDC-14. Recensement des échecs partiels tolérés

- Statut : faite (2026-11-13)
- Agent : Explore (lecture seule)
- Branche : refactor/audit-centralise
- Dépend de : ADR 0018 point 1 bis

## Critères d'acceptation

- [x] liste des routes et repos qui attrapent une exception après rollback() (ou sans
      relever) et continuent : fichier:ligne, route concernée, effet aujourd'hui, effet
      sous ADR 0018 point 1 bis, adaptation proposée
- [x] liste des routes qui écrivent en base hors de la requête (tâches de fond, flux)

## Compte rendu final

Explore (2026-11-13), lecture seule, script AST sur backend/api puis lecture des cas.
Vérifié par l'agent principal : commit() sur une transaction en erreur ne lève rien
(psycopg2, base de dev en lecture, statut 3 puis aucune exception) ; écriture puis 401
dans /auth/login (auth/routes.py:104-111) ; 5 `SET LOCAL app.skip_request_status_log`.

Constats transverses (socle, AUDC-11) :
- A. Transaction en erreur validée en silence : le middleware doit tester
  `conn.info.transaction_status` avant de valider, en plus des rollback() de repo.
- B. `ROLLBACK TO SAVEPOINT` par cur.execute (purchase_requests/repo.py:1596-1697,
  dispatch) échappe au crochet sur rollback().
- C. Un rollback() sur la connexion partagée efface tout ce qui précède : rollback de
  flux normal en preventive_occurrences/repo.py:390 (« conflit ») et
  intervention_requests/repo.py:1133 (sans raise).
- D. `SET LOCAL app.skip_request_status_log` (intervention_requests/repo.py:848, 1075,
  1193 ; interventions/repo.py:875 ; preventive_occurrences/repo.py:764) durerait jusqu'à
  la fin de la requête ; le trigger fn_init_request_status_log le remet à false à chaque
  création de demande.
- E. Écriture puis 4xx : /auth/login (tentatives, security_log) et /auth/refresh
  (révocation sur réutilisation de jeton) ; sous transaction de requête, ces écritures
  seraient annulées.
- BackgroundTasks (courriels) : ordre avec le commit non garanti, et la tâche hérite du
  ContextVar ; lire les destinataires avant, ou lancer après le commit, ContextVar vidé.
- Écritures hors requête assumées : touch_last_used des clés d'API (JWTMiddleware),
  catalogue des endpoints au démarrage.

Cas à échec partiel, par domaine (adaptation avant passage sous transaction) :
- PUT /interventions : cascade de fermeture (on_intervention_closed) avalée.
- POST /preventive-occurrences/generate : une transaction par machine, conflits en
  rollback, auto-acceptation avalée ; le plus lourd.
- POST /purchase-requests/import : une ligne en erreur n'arrête pas les autres.
- POST /purchase-requests/dispatch : SAVEPOINT par demande ; défaut existant du cache
  de paniers après retour arrière.
- POST /admin/endpoints/sync : échec avalé, réponse « synchronisé ».
- POST /intervention-status-log et `_write_audit_log` : audit avalé (supprimé en AUDC-13).
- Lectures avalées sur le chemin de réponse de routes qui modifient (actions, achats,
  lignes de commande, commandes, équipements, familles de stock) : couvertes par le
  contrôle A.
- POST qui n'écrivent rien (import/headers, import dry_run, exports CSV et courriel de
  commande, test de courriel) : exceptions déclarées.
Décompte : 150 rollback() dans api/, dont 147 suivis d'un raise.
À surveiller : pg_advisory_xact_lock (equipements/repo.py:735, 936) tenu plus longtemps ;
codes MAX()+1 (demandes, demandes d'achat) plus exposés aux collisions ; trigger
trg_task_status_on_action_link cité dans le code mais absent de schema.sql.
NON VÉRIFIÉ : chaîne réelle des middlewares, ordre BackgroundTasks et commit, tests qui
dépendent des échecs partiels, contraintes d'unicité des codes.
