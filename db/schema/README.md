# 🗄️ Database Schema - GMAO Tunnel

Architecture SQL complète pour gestion maintenance industrielle (nettoyée sans Directus).

## 📁 Structure

```
db/schema/
├─ 00_extensions.sql          # Extensions PostgreSQL (uuid-ossp)
├─ 01_core/                   # Tables métier principales
│  ├─ intervention.sql
│  ├─ intervention_action.sql
│  ├─ intervention_part.sql
│  ├─ intervention_status_log.sql
│  ├─ machine.sql
│  ├─ location.sql
│  ├─ subtask.sql
│  ├─ stock_item.sql
│  ├─ stock_item_standard_spec.sql
│  ├─ manufacturer_item.sql
│  ├─ purchase_request.sql
│  ├─ supplier.sql
│  ├─ supplier_order.sql
│  ├─ supplier_order_line.sql
│  ├─ supplier_order_line_purchase_request.sql
│  └─ stock_item_supplier.sql
├─ 02_ref/                    # Tables référentiels
│  ├─ action_category.sql
│  ├─ action_subcategory.sql
│  ├─ complexity_factor.sql
│  ├─ intervention_status_ref.sql
│  ├─ purchase_status.sql
│  ├─ stock_family.sql
│  └─ stock_sub_family.sql
├─ 03_meta/                   # Métadonnées et configuration
│  ├─ action_category_meta.sql
│  ├─ action_classification_probe.sql
│  └─ anomaly_threshold.sql
└─ 05_triggers/               # Triggers & contraintes
   ├─ trg_interv_code.sql
   ├─ trg_log_status.sql
   ├─ trg_sync_status.sql
   ├─ trg_stock_ref.sql
   ├─ trg_supplier_order.sql
   ├─ trg_calculate_totals.sql
   └─ 99_foreign_keys.sql
```

## 🎯 Objectifs

### 1️⃣ **Schéma métier complet**

- ✅ Gestion interventions avec génération codes automatique
- ✅ Classification actions (catégories/sous-catégories avec couleurs)
- ✅ Configuration métier centralisée (durées typiques, seuils anomalies, sondes NLP)
- ✅ Historisation statuts (audit trail complet)
- ✅ Gestion stock (familles, références auto-générées)
- ✅ Achats (demandes, commandes, fournisseurs)

### 2️⃣ **Automatisation métier**

- ✅ Génération codes intervention (MACHINE-TYPE-YYYYMMDD-INITIALES)
- ✅ Génération références stock (FAMILLE-SOUSFAMILLE-SPEC-DIM)
- ✅ Génération numéros commandes (CMD-YYYYMMDD-NNNN)
- ✅ Historisation changements statut automatique
- ✅ Calculs totaux lignes commandes
- ✅ Timestamps updated_at automatiques
- ✅ Compte de références fournisseurs par article (optimisé)

## 🚀 Déploiement

### Ordre d'exécution (IMPORTANT)

```bash
# 1. Extensions
psql -d gmao -f 00_extensions.sql

# 2. Core tables (ordre dépendances)
psql -d gmao -f 01_core/location.sql
psql -d gmao -f 01_core/machine.sql
psql -d gmao -f 01_core/manufacturer_item.sql
psql -d gmao -f 01_core/intervention.sql
psql -d gmao -f 01_core/intervention_action.sql
psql -d gmao -f 01_core/intervention_part.sql
psql -d gmao -f 01_core/intervention_status_log.sql
psql -d gmao -f 01_core/subtask.sql
psql -d gmao -f 01_core/stock_item.sql
psql -d gmao -f 01_core/stock_item_standard_spec.sql
psql -d gmao -f 01_core/purchase_request.sql
psql -d gmao -f 01_core/supplier.sql
psql -d gmao -f 01_core/supplier_order.sql
psql -d gmao -f 01_core/supplier_order_line.sql
psql -d gmao -f 01_core/supplier_order_line_purchase_request.sql
psql -d gmao -f 01_core/stock_item_supplier.sql

# 3. Référentiels
psql -d gmao -f 02_ref/action_category.sql
psql -d gmao -f 02_ref/action_subcategory.sql
psql -d gmao -f 02_ref/complexity_factor.sql
psql -d gmao -f 02_ref/intervention_status_ref.sql
psql -d gmao -f 02_ref/purchase_status.sql
psql -d gmao -f 02_ref/stock_family.sql
psql -d gmao -f 02_ref/stock_sub_family.sql

# 4. Métadonnées et configuration
psql -d gmao -f 03_meta/action_category_meta.sql
psql -d gmao -f 03_meta/action_classification_probe.sql
psql -d gmao -f 03_meta/anomaly_threshold.sql

# 5. Triggers
psql -d gmao -f 05_triggers/trg_interv_code.sql
psql -d gmao -f 05_triggers/trg_log_status.sql
psql -d gmao -f 05_triggers/trg_sync_status.sql
psql -d gmao -f 05_triggers/trg_stock_ref.sql
psql -d gmao -f 05_triggers/trg_supplier_order.sql
psql -d gmao -f 05_triggers/trg_calculate_totals.sql
psql -d gmao -f 05_triggers/trg_update_supplier_refs_count.sql

# 6. Foreign keys (en dernier)
psql -d gmao -f 05_triggers/99_foreign_keys.sql
```

