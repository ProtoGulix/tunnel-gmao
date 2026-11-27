# ACD-01. API : interventions sans action et demandes issues d'un constat

- Statut : faite (2026-11-27)
- Agent : backend-dev
- Branche : feat/accueil-direction
- Dépend de : décisions de l'utilisateur du 2026-11-27 (accueil direction en file « à traiter », changements d'API acceptés)
- Périmètre d'écriture : backend/api/interventions/ (routes, schemas, repo), backend/api/intervention_requests/ (schemas, repo), backend/api/jobs/repo.py seulement pour partager le calcul, backend/tests/, docs/endpoints/ (interventions, intervention-requests), CHANGELOG.md, cette fiche. Exclu : migrations, autres domaines, fronts.

## Contexte

L'accueil direction doit lister les interventions sans action. Le calcul existe pour les
notifications (`JobsRepository.list_open_interventions_activity`, `jobs/repo.py:39` :
interventions non fermées, dernière activité = dernière action, sinon date de signalement ;
seuil `settings.REMINDER_INTERVAL_DAYS`). Il n'est exposé par aucune liste. De même, la liste
des demandes ne dit pas si une demande vient d'un constat (`constat.request_id`, facultatif).

## Critères d'acceptation

- [x] `GET /interventions?idle=true` ne rend que les interventions non fermées dont la dernière activité date d'au moins `REMINDER_INTERVAL_DAYS` jours ; même définition que le job (une seule requête SQL ou une fonction partagée, pas deux calculs divergents)
- [x] chaque ligne de `GET /interventions` porte `last_activity_date` et `days_without_action` (null pour une fermée)
- [x] chaque ligne de `GET /intervention-requests` porte `constat_id` (null si aucun constat ne cite la demande) ; pas de requête par ligne
- [x] tests : filtre idle (action récente exclue, sans action mais signalée récemment exclue, ancienne incluse, fermée exclue), constat_id présent ou null ; aucun test existant affaibli
- [x] docs/endpoints à jour ; textes sobres (CLAUDE.md 8.7)
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

- Définition partagée : `OPEN_INTERVENTION_SQL` et `LAST_ACTIVITY_SQL` dans `jobs/repo.py`, utilisées par le job de relance et par `GET /interventions` (filtre `idle`, count compris). Seuil : `date.today() - REMINDER_INTERVAL_DAYS` jours.
- `last_activity_date` et `days_without_action` ajoutés à chaque ligne ; les deux sont `null` pour une fermée.
- `constat_id` : jointure LATERAL dans la requête de liste, sur `constat.request_id` seulement (pas `linked_request_id`). Plusieurs constats sur une demande (versions corrigées) : le plus récent (`created_at DESC, id`).
- Tests : `tests/integration/test_acd01_inactivite_et_constat_integration.py` (3 tests, base jetable). Docs : `docs/api/endpoints/` (les fichiers de la fiche, `docs/endpoints/`, n'existent pas). CHANGELOG à jour.
