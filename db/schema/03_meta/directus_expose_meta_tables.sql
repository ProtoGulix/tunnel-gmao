-- ============================================================================
-- directus_expose_meta_tables.sql - Expose les tables 03_meta/ dans Directus
-- ============================================================================
-- Rend les tables de configuration visibles et modifiables via l'interface Directus
-- Permet accès API REST automatique : /items/action_category_meta, etc.
-- ============================================================================

-- ============================================================================
-- 1. Exposer action_category_meta dans Directus
-- ============================================================================

INSERT INTO directus_collections (collection, icon, note, singleton, hidden)
VALUES 
  ('action_category_meta', 'settings', 'Métadonnées métier des catégories (durées typiques, valeur ajoutée)', false, false)
ON CONFLICT (collection) DO UPDATE SET
  icon = EXCLUDED.icon,
  note = EXCLUDED.note;

-- Champs pour action_category_meta
INSERT INTO directus_fields (collection, field, special, interface, options, display, readonly, hidden, sort, width, note) VALUES
  ('action_category_meta', 'category_code', NULL, 'input', '{"iconRight": "vpn_key", "placeholder": "Code catégorie (ex: DEP, BAT)"}', 'raw', false, false, 1, 'full', 'Code catégorie (clé primaire, FK vers action_category)'),
  ('action_category_meta', 'is_simple', 'cast-boolean', 'boolean', '{"label": "Catégorie simple"}', 'boolean', false, false, 2, 'half', 'Catégorie considérée comme simple (temps exécution court)'),
  ('action_category_meta', 'is_low_value', 'cast-boolean', 'boolean', '{"label": "Faible valeur"}', 'boolean', false, false, 3, 'half', 'Catégorie à faible valeur ajoutée métier'),
  ('action_category_meta', 'typical_duration_min', NULL, 'input', '{"iconRight": "schedule", "placeholder": "Durée min (heures)"}', 'raw', false, false, 4, 'half', 'Durée typique minimale en heures'),
  ('action_category_meta', 'typical_duration_max', NULL, 'input', '{"iconRight": "schedule", "placeholder": "Durée max (heures)"}', 'raw', false, false, 5, 'half', 'Durée typique maximale en heures'),
  ('action_category_meta', 'created_at', 'date-created', 'datetime', NULL, 'datetime', true, true, 6, 'half', NULL),
  ('action_category_meta', 'updated_at', 'date-updated', 'datetime', NULL, 'datetime', true, true, 7, 'half', NULL)
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  options = EXCLUDED.options,
  note = EXCLUDED.note;

-- ============================================================================
-- 2. Exposer action_classification_probe dans Directus
-- ============================================================================

INSERT INTO directus_collections (collection, icon, note, singleton, hidden)
VALUES 
  ('action_classification_probe', 'manage_search', 'Sondes NLP pour détection anomalies de classification', false, false)
ON CONFLICT (collection) DO UPDATE SET
  icon = EXCLUDED.icon,
  note = EXCLUDED.note;

-- Champs pour action_classification_probe
INSERT INTO directus_fields (collection, field, special, interface, options, display, readonly, hidden, sort, width, note) VALUES
  ('action_classification_probe', 'id', NULL, 'input', '{"iconRight": "vpn_key"}', 'raw', true, true, 1, 'full', 'ID auto-généré'),
  ('action_classification_probe', 'keyword', NULL, 'input', '{"iconLeft": "search", "placeholder": "Mot-clé à détecter"}', 'raw', false, false, 2, 'half', 'Mot-clé ou pattern à détecter dans descriptions'),
  ('action_classification_probe', 'detection_type', NULL, 'select-dropdown', '{"choices": [{"text": "Keyword", "value": "keyword"}, {"text": "Regex", "value": "regex"}, {"text": "NLP", "value": "nlp"}]}', 'labels', false, false, 3, 'half', 'Type de détection : keyword, regex, nlp'),
  ('action_classification_probe', 'suggested_category', NULL, 'input', '{"iconRight": "category", "placeholder": "Code catégorie suggérée"}', 'raw', false, false, 4, 'half', 'Catégorie suggérée (NULL = alerte sans suggestion)'),
  ('action_classification_probe', 'severity', NULL, 'select-dropdown', '{"choices": [{"text": "Info", "value": "info"}, {"text": "Warning", "value": "warning"}, {"text": "Error", "value": "error"}]}', 'labels', false, false, 5, 'half', 'Sévérité : info, warning, error'),
  ('action_classification_probe', 'description', NULL, 'input-multiline', '{"placeholder": "Explication de la détection"}', 'raw', false, false, 6, 'full', 'Explication de la détection'),
  ('action_classification_probe', 'is_active', 'cast-boolean', 'boolean', '{"label": "Actif"}', 'boolean', false, false, 7, 'half', 'Sonde active/inactive'),
  ('action_classification_probe', 'created_at', 'date-created', 'datetime', NULL, 'datetime', true, true, 8, 'half', NULL),
  ('action_classification_probe', 'updated_at', 'date-updated', 'datetime', NULL, 'datetime', true, true, 9, 'half', NULL)
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  options = EXCLUDED.options,
  note = EXCLUDED.note;

