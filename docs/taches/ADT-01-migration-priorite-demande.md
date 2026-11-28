# ADT-01. Migration : contrainte sur la priorité d'une demande

- Statut : fait
- Agent : db-dev
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADR 0047 point 2
- Périmètre d'écriture : backend/alembic/versions/0030_*.py, backend/db/schema.sql si le dépôt le tient à jour avec les migrations, backend/tests/, CHANGELOG.md, cette fiche. Exclu : api/, fronts, données.

## Contexte

`intervention_request.priorite` (varchar 20) existe, vide partout. Elle prend les codes de priorité des interventions (ADR 0039, `api/constants.py` PRIORITY_TYPES).

## Critères d'acceptation

- [x] migration 0030 : CHECK `priorite IS NULL OR priorite IN ('faible','normal','important','urgent')`, aucune donnée modifiée, downgrade qui retire la contrainte
- [x] test d'intégration : valeur hors liste refusée par la base, NULL accepté
- [x] migration NON jouée en base de dev (accord de l'utilisateur requis)
- [x] scripts/check.sh et scripts/test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : migration 0030_priorite_demande (garde qui nomme toute valeur hors liste, puis CHECK `intervention_request_priorite_check` conditionnel par nom ; downgrade qui la retire). schema.sql n'est pas tenu à jour avec les migrations (0025 et 0029 n'y figurent pas) : non modifié.
Effet sur les données : aucune ligne modifiée ; la migration échoue si une valeur hors liste existe. Retour arrière : downgrade, sans perte.
Fichiers : alembic/versions/0030_priorite_demande.py, tests/test_bootstrap_integration.py (tête de révision), tests/integration/test_priorite_demande_migration_integration.py, CHANGELOG.md, cette fiche.
Non jouée en base de dev.
