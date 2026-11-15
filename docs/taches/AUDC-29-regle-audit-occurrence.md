# AUDC-29. Règle d'audit de l'occurrence préventive

- Statut : faite (2026-11-14)
- Agent : db-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-24 ; accord de l'utilisateur du 2026-11-14 (option a : règle
  routinière, skip_reason libre jusqu'au chantier « changements hors travail normal »)
- Périmètre d'écriture : `backend/alembic/versions/0008_audit_occurrence_preventive.py`
  (nouveau), `backend/db/seed_reference.sql`, `backend/tests/test_bootstrap_integration.py`
  (révision attendue seulement), un nouveau test dans `backend/tests/integration/`.
  Exclus : code d'api, autres migrations, base de dev (appliquée par l'agent principal).

## Contexte

Depuis AUDC-24, PATCH /preventive-occurrences/{id}/skip déclare l'entité
preventive_occurrence, qui n'a ni règle audit_rule ni place dans les entity_types de
ROUTINE : la route répond 400.

## Critères d'acceptation

- [x] migration 0008 idempotente (modèle 0004 et 0007) : règle audit_rule
      (preventive_occurrence, field NULL, is_routine true, ROUTINE) ; 'preventive_occurrence'
      ajouté aux entity_types de ROUTINE s'il n'y est pas ; séquences recalées sans recul ;
      downgrade qui retire la règle et l'entité de ROUTINE
- [x] seed cohérente avec la migration
- [x] test d'intégration : après bootstrap, la règle existe et ROUTINE couvre l'entité ;
      test de bootstrap à la révision 0008
- [x] check.sh vert ; test-integration.sh lancé par l'agent principal

## Compte rendu final

db-dev (2026-11-14) : migration 0008 (ROUTINE couvre preventive_occurrence, règle
routinière), seed, test, bootstrap à la révision 0008. Agent principal : insertion
corrigée (un `SELECT MAX(id)+1 ... WHERE NOT EXISTS` renvoie toujours une ligne :
conflit de clé quand la règle existe déjà, relevé par l'agent d'AUDC-25) ; montage
provisoire de la règle retiré du test skip d'AUDC-24 (il effaçait la règle de la
migration). test-integration.sh 214 passed.
