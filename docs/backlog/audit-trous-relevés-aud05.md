# Trous d'audit relevés pendant AUD-05 (2026-11-13)

- Création automatique de demande par le préventif (preventive_occurrences/repo.py) :
  aucune ligne d'audit. À tracer avec un motif system et is_system.
- Suppression de tâche : `delete_task` écrit TASK_DELETED (catégorie system) avec
  is_system=False ; le middleware ne valide pas les DELETE. Incohérent avec ADR 0017.
- /intervention-requests/repair : passé à ROUTINE au nom de l'utilisateur, sans test
  d'intégration.
- DELETE de tâche : `reason_text` n'est pas transmis au repo (OTHER refusé en base) et
  aucun test d'intégration ne couvre la suppression (relecture AUD, 2026-11-13).
- intervention_requests/repo.py, `create` : le `except ValidationError: raise` ne fait
  pas de rollback avant de relever (préexistant).
