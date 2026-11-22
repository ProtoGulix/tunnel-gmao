# PRIO-01. Migration : `normale` devient `normal`, contrainte CHECK

- Statut : faite (2026-11-21), essai à l'écran validé (2026-11-22)
- Agent : db-dev
- Branche : feat/priorites-et-statuts (depuis develop, ADR 0008)
- Dépend de : ADR 0039
- Périmètre d'écriture : backend/alembic/versions/0025_*.py, backend/db/seed_reference.sql
  (motif d'audit seulement), backend/db/schema.sql (contrainte, si le schéma de référence
  doit la porter), tests d'intégration de la migration dans backend/tests/. Exclu : api/,
  web/, mobile/, toute écriture dans la base de dev (la migration est jouée par l'agent
  principal).

## Contexte

`intervention.priority` contient `normal` (60) et `normale` (134) en dev, sans contrainte
(ADR 0039). Précédent à suivre : migration 0014 (motif DATA_BACKFILL, une ligne d'audit
système par intervention corrigée via fn_audit_log_decision, idempotente).

## Critères d'acceptation

- [x] Nouveau motif d'audit système (code et decision_type au choix de l'agent, cohérents
      avec 0014), ajouté par la migration sans écraser un motif existant et dans la seed.
- [x] Chaque intervention en `normale` passe en `normal` avec une ligne d'audit (ancienne
      et nouvelle valeur) ; une intervention déjà en `normal` n'en reçoit aucune.
- [x] La migration échoue avec un message clair s'il reste une valeur hors
      (`faible`, `normal`, `important`, `urgent`, NULL) après conversion, puis pose une
      contrainte CHECK nommée, conditionnelle par nom (ADR 0024).
- [x] Rejouer la migration ne fait rien de plus (idempotence testée).
- [x] downgrade retire la contrainte sans toucher aux données (documenté).
- [x] Test d'intégration : conversion, audit, refus d'une valeur inconnue après migration.
- [x] scripts/check.sh et scripts/test-integration.sh verts.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (db-dev, sonnet) : migration 0025_priorite_normal, motif système PRIORITY_NORMALIZED
(decision_type priority_changed) dans la migration et la seed, conversion auditée ligne par
ligne, garde qui nomme une valeur inconnue, contrainte `intervention_priority_check`
conditionnelle par nom, downgrade qui retire la contrainte et le motif s'il n'est pas
référencé (ne remet pas `normale` : documenté). Fichiers : alembic/versions/0025, seed,
test d'intégration dédié (5 tests), tête de version de test_bootstrap_integration (0024 →
0025, seule assertion changée, légitime). schema.sql non modifié : le bootstrap passe par
les migrations (comme ADR 0024).

Commandes en échec, corrigées : ruff format ; test_messages_base_p0001 (RAISE littéral,
passé en USING MESSAGE) ; UniqueViolation du helper de test ; suite d'intégration rouge
tant que l'API écrivait `normale` (attendu, levé par PRIO-02).

Contrôle de l'agent principal : périmètre conforme ; répétition sur une copie de la base
de dev (134 converties, 134 lignes d'audit exactement, contrainte posée, second passage
sans effet), copie supprimée ; jouée en dev le 2026-11-21 par redémarrage de l'API (0024
puis 0025 : la base de dev était en 0023) : 194 `normal`, 0 `normale`, contrainte présente,
API saine. Production : 0024 et 0025 à jouer à sa mise à jour.
