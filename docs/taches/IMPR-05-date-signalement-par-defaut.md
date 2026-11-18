# IMPR-05. Backend : une intervention a toujours une date de signalement

- Statut : faite (2026-11-17)
- Agent : backend-dev (sonnet)
- Branche : fix/historique-equipement-archivees, worktree de la sous-branche
  fix/historique-equipement-archivees-impr05
- Dépend de : IMPR-04 (en parallèle) ; accord de l'utilisateur du 2026-11-17
- Périmètre d'écriture : backend/api/interventions/ (repo.py, validators.py,
  schemas.py), backend/api/intervention_requests/repo.py (création d'intervention depuis
  une demande), backend/tests/, docs/api/endpoints/interventions.md, CHANGELOG.md
  (« Non publié »). Exclu : migrations, web, mobile.

## Contexte

`reported_date` est nullable et facultative à la création (POST /interventions,
création depuis une demande d'intervention : repo.py vers les lignes 850 et
intervention_requests/repo.py vers la ligne 935). Une intervention sans date sort de
toutes les périodes du tableau de bord d'un équipement (voir IMPR-04 pour l'historique).
Décision de l'utilisateur du 2026-11-17 : une intervention créée sans date de signalement
prend la date du jour.

## Critères d'acceptation

- [x] Création (les deux chemins) : `reported_date` absente ou null → date du jour
      (côté serveur) ; une date fournie est gardée
- [x] Mise à jour : `reported_date` explicitement null refusée (400, message en
      français) ; absente du corps = inchangée
- [x] Tests pytest des trois cas (création sans date, création avec date, mise à jour à
      null) sur les deux chemins de création
- [x] Doc de l'endpoint à jour ; scripts/check.sh vert ; CHANGELOG à jour

## Compte rendu final

Date du jour posée côté serveur (`date.today()`) dans les deux INSERT ; mise à jour : `validate_reported_date_not_null` (via `model_fields_set`, car `exclude_none` masque le null) lève 400. Tests : backend/tests/test_reported_date_defaut.py (9, base factice). Aucune migration.
