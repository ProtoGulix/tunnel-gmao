# AUDC-30. Motifs de suppression

- Statut : faite (2026-11-14)
- Agent : db-dev
- Branche : refactor/audit-etape-2
- Dépend de : ADR 0018 point 5 (suppression : motif explicite toujours exigé) ; accord de
  l'utilisateur du 2026-11-14 (libellés ci-dessous, application à la base de dev)
- Périmètre d'écriture : `backend/alembic/versions/0009_motifs_suppression.py` (nouveau),
  `backend/db/seed_reference.sql`, `backend/tests/test_bootstrap_integration.py` (révision
  attendue seulement), un nouveau test dans `backend/tests/integration/`. Exclus : code
  d'api, autres migrations, base de dev (appliquée par l'agent principal).

## Contexte

Toute suppression exige un motif explicite. Seul EQUIPMENT_UPDATE (catégorie auto)
s'applique aux équipements ; OTHER ne couvre que task, request, purchase_request,
intervention : la fenêtre de motif n'a rien à proposer pour supprimer une action, une
commande fournisseur ou un équipement.

## Critères d'acceptation

- [x] motifs DELETE_CREATED_BY_MISTAKE « Créé par erreur » et DELETE_DUPLICATE
      « Doublon » : catégorie user, entity_types NULL (toutes entités), decision_types
      {deleted}, actifs
- [x] OTHER : entity_types NULL (toutes entités) ; decision_types : ajouter `deleted`
      à la liste existante ({task_done, task_skipped}) pour qu'il reste proposé partout
      où il l'est aujourd'hui (vérifier dans api/audits comment decision_types filtre
      la liste des motifs : NULL = toutes décisions ?) et le dire dans le compte rendu
- [x] migration idempotente : insertion par `SELECT (SELECT COALESCE(MAX(id),0)+1 ...)
      WHERE NOT EXISTS` (jamais `SELECT MAX(id)+1 FROM t WHERE NOT EXISTS`, qui renvoie
      toujours une ligne), ON CONFLICT (code) DO NOTHING, séquences recalées sans recul ;
      downgrade qui retire les deux motifs s'ils ne sont pas référencés et rend à OTHER
      ses valeurs d'avant
- [x] seed cohérente ; test d'intégration (motifs présents, OTHER couvre une entité
      hors liste actuelle, ex. action) ; test de bootstrap à la révision 0009
- [x] check.sh vert ; test-integration.sh lancé par l'agent principal

## Compte rendu final

db-dev (2026-11-14) : migration 0009 (DELETE_CREATED_BY_MISTAKE « Créé par erreur »,
DELETE_DUPLICATE « Doublon » : user, toutes entités, {deleted} ; OTHER : toutes entités,
{task_done, task_skipped, deleted}), seed, test, bootstrap à la révision 0009.
decision_types ne filtre côté backend que la clôture directe de tâche (ADR 0016) : la
fenêtre de suppression des fronts doit filtrer sur `deleted` (AUDC-27). Agent
principal : test-integration.sh 222 passed ; migration jouée sur la base de dev.
