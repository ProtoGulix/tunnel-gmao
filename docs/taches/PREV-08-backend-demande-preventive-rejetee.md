# PREV-08. Backend : demande préventive rejetée, occurrence ignorée et régénérée

- Statut : faite (2026-11-18)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-automatise, worktree d'une sous-branche
  feat/preventif-automatise-prev08
- Dépend de : PREV-01, PREV-02
- Périmètre d'écriture : backend/api/intervention_requests/repo.py (transition vers
  `rejetee`), backend/api/preventive_occurrences/repo.py (référence et génération),
  backend/api/jobs/repo.py (retards), backend/tests/, docs/api/endpoints/ (fichiers des domaines), CHANGELOG.md
  (« Non publié »). Exclu : fronts, migrations, schéma, correction des données existantes.

## Contexte

Essai de l'utilisateur du 2026-11-18 : un préventif apparaît en retard alors que sa
demande a été rejetée (BRO_GRAISSAGE sur BRO003, DI-2026-0065). Le rejet ne touche pas
l'occurrence, qui reste `generated` : active pour toujours, elle bloque aussi toute
nouvelle génération du couple. Décision de l'utilisateur du 2026-11-18 : l'occurrence
d'une demande rejetée est **ignorée** et le préventif est **régénéré tout de suite** (au
passage suivant). Les données existantes ne sont pas corrigées ici
(docs/backlog/occurrences-incoherentes.md).

## Critères d'acceptation

- [x] Au passage d'une demande à `rejetee`, l'occurrence active liée (`di_id`) passe à
      `skipped`, `skip_reason` = « Demande rejetée », dans la même transaction que le
      rejet ; événement d'audit système (`is_system`, motif `system_reason_code()`) sur
      l'occurrence. Le rejet garde son propre motif (inchangé)
- [x] Une occurrence ignorée dont la demande est rejetée ne sert pas de référence
      (`_LAST_TERMINATED_LATERAL`, source unique de l'échéancier et de la génération) :
      l'échéance reste celle d'avant, donc l'échéancier la montre en retard et la
      génération suivante recrée une occurrence. Les autres `skipped` restent une
      référence (règle inchangée)
- [x] Régénération : si l'échéance calculée est déjà prise par une occurrence du même
      couple (contrainte unique plan, machine, date), `scheduled_date` = aujourd'hui ;
      sinon l'échéance. Aucun conflit compté pour ce cas
- [x] Tests (intégration) : rejet → occurrence `skipped` + audit ; échéancier en retard
      après rejet ; génération suivante crée une nouvelle occurrence et une nouvelle
      demande ; rejet d'une demande non préventive inchangé ; demande refusée sans
      occurrence active : rien
- [x] Machines hors service exclues (génération, échéancier, retards) : décision de
      l'utilisateur du 2026-11-18, seules les machines dont le statut a le code `EN_SERVICE`
      (testé par code, jamais par id) sont concernées ; occurrences existantes inchangées
- [x] scripts/check.sh et test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

Fait. Rejet : l'occurrence active (`pending`/`generated`) liée passe à `skipped`
(« Demande rejetée », `di_id` conservé, ce qui remplace l'ancien retour à `pending` avec
`di_id` vidé) ; deux événements système `status_changed` et `skip_reason_changed`
(SYSTEM_CASCADE), comme le skip manuel. `_LAST_TERMINATED_LATERAL` et la référence du plan
par heures excluent ces occurrences. Génération : échéance déjà prise, date du jour.
Machines hors service : filtre `EN_SERVICE` par code dans la génération, l'échéancier et la
liste des retards (jobs/repo.py). Tests : test_preventif_demande_rejetee_integration.py.
Intégration 401 verts, check.sh vert. Données existantes non corrigées.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre (élargi à
backend/api/jobs/repo.py par l'ajout « machines hors service » ; la requête de référence
des plans par heures reçoit la même exclusion des rejets, accepté). L'ancien code remettait
l'occurrence d'une demande rejetée en `pending` en vidant `di_id` : remplacé. Après fusion :
check.sh vert, test-integration.sh vert (401 passed). Échéancier relu sur la base de dev
(lecture) : 39 lignes, 23 en retard, 16 à jour, BRO003 (rebut) absente.

Décision de l'utilisateur du 2026-11-18 : les machines « À l'arrêt » restent exclues comme les autres statuts hors service (solution la plus simple, déjà en place).
