# CASC-05. Auteur partout dans les journaux de statut

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ)
- Agent : backend-dev
- Branche : fix/audit-des-cascades (worktree ../wt-casc-05)
- Dépend de : ADR 0029 (point 3), CASC-01, CASC-03
- Périmètre d'écriture : backend/alembic/versions/0022_auteur_des_journaux.py (non
  publiée, jamais jouée : on la complète au lieu d'ajouter 0023), backend/api/
  (intervention_requests, interventions, intervention_status_log, preventive_occurrences,
  intervention_actions), backend/tests/, CHANGELOG.md, cette fiche. Exclu : schema.sql,
  fronts, base de dev.

## Contexte

Restes signalés par CASC-03 : la ligne « ouvert » est écrite par le trigger
`trg_init_status_log`, que 0022 ne réécrit pas (CASC-03 l'a contourné par un UPDATE dans
`insert_intervention`) ; `request_status_log.changed_by` reste vide dans les lignes écrites
par le code (`on_intervention_closed`, routes /repair) ; `POST /intervention-status-log`
n'écrit pas `changed_by`. Le chemin PATCH d'une action qui clôt une tâche n'a pas de test
de `closed_by`. Corps de `trg_init_status_log` en base de dev identique à schema.sql
(vérifié en lecture seule le 2026-11-20).

## Critères d'acceptation

- [ ] 0022 réécrit aussi `trg_init_status_log` (changed_by depuis app.user_id) avec son
      corps d'origine au downgrade ; le contournement par UPDATE de CASC-03 est retiré.
- [ ] Toute ligne de request_status_log ou intervention_status_log écrite par le code
      porte l'auteur de la requête (même expression SQL `NULLIF(current_setting(
      'app.user_id', true), '')::uuid` ou l'user_id de la requête), y compris /repair et
      `POST /intervention-status-log` ; `technician_id` reste inchangé (déclaratif).
- [ ] Test de garde : après les parcours couverts par CASC-01 et CASC-03, aucune ligne de
      journal écrite dans une requête authentifiée n'a d'auteur vide.
- [ ] Test de `closed_by` sur le PATCH d'une action qui clôt une tâche.
- [ ] Tests de migration de CASC-01 encore verts (rejouée deux fois, downgrade puis upgrade).
- [ ] scripts/check.sh vert ; test-integration.sh complet vert
- [ ] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : 0022 réécrit aussi `trg_init_status_log` (changed_by depuis `app.user_id`), corps
d'origine de schema.sql restitué au downgrade ; l'UPDATE de contournement de
`insert_intervention` est retiré. `changed_by` posé par l'expression SQL commune dans
`POST /intervention-status-log` (`technician_id` inchangé), `on_intervention_closed`,
`repair_orphaned_requests` (demandes) et `repair_orphaned_data` (occurrences).
Tests : `test_casc05_auteur_partout_integration.py` (ligne « ouvert », journal manuel,
/repair, garde, PATCH d'action qui clôt une tâche : le code de closed_by y était déjà
correct) ; `_FONCTIONS` du test CASC-01 couvre maintenant `trg_init_status_log`
(rejeu x2, downgrade puis upgrade verts). Les lignes de mise en place faites en SQL propriétaire
dans les tests restent sans auteur (hors requête) : la garde les exclut.
