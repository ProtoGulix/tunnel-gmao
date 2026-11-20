# Audit : créations et suppressions non tracées

TRAITÉ (état des lieux du 2026-11-19, CONT-02). Le constat d'origine (2026-10-10, ADR 0011) :
le middleware n'écrivait rien pour un POST de création (pas d'id dans l'URL) ni pour un
DELETE sans corps.

Preuve : depuis l'ADR 0018, les routes déclarées écrivent `created` (id déposé par
`declare_created_id`) et `deleted` (motif explicite obligatoire). Tests d'intégration :
`test_audc25_achats_integration.py` (demande d'achat, commande, équipement : créé, modifié,
supprimé sans doublon), `test_audc22*`, `test_audc23*`, `test_audc31*`, `test_audc34*`,
`test_audc41*`. `tests/test_audit_coverage.py` échoue si une route qui modifie n'est ni
déclarée ni listée.
