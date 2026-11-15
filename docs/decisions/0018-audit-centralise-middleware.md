# 0018. Audit centralisé dans le middleware, une transaction par requête

- Statut : accepté (2026-11-13, après la preuve technique docs/spikes/0002)
- Date : 2026-11-13
- Remplace : ADR 0017 point 3 (audit écrit par les repos) et la décision d'AUD-04
  (le repo des tâches, source unique de leur audit)
- Affine : ADR 0016, 0017 points 1, 2 et 4, CLAUDE.md section 2 point 4

## Contexte

État des lieux du 2026-11-13 (vérifié par l'agent principal pour les points graves) :

- quatre mécanismes écrivent l'audit : AuditMiddleware (hors transaction, après la
  route), trois repos (demandes, tâches, actions, dans leur transaction), la route du
  journal de statut d'intervention et `POST /audit/log` ;
- le middleware devine l'entité depuis l'URL : il n'audite ni les créations (pas d'id),
  ni les suppressions sans motif dans le corps (aucune validation), écrit une ligne par
  colonne sur un POST de sous-ressource (bruit constaté en base), et remplace le corps
  d'une requête multipart (import CSV probablement cassé) ;
- AuditMiddleware s'exécute avant JWTMiddleware (ordre d'ajout Starlette) : la
  validation du motif et la lecture en base précèdent l'authentification et les droits ;
- une quarantaine de routes qui modifient (stock, pièces, fournisseurs, plans
  préventifs, référentiels, admin, y compris la gestion des motifs d'audit) et les
  mutations du système (génération préventive, acceptation automatique, cascades)
  n'ont aucune trace dans audit_log ;
- des motifs sont codés en dur dans des repos (TASK_STATUS, ROUTINE) et dans les fronts.

Décision de l'utilisateur (2026-11-13) : le middleware fait tout le travail d'audit,
l'audit est garanti par une transaction par requête, toutes les routes qui modifient
sont couvertes, par étapes.

## Décision

1. Unité de travail par requête. Pour une requête qui modifie, le middleware emprunte
   une connexion, la rend visible par un ContextVar, et `db.get_connection()` la renvoie
   aux repos. Le `commit()` d'un repo ne valide rien et `release_connection` ne rend
   rien : seul le middleware valide, après avoir écrit l'audit, ou annule tout si la
   route ou l'audit échoue. Les lectures (GET) gardent le fonctionnement actuel.
   Conditions prouvées par docs/spikes/0002 : la logique vit dans api/db.py (les repos
   importent `get_connection` de là) ; les événements d'audit passent par un objet
   partagé par référence (un ContextVar posé dans la route ne remonte pas au
   middleware) ; le middleware de transaction est ajouté avant JWTMiddleware dans
   app.py pour s'exécuter après lui. Dans la chaîne réelle (AUDC-11), un
   BaseHTTPMiddleware de transaction laissait partir corps et tâches de fond avant la
   validation : le middleware de transaction est donc un middleware ASGI pur qui décide
   à l'envoi des en-têtes de réponse, et un seul BaseHTTPMiddleware (l'audit) reste
   sous lui (vérifié par un test). Le contrôle des droits passe en middleware avant la
   transaction (la dépendance de route reste comme seconde barrière).
1 bis. Un `rollback()` de repo pendant une requête qui modifie marque la transaction en
   échec : le middleware annule toute la requête et répond une erreur, même si la route
   a avalé l'exception (décision de l'utilisateur, 2026-11-13). Les routes qui tolèrent
   aujourd'hui un échec partiel (génération préventive : « un échec sur une machine
   n'annule pas les autres ») sont recensées à l'étape 1 et adaptées avant leur passage
   sous la transaction de requête.
1 quater. Le middleware ne valide jamais une transaction en erreur
   (`conn.info.transaction_status` vérifié avant le commit) : psycopg2 ne lève rien sur
   un COMMIT d'une transaction en erreur et annule en silence (vérifié le 2026-11-13).
   Les points de reprise manuels (`SAVEPOINT`, `ROLLBACK TO SAVEPOINT` par cur.execute)
   sont interdits dans les repos : ils échapperaient à la règle 1 bis. Les
   `SET LOCAL` de repo sont remplacés par un réglage ciblé remis à sa valeur après usage.