### Script automatique

```bash
#!/bin/bash
# deploy-schema.sh
psql -d gmao -f 00_extensions.sql
for file in 01_core/*.sql; do
  psql -d gmao -f "$file"
done
for file in 02_ref/*.sql; do
  psql -d gmao -f "$file"
done
for file in 03_meta/*.sql; do
  psql -d gmao -f "$file"
done
for file in 05_triggers/*.sql; do
  psql -d gmao -f "$file"
done
```

## 📋 Exemples d'utilisation

### Génération automatique codes

```sql
-- Code intervention auto-généré
INSERT INTO intervention (machine_id, type_inter, tech_initials, description)
VALUES (
  (SELECT id FROM machine WHERE code='CONV01'),
  'PREV',
  'JD',
  'Maintenance préventive'
);
-- Résultat: code = 'CONV01-PREV-20241228-JD'

-- Référence stock auto-générée
INSERT INTO stock_item (family_code, sub_family_code, spec, dimension, designation)
VALUES ('VIS', 'CHC', 'M8', '20', 'Vis CHC M8x20');
-- Résultat: ref = 'VIS-CHC-M8-20'

-- Numéro commande auto-généré
INSERT INTO supplier_order (supplier_id, order_date)
VALUES ((SELECT id FROM supplier WHERE name='Acme Corp'), CURRENT_DATE);
-- Résultat: order_number = 'CMD-20241228-0001'
```

### Historique statuts

```sql
-- Changement statut (log automatique)
UPDATE intervention
SET status_actual = 'en_cours'
WHERE code='CONV01-PREV-20241228-JD';

-- Consulter historique
SELECT status_from, status_to, date, notes
FROM intervention_status_log
WHERE intervention_id = (SELECT id FROM intervention WHERE code='CONV01-PREV-20241228-JD')
ORDER BY date;
```

### Adapter frontend

```typescript
// Avant
import { ANOMALY_CONFIG } from '@/config/anomalyConfig';

// Après
const config = await configAdapter.fetchAnalysisConfig();
const category = await actionSubcategories.fetchActionCategory(id);
// category.is_simple, category.max_duration_hours disponibles dans DTO
```

## 🔍 Utilisation des vues

### KPI Dashboard

```sql
-- Stats interventions
SELECT kpi_data->>'intervention_code',
       kpi_data->>'total_time_spent'
FROM v_kpi_basic
WHERE kpi_type = 'intervention_kpi'
ORDER BY (kpi_data->>'total_time_spent')::NUMERIC DESC
LIMIT 10;

-- Stats catégories
SELECT kpi_data->>'category_code',
       kpi_data->>'avg_time_spent'
FROM v_kpi_basic
WHERE kpi_type = 'category_kpi';
```

### Anomalies

```sql
-- Actions suspectes
SELECT a.description, ano.anomaly_type, ano.severity
FROM v_action_anomaly ano
JOIN intervention_action a ON ano.action_id = a.id
WHERE ano.severity = 'high';
```

## 🛠️ Maintenance

### Vérifier intégrité

```sql
-- Vérifier triggers actifs
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Vérifier séquences
SELECT sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public';

-- Vérifier contraintes FK
SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;
```

## 📚 Documentation connexe

- [REGLES_METIER.md](../../docs/REGLES_METIER.md) - Règles métier GMAO
- [API_CONTRACTS.md](../../docs/tech/API_CONTRACTS.md) - Contrats DTOs frontend
- [ARCHITECTURE_LOCKED.md](../../docs/ARCHITECTURE_LOCKED.md) - Architecture backend-agnostic
- [schema_clean.sql](../../01%20-%20Docker/GMAO%20MVP/schema_clean.sql) - Schéma complet monobloc

## ⚠️ Prérequis

- PostgreSQL >= 12
- Extension `uuid-ossp` (génération UUID)
- Droits création tables, fonctions, triggers
