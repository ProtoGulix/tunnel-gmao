# PREV-03. Migration : motif d'audit SYSTEM_SCHEDULE

- Statut : faite (2026-11-18)
- Agent : db-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev03
- Dépend de : ADR 0023 (point 4)
- Périmètre d'écriture : backend/alembic/versions/ (nouvelle migration 0015),
  backend/db/seed_reference.sql, backend/tests/, CHANGELOG.md (« Non publié »). Exclu :
  code de l'API, schéma des tables.

## Contexte

Les créations de la tâche planifiée sont des mutations du système sans utilisateur.
`SYSTEM_CASCADE` (migration 0007) décrit la conséquence d'une décision d'utilisateur.
Accord de l'utilisateur pour un motif dédié, ajouté par migration de données :
2026-11-18.

## Critères d'acceptation

- [x] Migration 0015 sur le modèle de 0007 : `SYSTEM_SCHEDULE`, libellé « Génération
      planifiée du système », catégorie `system`, toutes entités et décisions,
      idempotente (`ON CONFLICT (code) DO NOTHING`), `downgrade` qui le retire
- [x] Même ligne dans seed_reference.sql (installation neuve)
- [x] Test : le motif existe après migration, `fn_audit_log_decision` accepte un
      événement `is_system` sans auteur avec ce motif (test-integration.sh)
- [x] Migration NON jouée sur la base de dev sans nouvel accord de l'utilisateur
- [x] scripts/check.sh et test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Migration 0015_motif_system_schedule (down_revision 0014_dates_signalement), ligne ajoutee
dans seed_reference.sql, test backend/tests/integration/test_motif_system_schedule_integration.py
(collecte verifiee, non execute), CHANGELOG. Effet : une ligne ajoutee dans
audit_reason_code. Retour arriere : downgrade retire la ligne si aucun audit_log ne la
reference. Non joue sur la base de dev. NON VERIFIE : execution du test d'integration.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre ; après fusion
dans feat/preventif-automatise, test-integration.sh a révélé un attendu oublié
(`test_schema_roles_and_status_codes` attendait la révision 0014) : attendu passé à 0015
par l'agent principal, puis check.sh vert et test-integration.sh vert (368 passed).
Commande en échec de l'agent : collecte pytest avec un mauvais chemin de .venv, corrigée.
