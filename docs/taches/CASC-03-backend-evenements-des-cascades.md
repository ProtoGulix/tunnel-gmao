# CASC-03. Événement du système sur chaque cascade, closed_by toujours rempli

- Statut : faite (2026-11-20, contrôlée par l'agent principal, reviewer APPROUVÉ)
- Agent : backend-dev
- Branche : fix/audit-des-cascades (worktree ../wt-casc-03, après CASC-02)
- Dépend de : ADR 0029 (points 5, 6, 7), CASC-02
- Périmètre d'écriture : backend/api/ (domaines cités ci-dessous, api/audits si une aide
  commune manque), backend/tests/, CHANGELOG.md, cette fiche. Exclu : alembic,
  schema.sql, fronts.

## Contexte

Revue du 2026-11-20 : cascades qui écrivent sans `record_audit_event`. Références
indicatives (à vérifier) :
- occurrence préventive « completed » : intervention_requests/repo.py vers 782 et 1230,
  preventive_occurrences/repo.py vers 1162, trigger fn_sync_status_log_to_intervention
  (côté code : constater l'avant/après autour de l'écriture qui déclenche le trigger,
  comme `watch_trigger_closure`) ;
- occurrence « in_progress » et tâches affectées ou datées à l'acceptation ou à la
  création : interventions/repo.py vers 1076-1093, intervention_requests/repo.py vers
  818-835, preventive_occurrences/repo.py vers 907-915 ;
- routes `/repair` (preventive_occurrences, intervention_requests, lignes 1108-1255 et
  suivantes) ;
- regroupement des demandes d'achat : supplier_order_line créées ou cumulées
  (purchase_requests/repo.py vers 1093) ;
- rattachement des sous-équipements (equipements/repo.py vers 803) ;
- `closed_by` d'une tâche close par une action (intervention_actions).

## Critères d'acceptation

- [x] Chaque cascade listée dépose un événement `is_system=True`, `SYSTEM_CASCADE`, auteur
      = utilisateur de la requête, old/new utiles, sur l'entité modifiée (type d'entité
      existant dans audit_rule ; s'il en manque un, s'arrêter et le signaler : pas de
      migration dans cette tâche).
- [x] La ligne « ouvert » écrite par le code à la création d'une intervention dans
      intervention_status_log porte `changed_by` = utilisateur de la requête (colonne
      ajoutée par CASC-01, migration 0022).
- [x] `closed_by` rempli à chaque passage d'une tâche à done ou skipped, toutes voies.
- [x] Test de garde d'intégration : déclenche chaque cascade et vérifie l'événement ;
      échoue si un chemin n'en dépose pas.
- [x] Aucune assertion existante affaiblie.
- [ ] scripts/check.sh vert ; test-integration.sh vert
- [ ] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait, par cascade (événement `is_system`, `SYSTEM_CASCADE`, auteur = jeton ; module commun
`api/audits/cascade.py`, SQL du préventif factorisé dans `api/preventive_occurrences/cascade.py`) :
- occurrence « in_progress » + tâches affectées ou datées : acceptation automatique,
  acceptation d'une demande (transition), création directe d'une intervention depuis une
  demande ; trois chemins qui dupliquaient le SQL passent par `attach_occurrence` ;
- occurrence « completed » : clôture de la demande, `on_intervention_closed`, et trigger
  `fn_sync_status_log_to_intervention` (avant/après dans `watch_trigger_closure`, déjà
  utilisé par la route des interventions et celle du journal de statut) ;
- `/repair` des occurrences (plan_id, tâches rattachées, occurrence liée ou complétée,
  demande close, tâches générées, `optional` resynchronisé) et `/repair` des demandes
  (lien `intervention_id` rétabli) ;
- regroupement d'achats : `created` ou `quantity_changed` sur `supplier_order_line` ;
- sous-équipements : `equipement_mere_changed` sur l'enfant ;
- `closed_by` : `NULLIF(current_setting('app.user_id', true), '')::uuid` dans les quatre
  UPDATE (done, skipped) des actions (création et modification) ;
- ligne « ouvert » : le trigger `trg_init_status_log` (migration interdite ici) l'écrit sans
  auteur ; `insert_intervention` complète `changed_by` juste après l'INSERT.
Tests : `tests/integration/test_casc03_evenements_des_cascades_integration.py` (9, gardes ;
5 échouent sans les correctifs des repos). Deux tests existants adaptés, sans affaiblir :
`test_acceptation_automatique_planifiee_motif_planifie` compte désormais 2 événements de
tâche au lieu de 1 (`created` + `updated` de l'acceptation, assertion rendue plus précise :
décision, motif, système, auteur) ; `test_assign_children_rattache_quand_tout_est_valide`
(unitaire) lie une unité d'audit et un identifiant valide, et vérifie en plus l'événement.
Restes signalés (hors fiche) : `request_status_log.changed_by` reste NULL dans les clôtures
écrites par le code (on_intervention_closed, repairs) ; `POST /intervention-status-log` n'écrit
pas `changed_by` ; `rattach_to_intervention` (intervention_tasks/repo.py) est du code mort.
