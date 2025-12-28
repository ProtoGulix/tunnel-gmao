## Gestion des interventions, actions et sous-tâches

> **Note importante** : Ce document définit le **modèle métier actuel** de Tunnel GMAO
> basé sur le schéma PostgreSQL implémenté. Les règles décrites correspondent
> à l'architecture technique en place.

---

### Intervention

#### Rôle métier

L'intervention est le **point d'entrée principal** de la maintenance.
Elle représente **l'exécution réelle du travail de maintenance** sur un équipement.

#### Règles métier

- Une intervention est **toujours rattachée à une machine** (obligatoire)
- Une intervention possède un **code unique auto-généré** : `MACHINE-TYPE-YYYYMMDD-INITIALES`
  - Exemple : `CONV01-PREV-20241228-JD`
- Une intervention peut être de différents types : `PREV` (préventif), `COR` (correctif), `INST` (installation), etc.
- Toute action terrain est rattachée à une intervention
- Une intervention passe par différents **statuts** : `ouvert`, `en_cours`, `ferme`, `annule`
- Chaque changement de statut est **automatiquement historisé** dans `intervention_status_log`

#### Règles fortes

- Il est obligatoire de préciser la machine concernée (`machine_id`)
- Le code intervention est généré automatiquement et ne peut pas être modifié manuellement
- Les dates (`date_debut`, `date_fin`) délimitent la période d'exécution
- Le statut actuel est synchronisé automatiquement avec l'historique des changements de statut

---

### Sous-tâches (Subtasks)

#### Rôle métier

Les sous-tâches servent **exclusivement à organiser le travail** lors :

- d'interventions longues
- de projets
- de mises en service

#### Règles métier

- Une sous-tâche est toujours rattachée à une intervention
- Une sous-tâche n'a **aucune valeur de traçabilité terrain**
- Une sous-tâche ne contient :
  - ni temps passé
  - ni pièces
  - ni complexité
- Les statistiques et indicateurs **ne tiennent jamais compte des sous-tâches**

#### Statuts

Les sous-tâches peuvent avoir des statuts pour suivre l'avancement organisationnel (exemples : `todo`, `in_progress`, `done`, `blocked`).

---

### Actions

#### Rôle métier

L'action (`intervention_action`) est la **seule unité de travail réel** et de traçabilité terrain.

#### Règles métier

- Une action est **toujours rattachée à une intervention** (`intervention_id` obligatoire)
- Une action est **classifiée par sous-catégorie** (`action_subcategory` → catégorie parent avec couleur)
- Une action possède :
  - Une **description** libre du travail effectué
  - Un **temps passé** (`time_spent` en heures) - **seule source de vérité**
  - Un **score de complexité** (`complexity_score`) - valeur arbitraire donnée par le technicien pour identifier les points de blocage
  - Des **annotations de complexité** (`complexity_anotation` JSON) - détail optionnel des facteurs contributifs (ex: facteurs de `complexity_factor`)
  - Un **technicien** ayant réalisé l'action (`tech`)

#### Règles fortes

- Le temps passé et le score de complexité sont portés **uniquement par les actions**
- Le score de complexité est **subjectif** : évaluation terrain du technicien pour signaler les difficultés rencontrées
- Toutes les statistiques et KPI sont calculés **à partir des actions**
- Les actions sont horodatées (`created_at`, `updated_at`)
- Une action ne peut pas exister sans intervention parente

#### Classification des actions

Les actions sont organisées en **catégories** et **sous-catégories** :

- **Catégories** (exemples) : DEP (Dépannage), FAB (Fabrication), PREV (Préventif), SUP (Support/Administratif), BAT (Bâtiment/Nettoyage)
- Chaque catégorie a une **couleur hexadécimale** pour l'UI (badges)
- Les **sous-catégories** affinent la classification (ex : DEP_ELEC, DEP_MECA, PREV_GRAIS, SUP_INV)

---

### Pièces consommées

#### Rôle métier

Les pièces consommées durant interventions sont tracées via `intervention_part`.

#### Règles métier

- Une pièce consommée est rattachée à une **intervention** (`intervention_id`)
- Lien avec les articles stock (`stock_item_id`)
- Quantité consommée enregistrée (`quantity`)
- Notes optionnelles pour contexte

---

### Règle métier synthèse (non négociable)

