# CDL-01. Migration 0029 : réglages des choix du constat

- Statut : faite 2026-11-26
- Agent : db-dev (sonnet)
- Branche : feat/constat-demande-selon-levier-cdl01 (worktree depuis feat/constat-demande-selon-levier)
- Dépend de : ADR 0045
- Périmètre d'écriture : backend/alembic/versions/0029_*.py, backend/tests/integration/test_constat_reglages_migration_integration.py, backend/db/schema.sql et données de départ seulement si le dépôt les tient à jour à chaque migration (suivre ce qu'a fait 0028). Rien dans backend/api/.

## Contexte

ADR 0045 : chaque choix porte « génère une demande » et « exclusif » ; nouveau levier « Rien ne
l'aurait évité » ; un constat peut exister sans demande. Modèle à suivre : 0028_constat_intervention.py
(instructions exposées par upgrade_statements et downgrade_statements, rejouables, garde ASSERT).
La base de dev contient des données réelles : ne jamais y appliquer la migration (CLAUDE.md 11.4),
seulement la base de test des tests d'intégration.

## Travail

1. `constat_choice.creates_request boolean NOT NULL DEFAULT false` et
   `is_exclusive boolean NOT NULL DEFAULT false`, ajoutées seulement si absentes ; à l'ajout de
   `creates_request`, la passer à vrai pour TASK et PROJECT (même idée que `_REQUIRED` de 0028 :
   relancer n'écrase pas un réglage).
2. Choix NOTHING « Rien ne l'aurait évité » sous la question LEVER, exclusif, sans demande, sans
   type, placé en dernier (après OTHER) ; insertion idempotente.
3. `constat.request_id` devient facultatif (DROP NOT NULL) ; la clé étrangère reste.
4. Downgrade : refusé par ASSERT si un constat n'a pas de demande ou si une réponse vise NOTHING ;
   sinon retire NOTHING, remet NOT NULL, retire les deux colonnes.

## Critères d'acceptation

- [x] test d'intégration : upgrade sur une base en 0028, colonnes et valeurs (TASK, PROJECT vrais ; NOTHING exclusif) ; relance sans effet ; un réglage modifié n'est pas écrasé par une relance
- [x] test : constat sans request_id accepté après upgrade
- [x] test : downgrade refusé avec un constat sans demande ; downgrade propre sinon
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert

## Compte rendu final

Migration 0029_constat_reglages_des_choix.py (upgrade_statements, downgrade_statements). Les mêmes
instructions sont ajoutées à db/seed_reference.sql (0002 s'exécute avant) ; schema.sql inchangé
(il ne contient pas les tables du constat). Tests : test_constat_reglages_migration_integration.py ;
test_constat_migration_integration.py ajusté (35 choix dont NOTHING, remontée de 0028 suivie de
0029) ; test_bootstrap_integration.py attend la révision 0029.

Effet sur les données : creates_request vrai pour TASK et PROJECT seulement à la création de la
colonne ; un choix NOTHING ajouté ; constats existants inchangés. Retour arrière : refusé (ASSERT)
si un constat n'a pas de demande ou si une réponse vise NOTHING ; sinon retire NOTHING, remet
request_id obligatoire, retire les deux colonnes. Jamais appliquée à la base de dev.
