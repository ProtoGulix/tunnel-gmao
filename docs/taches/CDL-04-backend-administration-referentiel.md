# CDL-04. Backend : administration du référentiel des constats

- Statut : faite 2026-11-26
- Agent : backend-dev (sonnet)
- Branche : feat/constat-demande-selon-levier-cdl04 (worktree depuis feat/constat-demande-selon-levier, après CDL-01)
- Dépend de : ADR 0045 point 5, CDL-01
- Périmètre d'écriture : backend/api/admin/ (routes.py, schemas.py, un repo dédié au référentiel des constats), leurs tests, comptes de la matrice dans backend/tests/integration/test_default_permissions_integration.py et test_bootstrap_integration.py si ces tests comptent les routes, docs/api/endpoints/admin.md. Rien dans backend/api/constats/ (CDL-02 en parallèle).

## Contexte

Modèle : routes `/admin/intervention-types` (backend/api/admin/routes.py, `_resp_admin`,
`audit("intervention_type", events_only=True)`, referentiel_repo.py). Les entités
`constat_question` et `constat_choice` ont déjà leur règle d'audit ROUTINE (migration 0028).
Les droits naissent du catalogue au démarrage (ADR 0007) : pas de migration.

## Travail

1. `GET /admin/constat-questions` : questions dans l'ordre, avec parent, et tous leurs choix (actifs et inactifs) : code, libellé, ordre, actif, type préconisé, `creates_request`, `is_exclusive`.
2. `PATCH /admin/constat-questions/{id}` : libellé seul.
3. `POST /admin/constat-choices` : question, code, libellé, type préconisé facultatif, `creates_request`, `is_exclusive` ; ordre = dernier de la question. Code : `^[A-Z][A-Z0-9_]{1,49}$`, unique sur toute la table, figé ensuite.
4. `PATCH /admin/constat-choices/{id}` : libellé, ordre, actif, type préconisé (null pour l'effacer : distinguer absent et null), `creates_request`, `is_exclusive`.
5. Règles (validators) : libellé non vide (strip_html) ; type préconisé = type d'intervention existant et actif ; une question garde au moins un choix actif ; aucune suppression.
6. RESP et ADMIN seulement, changements audités comme les types d'intervention.

## Critères d'acceptation

- [x] tests de droits : RESP et ADMIN passent, TECH, ACHETEUR et MCP refusés sur chaque route en écriture
- [x] tests : code invalide ou en double refusé ; type inconnu refusé ; dernier choix actif non désactivable ; null efface le type
- [x] test d'intégration : ajout puis modification d'un choix, événement d'audit écrit
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert

## Compte rendu final

Fait : 4 routes sous `/admin` (RESP, ADMIN ; TECH, ACHETEUR, clé MCP refusés), audit
`constat_question` / `constat_choice`. Contrat dans docs/api/endpoints/admin.md : GET questions
(+ `choices[]` complets), PATCH question `{label}`, POST choix (201 `{id, message}`), PATCH choix
(champ absent inchangé, `suggested_type_inter: null` efface). Erreurs : 422 code invalide, 400
code en double / libellé vide / type inconnu ou inactif / dernier choix actif / corps vide, 404
inconnu.

Fichiers hors périmètre : `backend/db/default_permissions.py` (deux préfixes RESP, ajoutés par
l'agent principal avec l'accord de l'utilisateur) ; `backend/api/audits/entity_ids.py` (deux
espaces de noms uuid5, sans eux l'audit d'une clé entière lève ValueError) et
`backend/tests/test_audit_etape4.py` (liste des entités et routes déclarées), par l'agent.

Tests : `test_cdl04_referentiel_constats_integration.py`.
