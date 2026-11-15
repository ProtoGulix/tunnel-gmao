# AUDC-45. Utilisateurs, droits, clés d'API, sécurité, classes, services, accueil

- Statut : faite sous réserve d'un test à corriger (voir compte rendu)
- Agent : backend-dev
- Branche : refactor/audit-etape-4
- Dépend de : AUDC-41 à AUDC-44
- Périmètre d'écriture : `backend/api/` des domaines admin (utilisateurs, permissions,
  endpoints, ip-blocklist, email-domain-rules), api_keys, equipement_class, services,
  home_view, users ; `backend/api/audits/exclusions.py` ; tests (retrait des xfail) ;
  docs/api/endpoints concernés ; CHANGELOG. Exclus : auth, notifications, changelog,
  fronts.

## Contexte

Routes : /admin/users (POST, PUT, DELETE, role, active, reset-password),
PATCH /admin/permissions/{id}, PATCH /admin/endpoints/{id}, /admin/ip-blocklist (POST,
DELETE), /admin/email-domain-rules (POST, DELETE), /api-keys (POST, PATCH, DELETE),
/equipement-class (POST, PATCH, DELETE), /home-view/admin/assignments/{role_id} (PUT,
DELETE), /services (POST, PATCH), /users/me/password, /users/me/profile. Routinier sauf
DELETE. Points relevés : security_log et permission_audit_log conservés ;
POST ip-blocklist et email-domain-rules sont des upserts (ne pas écrire un faux `created`
sur une ligne existante) ; home-view : le chemin porte role_id, pas l'id de la ligne ;
/users/me/* : id = jeton ; rechargement du cache des droits (admin/repo.py) fait avant la
validation réelle de la transaction : à placer après, ou à justifier. Secrets masqués par
AUDC-43 ; ne jamais écrire le mot de passe provisoire ni le secret d'une clé.

## Critères d'acceptation

- [ ] routes déclarées, exclusions retirées, inventaire régénéré : plus aucune route
      « à traiter » dans l'inventaire
- [ ] DELETE : 400 sans motif, ligne `deleted` avec motif ; le reste routinier
- [ ] upserts tracés selon ce qui s'est réellement passé (création ou modification)
- [ ] aucun rollback() avalé, aucun SAVEPOINT
- [ ] tests AUDC-45 verts sans xfail ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : 24 routes déclarées `audit(...)` (exclusions `_todo(4)` retirées, inventaire régénéré :
plus aucune route « à traiter »). Uuid classiques : `id_from_path` / `id_from_created`
(`declare_created_id` pour les créations d'utilisateur, clé d'API, classe, service). `events_only`
avec événements du repo : upserts IP bloquée et règle de domaine (`created` si ligne absente,
sinon `{champ}_changed` ; répétition identique = aucune trace), vue d'accueil (trace sous l'id de
la ligne `role_home_view` ; suppression d'une ligne absente = aucune trace), `/users/me/profile`
et `/users/me/password` (id du jeton ; `password_hash_changed` masqué). Nouveau
`record_column_changes` (api/audits/events.py), format `{champ}` seul comme les diffs du
middleware. security_log et permission_audit_log conservés. Cache des droits : plus rechargé dans
le repo ; la route le recharge par `BackgroundTasks` après la validation de la transaction (avant,
la lecture se faisait sur la connexion de requête non validée : un échec d'audit aurait laissé un
droit annulé dans le cache). Fenêtre de quelques ms entre la réponse et le rechargement, couverte
par le TTL. Aucun rollback avalé, aucun SAVEPOINT. Frontends non touchés (AUDC-46).
Test existant changé : `test_rbac_integration.py::_ecritures`, le DELETE d'utilisateur envoie un
`reason_code` (motif désormais obligatoire, voulu par la décision 9).
Résultats : check.sh vert (340 passés) ; test-integration.sh 317 passés, 1 échec :
`test_vue_d_accueil_tracee_sous_l_id_de_la_ligne_pas_celui_du_role`. Ce test est faux : le
bootstrap donne déjà `acheteur` à ACHETEUR, donc son premier PUT `{"home_view": "acheteur"}` ne
change rien et ne laisse (à raison) aucune trace, alors que le test exige `created` ou
`home_view_changed`. Non modifié. Vérifié par une copie temporaire (supprimée) dont le premier PUT
vaut `direction_technique` : elle passe. Correction proposée : changer cette valeur du premier PUT.
Pas de doc d'endpoints pour home-view (aucun fichier existant).

Contrôle de l'agent principal (2026-11-14) : test de la vue d'accueil corrigé (le bootstrap
donne déjà « acheteur » à ACHETEUR : premier PUT sur « direction_technique »). Seul test
existant modifié par l'agent : test_rbac_integration (le DELETE d'utilisateur envoie un
motif, conforme à la décision 9). Cache des droits rechargé par BackgroundTasks, après la
validation de la transaction : accepté. check.sh vert ; test-integration.sh 318 passés,
plus aucun xfail.
