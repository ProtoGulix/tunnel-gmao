# AUDC-42. Règles d'audit de l'étape 4

- Statut : faite (2026-11-14)
- Agent : db-dev
- Branche : refactor/audit-etape-4
- Dépend de : décision 9 de AUDC-plan.md
- Périmètre d'écriture : `backend/alembic/versions/0012_audit_entites_etape_4.py`, ligne de
  seed correspondante (comme 0010 et 0011), test d'intégration de la migration. Rien
  d'autre ; ne pas jouer la migration sur la base de dev (accord de l'utilisateur requis,
  l'agent principal s'en charge).

## Contexte

Sans règle routinière (audit_rule entité/field NULL/ROUTINE) ni place dans les
entity_types de ROUTINE, une route déclarée répond 400. Modèle exact :
`0010_audit_entites_etape_3.py` (idempotente, séquence jamais reculée, downgrade).

Entités : user, permission, endpoint, ip_block, email_domain_rule, api_key,
equipement_class, service, role_home_view, action_category, action_subcategory,
intervention_type, intervention_status, audit_reason, audit_rule.

Les motifs de suppression (DELETE_CREATED_BY_MISTAKE, DELETE_DUPLICATE, OTHER) ont
entity_types NULL : rien à faire pour eux (vérifier).

## Critères d'acceptation

- [x] migration 0012 idempotente (rejouée sans effet), downgrade, docstring « effet sur les
      données » comme 0010 ; seed aligné
- [x] test d'intégration : après bootstrap, une règle routinière par entité et chaque
      entité dans ROUTINE
- [x] scripts/check.sh vert ; test-integration.sh vert

## Compte rendu final

Fait : migration `0012_audit_entites_etape_4.py` (corps identique à 0010, 15 entités),
bloc idempotent du seed, test `tests/integration/test_audc42_regles_etape_4_integration.py`
(une règle routinière par entité, entité dans ROUTINE, motifs de suppression à entity_types
NULL). Seule assertion existante changée : révision du bootstrap (0011 → 0012). Non jouée
sur la base de dev (accord de l'utilisateur à demander).

Contrôle de l'agent principal : diff conforme au périmètre ; test-integration.sh 297 passés.
