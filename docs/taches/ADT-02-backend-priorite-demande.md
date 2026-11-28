# ADT-02. API : urgence d'une demande

- Statut : fait
- Agent : backend-dev
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADT-01, ADR 0047 points 2 et 3
- Périmètre d'écriture : backend/api/intervention_requests/, backend/api/auth/default_permissions.py (nouvelle route seulement), backend/tests/, docs/api/endpoints/ (demandes), CHANGELOG.md, cette fiche. Exclu : migrations, autres domaines, fronts.

## Contexte

La direction trie « À trancher » par urgence. Les quatre codes de priorité des interventions sont réutilisés.

## Critères d'acceptation

- [x] `priorite` facultative à la création (`InterventionRequestIn`), validée par liste blanche (codes PRIORITY_TYPES), exposée dans la liste et le détail
- [x] tri de la liste possible par urgence puis ancienneté (paramètre en liste blanche)
- [x] route d'écriture dédiée au changement d'urgence d'une demande `nouvelle` ou `en_attente` : ADMIN et RESP par défaut, refusée sinon (tests d'autorisation par rôle, MCP refusé), auteur tracé dans audit_log
- [x] demande fermée (acceptée, rejetée, clôturée) : changement refusé (400 métier, pas de 500)
- [x] l'acceptation garde la priorité envoyée ; le front la préremplit (aucune règle cachée côté API)
- [x] demandes du préventif (`is_system`) : comportement inchangé (test)
- [x] erreurs sans message SQL brut ; docs/api/endpoints ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : `priorite` facultative à la création (liste blanche PRIORITY_TYPES, 400 métier), exposée dans la liste et le détail ; `GET /intervention-requests?sort=recent|urgence` (liste blanche `_ORDER_BY`, autre valeur 422) ; `PATCH /intervention-requests/{id}/priority` avec `{priorite}`, demande nouvelle ou en_attente seulement (400 sinon), audit `request` par id du chemin, auteur = jeton. Acceptation et préventif inchangés. default_permissions.py non modifié : la règle par défaut donne déjà ADMIN et RESP (écriture), refus de TECH, ACHETEUR, MCP.
Fichiers : api/intervention_requests/{routes,schemas,validators,repo}.py, tests/test_priorite_demande_validator.py, tests/test_default_permissions.py, tests/integration/test_adt02_priorite_demande_integration.py, tests/integration/test_default_permissions_integration.py (comptes +1 ADMIN et RESP, 279 endpoints), docs/api/endpoints/intervention-requests.md, CHANGELOG.md, cette fiche.
