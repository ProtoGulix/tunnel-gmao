# REO-01. Migration 0021 : motifs de réouverture d'une intervention

- Statut : faite
- Agent : db-dev
- Branche : fix/statuts-hors-travail-normal (depuis develop, ADR 0008)
- Dépend de : ADR 0028
- Périmètre d'écriture : backend/alembic/versions/0021_*.py, backend/db/seed_reference.sql,
  backend/tests/ (test de migration, tête attendue du test de bootstrap). Exclu : api/, fronts.

## Contexte

Calquer la migration 0019 (backend/alembic/versions/0019_motifs_ignorer_occurrence.py) :
deux motifs de catégorie user, entité intervention, décision intervention_reopened :
INTERVENTION_CLOSED_BY_MISTAKE « Clôturée par erreur » et INTERVENTION_REWORK « Travail à
reprendre » (couleurs et descriptions courtes à proposer), plus la décision
intervention_reopened ajoutée à OTHER. Idempotente, upgrade_statements et
downgrade_statements exposés, séquence recalée, downgrade qui ne supprime un motif que s'il
n'est référencé par aucun audit_log. Mêmes instructions dans seed_reference.sql.

## Critères d'acceptation

- [x] Test d'intégration de la migration : motifs présents, OTHER porte la décision,
      rejouer est sans effet, downgrade puis upgrade cohérents
- [x] test_bootstrap : tête attendue 0021
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert

## Compte rendu

Migration `0021_motifs_reouverture` (l'identifiant de révision est limité à 32 caractères :
`alembic_version_backend.version_num` est un varchar(32), le nom long prévu a échoué en
bootstrap). Deux motifs ajoutés (INTERVENTION_CLOSED_BY_MISTAKE, INTERVENTION_REWORK), décision
`intervention_reopened` ajoutée à OTHER, séquence recalée, mêmes instructions en fin de
seed_reference.sql. Effet sur les données : au plus 2 lignes ajoutées, OTHER modifié, rien
d'autre. Retour arrière : le downgrade retire la décision de OTHER et supprime les motifs
seulement si aucun audit_log ne les référence.

Tests : test d'intégration de la migration, tête 0021 dans test_bootstrap. Deux tests existants
ajustés (ordre/contenu des decision_types de OTHER, sans affaiblir d'assertion) :
test_audc30 (liste attendue + intervention_reopened) et le retour arrière de 0019 (comparaison
triée). Intégration : 495 passés après correctifs (3 échecs initiaux corrigés) ; check.sh vert.