-- ============================================================================
-- 3. Exposer anomaly_threshold dans Directus
-- ============================================================================

INSERT INTO directus_collections (collection, icon, note, singleton, hidden)
VALUES 
  ('anomaly_threshold', 'warning', 'Seuils de détection d''anomalies (6 types configurables)', false, false)
ON CONFLICT (collection) DO UPDATE SET
  icon = EXCLUDED.icon,
  note = EXCLUDED.note;

-- Champs pour anomaly_threshold
INSERT INTO directus_fields (collection, field, special, interface, options, display, readonly, hidden, sort, width, note) VALUES
  ('anomaly_threshold', 'id', NULL, 'input', '{"iconRight": "vpn_key"}', 'raw', true, true, 1, 'full', 'ID auto-généré'),
  ('anomaly_threshold', 'anomaly_type', NULL, 'select-dropdown', '{"choices": [{"text": "A - Répétitive", "value": "repetitive"}, {"text": "B - Fragmentée", "value": "fragmented"}, {"text": "C - Trop longue", "value": "too_long"}, {"text": "D - Mauvaise classification", "value": "bad_classification"}, {"text": "E - Back-to-back", "value": "back_to_back"}, {"text": "F - Faible valeur/charge élevée", "value": "low_value_high_load"}]}', 'labels', false, false, 2, 'half', 'Type d''anomalie (clé unique)'),
  ('anomaly_threshold', 'threshold_value', NULL, 'input', '{"iconRight": "exposure", "placeholder": "Valeur seuil"}', 'raw', false, false, 3, 'half', 'Valeur seuil de détection principale'),
  ('anomaly_threshold', 'threshold_unit', NULL, 'select-dropdown', '{"choices": [{"text": "Heures", "value": "hours"}, {"text": "Nombre", "value": "count"}, {"text": "Jours", "value": "days"}, {"text": "Mots-clés", "value": "keywords"}]}', 'raw', false, false, 4, 'half', 'Unité du seuil'),
  ('anomaly_threshold', 'high_severity_value', NULL, 'input', '{"iconRight": "priority_high", "placeholder": "Seuil sévérité élevée"}', 'raw', false, false, 5, 'half', 'Valeur seuil pour sévérité élevée'),
  ('anomaly_threshold', 'config_json', 'cast-json', 'input-code', '{"language": "json"}', 'raw', false, false, 6, 'full', 'Configuration JSON additionnelle (paramètres spécifiques)'),
  ('anomaly_threshold', 'description', NULL, 'input-multiline', '{"placeholder": "Explication du type d''anomalie"}', 'raw', false, false, 7, 'full', 'Explication du type d''anomalie'),
  ('anomaly_threshold', 'is_active', 'cast-boolean', 'boolean', '{"label": "Actif"}', 'boolean', false, false, 8, 'half', 'Seuil actif/inactif'),
  ('anomaly_threshold', 'updated_at', 'date-updated', 'datetime', NULL, 'datetime', true, true, 9, 'half', NULL)
ON CONFLICT (collection, field) DO UPDATE SET
  interface = EXCLUDED.interface,
  options = EXCLUDED.options,
  note = EXCLUDED.note;

-- ============================================================================
-- Vérification
-- ============================================================================

SELECT 'Collections exposées:' as status;
SELECT collection, icon, note 
FROM directus_collections 
WHERE collection IN ('action_category_meta', 'action_classification_probe', 'anomaly_threshold')
ORDER BY collection;
