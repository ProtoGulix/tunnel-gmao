# AUDC-24. Occurrences préventives sous l'audit centralisé

- Statut : faite (2026-11-14)
- Agent : backend-dev
- Branche : refactor/audit-etape-2
- Dépend de : ADR 0018 (points 1 bis, 1 quater, 1 quinquies, 6), AUDC-28 (SYSTEM_CASCADE)
- Périmètre d'écriture : `backend/api/preventive_occurrences/`, `backend/api/transaction.py`
  (retrait de l'exclusion temporaire de /generate seulement), `backend/api/audits/exclusions.py`,
  tests (nouveaux tests ; le test d'AUDC-15 sur le succès partiel de la génération est
  à adapter : signaler avant de le changer), `docs/api/endpoints/` du domaine, CHANGELOG.
  Exclus : socle d'audit, autres domaines (appels aux repos des demandes et interventions
  permis), fronts, migrations.

## Contexte

`generate_occurrences` (preventive_occurrences/repo.py:202) traite chaque machine dans
sa propre transaction et avale les erreurs (`except Exception` → `errors`), avec des
`conn.rollback()` sur conflit (ligne 391) et ailleurs (444, 447, 509). Décision de
l'utilisateur (ADR 0018, 1 quinquies) : tout ou rien. Les cas prévisibles (occurrence
déjà générée, conflit de code, plan sans machine, machine sans compteur) sont vérifiés
avant d'écrire et rapportés sans erreur ; une erreur SQL annule toute la génération
(500). La génération crée des demandes système, et une intervention en acceptation
automatique (auto_accept) : chaque création écrit son événement du système.
Les courriels « di_a_traiter » partent en BackgroundTasks après validation (ADR 0018,
1 ter) : à garder ainsi.

## Critères d'acceptation

- [x] tests qui échouent d'abord, puis passent :
  - génération avec un conflit prévisible : 200, rapport (skipped_conflicts), les autres
    occurrences créées, aucun rollback() de repo
  - erreur SQL pendant la génération : 500, aucune occurrence, demande ni intervention
    créée
  - chaque occurrence, demande et intervention créée par la génération : un événement
    `created`, is_system, motif SYSTEM_CASCADE, auteur = jeton
- [x] aucun `conn.rollback()` ni SAVEPOINT dans le chemin de la génération
- [x] /generate, /repair et /{id}/skip déclarés (events_only quand pas d'entité propre),
      exclusions retirées, exclusion temporaire de api/transaction.py retirée, inventaire
      régénéré
- [x] skip : motif de la requête validé par le middleware ; `skip_reason` texte gardé tel
      quel (le passage à un motif d'audit est au chantier « changements hors travail
      normal », ne pas le faire ici)
- [x] check.sh vert, test-integration.sh vert ; CHANGELOG « Non publié »

## Compte rendu final

backend-dev (2026-11-14) : tests d'abord (backend/tests/integration/
test_audc24_preventif_integration.py, 4 tests ; backend/tests/test_preventif_sans_rollback.py),
vérifiés en échec avant le code (atomicité, événements, skip non audité ; le test du conflit
passait grâce à l'exclusion, il vérifie désormais l'absence de rollback sous la transaction).

- Génération tout ou rien : conflit vérifié par SELECT avant l'INSERT (plus de
  ON CONFLICT ni de rollback), plan sans classe ignoré, erreur de chargement des machines
  remontée, `except Exception` retirés, auto-accept sans avalement. Plus aucun `rollback()` ni
  SAVEPOINT dans le repo (`/repair` et `skip` compris).
- Événements `created` (is_system, SYSTEM_CASCADE) : `preventive_occurrence`, `request`
  (demande système), `intervention` (auto-accept) ; helper `_record_system_created`.
- Routes : `generate` et `repair` en `audit("request", events_only=True)` ; `skip` en
  `audit("preventive_occurrence", id_from_path=..., table=...)`. Exclusions retirées
  (exclusions.py, `_TEMPORARY_EXCLUSIONS` de transaction.py). Inventaire régénéré (125 routes).
- Bug trouvé : l'auto-accept n'a jamais pu créer l'intervention (type « PREV » inconnu, titre
  NOT NULL absent), l'erreur était avalée. Corrigé (type « PRE », titre = libellé du plan), sinon
  tout ou rien aurait rendu /generate en 500 pour tout plan auto_accept.

Test existant d'AUDC-15 (succès partiel, conflit) : non modifié, compatible avec « tout ou
rien » (conflit rapporté, 200). Assertion modifiée malgré tout : tests/test_transaction_exclusions.py
fige `_TEMPORARY_EXCLUSIONS` ; l'entrée de /generate en est retirée (inévitable).

Docs : docs/api/endpoints/preventive-occurrences.md, CHANGELOG, AUDC-routes.md.

BESOIN DE MIGRATION (non faite) : `skip` déclare `preventive_occurrence`, qui n'a ni règle
d'audit (audit_rule) ni ROUTINE dans ses entity_types ; sans migration, PATCH .../skip répond
400 en production. Le test pose ces lignes dans la base jetable.

Contrôle de l'agent principal (2026-11-14) : diff conforme ; une assertion changée et
acceptée (test_transaction_exclusions.py fige la liste des exclusions temporaires :
/generate en sort, c'est l'objet de la tâche). check.sh vert (212 passed) ;
test-integration.sh 202 passed. Base de dev : aucun plan auto_accept (0), le bogue
d'acceptation automatique corrigé (type PREV inconnu, titre absent) n'a donc jamais eu
d'effet visible ici. Ouvert : PATCH /preventive-occurrences/{id}/skip répond 400 sans
règle d'audit pour preventive_occurrence (migration à décider par l'utilisateur) ;
liaison de la demande à l'intervention (nouvelle → acceptee par POST /interventions) sans
événement d'audit.

Règle d'audit de l'occurrence : faite par AUDC-29 (migration 0008).
