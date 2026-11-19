**TRAITÉ (TRI-03, 2026-11-19) : constat erroné du tri. Le REVOKE UPDATE, DELETE, TRUNCATE existait déjà pour audit_log, permission_audit_log et security_log (APPEND_ONLY_TABLES de bootstrap.py, ADR 0007 point 6) ; la table de version d'alembic y a été ajoutée, avec un test.**

# Tables d'audit modifiables par le rôle de l'application

Réserve de l'étape 3c, toujours vraie au tri du 2026-11-19 (vérifiée par l'agent principal).
Gravité : intégrité (principe 4 : une trace falsifiable ne vaut rien).

backend/scripts/bootstrap.py:118 accorde SELECT, INSERT, UPDATE, DELETE sur toutes les
tables au rôle de l'application, y compris `audit_log`, `permission_audit_log` et la table
de version alembic. Aucun REVOKE dans backend/ ni deploy/. Correctif : REVOKE UPDATE,
DELETE sur ces tables (bootstrap idempotent), vérifier qu'aucun code ne les modifie, test
d'intégration qui échoue sur un UPDATE avec le rôle de l'application.
