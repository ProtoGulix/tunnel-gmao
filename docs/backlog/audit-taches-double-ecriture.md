# Audit des tâches écrit deux fois

Constaté le 2026-11-13 (CLO-01) : un PATCH de tâche écrit une ligne d'audit par champ
modifié depuis le repo (`_audit_task`, backend/api/intervention_tasks/repo.py) et d'autres
depuis AuditMiddleware. En ROUTINE, une clôture produit trois lignes. Depuis CLO-01 le
repo transmet le reason_text, mais la double écriture reste : choisir une seule source
(middleware ou repo) pour les tâches, avec un test sur le nombre de lignes.
