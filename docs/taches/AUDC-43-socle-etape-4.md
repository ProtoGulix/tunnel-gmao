# AUDC-43. Socle de l'étape 4 : secrets masqués, clés non uuid, fin de POST /audit/log

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-4
- Dépend de : AUDC-41
- Périmètre d'écriture : `backend/api/audits/` (middleware, entity_ids, exclusions,
  routes, repo, schemas) ; tests (retrait des xfail de la tâche ; tests existants de
  POST /audit/log supprimés, à signaler) ; `docs/api/endpoints/audit-log.md`,
  `docs/api/API_REFERENCE.md` ; CHANGELOG. Exclus : autres domaines, fronts.

## Contexte

Décision 9. Le middleware écrit l'état entier (`SELECT *`) dans old_value/new_value :
les empreintes `password_hash` (tunnel_user) et `key_hash` (api_key) y finiraient, lisibles
par RESP et MCP. Plusieurs entités ont une clé int ou texte alors que audit_log.entity_id
est un uuid (`UUID(...)` lève, 500) : généraliser `api/audits/entity_ids.py` (une fonction
et un espace de noms constant par entité, jamais modifiés), sur le modèle des familles de
stock. POST /audit/log : écriture libre d'une ligne d'audit, sans appelant hors tests,
supprimée (changement d'API accepté par l'utilisateur).

Entités, tables et clés :

| entité | table | clé |
| --- | --- | --- |
| user | tunnel_user | uuid |
| permission | tunnel_permission | uuid |
| endpoint | tunnel_endpoint | uuid |
| ip_block | ip_blocklist | uuid |
| email_domain_rule | email_domain_rule | uuid |
| api_key | api_key | uuid |
| equipement_class | equipement_class | uuid |
| service | service | uuid |
| role_home_view | role_home_view | uuid propre ; le chemin porte role_id |
| action_category | action_category | int |
| action_subcategory | action_subcategory | int |
| intervention_type | intervention_type | int |
| intervention_status | intervention_status_ref | texte (code) |
| audit_reason | audit_reason_code | int |
| audit_rule | audit_rule | bigint |

## Critères d'acceptation

- [x] colonnes sensibles masquées (valeur remplacée, pas retirée : le diff
      `password_hash_changed` reste visible) dans created, deleted et les diffs ; liste
      explicite dans le middleware, test unitaire
- [x] `_TABLE_MAP` complété pour les entités uuid
- [x] `entity_ids.py` : identifiants uuid5 des entités int/texte, testés (stabilité,
      espaces de noms distincts) ; le mécanisme pour une route déclarée dont la clé n'est
      pas un uuid est documenté (événement déposé par le repo, comme les familles)
- [x] POST /audit/log supprimée (route, schéma et fonction de repo devenus inutiles,
      tests, doc) ; GET /audit/logs inchangé
- [x] exclusions de la décision 9 écrites avec leur raison : notifications (2),
      changelog-seen, mail/test (NO_WRITE), endpoints/sync, 4 routes cassées (renvoi à
      docs/backlog/routes-referentiel-cassees.md)
- [x] tests AUDC-43 d'AUDC-41 verts sans xfail ; check.sh et test-integration.sh verts ;
      CHANGELOG

## Compte rendu final

Fait : `entity_ids.py` (ENTITY_NAMESPACES, entity_id_for ; le mécanisme documenté : le repo
dépose un événement sous cet identifiant, la clé d'origine dans old/new_value), middleware
(`_TABLE_MAP` complété, SENSITIVE_COLUMNS, mask_sensitive appliqué au point unique d'écriture
`_write_audit_log` : created, deleted, diffs calculés sur les vraies valeurs puis masqués,
événements des repos), exclusions de la décision 9 motivées, POST /audit/log supprimée (route,
schéma ; `call_fn_audit_log_decision` reste utilisé par le middleware). Tests existants changés :
test_audit_log_route.py supprimé ; test_rbac_integration.py (2 tests POST /audit/log et
`_log_body` retirés) ; test_default_permissions.py (cas ambigu POST /audit/log retiré) ;
décomptes 257 -> 256 endpoints, ADMIN 257 -> 256, RESP 221 -> 220 (test_default_permissions_integration,
test_bootstrap_integration). Aucun test marqué AUDC-43 dans l'intégration (secrets : AUDC-45).
Résultats : check.sh vert (301 passés, 37 xfail AUDC-44/45) ; test-integration.sh 295 passés,
23 xfail. Première exécution d'intégration : 2 échecs, les décomptes ci-dessus, corrigés.
