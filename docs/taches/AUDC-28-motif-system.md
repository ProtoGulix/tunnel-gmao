# AUDC-28. Motif system pour les mutations du système

- Statut : faite (2026-11-14)
- Agent : db-dev
- Branche : refactor/audit-etape-2
- Dépend de : ADR 0018 point 6
- Périmètre d'écriture : `backend/alembic/versions/0007_motif_system_cascade.py` (nouveau),
  `backend/db/seed_reference.sql` (ligne du motif), un test dans
  `backend/tests/integration/`. Exclus : code d'api, autres migrations, toute écriture
  en base de dev (faite par l'agent principal après contrôle).

## Contexte

Motif de catégorie system SYSTEM_CASCADE (mutations du système : cascades, génération, acceptation automatique) dans la seed et la base de dev (accord de l'utilisateur, 2026-11-14), migration de données idempotente pour les autres bases sur le modèle de 0004.

## Critères d'acceptation

- [x] motif SYSTEM_CASCADE : catégorie system, libellé « Mutation automatique du
      système », entity_types NULL (toutes entités), decision_types NULL, actif
- [x] migration 0007 idempotente sur le modèle de 0004 (ON CONFLICT (code) DO NOTHING,
      séquence recalée), downgrade qui retire la ligne si aucun audit_log ne la référence
- [x] seed : même ligne, id explicite suivant, cohérente avec la migration
- [x] test d'intégration : après bootstrap le motif existe ; fn_audit_log_decision accepte
      SYSTEM_CASCADE avec is_system=true (le refus en mode manuel est celui du
      middleware, ADR 0017 point 1 : la fonction ne le fait pas, critère corrigé par
      l'agent principal)
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

db-dev (2026-11-14) : migration 0007_motif_system_cascade (ON CONFLICT, séquence recalée
sans reculer, downgrade seulement si non référencé), ligne de seed (id calculé comme les
motifs TASK_*), test d'intégration. Agent principal : test « refus en mode manuel »
retiré (la fonction en base ne le fait pas, le middleware oui : middleware.py:104),
test de bootstrap passé à la révision 0007 ; test-integration.sh vert. Base de dev :
migration à jouer par l'agent principal (accord du 2026-11-14).
