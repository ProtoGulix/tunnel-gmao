# CASC-01. Auteur des journaux de statut et fin des doublons (migration 0022)

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ)
- Agent : db-dev
- Branche : fix/audit-des-cascades (worktree ../wt-casc-01)
- Dépend de : ADR 0029 (points 3, 4, 8)
- Périmètre d'écriture : backend/alembic/versions/0022_*.py, backend/db/schema.sql
  (fonctions et colonne concernées seulement, si la convention du dépôt l'exige),
  backend/api/transaction.py et/ou backend/api/db.py (pose de `app.user_id`),
  backend/tests/ (nouveaux tests), CHANGELOG.md, cette fiche. Exclu : tout autre code
  applicatif, la base de dev (aucune migration jouée).

## Contexte

Les triggers `trg_log_status_change` (intervention_status_log) et
`fn_sync_status_log_to_intervention` (request_status_log) écrivent des lignes sans auteur.
`fn_sync_status_log_to_intervention` fait un `UPDATE intervention_request SET statut` qui
déclenche `fn_log_request_status_change` (une ligne), puis insère sa propre ligne :
doublon (153 en base). `intervention_status_log` n'a pas de colonne d'auteur ;
`technician_id` est déclaratif (ADR 0005) et ne doit pas servir d'auteur.

## Critères d'acceptation

- [x] Migration `0022_auteur_des_journaux` (id ≤ 32 caractères, varchar(32)) :
      `intervention_status_log.changed_by uuid` nullable (FK vers l'utilisateur si la
      convention des autres colonnes d'auteur le fait) ; idempotente ; downgrade documenté.
- [x] Les triggers qui écrivent un journal remplissent l'auteur depuis
      `NULLIF(current_setting('app.user_id', true), '')::uuid` : trg_log_status_change,
      fn_log_request_status_change, fn_init_request_status_log,
      fn_sync_status_log_to_intervention (ligne de clôture de la demande).
- [x] fn_sync_status_log_to_intervention n'écrit plus de doublon : son `UPDATE` de la
      demande est entouré de `app.skip_request_status_log` à true puis false.
- [x] La transaction de requête pose `app.user_id` (set_config local à la transaction) dès
      que `request.state.user_id` est connu, avant la première écriture ; rien n'est posé
      sans utilisateur (tâche planifiée, requête anonyme) ; pas de fuite d'une requête à
      l'autre (connexion du pool).
- [x] Données passées non modifiées (ADR 0029 point 8) : la migration n'écrit aucune ligne.
- [x] Tests d'intégration : clôture d'une intervention par PUT → une seule ligne
      request_status_log « cloturee » avec changed_by = l'utilisateur ; ligne
      intervention_status_log avec changed_by ; requête suivante sur la même connexion
      sans auteur résiduel ; migration rejouée deux fois sans erreur.
- [x] scripts/check.sh vert ; test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Migration 0022_auteur_des_journaux (24 caractères) livrée : colonne
`intervention_status_log.changed_by` (FK tunnel_user ON DELETE SET NULL), quatre fonctions
réécrites (CREATE OR REPLACE), UPDATE de la demande de fn_sync entouré du réglage
`skip_request_status_log` (valeur précédente restaurée, pas forcément false). Aucune ligne
écrite. Retour arrière : fonctions d'origine, contrainte et colonne retirées (auteurs perdus).
`schema.sql` non touché (aucune migration depuis 5.0.0 n'y est reportée).
Pose : `api/db.py` (set_request_author) appelée par `api/transaction.py` avant la route ;
set_config local, vérifié absent de toutes les connexions du pool après une requête.
Tests : 7 dans test_casc01_auteur_des_journaux_integration.py ; suite d'intégration 509
verts ; check.sh vert.
Constat hors périmètre : la ligne « ouvert » du journal d'une intervention est écrite par le
code à la création, sans changed_by (auteur toujours vide). À traiter dans une autre tâche.
