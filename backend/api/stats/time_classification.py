"""Classement du temps des actions (PROD, DEP, PILOT, FRAG) : règle unique du Bilan du service.

Le calcul des totaux et celui de la série mensuelle de /stats/service-status partagent ce
texte SQL, pour que la somme des mois égale toujours le total de la période.
Deux paramètres %s : début et fin de la période (sur created_at de l'action).
"""

CLASSIFIED_ACTIONS_CTE = """
classified_actions AS (
  SELECT
    ia.id,
    ia.time_spent,
    ia.created_at,
    to_char(ia.created_at, 'YYYY-MM') as month,
    ia.action_subcategory,
    s.name as subcategory_name,
    c.id as category_id,
    c.code as category_code,
    i.machine_id,
    m.equipement_mere,
    m.is_mere,
    m.name as machine_name,
    parent.name as parent_name,
    CASE
      WHEN c.id = 23 THEN 'FRAG'
      WHEN c.code = 'SUP' THEN 'FRAG'
      WHEN ia.time_spent < 0.5 AND c.code NOT IN ('DEP', 'PREV') THEN 'FRAG'
      WHEN c.id = 19 THEN 'DEP'
      WHEN c.id IN (20, 24) THEN 'PROD'
      WHEN c.id IN (21, 22) THEN 'PILOT'
      ELSE 'PROD'
    END as time_type
  FROM intervention_action ia
  JOIN intervention i ON ia.intervention_id = i.id
  LEFT JOIN action_subcategory s ON ia.action_subcategory = s.id
  LEFT JOIN action_category c ON s.category_id = c.id
  LEFT JOIN machine m ON i.machine_id = m.id
  LEFT JOIN machine parent ON m.equipement_mere = parent.id
  WHERE ia.created_at >= %s AND ia.created_at <= %s
)
"""