| Règle                           | Description                                                      | Implémentation |
| ------------------------------- | ---------------------------------------------------------------- | -------------- |
| **Intervention = point entrée** | L'intervention est le point d'entrée principal de la maintenance | ✅ Implémenté  |
| **Machine obligatoire**         | Toute intervention doit être rattachée à une machine             | ✅ Implémenté  |
| **Sous-tâche = organisation**   | Une sous-tâche est un outil d'organisation, pas de traçabilité   | ✅ Implémenté  |
| **Action = preuve**             | Une action est la seule preuve de travail réel                   | ✅ Implémenté  |
| **Temps dans l'action**         | Le temps et la complexité vivent uniquement dans les actions     | ✅ Implémenté  |
| **Code auto-généré**            | Les codes intervention, stock, commandes sont auto-générés       | ✅ Triggers    |
| **Historisation statuts**       | Tout changement de statut est automatiquement historisé          | ✅ Triggers    |

### Impact sur l'architecture technique

Ces règles métier se traduisent dans le schéma PostgreSQL par :

1. **Modèle de données** (voir [db/schema/](../db/schema/))

   - Table `intervention` : point d'entrée principal
     - `machine_id` (UUID, FK vers `machine`) - obligatoire
     - `code` (VARCHAR) - auto-généré par trigger `trg_interv_code`
     - `type_inter` (VARCHAR) - type intervention
     - `status_actual` (VARCHAR, FK vers `intervention_status_ref`)
   - Table `intervention_action` : unité de travail réel
     - `intervention_id` (UUID, FK vers `intervention`) - obligatoire
     - `action_subcategory` (INTEGER, FK vers `action_subcategory`)
     - `time_spent` (NUMERIC(6,2)) - temps en heures
     - `complexity_score` (INTEGER) - score arbitraire donné par le technicien (identification des blocages)
     - `complexity_anotation` (JSON) - annotations optionnelles sur les facteurs de difficulté
     - `tech` (UUID) - technicien
   - Table `subtask` : organisation interne
     - `intervention_id` (UUID, FK vers `intervention`)
     - `description` (TEXT), `status` (VARCHAR), `assigned_to` (UUID)
     - **Aucun champ temps/complexité** (organisation uniquement)
   - Table `intervention_status_log` : historique automatique
     - Alimentée par triggers `trg_init_status_log` et `trg_log_status_change`

2. **Configuration métier centralisée** (voir [db/schema/03_meta/](../db/schema/03_meta/))

   - Table `action_category_meta` : Métadonnées des catégories
     - `is_simple` (BOOLEAN) - Catégorie "simple" (temps court)
     - `is_low_value` (BOOLEAN) - Faible valeur ajoutée
     - `typical_duration_min/max` (NUMERIC) - Durées typiques
   - Table `action_classification_probe` : Sondes NLP
     - `keyword` (VARCHAR) - Mot-clé de détection
     - `suggested_category` (VARCHAR) - Catégorie suggérée
     - `severity` (VARCHAR) - Niveau sévérité (info, warning, error)
   - Table `anomaly_threshold` : Seuils de détection
     - 6 types : repetitive, fragmented, too_long, bad_classification, back_to_back, low_value_high_load
     - Valeurs ajustables sans redéploiement

3. **Automatisations PostgreSQL** (triggers)

   - **Génération codes** :
     - `trg_interv_code` : Code intervention `MACHINE-TYPE-YYYYMMDD-INITIALES`
     - `trg_generate_stock_item_ref` : Référence stock `FAM-SFAM-SPEC-DIM`
     - `trg_generate_supplier_order_number` : Numéro commande `CMD-YYYYMMDD-NNNN`
   - **Historisation statuts** :
     - `trg_init_status_log` : Log initial à la création (statut ouvert)
     - `trg_log_status_change` : Log automatique à chaque changement statut
     - `trg_sync_status_from_log` : Synchronisation `status_actual` depuis log
   - **Calculs automatiques** :
     - `trg_calculate_line_total` : Total ligne commande (prix × quantité)
     - `update_updated_at_column` : Timestamps `updated_at`

4. **Validation backend**

   - Création intervention : `machine_id` obligatoire
   - Création action : `intervention_id` obligatoire
   - Temps/complexité : uniquement dans `intervention_action`
   - Codes auto-générés : interdiction modification manuelle
   - Configuration anomalies : chargée depuis `03_meta/` (pas de hardcoding)

