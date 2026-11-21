# TRI-03. Tables d'audit en ajout seul pour le rôle de l'application

- Statut : fait
- Agent : db-dev (sonnet)
- Branche : fix/priorites-backlog, worktree fix/priorites-backlog-audit
- Dépend de : docs/backlog/audit-tables-modifiables.md
- Périmètre d'écriture : backend/scripts/bootstrap.py, tests backend (intégration),
  CHANGELOG.md (« Non publié »), cette fiche. Exclu : migrations alembic (TRI-02 en
  parallèle), api/.

## Contexte

backend/scripts/bootstrap.py:118 accorde SELECT, INSERT, UPDATE, DELETE sur toutes les tables
au rôle de l'application, audit compris. Aucun code ne modifie ni ne supprime de ligne
d'audit (grep du 2026-11-19 dans api, schéma et migrations). Accord de l'utilisateur pour
changer les droits du rôle (2026-11-19).

## Critères d'acceptation

- [x] Après les GRANT, REVOKE UPDATE, DELETE, TRUNCATE sur audit_log, permission_audit_log et
      la table de version d'alembic pour le rôle de l'application ; idempotent (rejoué à
      chaque démarrage) ; les futures tables restent couvertes par les droits par défaut
      existants, les trois tables gardent leur restriction
- [x] Le rôle propriétaire (migrations) garde tous ses droits ; les fonctions SECURITY
      DEFINER éventuelles qui écrivent l'audit fonctionnent encore (vérifier)
- [x] Test d'intégration : avec le rôle de l'application, UPDATE et DELETE sur audit_log
      échouent, INSERT (via fn_audit_log_decision) réussit
- [x] scripts/check.sh et scripts/test-integration.sh verts
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Constat : le REVOKE UPDATE, DELETE, TRUNCATE existait déjà dans bootstrap.py (ADR 0007
point 6) pour audit_log, permission_audit_log et security_log ; le backlog était périmé
sur ce point. Seule la table de version alembic (alembic_version_backend) manquait :
ajoutée à APPEND_ONLY_TABLES. Les migrations tournent avant le bootstrap des droits, la
table existe donc. fn_audit_log_decision et les triggers d'audit ne sont pas SECURITY
DEFINER (droits de l'appelant) : l'INSERT passe, vérifié par le test. Aucun test existant
n'écrit en UPDATE/DELETE sur ces tables avec le rôle de l'application.
Test : backend/tests/integration/test_journaux_ajout_seul_integration.py.
Effet en production : au prochain démarrage, le rôle de l'application perd UPDATE, DELETE et
TRUNCATE sur alembic_version_backend (aucune donnée modifiée).
