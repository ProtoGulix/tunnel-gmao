# Audit : créations et suppressions non tracées

AuditMiddleware (api/audits/middleware.py) n'écrit rien quand l'URL ne contient pas
d'id, ce qui est le cas d'un POST de création. Il n'écrit rien non plus pour un DELETE
envoyé sans reason_code, puisqu'un DELETE n'a pas de corps. Cela vaut pour toutes les
entités tracées. Pour les équipements, constaté le 2026-10-10 (ADR 0011) : la création
et la suppression, réservées à RESP et ADMIN, ne laissent pas de trace dans audit_log.
Il faudrait lire l'id dans la réponse d'un POST et injecter la règle routine pour un
DELETE.
