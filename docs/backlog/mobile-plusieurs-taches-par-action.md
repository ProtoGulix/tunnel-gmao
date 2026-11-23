# Mobile : plusieurs tâches par action

Constat de l'utilisateur du 2026-11-22 (essai du chantier CST) : sur le mobile, une action ne
se lie qu'à une seule tâche, et ne peut donc en terminer qu'une. En réalité, une action
termine souvent plusieurs tâches.

- L'API l'accepte déjà : `tasks` de POST /intervention-actions est une liste
  (`{task_id, close_task}` par tâche).
- Le web le fait déjà (ActionForm/useActionSubmit.js, `selectedTasks`).
- Le mobile envoie une seule tâche (mobile/src/components/actions/ActionForm.jsx, `selectedTaskId`,
  case « Cette action termine la tâche »).

À faire : sélection multiple sur le mobile, avec pour chaque tâche cochée le choix de la
terminer ou non, comme le web.
