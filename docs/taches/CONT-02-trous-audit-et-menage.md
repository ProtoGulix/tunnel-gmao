# CONT-02. Trous d'audit restants et ménage

- Statut : terminée
- Agent : backend-dev (sonnet)
- Branche : feat/contraintes-et-audit, worktree feat/contraintes-et-audit-cont02
- Dépend de : état des lieux du 2026-11-19 (fiches audit-* du backlog)
- Périmètre d'écriture : backend/api/supplier_orders/ (export courriel), backend/api/audits/
  (exclusions, si la correction l'exige), backend/api/intervention_requests/repo.py (branche
  morte), tests backend, web/src/components/preventive/GammeProgressBlock.jsx (suppression),
  CHANGELOG.md, cette fiche. Exclu : migrations (CONT-01 en parallèle), occurrences
  préventives (CONT-03).

## Contexte

État des lieux du 2026-11-19 : créations et suppressions désormais tracées partout ; restent
l'export courriel d'une commande (POST /supplier-orders/{id}/export/email), classé NO_WRITE
dans api/audits/exclusions.py mais qui passerait par le chemin non déclaré du middleware et
écrirait probablement une ligne d'audit par colonne à chaque export (NON VÉRIFIÉ), et
/intervention-requests/repair sans test des lignes écrites.

## Critères d'acceptation

- [x] Export courriel : test d'intégration qui montre ce qui est écrit dans audit_log ; si
      des lignes parasites apparaissent, correction (une route qui ne modifie rien n'écrit
      rien, ou un seul événement explicite si l'envoi doit être tracé : le dire et le
      justifier), test vert
- [x] /intervention-requests/repair : test d'intégration des lignes écrites (événement
      système par DI réparée, motif, auteur)
- [x] Branche morte `except ValidationError: raise` de intervention_requests/repo.py (~l.618)
      retirée ; GammeProgressBlock.jsx supprimé (aucun import)
- [x] scripts/check.sh et scripts/test-integration.sh verts, build web vert
- [x] CHANGELOG à jour ; fiches du backlog audit-* mises à jour (points traités marqués)

## Compte rendu final


Constat avant correction : la route ne distribue aucun courriel (elle compose sujet, corps et
lien mailto depuis des SELECT), mais, classée NO_WRITE donc non déclarée, elle passait par le
chemin historique du middleware : règle routinière injectée (ROUTINE) puis une ligne d'audit
par colonne non nulle de la commande, soit 4 lignes parasites à chaque export :
`order_number_changed`, `status_changed`, `supplier_id_changed`, `total_amount_changed`
(vérifié par test_cont02_export_courriel_integration.py avant le correctif).

Correction : le middleware (`_is_unaudited`, api/audits/middleware.py) ignore les routes non
déclarées listées NO_WRITE ou EXCLUDED dans exclusions.py : ni motif demandé, ni ligne
déduite de l'URL. Aucun événement d'audit pour l'export : il ne modifie rien. Réponse inchangée.

Tests ajoutés : test_cont02_export_courriel_integration.py (avec et sans motif, aucune ligne),
test_cont02_repair_integration.py (événement système SYSTEM_CASCADE, is_system, auteur =
jeton ; idempotence sans écriture). Branche morte retirée de intervention_requests/repo.py,
GammeProgressBlock.jsx supprimé, CHANGELOG et fiches audit-* du backlog mis à jour (le
préventif et skip restent ouverts : CONT-03).
