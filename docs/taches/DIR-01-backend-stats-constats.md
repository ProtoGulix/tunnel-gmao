# DIR-01. API : indicateurs des constats

- Statut : faite (2026-11-23)
- Agent : backend-dev (sonnet)
- Branche : feat/vue-direction-constats-dir01 (worktree depuis feat/vue-direction-constats)
- Dépend de : ADR 0044, ADR 0043, ADR 0007
- Périmètre d'écriture : backend/api/stats/ (routes, schemas, nouveau constats_repo.py),
  backend/tests/, docs/api/endpoints/stats.md (ou le fichier stats existant). Pas de migration,
  pas de changement de default_permissions.py (la règle de lecture par défaut suffit).

## Contexte

ADR 0044 : un composant web affiche quatre blocs sur les constats. Cette tâche fournit la route.
Données : backend/alembic/versions/0028_constat_intervention.py (constat, constat_answer,
constat_question, constat_choice) ; filtre de version courante `_NOT_SUPERSEDED` dans
backend/api/constats/repo.py. Les versions d'un constat partagent le même `request_id`.

## Contrat (fixé, le web l'utilise en parallèle)

`GET /stats/constats?start_date=AAAA-MM-JJ&end_date=AAAA-MM-JJ` (mêmes règles de dates et
même limiteur que `/stats/organisation`), réponse enveloppée comme les autres routes stats :

    {
      "period": {"start_date": "...", "end_date": "..."},
      "total": 4,
      "by_month": [{"month": "2026-11", "count": 4}],
      "levers": [{"code": "TASK", "label": "...", "suggested_type_inter": "PRE", "count": 1}],
      "signals": [{"code": "SIGNAL_SEEN", "label": "...", "count": 1}],
      "known_since": [{"code": "SINCE_GT_3M", "label": "...", "count": 2}],
      "outcomes": [{"code": "nouvelle", "label": "...", "color": "#hex", "count": 2}]
    }

- Constats comptés : version courante seulement, datés par la date de leur première version
  (min(created_at) des constats de même request_id), dans [start_date, end_date].
- `by_month` : tous les mois de la période, y compris à 0, ordre chronologique.
- `levers`, `signals`, `known_since` : choix des questions LEVER, SIGNAL, KNOWN_SINCE, dans
  l'ordre sort_order, choix actifs même à 0 ; un choix inactif n'apparaît que s'il a des réponses.
  Un constat à plusieurs leviers compte dans chacun.
- `outcomes` : statut de la demande issue du constat (request_status_ref : label, color), sauf
  si `linked_request_id` est renseigné : code `rattachee`, libellé « Rattachée à une idée »,
  couleur celle du statut rejetee. Ordre stable : nouvelle, en_attente, acceptee, cloturee,
  rejetee, rattachee ; statuts à 0 inclus.
- Aucun auteur, aucun technicien dans la réponse.

## Critères d'acceptation

- [x] tests d'intégration : comptes justes avec des constats créés par l'API (dont une correction
      qui ne change pas le mois ni le total, un constat rattaché, un hors période)
- [x] mois à 0 et choix à 0 présents ; période invalide refusée comme /stats/organisation
- [x] droit `stats:get_constats` : TECH, RESP, ACHETEUR et MCP lisent (règle par défaut), test
- [x] requêtes paramétrées, aucune erreur PostgreSQL brute au client
- [x] doc d'endpoint ; check.sh et test-integration.sh verts

## Compte rendu final

Fait (2026-11-23) : `GET /stats/constats` (constats_repo.py, schémas, route), doc dans
docs/api/endpoints/stats.md. Contrat respecté tel quel (période `start_date`/`end_date`).
Le devenir `rattachee` n'existe pas dans request_status_ref : libellé fixe, couleur de rejetee.
Tests : tests/test_stats_constats.py (unitaires) et tests/integration/test_stats_constats_integration.py
(10 tests : total, mois à 0, correction, rattaché, hors période, choix inactif, droits TECH/RESP/
ACHETEUR/MCP, refus 403, périodes invalides, absence d'auteur). Aucune migration.
