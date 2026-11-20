# CONT-01. Migration 0018 : contraintes et index de la production

- Statut : fait (en attente de relecture)
- Agent : db-dev (sonnet)
- Branche : feat/contraintes-et-audit (depuis develop), worktree feat/contraintes-et-audit-cont01
- Dépend de : ADR 0024, inventaire docs/taches/CONT-01-inventaire-production.txt
- Périmètre d'écriture : backend/alembic/versions/0018_*.py, tests backend (intégration ;
  fixtures existantes seulement si elles violaient une contrainte), backend/tests/test_bootstrap_integration.py
  (tête de migration), CHANGELOG.md (« Non publié »), cette fiche. Exclu : schema.sql, api/.

## Contexte

Voir ADR 0024. L'inventaire compare par nom ; certains objets peuvent exister sous un autre
nom dans une installation neuve. Accord de l'utilisateur pour la migration (2026-11-19).

## Critères d'acceptation

- [x] Comparaison par définition contre une base neuve construite par les tests (révision
      0017) : la liste des objets réellement manquants et celle des équivalents écartés
      figurent dans le compte rendu
- [x] Migration 0018 : ajout conditionnel par nom de chaque objet manquant, définition de la
      production, clés étrangères et CHECK validés ; ordre qui respecte les dépendances ;
      downgrade documenté (bases neuves seulement, ADR 0024)
- [x] Test d'intégration : après migration, une base neuve a toutes les contraintes de
      l'inventaire retenues (par nom) ; quelques refus représentatifs (clé étrangère, CHECK
      tâche ignorée sans motif, quantité nulle)
- [x] Migration rejouée sur une base déjà migrée : sans effet (idempotence)
- [x] scripts/check.sh et scripts/test-integration.sh verts, fixtures corrigées sans
      affaiblir d'assertion (lister celles qui l'ont été)
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final


Migration `backend/alembic/versions/0018_contraintes_production.py` (down_revision 0017).

Comparaison par définition (base neuve en révision 0017, PostgreSQL 15 jetable) : sur les
152 objets de l'inventaire, 151 manquaient ; 1 équivalent écarté : `machine_equipement_mere_index`
(déjà `idx_machine_equipement_mere`, même définition). Aucune table de l'inventaire absente.
Ajoutés : 72 clés étrangères, 15 CHECK, 65 index (aucune FK ni CHECK équivalent sous un autre nom).

Effet sur les données : aucune ligne modifiée ; ajouts conditionnels par nom (sans effet sur la
production). Contraintes validées. Retour arrière : le downgrade retire tout l'inventaire,
réservé aux bases neuves (ADR 0024). Vérifié sur base jetable : downgrade (96/18/197 vers
24/3/132 FK/CHECK/index), upgrade, second upgrade sans effet.

Test : `backend/tests/integration/test_contraintes_production_integration.py` (présence par
nom, rejeu sans effet, refus FK, CHECK tâche ignorée sans motif, quantité nulle).
Tête de migration mise à jour dans `test_bootstrap_integration.py`.

Fixtures qui violaient la production (corrigées, aucune assertion touchée) :
- `test_audit_integration.py` (export CSV) : famille F et sous-famille SF créées avant l'article ;
- `test_preventif_echeancier_integration.py` (`_occurrence`) : motif fourni pour une occurrence
  `skipped` (sert `test_preventif_demande_rejetee`) ;
- `test_stats_organisation_integration.py` : plan de type `periodicity` avec 30 jours (la
  fixture utilisait `periodic`, valeur que le CHECK de la production refuse).
- `test_motifs_cloture_migration_integration.py` : la clé `audit_log_reason_code_id_fkey` interdit
  de supprimer un motif cité par des tests précédents de la session ; le test retire d'abord
  leurs lignes d'audit (comme il le fait déjà à sa fin). Aucune assertion modifiée.

Résultats : check.sh vert ; test-integration.sh 443 passés (base jetable tunnel-it-db-cont01).
