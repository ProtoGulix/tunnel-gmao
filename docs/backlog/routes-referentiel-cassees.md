**TRAITÉ (SUIT-01, 2026-11-15) : les quatre routes ont été retirées du backend.**

# Routes de référentiel d'administration cassées

Constat du 2026-11-14 (inventaire de l'étape 4 de l'audit centralisé, vérifié sur la base de
dev) : quatre routes visent des colonnes absentes et répondent 500, alors que l'écran
d'administration web les appelle (web/src/api/adminReferentiel.js).

- PATCH /admin/action-categories/{category_id}/active : `action_category` n'a pas de
  colonne `is_active` (colonnes réelles : id, name, code, color).
- PATCH /admin/action-subcategories/{subcat_id}/active : idem pour `action_subcategory`
  (id, category_id, name, code).
- PATCH /admin/complexity-factors/{factor_id} et .../active : `complexity_factor` n'a ni
  `id` ni `is_active` (clé `code` texte ; colonnes : code, label, category).

Exclues de l'audit en attendant (backend/api/audits/exclusions.py). À décider avec
l'utilisateur : ajouter les colonnes (migration, changement de schéma) ou retirer les
routes et les boutons (changement d'API). Dans les deux cas, les auditer ensuite.
