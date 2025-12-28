-- ============================================================================
-- directus_permissions_meta_tables.sql - Permissions pour tables 03_meta/
-- ============================================================================
-- Donne accès CRUD complet aux tables de configuration pour le policy Administrator
-- ============================================================================

-- ID du policy Administrator (admin_access = true)
DO $$
DECLARE
    admin_policy_id UUID;
BEGIN
    -- Récupérer l'ID du policy admin
    SELECT id INTO admin_policy_id 
    FROM directus_policies 
    WHERE admin_access = true 
    LIMIT 1;

    -- Si pas de policy admin trouvé, utiliser l'UUID courant
    IF admin_policy_id IS NULL THEN
        SELECT id INTO admin_policy_id 
        FROM directus_policies 
        WHERE name = 'Administrator' 
        LIMIT 1;
    END IF;

    RAISE NOTICE 'Policy Administrator ID: %', admin_policy_id;

    -- ============================================================================
    -- Permissions pour action_category_meta
    -- ============================================================================
    
    -- CREATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_category_meta', 'create', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- READ
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_category_meta', 'read', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- UPDATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_category_meta', 'update', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- DELETE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_category_meta', 'delete', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- ============================================================================
    -- Permissions pour action_classification_probe
    -- ============================================================================
    
    -- CREATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_classification_probe', 'create', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- READ
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_classification_probe', 'read', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- UPDATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_classification_probe', 'update', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- DELETE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'action_classification_probe', 'delete', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- ============================================================================
    -- Permissions pour anomaly_threshold
    -- ============================================================================
    
    -- CREATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'anomaly_threshold', 'create', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- READ
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'anomaly_threshold', 'read', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- UPDATE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'anomaly_threshold', 'update', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

    -- DELETE
    INSERT INTO directus_permissions (policy, collection, action, permissions, validation, presets, fields)
    VALUES (admin_policy_id, 'anomaly_threshold', 'delete', NULL, NULL, NULL, '*')
    ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- Vérification
-- ============================================================================

SELECT 'Permissions créées pour:' as status;
SELECT p.collection, p.action, pol.name as policy_name
FROM directus_permissions p
JOIN directus_policies pol ON p.policy = pol.id
WHERE p.collection IN ('action_category_meta', 'action_classification_probe', 'anomaly_threshold')
  AND pol.admin_access = true
ORDER BY p.collection, p.action;
