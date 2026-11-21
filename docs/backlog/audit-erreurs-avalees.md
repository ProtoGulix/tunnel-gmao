**TRAITÉ (constaté le 2026-11-19, SEC-01) : déjà corrigé par la migration 0006_audit_erreurs_visibles (ADR 0017, point 2) : fn_audit_log_decision laisse remonter ses erreurs.**

# fn_audit_log_decision avale ses erreurs

Constaté le 2026-11-13 (CLO-03), vérifié par l'agent principal dans backend/db/schema.sql :
la fonction lève des exceptions (motif inconnu ou inactif, OTHER sans texte, changed_by
absent, motif non système pour une mutation système) mais son bloc
`EXCEPTION WHEN OTHERS THEN RAISE WARNING` les transforme en simple avertissement. La
mutation métier passe alors sans aucune trace d'audit, pour toutes les entités.
Contraire au principe 4 (traçabilité fiable). Les tâches sont protégées dans la route
depuis CLO-03 ; les autres entités non. Correctif : migration de la fonction (accord de
l'utilisateur requis), avec tests d'intégration par entité. Priorité haute : à reporter
aussi dans le bilan de sécurité interne.