5. **Interface utilisateur**

   - Workflow : Machine → Intervention → Actions
   - Statistiques calculées **uniquement sur actions** (ignorer sous-tâches)
   - Sous-tâches affichées comme checklist organisationnelle
   - Configuration anomalies chargée dynamiquement via API

6 5. **API contracts (DTOs)**

- `Intervention` : inclure `machine: { id, code, nom }`, `status_actual`, `code`
- `InterventionAction` : inclure `timeSpent`, `complexityScore`, `complexityAnotation`, `subcategory.category.color`
- `AnomalyConfiguration` : Agrégat de `action_category_meta`, `action_classification_probe`, `anomaly_threshold`

> 📖 Voir [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md) pour les contrats DTOs détaillés  
> 📖 Voir [db/schema/README.md](../db/schema/README.md) pour la documentation du schéma SQL  
> 📖 Voir [db/schema/03_meta/](../db/schema/03_meta/) pour la configuration centralisée
> 📖 Voir [db/schema/README.md](../db/schema/README.md) pour la documentation du schéma SQL

---

## Gestion du stock et des achats

### Articles stock

#### Structure

Les articles sont organisés en hiérarchie :

- **Familles** (`stock_family`) : niveau 1 (ex: VIS, ROUL, COURR)
- **Sous-familles** (`stock_sub_family`) : niveau 2 (ex: VIS-CHC, VIS-TH)
- **Articles** (`stock_item`) : niveau 3 avec référence auto-générée

#### Règles métier

- Référence auto-générée : `FAMILLE-SOUSFAMILLE-SPEC-DIMENSION`
  - Exemple : `VIS-CHC-M8-20`
- Stock suivi en quantité (`stock_quantity`)
- Seuil minimum (`stock_min`) pour alertes
- Contrainte : stock >= 0

#### Fournisseurs

- Articles liés aux fournisseurs via `stock_item_supplier`
- Prix, délais, quantités minimum par fournisseur
- Fournisseur préféré marquable (`is_preferred`)

### Demandes d'achat

#### Rôle métier

Les demandes d'achat (`purchase_request`) permettent de demander l'approvisionnement d'articles.

#### Règles métier

- Rattachée à un article stock (`stock_item_id`)
- Peut être liée à une intervention (`intervention_id`, optionnel)
- Quantités : demandée (`quantity_requested`) et approuvée (`quantity_approved`)
- Statut : `en_attente`, `approuve`, `commande`, `recu`, `refuse`
- Marquage urgence possible (`urgent`)

### Commandes fournisseurs

#### Structure

- **Commande** (`supplier_order`) : entête avec numéro auto-généré `CMD-YYYYMMDD-NNNN`
- **Lignes** (`supplier_order_line`) : détail articles commandés
- **Lien demandes** (`supplier_order_line_purchase_request`) : traçabilité demande → commande

#### Règles métier

- Numéro commande auto-généré et unique
- Total ligne calculé automatiquement (prix × quantité)
- Dates : commande, livraison prévue, livraison réelle
- Statut : `brouillon`, `envoye`, `recu`, `annule`

---

## Machines et équipements

### Structure hiérarchique

- Une machine peut avoir un **équipement parent** (`equipement_mere`)
- Permet modélisation équipements composés (ex: ligne production avec plusieurs machines)

### Règles métier

- Code unique obligatoire (`code`) - utilisé dans code intervention
- Informations : type, fabricant, numéro série, date mise en service
- Localisation géographique (`localisation` → `location`)
- Hiérarchie auto-référencée pour sous-équipements

---

## Principes architecturaux

### Backend-agnostic

L'architecture suit le pattern **datasource/mapper/adapter** :

- **Datasource** : Requêtes HTTP backend-spécifiques
- **Mapper** : Transformations pures backend → domain
- **Adapter** : Interface domaine pour composants

### Séparation des préoccupations

- **Métier** : Tables core (intervention, action, stock)
- **Référentiels** : Tables ref (catégories, statuts)
- **Automatisations** : Triggers (codes, logs, calculs)

### Traçabilité

- Tous les changements de statut historisés
- Timestamps automatiques (`created_at`, `updated_at`)
- Actions = preuve du travail réel avec temps passé
