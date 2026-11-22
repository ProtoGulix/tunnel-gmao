# IRR-01. Base : déclencheur de l'archivage irrévocable (migration 0026)

- Statut : faite (2026-11-22)
- Agent : db-dev (sonnet)
- Branche : feat/archivage-irrevocable-irr01 (worktree depuis feat/archivage-irrevocable)
- Dépend de : ADR 0041 ; accord de l'utilisateur du 2026-11-22 (règle en base, migration)
- Périmètre d'écriture : backend/alembic/versions/0026_*.py (nouveau), backend/db/schema.sql
  seulement si le dépôt tient ce fichier à jour à chaque migration (vérifier sur 0022 à 0025),
  backend/api/errors/exceptions.py (liste blanche `_USER_FACING_DB_MESSAGES` seulement),
  backend/tests/ (nouveaux fichiers de tests, unitaire et intégration), CHANGELOG.md.
  Exclus : routes, repo, validators, fronts. Aucune écriture sur la base de dev : la migration
  n'est jouée que dans la base jetable de scripts/test-integration.sh.

## Contexte

ADR 0041 : l'archivage (`intervention.printed_fiche` vrai) est irrévocable, et une
intervention archivée fermée ne se rouvre pas. Le statut courant est `intervention.status_actual`
(code fermé : `ferme`, api/constants.py), journalisé par le déclencheur AFTER UPDATE
`trg_log_status_change`. Modèles de migration : 0022 (déclencheurs, variables de session) et
0025 (dernière migration, upgrade et downgrade). Le message d'un RAISE EXCEPTION n'est renvoyé
au client que s'il figure dans `_USER_FACING_DB_MESSAGES`.

## Critères d'acceptation

- [x] migration 0026 : fonction et déclencheur BEFORE UPDATE sur `intervention` ; si OLD.printed_fiche IS TRUE et NEW.printed_fiche IS DISTINCT FROM TRUE : RAISE EXCEPTION « L'archivage d'une intervention est irrévocable » ; si OLD.printed_fiche IS TRUE, OLD.status_actual = 'ferme' et NEW.status_actual IS DISTINCT FROM 'ferme' : RAISE EXCEPTION « Une intervention archivée ne peut pas être rouverte » ; downgrade qui retire déclencheur et fonction ; idempotente
- [x] les deux messages ajoutés à la liste blanche ; test unitaire de `user_facing_db_message` pour chacun
- [x] tests d'intégration (vraie base) : défaire l'archive refusé (400 par l'API PUT et refus par SQL direct avec le rôle applicatif) ; rouvrir une intervention archivée fermée refusé (400, avec un motif de réouverture valide fourni) ; marquer archivée (faux → vrai) toujours permis ; modifier une intervention archivée sans toucher à ces champs reste permis ; une intervention non archivée se rouvre comme avant
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert
- [x] CHANGELOG (« Non publié ») : entrée sous Modifié ou Sécurité/Intégrité selon les rubriques du fichier, avec la migration 0026 à jouer en production

## Compte rendu final

Migration 0026_archivage_irrevocable : fonction fn_archivage_irrevocable et déclencheur
trg_archivage_irrevocable (BEFORE UPDATE sur intervention), deux messages ajoutés à
`_USER_FACING_DB_MESSAGES`. backend/db/schema.sql non touché (non tenu à jour depuis 0022).
Tests : unitaire (messages), intégration (nouveau fichier test_reouverture_archivee_irrevocable,
nommé après test_motifs_reouverture_migration pour ne pas bloquer son retour arrière).
Fixture du tableau de bord d'équipement et version attendue du bootstrap adaptées.
Preuve : sans la migration, 6 des 9 nouveaux tests d'intégration échouent.
Effet sur les données : aucune ligne modifiée ; les interventions déjà archivées sont figées.
Retour arrière : downgrade retire déclencheur et fonction, l'archivage redevient révocable.
Point d'attention : l'INSERT d'une ligne déjà archivée dont le statut n'est pas « ouvert » est
refusé, car trg_init_status_log (AFTER INSERT) réécrit le statut en « ouvert ».
