**Types TRAITÉS (ADR 0026, TYP-01 à TYP-04, 2026-11-20). Statuts RESTENT OUVERTS (vérifié le 2026-11-21) : libellés et couleurs toujours écrits en dur dans les fronts, l'écran Référentiel modifie `label` et `color` que rien ne lit.**

# Types et statuts d'intervention : la base comme source de vérité

Constat du 2026-11-14 (essai à l'écran de l'étape 4 de l'audit centralisé) : l'écran
Administration → Référentiel → Interventions modifie des tables que l'application ne lit pas.

- Types : les 8 types (CUR, PRE, REA, BAT, PRO, COF, PIL, MES) sont écrits en dur dans
  `backend/api/constants.py` (INTERVENTION_TYPES) et `web/src/config/interventionTypes.js`
  (et ailleurs côté fronts). La table `intervention_type` est vide en base de dev et n'est lue
  par rien d'autre que l'écran d'administration.
- Statuts : `intervention_status_ref` est lue par le métier (id, code), mais son libellé réel
  est dans la colonne `value` ; l'écran affiche et modifie `label` (NULL) et `color` (NULL).
  Libellés et couleurs affichés dans l'application : écrits en dur dans les fronts.

Décision de l'utilisateur (2026-11-14) : chantier à part, après l'étape 4. Plan à proposer :
ADR (la base devient la source de vérité), migration de données qui remplit les types et les
libellés/couleurs des statuts depuis les valeurs actuelles (accord pour la base de dev et la
production), backend et fronts qui lisent l'API au lieu des constantes, audit déjà en place
(étape 4).
