# REJ-01. Motifs de rejet en données de référence

- Statut : faite (2026-11-21)
- Agent : db-dev (sonnet)
- Branche : fix/motif-de-rejet (worktree dédié)
- Dépend de : ADR 0038
- Périmètre d'écriture : backend/alembic/versions/ (une migration), backend/db/seed_reference.sql (mêmes motifs pour une installation neuve), tests de migration, CHANGELOG.md, cette fiche

## Contexte

ADR 0038 point 2. Étudier d'abord comment les motifs sont filtrés pour une transition de
demande (`audit_reason_code.decision_types`, type de décision produit par une transition
vers « rejetee » : lire backend/api/audits/ et intervention_requests/) pour que seuls les
motifs de rejet soient proposés au rejet.

## Critères d'acceptation

- [x] migration idempotente (rejouable, sans doublon) qui ajoute les quatre motifs de rejet avec le bon type de décision ; « Autre raison » couvre aussi le rejet
- [x] seed aligné pour une installation neuve
- [x] test (intégration) : après installation, les motifs de rejet sont proposés pour un rejet et pas pour une acceptation
- [x] test-integration.sh vert ; jamais joué sur la base de dev sans accord

## Compte rendu final

Migration 0024_motifs_rejet_demande : REJECT_OUT_OF_SCOPE, REJECT_DUPLICATE,
REJECT_ALREADY_HANDLED, REJECT_INCOMPLETE (user, entité request, décision request_rejected) ;
OTHER reçoit request_rejected. Seed aligné. Test : test_motifs_rejet_demande_integration.py.

Constat : une transition de demande n'a pas de type de décision propre (le middleware trace
« updated » pour toute transition, acceptation comme rejet). Le type `request_rejected` est
donc posé en données ; REJ-02 doit le produire côté backend (validation du motif sur ce type,
comme `intervention_reopened`).
