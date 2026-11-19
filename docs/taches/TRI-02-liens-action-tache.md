# TRI-02. Liens action-tâche : clés étrangères et tâche rendue à « à faire »

- Statut : fait
- Agent : backend-dev (sonnet)
- Branche : fix/priorites-backlog, worktree fix/priorites-backlog-integrite
- Dépend de : docs/backlog/integrite-taches-action-supprimee.md
- Périmètre d'écriture : backend/alembic/versions/0017_*.py, backend/db/schema.sql
  uniquement si le dépôt tient le schéma de départ à jour pour les nouvelles tables (sinon
  ne pas y toucher, le dire), backend/api/intervention_actions/repo.py,
  backend/api/intervention_tasks/ si nécessaire, tests backend, CHANGELOG.md (« Non
  publié »), cette fiche. Exclu : fronts, bootstrap.py (tâche TRI-03 en parallèle).

## Contexte

`intervention_action_task` n'a pas de clé étrangère ; supprimer une action laisse le lien
orphelin et la tâche « en cours ». Base de dev mesurée le 2026-11-19 (lecture seule) :
977 liens, 0 orphelin, 0 tâche en cours sans action. Accord de l'utilisateur pour la
migration (2026-11-19).

## Critères d'acceptation

- [x] Migration 0017 réversible : suppression préalable des liens orphelins éventuels (en
      comptant et journalisant le nombre), puis clés étrangères vers intervention_action(id)
      et intervention_task(id) en ON DELETE CASCADE ; downgrade qui retire les contraintes
- [x] Suppression d'une action : chaque tâche liée en `in_progress` qui n'a plus aucune
      action revient à `todo`, dans la même transaction ; une tâche `done` ou `skipped` ne
      change pas ; la tâche encore portée par une autre action ne change pas (tests
      d'intégration)
- [x] Après suppression, la tâche peut être supprimée (le lien ne la bloque plus) (test)
- [x] Audit : le changement de statut de la tâche est-il un événement d'audit ailleurs dans
      le code ? Si oui, le tracer de la même façon ; le dire dans le compte rendu
- [x] scripts/check.sh et scripts/test-integration.sh verts
- [x] CHANGELOG (« Non publié ») à jour ; requête de comptage des orphelins en lecture seule
      pour la production fournie dans le compte rendu

## Compte rendu final


Fait : migration 0017_action_task_fk (purge des orphelins journalisée, deux FK ON DELETE CASCADE,
idempotente, downgrade). `delete` de intervention_actions/repo.py : tâches `in_progress` liées
relevées (verrou), action supprimée, puis retour à `todo` si plus aucun lien, même transaction.
Audit : le changement de statut d'une tâche par une action est déjà un événement
(`_audit_task_from_action`, SYSTEM_CASCADE) ; le retour à `todo` l'utilise. schema.sql non
modifié (dump de départ, les migrations s'appliquent par-dessus). Tests :
tests/integration/test_action_task_fk_integration.py (5) ; test_bootstrap_integration.py mis à
jour pour la nouvelle tête de migration.

Comptage des orphelins en production (lecture seule) :

    SELECT count(*) FROM intervention_action_task iat
    WHERE NOT EXISTS (SELECT 1 FROM intervention_action a WHERE a.id = iat.action_id)
       OR NOT EXISTS (SELECT 1 FROM intervention_task t WHERE t.id = iat.task_id);
