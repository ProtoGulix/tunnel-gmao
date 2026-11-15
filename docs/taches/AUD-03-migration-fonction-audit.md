# AUD-03. Migration : fn_audit_log_decision ne masque plus ses erreurs

- Statut : faite (2026-11-13), non jouée sur la base de dev
- Agent : db-dev
- Branche : fix/audit-integrite
- Dépend de : AUD-01, ADR 0017 point 2
- Périmètre d'écriture : `backend/alembic/versions/0006_*.py`, `backend/db/schema.sql`
  (définition de la fonction, pour rester la référence), aucun fichier de test (l'agent principal retire les xfail). Exclus : code de l'API, fronts, données.

## Critères d'acceptation

- [x] migration 0006 : CREATE OR REPLACE de la fonction sans le bloc EXCEPTION WHEN
      OTHERS, corps identique sinon ; downgrade qui restaure l'ancienne version
- [x] les appelants dans une transaction (`_audit_task` avec SAVEPOINT) restent corrects
- [x] test AUD-01 sur la fonction passe sans xfail
- [x] migration jouée sur la base de test isolée ; pas sur la base de dev sans accord
- [x] scripts/check.sh et scripts/test-integration.sh verts

## Compte rendu final

db-dev (2026-11-13) : migration 0006_audit_erreurs_visibles (CREATE OR REPLACE sans le
bloc EXCEPTION WHEN OTHERS ; downgrade restaure l'ancienne définition, copiée dans
FN_AVEC_MASQUAGE) ; schema.sql aligné (installation neuve par 0001). Aucun trigger
n'appelle la fonction. Révélé : les appelants sans SAVEPOINT perdaient la mutation, et la
création de demande échouait à l'audit depuis toujours (aucune des 181 demandes de la
base de dev n'a de ligne « created », vérifié par l'agent principal) : AUD-05.
Retour arrière : `alembic downgrade 0005_affectation_residu` (rôle propriétaire).
Incident : deux agents ont lancé test-integration.sh en même temps (conteneur au nom
fixe) ; erreur d'orchestration de l'agent principal, ensuite un seul agent à la fois.
NON VÉRIFIÉ : downgrade jamais exécuté ; base de production.
