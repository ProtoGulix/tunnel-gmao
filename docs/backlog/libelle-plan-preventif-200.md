# Libellé d'un plan préventif limité à 200 caractères

`preventive_plan.label` (text) devient le titre des interventions générées
(`intervention.title`, varchar 200). Un libellé plus long fait échouer la génération en 400
(`validate_title`, correctif FTL du 2026-11-28) au lieu d'être refusé à la saisie du plan.
Piste : `max_length=200` sur les schémas du plan préventif. Relevé par la revue du 2026-11-28.
