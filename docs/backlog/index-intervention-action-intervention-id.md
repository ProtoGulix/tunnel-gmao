# Index sur intervention_action.intervention_id

Constaté le 2026-11-27 (revue du chantier ACD) : aucun index sur
`intervention_action.intervention_id`. La dernière activité d'une intervention
(`LAST_ACTIVITY_SQL`, api/jobs/repo.py) est une sous-requête corrélée évaluée par ligne de
`GET /interventions` et dans le filtre `idle`. Coût faible au volume actuel (environ 400
interventions), NON VÉRIFIÉ en mesure. Changement de schéma : migration et accord de
l'utilisateur. Variante : tri `last_activity_date` côté API pour la section « Sans action »
de l'accueil direction, aujourd'hui triée par date de signalement avant plafond.
