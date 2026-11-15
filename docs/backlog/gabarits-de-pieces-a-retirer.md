# Gabarits de pièces : fonctionnalité abandonnée, traces à retirer

L'utilisateur (2026-11-14) : les gabarits de pièces (part templates) ont été abandonnés ;
il en reste des traces, à nettoyer plus tard.

Inventaire du 2026-11-14 (grep et base de dev en lecture seule) :
- backend : domaine `api/part_templates/` (routes montées dans app.py, 3 routes qui
  modifient), `api/stock_items/template_service.py` et `template_schemas.py`, usages
  dans `stock_items/repo.py`, `stock_item_service.py`, `stock_sub_families/repo.py` ;
  permissions (test_default_permissions.py) ; exclusions d'audit (étape 3 d'AUDC) ;
- schéma : 24 mentions de part_template dans backend/db/schema.sql ;
- web : onglet StockTemplatesTab, PartTemplateDetail, PartTemplateCreateForm,
  PartTemplateFieldRow, usePartTemplates, api/partTemplates.js, choix d'un gabarit
  dans StockSubFamilyForm, codes de permission ;
- données de dev : 22 gabarits (dernier créé le 2026-05-21), 33 articles de stock avec
  template_id renseigné.

À décider avant le retrait : sort des 33 articles liés (template_id) et des 22 gabarits
(migration de suppression ou colonnes gardées en lecture), ordre du retrait (fronts,
routes, schéma), ADR si le retrait touche le schéma.
