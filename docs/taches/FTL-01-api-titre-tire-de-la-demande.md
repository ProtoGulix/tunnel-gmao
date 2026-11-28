# FTL-01. API : titre d'une intervention tiré de sa demande

- Statut : fait
- Agent : backend-dev
- Branche : fix/acceptation-titre-long
- Dépend de : ADR 0025 (une seule insertion d'intervention)
- Périmètre d'écriture : backend/api/interventions/ (repo, validators, schemas si besoin), backend/api/intervention_requests/ (acceptation), backend/tests/, docs/api/endpoints/ (interventions, demandes), CHANGELOG.md, cette fiche. Exclu : migrations, fronts.

## Contexte

`intervention.title` est un varchar(200). À l'acceptation, le titre reprend la description de la demande ; une demande issue d'un constat (ADR 0045) dépasse 200 caractères (257 en dev) : PostgreSQL refuse, l'API répond 500 « Erreur base de données » (constaté le 2026-11-28 sur DI-2026-0297). Même chose par `POST /interventions` avec `request_id`.

## Critères d'acceptation

- [x] sans titre fourni, `insert_intervention` tire le titre de la description de la demande liée (existante ou créée dans le même geste), coupé à 200 caractères au plus sur une frontière de mot avec « … » ; constante nommée pour 200
- [x] titre fourni de plus de 200 caractères : 400 métier clair (validator), jamais 500
- [x] `POST /intervention-requests/{id}/transition` vers acceptee et `POST /interventions` (request_id et request) : tests d'intégration avec une description de 257 caractères, titre attendu exact
- [x] titre fourni court : inchangé (test)
- [x] docs/api/endpoints ; check.sh et test-integration.sh verts ; CHANGELOG (correctif)

## Compte rendu

- `title_from_description` et `TITLE_MAX_LENGTH` (api/interventions/validators.py) : seul endroit de la règle ; `insert_intervention` l'applique (demande lue dans la même transaction), `validate_title` refuse un titre fourni trop long (400), sans titre ni description : 400. `or request.get("description")` retiré de l'acceptation.
- Tests : tests/test_titre_intervention.py (unitaires), tests/integration/test_ftl01_titre_demande_integration.py.
