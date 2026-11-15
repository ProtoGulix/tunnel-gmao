# AUDC : inventaire des routes qui modifient

Généré par `backend/scripts/audit_routes.py` : ne pas éditer à la main, relancer le
script. Plan et décisions : [AUDC-plan.md](AUDC-plan.md).

125 routes.

| Étape | Préfixe | Méthode | Chemin | Fonction | Statut |
| --- | --- | --- | --- | --- | --- |
| 2 | equipements | POST | `/equipements` | create_equipement | déclarée (equipement) |
| 2 | equipements | DELETE | `/equipements/{equipement_id}` | delete_equipement | déclarée (equipement) |
| 2 | equipements | PATCH | `/equipements/{equipement_id}` | patch_equipement | déclarée (equipement) |
| 2 | equipements | PUT | `/equipements/{equipement_id}` | update_equipement | déclarée (equipement) |
| 2 | intervention-actions | POST | `/intervention-actions` | add_action | déclarée (action) |
| 2 | intervention-actions | DELETE | `/intervention-actions/{action_id}` | delete_action | déclarée (action) |
| 2 | intervention-actions | PATCH | `/intervention-actions/{action_id}` | patch_action | déclarée (action) |
| 2 | intervention-requests | POST | `/intervention-requests` | create_request | déclarée (request) |
| 2 | intervention-requests | POST | `/intervention-requests/repair` | repair_orphaned_requests | déclarée (request) |
| 2 | intervention-requests | DELETE | `/intervention-requests/{request_id}` | delete_request | déclarée (request) |
| 2 | intervention-requests | POST | `/intervention-requests/{request_id}/transition` | transition_request_status | déclarée (request) |
| 2 | intervention-status-log | POST | `/intervention-status-log` | create_status_log | déclarée (intervention) |
| 2 | intervention-tasks | POST | `/intervention-tasks` | create_task | déclarée (task) |
| 2 | intervention-tasks | DELETE | `/intervention-tasks/{task_id}` | delete_task | déclarée (task) |
| 2 | intervention-tasks | PATCH | `/intervention-tasks/{task_id}` | patch_task | déclarée (task) |
| 2 | interventions | POST | `/interventions` | create_intervention | déclarée (intervention) |
| 2 | interventions | DELETE | `/interventions/{intervention_id}` | delete_intervention | déclarée (intervention) |
| 2 | interventions | PUT | `/interventions/{intervention_id}` | update_intervention | déclarée (intervention) |
| 2 | interventions | POST | `/interventions/{intervention_id}/force-close-request` | force_close_linked_request | déclarée (intervention) |
| 2 | interventions | POST | `/interventions/{intervention_id}/request-pointage` | request_pointage | déclarée (intervention) |
| 2 | preventive-occurrences | POST | `/preventive-occurrences/generate` | generate_occurrences | déclarée (request) |
| 2 | preventive-occurrences | POST | `/preventive-occurrences/repair` | repair_occurrences | déclarée (request) |
| 2 | preventive-occurrences | PATCH | `/preventive-occurrences/{occurrence_id}/skip` | skip_occurrence | déclarée (preventive_occurrence) |
| 2 | purchase-requests | POST | `/purchase-requests` | create_purchase_request | déclarée (purchase_request) |
| 2 | purchase-requests | POST | `/purchase-requests/dispatch` | dispatch_pending_requests | déclarée (purchase_request) |
| 2 | purchase-requests | POST | `/purchase-requests/import` | import_purchase_requests_from_csv | déclarée (purchase_request) |
| 2 | purchase-requests | POST | `/purchase-requests/import/headers` | get_csv_import_headers | ne modifie rien : Lit le CSV envoyé et renvoie ses colonnes : n'ouvre aucune écriture en base (AUDC-25) |
| 2 | purchase-requests | DELETE | `/purchase-requests/{request_id}` | delete_purchase_request | déclarée (purchase_request) |
| 2 | purchase-requests | PUT | `/purchase-requests/{request_id}` | update_purchase_request | déclarée (purchase_request) |
| 2 | supplier-orders | POST | `/supplier-orders` | create_supplier_order | déclarée (supplier_order) |
| 2 | supplier-orders | DELETE | `/supplier-orders/{order_id}` | delete_supplier_order | déclarée (supplier_order) |
| 2 | supplier-orders | PUT | `/supplier-orders/{order_id}` | update_supplier_order | déclarée (supplier_order) |
| 2 | supplier-orders | POST | `/supplier-orders/{order_id}/export/csv` | export_supplier_order_csv | déclarée (supplier_order) |
| 2 | supplier-orders | POST | `/supplier-orders/{order_id}/export/email` | export_supplier_order_email | ne modifie rien : Compose le courriel depuis des SELECT (get_export_data) : aucune écriture (AUDC-25) |
| 3 | manufacturer-items | POST | `/manufacturer-items` | create_manufacturer_item | déclarée (manufacturer_item) |
| 3 | manufacturer-items | DELETE | `/manufacturer-items/{item_id}` | delete_manufacturer_item | déclarée (manufacturer_item) |
| 3 | manufacturer-items | PATCH | `/manufacturer-items/{item_id}` | patch_manufacturer_item | déclarée (manufacturer_item) |
| 3 | part-templates | POST | `/part-templates` | create_template | exclue : Fonctionnalité abandonnée, retrait au backlog (docs/backlog/gabarits-de-pieces-a-retirer.md) |
| 3 | part-templates | DELETE | `/part-templates/{template_id}` | delete_template | exclue : Fonctionnalité abandonnée, retrait au backlog (docs/backlog/gabarits-de-pieces-a-retirer.md) |
| 3 | part-templates | POST | `/part-templates/{template_id}/versions` | create_template_version | exclue : Fonctionnalité abandonnée, retrait au backlog (docs/backlog/gabarits-de-pieces-a-retirer.md) |
| 3 | parts | POST | `/parts` | create_part | déclarée (part) |
| 3 | parts | DELETE | `/parts/manufacturer-refs/{mfr_ref_id}` | delete_manufacturer_ref | déclarée (part_manufacturer_ref) |
| 3 | parts | PATCH | `/parts/manufacturer-refs/{mfr_ref_id}` | update_manufacturer_ref | déclarée (part_manufacturer_ref) |
| 3 | parts | POST | `/parts/manufacturer-refs/{mfr_ref_id}/set-preferred` | set_preferred_manufacturer_ref | déclarée (part_manufacturer_ref) |
| 3 | parts | POST | `/parts/manufacturer-refs/{mfr_ref_id}/supplier-refs` | add_supplier_ref | déclarée (part_supplier_ref) |
| 3 | parts | DELETE | `/parts/supplier-refs/{supplier_ref_id}` | delete_supplier_ref | déclarée (part_supplier_ref) |
| 3 | parts | PATCH | `/parts/supplier-refs/{supplier_ref_id}` | update_supplier_ref | déclarée (part_supplier_ref) |
| 3 | parts | POST | `/parts/supplier-refs/{supplier_ref_id}/set-preferred` | set_preferred_supplier_ref | déclarée (part_supplier_ref) |
| 3 | parts | PATCH | `/parts/{part_id}` | update_part | déclarée (part) |
| 3 | parts | POST | `/parts/{part_id}/manufacturer-refs` | add_manufacturer_ref | déclarée (part_manufacturer_ref) |
| 3 | preventive-plans | POST | `/preventive-plans` | create_preventive_plan | déclarée (preventive_plan) |
| 3 | preventive-plans | DELETE | `/preventive-plans/{plan_id}` | delete_preventive_plan | déclarée (preventive_plan) |
| 3 | preventive-plans | PUT | `/preventive-plans/{plan_id}` | update_preventive_plan | déclarée (preventive_plan) |
| 3 | preventive-plans | POST | `/preventive-plans/{plan_id}/reactivate` | reactivate_preventive_plan | déclarée (preventive_plan) |
| 3 | preventive-plans | PATCH | `/preventive-plans/{plan_id}/steps` | replace_plan_steps | déclarée (preventive_plan) |
| 3 | stock-families | POST | `/stock-families` | create_stock_family | déclarée (stock_family) |
| 3 | stock-families | PATCH | `/stock-families/{family_code}` | patch_stock_family | déclarée (stock_family) |
| 3 | stock-item-suppliers | POST | `/stock-item-suppliers` | create_stock_item_supplier | déclarée (stock_item_supplier) |
| 3 | stock-item-suppliers | DELETE | `/stock-item-suppliers/{ref_id}` | delete_stock_item_supplier | déclarée (stock_item_supplier) |
| 3 | stock-item-suppliers | PUT | `/stock-item-suppliers/{ref_id}` | update_stock_item_supplier | déclarée (stock_item_supplier) |
| 3 | stock-item-suppliers | POST | `/stock-item-suppliers/{ref_id}/set-preferred` | set_preferred_supplier | déclarée (stock_item_supplier) |
| 3 | stock-items | POST | `/stock-items` | create_stock_item | déclarée (stock_item) |
| 3 | stock-items | DELETE | `/stock-items/{item_id}` | delete_stock_item | déclarée (stock_item) |
| 3 | stock-items | PUT | `/stock-items/{item_id}` | update_stock_item | déclarée (stock_item) |
| 3 | stock-items | PATCH | `/stock-items/{item_id}/quantity` | update_stock_quantity | déclarée (stock_item) |
| 3 | stock-sub-families | POST | `/stock-sub-families` | create_stock_sub_family | déclarée (stock_sub_family) |
| 3 | stock-sub-families | POST | `/stock-sub-families/{family_code}` | create_stock_sub_family_in_family | déclarée (stock_sub_family) |
| 3 | stock-sub-families | PATCH | `/stock-sub-families/{family_code}/{sub_family_code}` | update_stock_sub_family | déclarée (stock_sub_family) |
| 3 | supplier-order-lines | POST | `/supplier-order-lines` | create_supplier_order_line | déclarée (supplier_order_line) |
| 3 | supplier-order-lines | DELETE | `/supplier-order-lines/{line_id}` | delete_supplier_order_line | déclarée (supplier_order_line) |
| 3 | supplier-order-lines | PATCH | `/supplier-order-lines/{line_id}` | patch_supplier_order_line | déclarée (supplier_order_line) |
| 3 | supplier-order-lines | PUT | `/supplier-order-lines/{line_id}` | update_supplier_order_line | déclarée (supplier_order_line) |
| 3 | supplier-order-lines | POST | `/supplier-order-lines/{line_id}/purchase-requests` | link_purchase_request | déclarée (supplier_order_line) |
| 3 | supplier-order-lines | DELETE | `/supplier-order-lines/{line_id}/purchase-requests/{purchase_request_id}` | unlink_purchase_request | déclarée (supplier_order_line) |
| 3 | suppliers | POST | `/suppliers` | create_supplier | déclarée (supplier) |
| 3 | suppliers | DELETE | `/suppliers/{supplier_id}` | delete_supplier | déclarée (supplier) |
| 3 | suppliers | PUT | `/suppliers/{supplier_id}` | update_supplier | déclarée (supplier) |
| 4 | admin | PATCH | `/admin/action-categories/{category_id}` | patch_action_category | déclarée (action_category) |
| 4 | admin | PATCH | `/admin/action-categories/{category_id}/active` | patch_action_category_active | exclue : Route cassée (colonne absente en base), à réparer ou retirer : docs/backlog/routes-referentiel-cassees.md |
| 4 | admin | POST | `/admin/action-subcategories` | create_action_subcategory | déclarée (action_subcategory) |
| 4 | admin | PATCH | `/admin/action-subcategories/{subcat_id}` | patch_action_subcategory | déclarée (action_subcategory) |
| 4 | admin | PATCH | `/admin/action-subcategories/{subcat_id}/active` | patch_action_subcategory_active | exclue : Route cassée (colonne absente en base), à réparer ou retirer : docs/backlog/routes-referentiel-cassees.md |
| 4 | admin | POST | `/admin/audit-reasons` | create_audit_reason | déclarée (audit_reason) |
| 4 | admin | PATCH | `/admin/audit-reasons/{reason_id}` | update_audit_reason | déclarée (audit_reason) |
| 4 | admin | PATCH | `/admin/audit-reasons/{reason_id}/active` | patch_audit_reason_active | déclarée (audit_reason) |
| 4 | admin | POST | `/admin/audit-rules` | create_audit_rule | déclarée (audit_rule) |
| 4 | admin | PATCH | `/admin/audit-rules/{rule_id}` | update_audit_rule | déclarée (audit_rule) |
| 4 | admin | PATCH | `/admin/complexity-factors/{factor_id}` | patch_complexity_factor | exclue : Route cassée (colonne absente en base), à réparer ou retirer : docs/backlog/routes-referentiel-cassees.md |
| 4 | admin | PATCH | `/admin/complexity-factors/{factor_id}/active` | patch_complexity_factor_active | exclue : Route cassée (colonne absente en base), à réparer ou retirer : docs/backlog/routes-referentiel-cassees.md |
| 4 | admin | POST | `/admin/email-domain-rules` | add_email_domain_rule | déclarée (email_domain_rule) |
| 4 | admin | DELETE | `/admin/email-domain-rules/{rule_id}` | remove_email_domain_rule | déclarée (email_domain_rule) |
| 4 | admin | POST | `/admin/endpoints/sync` | sync_endpoints | exclue : Resynchronisation technique du catalogue d'endpoints depuis le code, sans décision humaine ; les droits qui en dépendent sont tracés par permission_audit_log |
| 4 | admin | PATCH | `/admin/endpoints/{endpoint_id}` | patch_endpoint | déclarée (endpoint) |
| 4 | admin | PATCH | `/admin/intervention-statuses/{status_code}` | patch_intervention_status | déclarée (intervention_status) |
| 4 | admin | POST | `/admin/intervention-types` | create_intervention_type | déclarée (intervention_type) |
| 4 | admin | PATCH | `/admin/intervention-types/{type_id}` | patch_intervention_type | déclarée (intervention_type) |
| 4 | admin | PATCH | `/admin/intervention-types/{type_id}/active` | patch_intervention_type_active | déclarée (intervention_type) |
| 4 | admin | POST | `/admin/ip-blocklist` | add_ip_block | déclarée (ip_block) |
| 4 | admin | DELETE | `/admin/ip-blocklist/{block_id}` | remove_ip_block | déclarée (ip_block) |
| 4 | admin | PATCH | `/admin/permissions/{permission_id}` | patch_permission | déclarée (permission) |
| 4 | admin | POST | `/admin/settings/mail/test` | test_mail | ne modifie rien : Envoie un courriel de test avec la configuration courante : aucune écriture en base |
| 4 | admin | POST | `/admin/users` | create_user | déclarée (user) |
| 4 | admin | DELETE | `/admin/users/{user_id}` | delete_user | déclarée (user) |
| 4 | admin | PUT | `/admin/users/{user_id}` | update_user | déclarée (user) |
| 4 | admin | PATCH | `/admin/users/{user_id}/active` | patch_user_active | déclarée (user) |
| 4 | admin | POST | `/admin/users/{user_id}/reset-password` | reset_password | déclarée (user) |
| 4 | admin | PATCH | `/admin/users/{user_id}/role` | patch_user_role | déclarée (user) |
| 4 | api-keys | POST | `/api-keys` | create_api_key | déclarée (api_key) |
| 4 | api-keys | DELETE | `/api-keys/{key_id}` | delete_api_key | déclarée (api_key) |
| 4 | api-keys | PATCH | `/api-keys/{key_id}` | update_api_key | déclarée (api_key) |
| 4 | auth | POST | `/auth/login` | login | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | auth | POST | `/auth/logout` | logout | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | auth | POST | `/auth/refresh` | refresh_token | exclue : Trace dans security_log (ADR 0018, point 1 quinquies) |
| 4 | equipement-class | POST | `/equipement-class` | create_equipement_class | déclarée (equipement_class) |
| 4 | equipement-class | DELETE | `/equipement-class/{class_id}` | delete_equipement_class | déclarée (equipement_class) |
| 4 | equipement-class | PATCH | `/equipement-class/{class_id}` | update_equipement_class | déclarée (equipement_class) |
| 4 | home-view | DELETE | `/home-view/admin/assignments/{role_id}` | delete_home_view_assignment | déclarée (role_home_view) |
| 4 | home-view | PUT | `/home-view/admin/assignments/{role_id}` | upsert_home_view_assignment | déclarée (role_home_view) |
| 4 | notifications | PATCH | `/notifications/read-all` | mark_all_read | exclue : Marque lue une notification personnelle : état d'usage de l'utilisateur, pas une décision |
| 4 | notifications | PATCH | `/notifications/{notification_id}/read` | mark_read | exclue : Marque lue une notification personnelle : état d'usage de l'utilisateur, pas une décision |
| 4 | services | POST | `/services` | create_service | déclarée (service) |
| 4 | services | PATCH | `/services/{service_id}` | update_service | déclarée (service) |
| 4 | users | PATCH | `/users/me/changelog-seen` | mark_my_changelog_seen | exclue : Mémorise la dernière version des nouveautés vue par l'utilisateur : préférence d'affichage |
| 4 | users | POST | `/users/me/password` | change_my_password | déclarée (user) |
| 4 | users | PATCH | `/users/me/profile` | update_my_profile | déclarée (user) |
