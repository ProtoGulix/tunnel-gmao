# REM-01. Base : motifs de remise à faire (migration 0027)

- Statut : faite (2026-11-22)
- Agent : db-dev (sonnet)
- Branche : feat/motif-remise-a-faire-rem01 (worktree depuis feat/motif-remise-a-faire)
- Dépend de : ADR 0042
- Périmètre d'écriture : backend/alembic/versions/0027_*.py (nouveau), backend/db/seed_reference.sql
  (bloc miroir), backend/tests/ (test de migration, mise à jour des tests qui comptent les motifs
  de tâche ou la révision attendue, sans affaiblir d'assertion), CHANGELOG.md.
  Exclus : backend/api, fronts. Aucune écriture sur la base de dev.

## Contexte

ADR 0042. Modèles : migrations 0021_motifs_reouverture.py et 0024_motifs_rejet_demande.py
(idempotence, ajout de la décision à OTHER par array_append gardé, recalage de séquence,
downgrade qui garde un motif déjà référencé), test test_motifs_reouverture_migration_integration.py.
Dernière migration : 0026_archivage_irrevocable.

## Contrat commun (REM-01 à REM-03)

- Décision : `task_reopened`. Motifs : `TASK_CLOSED_BY_MISTAKE` « Clôturée par erreur »,
  `TASK_REWORK` « Travail à reprendre » (catégorie user, entité task, decision_types
  {task_reopened}) ; `OTHER` reçoit aussi `task_reopened` dans ses decision_types.
- API : `PATCH /intervention-tasks/{id}` avec `status: "todo"` sur une tâche `done` ou `skipped`
  sans motif valide : 400 au format du mécanisme d'audit (`AuditReasonRequiredError`, liste des
  motifs filtrée sur `task_reopened`), comme la clôture directe (`ensure_explicit_close_reason`).
  Avec motif : 200, `closed_by` remis à NULL, une ligne d'audit de décision `task_reopened`
  portant le motif (et non `status_changed`).
- Journal web : libellé « Tâche remise à faire ».
- Textes sobres (CLAUDE.md 8.7).

## Critères d'acceptation

- [x] migration 0027 idempotente, upgrade et downgrade ; seed_reference.sql aligné (base neuve = base migrée)
- [x] test d'intégration de la migration (état attendu, rejouer sans effet, retour arrière puis remontée)
- [x] scripts/check.sh et scripts/test-integration.sh verts
- [x] CHANGELOG (« Non publié ») : migration 0027 à jouer en production

## Compte rendu final

Fait : migration 0027_motifs_remise_a_faire (deux motifs TASK_CLOSED_BY_MISTAKE et TASK_REWORK,
décision task_reopened ajoutée à OTHER, idempotente, séquence recalée) ; bloc miroir dans
seed_reference.sql ; test d'intégration de la migration (état, rejeu, retour arrière puis
remontée) ; révision attendue du test de bootstrap mise à jour ; liste des décisions de OTHER
étendue dans test_audc30 (ajout de task_reopened, aucune assertion retirée).

Effet sur les données : au plus deux lignes ajoutées dans audit_reason_code, OTHER reçoit une
décision. Aucune donnée utilisateur modifiée. Retour arrière : alembic downgrade 0026 retire la
décision de OTHER et supprime les motifs non référencés par audit_log.

Non vérifié : la migration n'a pas été jouée sur la base de dev (interdit), seulement sur la
base jetable des tests d'intégration.
