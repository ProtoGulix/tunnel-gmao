# BASC-03. Migration 0013 : motifs de clôture sur les bases existantes

- Statut : faite (2026-11-15)
- Agent : db-dev
- Branche : fix/bascule-depuis-3.57
- Dépend de : ADR 0016, migrations 0004 (modèle), 0007, 0009, backlog
  `motifs-cloture-bases-existantes.md`
- Périmètre d'écriture : nouveau `backend/alembic/versions/0013_motifs_cloture.py`, ses
  tests (backend/tests/, intégration si l'outillage existe), `CHANGELOG.md` (« Non
  publié »), `docs/backlog/motifs-cloture-bases-existantes.md` (à supprimer une fois
  traité). Exclus : seed_reference.sql, schema.sql, autres migrations, deploy/.

## Contexte

Les 4 motifs TASK_DONE_UNRECORDED, TASK_HANDLED_ELSEWHERE, TASK_NO_LONGER_NEEDED,
TASK_DUPLICATE, les decision_types qui vont avec, et la désactivation de
LEGACY_STATUS_CHANGE ne sont posés que par la seed (base neuve) et à la main sur la base
de dev. Vérifié sur la copie de production après 0012 : motifs absents,
LEGACY_STATUS_CHANGE actif. Décision de l'utilisateur du 2026-11-15 : migration de
données 0013.

## Critères d'acceptation

- [x] 0013 (down_revision 0012) insère les 4 motifs à l'identique de
      `seed_reference.sql` (lignes « Motifs de clôture », ADR 0016), id calculé et
      ON CONFLICT (code) DO NOTHING, recale la séquence comme 0004, désactive
      LEGACY_STATUS_CHANGE. Pour OTHER, ne rien faire si 0009 couvre déjà ses
      decision_types (vérifier et le dire). Idempotente : sans effet sur une base qui a
      déjà ces lignes (base neuve installée par la seed, base de dev).
- [x] downgrade documenté (retire les 4 motifs seulement s'ils ne sont référencés par
      aucune trace d'audit, sinon les laisse ; réactive LEGACY_STATUS_CHANGE).
- [x] Test : sur base neuve, upgrade head puis état attendu ; rejouer 0013 ne change
      rien. Si test-integration.sh couvre les migrations, y ajouter le cas ; sinon le
      dire.
- [x] Aucune exécution contre la base de dev (projet Compose `tunnel`) ni contre la
      répétition (projet `tunnel-repetition`) : l'agent principal joue la répétition.
- [x] scripts/check.sh vert ; test-integration.sh vert.
- [x] CHANGELOG à jour, entrée de backlog supprimée.

## Compte rendu final

Fait (db-dev, worktree) : `0013_motifs_cloture.py` (4 motifs repris de la seed, id
calculé, WHERE NOT EXISTS et ON CONFLICT, séquence recalée sans recul, désactivation de
LEGACY_STATUS_CHANGE ; downgrade qui garde un motif référencé par audit_log) ; test
d'intégration `test_motifs_cloture_migration_integration.py` (base neuve inchangée,
base 3.57.0 simulée rattrapée sans écraser un motif personnalisé, downgrade) ; assertion
de révision du bootstrap passée de 0012 à 0013 (attendu, pas un affaiblissement) ;
backlog supprimé. OTHER : couvert par 0009, non touché.

Commandes en échec (agent) : check.sh sans node_modules (liens temporaires, retirés) ;
test-integration.sh, 1 échec attendu sur la révision 0012, corrigé ; un lien .venv mal
placé, retiré. Résultats agent : check.sh vert (337), test-integration.sh 333 verts.

Contrôle de l'agent principal : diff conforme au périmètre ; retrait de la référence au
backlog dans la section publiée [5.3.0] du CHANGELOG annulé (historique publié
intact) ; références restantes corrigées (ETAT, MIGRATION-v4.md). NON VÉRIFIÉ : jouée
par alembic sur la copie de production (répétition complète), downgrade alembic réel.
