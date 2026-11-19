# Dette du backend (tri du 2026-11-19)

Points ouverts des anciens backlogs et des suites d'étapes, avec preuve.

Règles à trancher :
- Garde de clôture en double, règles différentes : Python pour toute intervention
  (api/interventions/repo.py:1083-1110), trigger seulement avec plan_id (db/schema.sql:85-101).
- `is_complete` faux quand une occurrence n'a aucune tâche (api/intervention_tasks/repo.py:205,248,
  schemas.py:90).
- `skip_occurrence` limité à `pending` (api/preventive_occurrences/repo.py:473,488).
- Réparation préventive : resync de `optional` sans verrou (`optional_locked` absent) et
  ancienne valeur non journalisée (api/preventive_occurrences/repo.py:1250-1272) ; pas de
  test d'idempotence de repair.

Ménage :
- `datetime.now()` sans fuseau (intervention_tasks/repo.py:717, purchase_requests/repo.py:115,177,
  intervention_actions/repo.py:653,872, validators.py:121, exports/routes.py, pdf_generator.py:30,
  jobs/scheduler.py:102) : voir coherence-decimal-et-timezone.md.
- Seuils en dur (supplier_orders/repo.py:67-68, constants.py:9, equipements/routes.py:34) :
  voir magic-numbers-en-config.md.
- 108 `class Config` Pydantic à convertir en `model_config`.
- 3 `response_model=dict` restants.
- LOG_LEVEL non configurable (api/app.py:88-90).
- `get_active_status_ids` sans appelant (api/intervention_status/repo.py:35).
- DIRECTUS_KEY encore dans backend/.env.example.
- Booléens mal nommés (`printed_fiche`, `interventions` de equipement_statuts) : renommage coûteux.
- Migration 0004 : forme `MAX(id)+1 ... NOT EXISTS` (sans effet si jouée une fois).
- Pas de document d'architecture du backend (docs/guides/conventions-backend.md seul).
- NON VÉRIFIÉ : cohérence PATCH et PUT route par route.
