# Volet Tâches de l'accueil : composants de tâche partagés

Le volet Tâches de l'accueil (web/src/components/home/TasksPane.jsx) garde ses propres copies des cellules d'affectation et d'échéance, qui avalent encore les erreurs. Les remplacer par TaskAssignCell, TaskDueDateCell et TaskStatusBadge de web/src/components/tasks/ (ADR 0015).
