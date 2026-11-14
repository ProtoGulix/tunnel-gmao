# AUDC-41. Tests qui échouent de l'étape 4

- Statut : faite (2026-11-14)
- Agent : test-writer
- Branche : refactor/audit-etape-4
- Dépend de : décision 9 de AUDC-plan.md
- Périmètre d'écriture : `backend/tests/` seulement (nouveaux fichiers ; ne pas modifier
  un test existant sans le signaler). Aucun code de production.

## Contexte

Étape 4 du chantier AUDC (ADR 0018) : 36 routes à déclarer, 12 exclues, POST /audit/log
supprimée (décision 9). Mécanismes et modèles de tests : tests d'AUDC-31
(`tests/integration/test_audc31_etape3_integration.py`, `tests/test_audit_etape3.py`),
fixtures `tests/integration/conftest.py` (instance, client, admin, make_user, grant),
`tests/integration/etape2_helpers.py` (lignes_audit). Entités et clés : tableau de
AUDC-43. Tout est routinier sauf DELETE (motif explicite, 400 sans motif).

## Critères d'acceptation

Tests marqués `xfail(strict=True)` tant que la tâche qui les fait passer n'est pas faite
(raison : « AUDC-4x »), verts sinon :

- [x] couverture : `tests/test_audit_coverage.py` ou équivalent vérifie qu'aucune route ne
      reste « à traiter étape 4 » et que les 12 exclusions de la décision 9 portent une
      raison (AUDC-43/44/45)
- [x] POST /audit/log n'existe plus (404 ou 405) (AUDC-43)
- [x] secrets : création, réinitialisation de mot de passe, suppression d'un utilisateur,
      changement de son propre mot de passe, création et suppression d'une clé d'API :
      aucune ligne audit_log ne contient `password_hash` ni `key_hash` en clair (valeur
      masquée), la ligne de décision existe (AUDC-43, AUDC-45)
- [x] clé entière ou texte : une modification de type d'intervention, de catégorie
      d'action, de motif d'audit, de règle d'audit et de statut d'intervention écrit sa
      ligne sous l'uuid5 attendu (même clé → même entity_id), la clé d'origine présente
      dans la valeur (AUDC-43, AUDC-44)
- [x] une route par domaine : ligne d'audit routinière (ROUTINE, auteur = jeton) sans
      motif dans le corps ; DELETE sans motif → 400 et rien supprimé ; DELETE avec motif
      → ligne `deleted` (users, api-keys, ip-blocklist, email-domain-rules,
      equipement-class, home-view, services, permissions, endpoints, users/me) (AUDC-45)
- [x] traces de sécurité conservées : changement de rôle et désactivation écrivent
      toujours security_log, changement de droit toujours permission_audit_log (AUDC-45)
- [x] scripts/check.sh vert (les xfail stricts comptent comme attendus)

## Compte rendu final

Fait : `tests/test_audit_etape4.py` (64 xfail stricts : exclusions de la décision 9,
POST /audit/log absente, masquage `SENSITIVE_COLUMNS`/`mask_sensitive`, identifiants
`entity_id_for`/`ENTITY_NAMESPACES`, déclarations des 36 routes) et
`tests/integration/test_audc41_etape4_integration.py` (23 xfail stricts). API imposée à
l'implémenteur : `api.audits.entity_ids.entity_id_for(entity_type, key)` (uuid5 par entité,
ValueError pour une entité inconnue) ; `api.audits.middleware.SENSITIVE_COLUMNS` et
`mask_sensitive(state)`. Tests existants à changer avec la suppression de POST /audit/log :
test_audit_log_route.py, test_rbac_integration.py (l. 90-97), test_default_permissions.py
(l. 191). Pas de DELETE pour services, permissions et endpoints (la fiche en listait).

Contrôle de l'agent principal : première exécution de test-integration.sh en échec (50 échecs,
23 erreurs, tous en 401 à la connexion). Cause : le test de règle de domaine de courriel,
en échec attendu, laissait sa règle en base ; une seule règle restreint la connexion de tous
les comptes aux domaines listés. Corrigé par des fixtures de nettoyage (règle de domaine, IP
bloquée, vue d'accueil d'ACHETEUR). Ensuite : 297 passés, 23 xfail ; check.sh vert.