1 quinquies. Décisions de l'utilisateur sur les échecs partiels (2026-11-13, AUDC-14) :
   - /auth/login, /auth/refresh, /auth/logout restent hors transaction de requête et
     hors audit_log (leur trace est security_log) : exception déclarée et testée ;
   - génération préventive : tout ou rien ; les cas prévisibles (occurrence déjà
     générée, conflit de code, plan sans machine) sont vérifiés avant d'écrire et
     rapportés sans erreur ; une erreur SQL annule toute la génération ;
   - import CSV et répartition des demandes d'achat : valider toutes les lignes avant
     d'écrire ; import tout ou rien avec le rapport d'erreurs ; répartition des seules
     demandes répartissables, les autres signalées sans écriture ;
   - fermeture d'une intervention : tout ou rien avec sa cascade (demande, occurrence) ;
     /repair et force-close-request restent pour les données anciennes.
1 ter. Aucune écriture en base dans une tâche de fond (BackgroundTasks) ni dans une
   réponse en flux : elles s'exécutent après la validation, hors transaction et hors
   audit. Usages actuels conformes (courriels en lecture, exports) ; un test le vérifie.
   Les tâches de fond démarrent après la validation, sans hériter de la connexion de la
   requête. Écritures hors requête assumées : date de dernier usage des clés d'API,
   catalogue des endpoints au démarrage.
2. Le middleware s'exécute après l'authentification et le contrôle des droits.
3. Chaque route qui modifie déclare ce qu'elle audite : entité, source de l'identifiant
   (paramètre de chemin, ou identifiant créé déposé par la route). Un test parcourt
   toutes les routes POST, PUT, PATCH et DELETE et échoue si l'une n'est ni déclarée ni
   inscrite dans la liste des exceptions en cours de traitement, qui doit se vider.
4. Le middleware est le seul à écrire dans audit_log. Quand une requête touche d'autres
   entités que l'entité déclarée (acceptation d'une demande, action qui ferme des tâches,
   génération préventive), le repo dépose un événement d'audit (entité, id, type de
   décision, avant, après) dans la requête ; le middleware valide le motif et écrit
   chaque événement dans la même transaction. Les repos n'appellent plus
   fn_audit_log_decision ; `POST /audit/log` reste la seule écriture explicite.
5. Créations : une ligne `created` avec l'identifiant créé ; une création déclarée qui
   ne dépose pas son identifiant fait annuler la requête. Suppressions : un motif
   explicite est toujours exigé, même si la règle de l'entité est routinière (supprimer
   est une décision hors travail normal, CLAUDE.md section 2.4) ; ligne `deleted` avec
   l'état avant.
   POST de sous-ressource : seuls les champs réellement modifiés sont tracés, état avant
   lu comme pour PATCH. Plus aucune réécriture du corps de requête : le motif injecté
   passe par l'état de la requête.
6. Mutations du système : les événements portent `is_system` et un motif de catégorie
   system ; l'auteur est l'utilisateur qui a déclenché la requête quand il existe.
7. Les historiques de statut (intervention_status_log, request_status_log) restent des
   données métier ; audit_log est la trace de référence. permission_audit_log et
   security_log ne changent pas.

## Alternatives écartées

- Audit après coup sur une autre connexion (fonctionnement actuel) : une trace peut
  manquer ; refusé par l'utilisateur.
- Audit par les repos dans leur transaction (ADR 0017 point 3) : écritures dispersées,
  motifs codés en dur, oublis possibles route par route.
- Triggers en base sur chaque table : pas d'accès au motif ni à l'auteur du jeton sans
  variables de session ; logique d'audit cachée dans le schéma.
- Passer une connexion explicite à chaque repo : plus explicite, mais touche la
  signature de tous les repos (325 usages de curseur) et des routes ; repli si la chaîne
  réelle des middlewares contredit la preuve.
- Isoler le repo fautif par un SAVEPOINT et valider le reste (prouvé possible par
  docs/spikes/0002) : garde les échecs partiels actuels, mais une réponse « OK » peut
  cacher une écriture annulée ; écarté par l'utilisateur.
- Deviner l'entité depuis l'URL (actuel) : impossible pour les créations et les
  sous-ressources, et ne détecte pas les routes oubliées.

## Conséquences

- Les tests qui attendent les decision_type écrits par les repos (status_transitioned,
  updated avec triggered_by_action, closed_by_changed) seront revus au cas par cas.
- Une requête qui modifie garde une connexion jusqu'à la fin de la requête ; les effets
  externes (courriel, notification) d'une route doivent supporter une annulation tardive.
- Les fronts envoient un motif pour les suppressions ; les motifs codés en dur
  disparaissent au profit des règles d'audit.
- Les créations passées restent sans ligne `created` : rien n'est reconstitué.
