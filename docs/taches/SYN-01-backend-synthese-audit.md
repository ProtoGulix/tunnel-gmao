# SYN-01. Route de synthèse de l'audit et du partage des tâches

- Statut : fait
- Agent : backend-dev
- Branche : feat/synthese-audit (worktree ../wt-syn-01)
- Dépend de : ADR 0032
- Périmètre d'écriture : backend/api/stats/ (nouveau repo dédié, routes, schémas),
  backend/tests/, docs/api/endpoints/ (stats), CHANGELOG.md, cette fiche. Exclu : alembic,
  schema.sql, fronts, autres domaines.

## Contexte

Modèle : `GET /stats/organisation` (backend/api/stats/organisation_repo.py, routes.py,
schémas, tests, droit ouvert par défaut aux rôles qui lisent ; voir comment ce droit est
créé par le bootstrap). Tables : intervention_task (assigned_to, created_by, closed_by,
status, created_at), intervention_action (tech, created_at), intervention_action_task,
audit_log (reason_code_id, decision_type, is_system, logged_at), audit_reason_code
(category). Comptes de vérification (base de dev, 3 mois, 2026-11-20) : 143 tâches, 6 sans
garant, 110 faites dont 26 sans action du garant, 70 repérées sur le terrain.

## Critères d'acceptation

- [x] `GET /stats/audit-synthese?months=N` (défaut 3, borné comme organisation) : par mois,
      les indicateurs de l'ADR 0032 point 4 ; aucun identifiant, nom ni initiale dans la
      réponse (test qui le vérifie sur la réponse brute).
- [x] Droit `stats:get_audit_synthese` ouvert par défaut comme `stats:get_organisation`
      (comptes de la matrice mis à jour si besoin, justifiés).
- [x] Champ qui signale les mois antérieurs au 2026-11-20 (données incomplètes, ADR 0032
      point 5).
- [x] Tests d'intégration sur un jeu de données construit : chaque indicateur avec une
      valeur attendue exacte ; tâche partagée, faite sans le garant, repérée sur le terrain,
      sans garant ; décision user/manual comptée, événement système compté à part.
- [x] SQL paramétré, une seule requête par indicateur, pas de N+1.
- [x] Docs de l'endpoint ; scripts/check.sh vert ; test-integration.sh complet vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Fait : `GET /stats/audit-synthese?months=N` (défaut 3, 1 à 120 sinon 400), dépôt dédié
`backend/api/stats/audit_synthese_repo.py` (3 requêtes paramétrées : tâches, événements,
décisions ; lecture seule), schémas, route, droit `stats:get_audit_synthese`. Droit ouvert
par la règle générale des lectures (catalogue construit depuis les routes) ; les deux
comptes figés de la matrice passent de +1 par rôle (test_default_permissions_integration,
test_bootstrap_integration), justifiés par ce seul droit. Définitions dans docs/api/endpoints/stats.md.

Choix de définition : indicateurs de tâches rattachés au mois de création de la tâche ;
« faites » = statut done ; indicateurs sur garant/exécutants calculés sur les tâches done
avec garant (`tasks_done_with_guarantor`) ; mois « incomplet » si son premier jour précède
2026-11-20 (novembre 2026 inclus) ; « 3 mois » = 3 mois calendaires
(comme Organisation) ; les comptes de la fiche étaient glissants (même résultat sur 08-21).
Le motif LEGACY_STATUS_CHANGE (journaux migrés, inactif depuis la migration 0013, dernier
événement le 2026-11-12) est exclu de `decisions` et `decisions_total` par son code ; ses
événements restent dans `audit_events`.

Tests : 6 unitaires (`test_stats_audit_synthese.py`), 8 d'intégration
(`test_stats_audit_synthese_integration.py`, jeu 2035 nettoyé après chaque test).
