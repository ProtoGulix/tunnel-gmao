# IMPR-04. Migration : compléter les dates de signalement manquantes, tracées dans l'audit

- Statut : faite (2026-11-17)
- Agent : db-dev (sonnet)
- Branche : fix/historique-equipement-archivees, worktree de la sous-branche
  fix/historique-equipement-archivees-impr04
- Dépend de : IMPR-03 ; accord de l'utilisateur du 2026-11-17 (migration de données,
  nouveau motif, source de la date)
- Périmètre d'écriture : backend/alembic/versions/0014_*.py (nouveau),
  backend/db/seed_reference.sql (le motif, pour une base neuve), tests d'intégration de
  la migration dans backend/tests/integration/, docs/ si un guide recense les motifs
  système, CHANGELOG.md (« Non publié »). Exclu : code applicatif, web, mobile. Aucune
  exécution de la migration sur la base de dev (l'agent principal la joue après contrôle).

## Contexte

56 interventions de la base de dev (toutes de 2025, reprise d'historique) ont
`reported_date` NULL : elles n'entrent dans aucune période du tableau de bord d'un
équipement (liste « Voir les interventions », graphique « signalées par mois »). Cas
signalé : CHOUFFE-PRO-20250220-IB. Le code d'une intervention est généré avec la date du
jour de création (`generate_intervention_code`, `to_char(current_date, 'YYYYMMDD')`) : c'est
la source retenue par l'utilisateur. À défaut de code au format attendu : date du premier
passage dans `intervention_status_log`. 50 des 56 ont les deux dates égales ; 6 ont un
journal plus tardif (reprise), dont CHOUFFE (code 2025-02-20) et GRB422-CUR-20250110.

Changement hors travail normal (CLAUDE.md section 2 point 4) : chaque intervention
corrigée est tracée dans audit_log, ligne système, avec un nouveau motif de catégorie
`system` ajouté aux données de référence.

## Critères d'acceptation

- [x] Migration 0014 (down_revision 0013_motifs_cloture), docstring au format de 0013
      (effet sur les données, idempotence, retour arrière)
- [x] Motif `DATA_BACKFILL` (« Complétion de données historiques »), catégorie `system`,
      decision_types adaptés, ajouté par la migration (ON CONFLICT DO NOTHING) et dans
      seed_reference.sql pour une base neuve
- [x] `reported_date` posée seulement là où elle est NULL : date extraite du code
      (`-AAAAMMJJ-`, date valide), sinon premier passage du journal des statuts, sinon
      rien (et la migration le dit dans ses logs ou son compte)
- [x] Une ligne audit_log par intervention corrigée via `fn_audit_log_decision`
      (entity_type `intervention`, old `{reported_date: null}`, new `{reported_date: …}`,
      motif DATA_BACKFILL, is_system true), dans la même transaction
- [x] Idempotente : rejouée, ne change rien et n'ajoute aucune ligne d'audit
- [x] Downgrade : retire le motif seulement s'il n'est référencé par aucune ligne
      d'audit ; ne remet pas les dates à NULL (choix à documenter)
- [x] Test d'intégration (base jetable de scripts/test-integration.sh) : intervention à
      code daté, intervention sans code exploitable avec journal, intervention déjà datée
      inchangée, lignes d'audit, idempotence
- [x] scripts/check.sh et scripts/test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Migration `0014_dates_signalement` livrée, non jouée sur la base de dev. Date lue par
`substring(code FROM '-([0-9]{8})-')`, validée par aller-retour to_date/to_char et année
>= 2000 ; sinon `min(date)` du journal des statuts ; sinon intervention laissée et
comptée dans une NOTICE. Audit : `decision_type` `reported_date_changed` (convention
`{champ}_changed`), source dans `reason_text`. Downgrade : retire le motif s'il n'est pas
référencé, ne remet pas les dates à NULL (indiscernables des dates saisies ensuite).
Hors périmètre à reporter : `deploy/basculer-production.sh` ligne 430 attend encore la
révision `0013_motifs_cloture` ; `backend/tests/test_bootstrap_integration.py` (révision
de tête) mis à jour. Tests : intégration complète 356 passed, check.sh vert.

Contrôle de l'agent principal : relecture de la migration, test-integration.sh 356 après
regroupement (le premier passage des agents a pu être perturbé : les deux agents
partageaient le conteneur jetable à port fixe), reviewer APPROUVÉ. Migration jouée sur la
base de dev le 2026-11-17 avec l'accord de l'utilisateur (redémarrage de l'API) : révision
0014_dates_signalement, 56 dates posées (toutes depuis le code), 56 lignes d'audit
DATA_BACKFILL, plus aucune reported_date NULL ; CHOUFFE-PRO-20250220-IB au 2025-02-20.
Production : jouée au démarrage de l'API à la prochaine mise à jour.
