# AUDC-32. Règles d'audit des entités de l'étape 3

- Statut : faite (2026-11-14)
- Agent : db-dev
- Branche : refactor/audit-etape-3
- Dépend de : décision de l'utilisateur du 2026-11-14 (tout routinier sauf suppression)
- Périmètre d'écriture : `backend/alembic/versions/0010_audit_entites_etape_3.py`
  (nouveau), `backend/db/seed_reference.sql`, `backend/tests/test_bootstrap_integration.py`
  (révision seulement), un nouveau test d'intégration. Exclus : code d'api, base de dev.

## Critères d'acceptation

- [x] pour chaque entité (preventive_plan, part, part_manufacturer_ref, part_supplier_ref, manufacturer_item, stock_item, stock_sub_family, stock_item_supplier, supplier, supplier_order_line) : règle audit_rule (entité, field NULL, routinière,
      ROUTINE) si absente ; entité ajoutée aux entity_types de ROUTINE si absente
- [x] idempotent : identifiant par sous-requête `(SELECT COALESCE(MAX(id),0)+1 ...)` avec
      WHERE NOT EXISTS (jamais `SELECT MAX(id)+1 FROM t WHERE NOT EXISTS`), séquences
      recalées sans recul ; downgrade qui retire règles et entités
- [x] seed cohérente ; test d'intégration ; bootstrap à la révision 0010
- [x] check.sh vert ; test-integration.sh lancé par l'agent principal

## Compte rendu final

db-dev (2026-11-14) : migration 0010 (10 entités : règle routinière, ROUTINE étendu),
seed, test paramétré, bootstrap à 0010. Agent principal : relue (forme corrigée de 0008,
noms d'entités venant d'une liste constante) ; test-integration.sh 244 passed. Base de
dev : à jouer (accord à confirmer par l'utilisateur).
