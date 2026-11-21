**TRAITÉ (TRI-02, 2026-11-19) : migration 0017 (clés étrangères en cascade, orphelins purgés) ; une tâche en cours sans action revient à « à faire ».**

# Suppression d'une action : tâches « en cours » et liens orphelins

Relevé au tri du 2026-11-19 (ancien backlog backend, point 14), vérifié par l'agent principal.
Gravité : intégrité des données (priorité 1).

- La table `intervention_action_task` (backend/db/schema.sql:1692) n'a aucune clé étrangère,
  seulement sa clé primaire (schema.sql:2931), ni dans le schéma ni dans les migrations.
- `delete` de backend/api/intervention_actions/repo.py (~l.1004) supprime l'action sans
  toucher aux liens ni aux tâches. Une tâche passée en `in_progress` par l'action
  (repo.py:759-763, 945-949) y reste ; le lien orphelin compte encore comme action
  (intervention_tasks/repo.py:37-41) et bloque la suppression de la tâche (repo.py:437).

Correctif attendu : clés étrangères (ON DELETE CASCADE côté action et tâche) avec
nettoyage préalable des orphelins (migration, accord requis), et règle de retour de la
tâche à `todo` quand plus aucune action ne la porte. Compter d'abord les orphelins en
production (lecture seule).
