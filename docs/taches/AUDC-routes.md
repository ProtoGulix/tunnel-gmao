# AUDC : inventaire des routes qui modifient

Généré par `backend/scripts/audit_routes.py` : ne pas éditer à la main, relancer le
script. Plan et décisions : [AUDC-plan.md](AUDC-plan.md).

125 routes.

| Étape | Préfixe | Méthode | Chemin | Fonction | Statut |
| --- | --- | --- | --- | --- | --- |
| 2 | equipements | POST | `/equipements` | create_equipement | à traiter étape 2 |
| 2 | equipements | DELETE | `/equipements/{equipement_id}` | delete_equipement | à traiter étape 2 |
| 2 | equipements | PATCH | `/equipements/{equipement_id}` | patch_equipement | à traiter étape 2 |
| 2 | equipements | PUT | `/equipements/{equipement_id}` | update_equipement | à traiter étape 2 |
| 2 | intervention-actions | POST | `/intervention-actions` | add_action | à traiter étape 2 |
| 2 | intervention-actions | DELETE | `/intervention-actions/{action_id}` | delete_action | à traiter étape 2 |
| 2 | intervention-actions | PATCH | `/intervention-actions/{action_id}` | patch_action | à traiter étape 2 |
| 2 | intervention-requests | POST | `/intervention-requests` | create_request | à traiter étape 2 |
| 2 | intervention-requests | POST | `/intervention-requests/repair` | repair_orphaned_requests | à traiter étape 2 |
| 2 | intervention-requests | DELETE | `/intervention-requests/{request_id}` | delete_request | à traiter étape 2 |
| 2 | intervention-requests | POST | `/intervention-requests/{request_id}/transition` | transition_request_status | déclarée (request) |
| 2 | intervention-status-log | POST | `/intervention-status-log` | create_status_log | à traiter étape 2 |
| 2 | intervention-tasks | POST | `/intervention-tasks` | create_task | à traiter étape 2 |
| 2 | intervention-tasks | DELETE | `/intervention-tasks/{task_id}` | delete_task | à traiter étape 2 |
| 2 | intervention-tasks | PATCH | `/intervention-tasks/{task_id}` | patch_task | à traiter étape 2 |
| 2 | interventions | POST | `/interventions` | create_intervention | déclarée (intervention) |
| 2 | interventions | DELETE | `/interventions/{intervention_id}` | delete_intervention | déclarée (intervention) |
| 2 | interventions | PUT | `/interventions/{intervention_id}` | update_intervention | à traiter étape 2 |
| 2 | interventions | POST | `/interventions/{intervention_id}/force-close-request` | force_close_linked_request | à traiter étape 2 |
| 2 | interventions | POST | `/interventions/{intervention_id}/request-pointage` | request_pointage | à traiter étape 2 |
| 2 | preventive-occurrences | POST | `/preventive-occurrences/generate` | generate_occurrences | à traiter étape 2 |
| 2 | preventive-occurrences | POST | `/preventive-occurrences/repair` | repair_occurrences | à traiter étape 2 |
| 2 | preventive-occurrences | PATCH | `/preventive-occurrences/{occurrence_id}/skip` | skip_occurrence | à traiter étape 2 |
| 2 | purchase-requests | POST | `/purchase-requests` | create_purchase_request | à traiter étape 2 |
| 2 | purchase-requests | POST | `/purchase-requests/dispatch` | dispatch_pending_requests | à traiter étape 2 |
| 2 | purchase-requests | POST | `/purchase-requests/import` | import_purchase_requests_from_csv | à traiter étape 2 |
| 2 | purchase-requests | POST | `/purchase-requests/import/headers` | get_csv_import_headers | à traiter étape 2 : POST sans écriture (AUDC-14), à valider avec l'utilisateur |
| 2 | purchase-requests | DELETE | `/purchase-requests/{request_id}` | delete_purchase_request | à traiter étape 2 |
| 2 | purchase-requests | PUT | `/purchase-requests/{request_id}` | update_purchase_request | à traiter étape 2 |
| 2 | supplier-orders | POST | `/supplier-orders` | create_supplier_order | à traiter étape 2 |
| 2 | supplier-orders | DELETE | `/supplier-orders/{order_id}` | delete_supplier_order | à traiter étape 2 |
| 2 | supplier-orders | PUT | `/supplier-orders/{order_id}` | update_supplier_order | à traiter étape 2 |
| 2 | supplier-orders | POST | `/supplier-orders/{order_id}/export/csv` | export_supplier_order_csv | déclarée (supplier_order) |
| 2 | supplier-orders | POST | `/supplier-orders/{order_id}/export/email` | export_supplier_order_email | à traiter étape 2 : POST sans écriture (AUDC-14), à valider avec l'utilisateur |
| 3 | manufacturer-items | POST | `/manufacturer-items` | create_manufacturer_item | à traiter étape 3 |
| 3 | manufacturer-items | DELETE | `/manufacturer-items/{item_id}` | delete_manufacturer_item | à traiter étape 3 |
| 3 | manufacturer-items | PATCH | `/manufacturer-items/{item_id}` | patch_manufacturer_item | à traiter étape 3 |
| 3 | part-templates | POST | `/part-templates` | create_template | à traiter étape 3 |
| 3 | part-templates | DELETE | `/part-templates/{template_id}` | delete_template | à traiter étape 3 |
| 3 | part-templates | POST | `/part-templates/{template_id}/versions` | create_template_version | à traiter étape 3 |
| 3 | parts | POST | `/parts` | create_part | à traiter étape 3 |
| 3 | parts | DELETE | `/parts/manufacturer-refs/{mfr_ref_id}` | delete_manufacturer_ref | à traiter étape 3 |
| 3 | parts | PATCH | `/parts/manufacturer-refs/{mfr_ref_id}` | update_manufacturer_ref | à traiter étape 3 |
| 3 | parts | POST | `/parts/manufacturer-refs/{mfr_ref_id}/set-preferred` | set_preferred_manufacturer_ref | à traiter étape 3 |
| 3 | parts | POST | `/parts/manufacturer-refs/{mfr_ref_id}/supplier-refs` | add_supplier_ref | à traiter étape 3 |
| 3 | parts | DELETE | `/parts/supplier-refs/{supplier_ref_id}` | delete_supplier_ref | à traiter étape 3 |
| 3 | parts | PATCH | `/parts/supplier-refs/{supplier_ref_id}` | update_supplier_ref | à traiter étape 3 |
| 3 | parts | POST | `/parts/supplier-refs/{supplier_ref_id}/set-preferred` | set_preferred_supplier_ref | à traiter étape 3 |
| 3 | parts | PATCH | `/parts/{part_id}` | update_part | à traiter étape 3 |
| 3 | parts | POST | `/parts/{part_id}/manufacturer-refs` | add_manufacturer_ref | à traiter étape 3 |
| 3 | preventive-plans | POST | `/preventive-plans` | create_preventive_plan | à traiter étape 3 |
| 3 | preventive-plans | DELETE | `/preventive-plans/{plan_id}` | delete_preventive_plan | à traiter étape 3 |
| 3 | preventive-plans | PUT | `/preventive-plans/{plan_id}` | update_preventive_plan | à traiter étape 3 |
| 3 | preventive-plans | PATCH | `/preventive-plans/{plan_id}/steps` | replace_plan_steps | à traiter étape 3 |
| 3 | stock-families | POST | `/stock-families` | create_stock_family | à traiter étape 3 |
| 3 | stock-families | PATCH | `/stock-families/{family_code}` | patch_stock_family | à traiter étape 3 |
| 3 | stock-item-suppliers | POST | `/stock-item-suppliers` | create_stock_item_supplier | à traiter étape 3 |
| 3 | stock-item-suppliers | DELETE | `/stock-item-suppliers/{ref_id}` | delete_stock_item_supplier | à traiter étape 3 |
| 3 | stock-item-suppliers | PUT | `/stock-item-suppliers/{ref_id}` | update_stock_item_supplier | à traiter étape 3 |
| 3 | stock-item-suppliers | POST | `/stock-item-suppliers/{ref_id}/set-preferred` | set_preferred_supplier | à traiter étape 3 |
| 3 | stock-items | POST | `/stock-items` | create_stock_item | à traiter étape 3 |
| 3 | stock-items | DELETE | `/stock-items/{item_id}` | delete_stock_item | à traiter étape 3 |
| 3 | stock-items | PUT | `/stock-items/{item_id}` | update_stock_item | à traiter étape 3 |
| 3 | stock-items | PATCH | `/stock-items/{item_id}/quantity` | update_stock_quantity | à traiter étape 3 |
| 3 | stock-sub-families | POST | `/stock-sub-families` | create_stock_sub_family | à traiter étape 3 |
| 3 | stock-sub-families | POST | `/stock-sub-families/{family_code}` | create_stock_sub_family_in_family | à traiter étape 3 |
| 3 | stock-sub-families | PATCH | `/stock-sub-families/{family_code}/{sub_family_code}` | update_stock_sub_family | à traiter étape 3 |
| 3 | supplier-order-lines | POST | `/supplier-order-lines` | create_supplier_order_line | à traiter étape 3 |
| 3 | supplier-order-lines | DELETE | `/supplier-order-lines/{line_id}` | delete_supplier_order_line | à traiter étape 3 |
| 3 | supplier-order-lines | PATCH | `/supplier-order-lines/{line_id}` | patch_supplier_order_line | à traiter étape 3 |
| 3 | supplier-order-lines | PUT | `/supplier-order-lines/{line_id}` | update_supplier_order_line | à traiter étape 3 |
| 3 | supplier-order-lines | POST | `/supplier-order-lines/{line_id}/purchase-requests` | link_purchase_request | à traiter étape 3 |
| 3 | supplier-order-lines | DELETE | `/supplier-order-lines/{line_id}/purchase-requests/{purchase_request_id}` | unlink_purchase_request | à traiter étape 3 |
| 3 | suppliers | POST | `/suppliers` | create_supplier | à traiter étape 3 |
| 3 | suppliers | DELETE | `/suppliers/{supplier_id}` | delete_supplier | à traiter étape 3 |
| 3 | suppliers | PUT | `/suppliers/{supplier_id}` | update_supplier | à traiter étape 3 |
| 4 | admin | PATCH | `/admin/action-categories/{category_id}` | patch_action_category | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/action-categories/{category_id}/active` | patch_action_category_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/action-subcategories` | create_action_subcategory | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/action-subcategories/{subcat_id}` | patch_action_subcategory | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/action-subcategories/{subcat_id}/active` | patch_action_subcategory_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/audit-reasons` | create_audit_reason | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/audit-reasons/{reason_id}` | update_audit_reason | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/audit-reasons/{reason_id}/active` | patch_audit_reason_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/audit-rules` | create_audit_rule | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/audit-rules/{rule_id}` | update_audit_rule | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/complexity-factors/{factor_id}` | patch_complexity_factor | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/complexity-factors/{factor_id}/active` | patch_complexity_factor_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/email-domain-rules` | add_email_domain_rule | à traiter étape 4 |
| 4 | admin | DELETE | `/admin/email-domain-rules/{rule_id}` | remove_email_domain_rule | à traiter étape 4 |
| 4 | admin | POST | `/admin/endpoints/sync` | sync_endpoints | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/endpoints/{endpoint_id}` | patch_endpoint | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/intervention-statuses/{status_code}` | patch_intervention_status | à traiter étape 4 |
| 4 | admin | POST | `/admin/intervention-types` | create_intervention_type | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/intervention-types/{type_id}` | patch_intervention_type | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/intervention-types/{type_id}/active` | patch_intervention_type_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/ip-blocklist` | add_ip_block | à traiter étape 4 |
| 4 | admin | DELETE | `/admin/ip-blocklist/{block_id}` | remove_ip_block | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/permissions/{permission_id}` | patch_permission | à traiter étape 4 |
| 4 | admin | POST | `/admin/settings/mail/test` | test_mail | à traiter étape 4 : POST sans écriture (AUDC-14), à valider avec l'utilisateur |
| 4 | admin | POST | `/admin/users` | create_user | à traiter étape 4 |
| 4 | admin | DELETE | `/admin/users/{user_id}` | delete_user | à traiter étape 4 |
| 4 | admin | PUT | `/admin/users/{user_id}` | update_user | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/users/{user_id}/active` | patch_user_active | à traiter étape 4 |
| 4 | admin | POST | `/admin/users/{user_id}/reset-password` | reset_password | à traiter étape 4 |
| 4 | admin | PATCH | `/admin/users/{user_id}/role` | patch_user_role | à traiter étape 4 |
| 4 | api-keys | POST | `/api-keys` | create_api_key | à traiter étape 4 |
| 4 | api-keys | DELETE | `/api-keys/{key_id}` | delete_api_key | à traiter étape 4 |
| 4 | api-keys | PATCH | `/api-keys/{key_id}` | update_api_key | à traiter étape 4 |
| 4 | audit | POST | `/audit/log` | create_log | à traiter étape 4 |
| 4 | auth | POST | `/auth/login` | login | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | auth | POST | `/auth/logout` | logout | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | auth | POST | `/auth/refresh` | refresh_token | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | equipement-class | POST | `/equipement-class` | create_equipement_class | à traiter étape 4 |
| 4 | equipement-class | DELETE | `/equipement-class/{class_id}` | delete_equipement_class | à traiter étape 4 |
| 4 | equipement-class | PATCH | `/equipement-class/{class_id}` | update_equipement_class | à traiter étape 4 |
| 4 | home-view | DELETE | `/home-view/admin/assignments/{role_id}` | delete_home_view_assignment | à traiter étape 4 |
| 4 | home-view | PUT | `/home-view/admin/assignments/{role_id}` | upsert_home_view_assignment | à traiter étape 4 |
| 4 | notifications | PATCH | `/notifications/read-all` | mark_all_read | à traiter étape 4 |
| 4 | notifications | PATCH | `/notifications/{notification_id}/read` | mark_read | à traiter étape 4 |
| 4 | services | POST | `/services` | create_service | à traiter étape 4 |
| 4 | services | PATCH | `/services/{service_id}` | update_service | à traiter étape 4 |
| 4 | users | PATCH | `/users/me/changelog-seen` | mark_my_changelog_seen | à traiter étape 4 |
| 4 | users | POST | `/users/me/password` | change_my_password | à traiter étape 4 |
| 4 | users | PATCH | `/users/me/profile` | update_my_profile | à traiter étape 4 |
