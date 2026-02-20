# Tunnel GMAO V3 — Architecture de référence

> Document de loi. Toute IA assistant sur ce projet doit lire ce fichier avant de produire du code.

---

## Contexte projet

Tunnel GMAO est un système de gestion de maintenance industrielle (GMAO/CMMS) open-source.
- Utilisé quotidiennement en production dans une usine réelle
- Développé et maintenu par une petite équipe
- Philosophie "terrain first" : simplicité et maintenabilité avant tout
- Backend : Python (FastAPI) — source de vérité unique
- Frontend : React + Vite

---

## Structure complète

```
src/
│
├── lib/                          # Infrastructure pure — zéro métier
│   ├── api/
│   │   ├── client.js             # fetch + headers + retry + interceptors
│   │   └── errors.js             # ApiError, NotFoundError, ValidationError...
│   └── utils/
│       ├── dates.js
│       ├── formats.js
│       └── strings.js
│
├── api/                          # Appels HTTP bruts — un fichier par domaine
│   ├── interventions.js
│   ├── machines.js
│   ├── equipements.js
│   ├── stock.js
│   ├── achats.js
│   ├── preventive.js
│   ├── anomalies.js
│   └── [module].js
│
├── hooks/                        # État et logique métier — organisés par domaine
│   ├── interventions/
│   │   ├── useInterventions.js
│   │   ├── useInterventionDetail.js
│   │   ├── useInterventionCreate.js
│   │   ├── useInterventionDuration.js
│   │   └── useInterventionStatusRefs.js
│   ├── machines/
│   │   └── useMachineData.js
│   ├── equipements/
│   │   ├── useEquipements.js
│   │   ├── useEquipementDetail.js
│   │   └── useEquipementHealth.js
│   ├── stock/
│   │   ├── useStockItems.js
│   │   ├── useStockItem.js
│   │   ├── useStockFamilies.js
│   │   ├── useStockData.js
│   │   └── useTemplate.js
│   ├── achats/
│   │   ├── usePurchasingManagement.js
│   │   ├── usePurchaseRequestsManagement.js
│   │   ├── useDeletePurchaseRequest.js
│   │   └── useSuppliers.js
│   ├── preventive/
│   │   └── usePreventiveSuggestions.js
│   ├── technicien/
│   │   ├── useTechnicianHome.js
│   │   └── useTechnicalWorkload.js
│   ├── anomalies/
│   │   ├── useAnomaliesSaisie.js
│   │   └── useAnomalyConfig.js
│   ├── [module]/
│   │   └── use[Module].js
│   └── shared/                   # Hooks utilitaires — aucune connaissance métier
│       ├── useApiCall.js
│       ├── useAutoRefresh.js
│       ├── useDebounce.js
│       ├── useDebouncedSearch.js
│       ├── useNotification.js
│       ├── useOptimisticData.js
│       ├── usePageConfig.js
│       ├── useSearchParam.js
│       ├── useTabNavigation.js
│       ├── useMediaQuery.js
│       ├── useTimeSelection.jsx
│       └── useTwinLinesValidation.js
│
├── components/
│   │
│   ├── ui/                       # Briques visuelles pures — zéro métier — props only
│   │   ├── DataTable.jsx
│   │   ├── InteractiveTable.jsx
│   │   ├── TableHeader.jsx
│   │   ├── Pagination.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingState.jsx
│   │   ├── StatusCallout.jsx
│   │   ├── ErrorState.jsx
│   │   ├── KPICard.jsx
│   │   ├── ToggleDetailsButton.jsx
│   │   ├── FilterSelect.jsx
│   │   ├── SearchField.jsx
│   │   ├── DateRangeFilter.jsx
│   │   └── SearchableSelect/
│   │
│   ├── layout/                   # Shell de l'application
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageContainer.jsx
│   │   ├── HeaderDateRangeFilter.jsx
│   │   └── TimeSelectionControl.jsx
│   │
│   ├── shared/                   # Composants métier réutilisables entre domaines
│   │   ├── StockItemBadge.jsx    # props only — jamais de hook
│   │   ├── SupplierTag.jsx
│   │   ├── OrderLineRow.jsx
│   │   ├── PurchaseRequestForm.jsx
│   │   └── StockItemMiniCard.jsx
│   │                             # Règle : un composant va ici uniquement s'il est
│   │                             # utilisé dans 2 domaines différents ET doit avoir
│   │                             # la même apparence partout
│   │
│   ├── interventions/
│   │   ├── tabs/
│   │   │   ├── InterventionInfoTab.jsx
│   │   │   ├── InterventionActionsTab.jsx
│   │   │   └── InterventionPartsTab.jsx
│   │   ├── InterventionCard.jsx
│   │   └── InterventionTabs/
│   │
│   ├── stock/
│   │   ├── tabs/
│   │   │   ├── StockItemsTab.jsx
│   │   │   ├── StockFamiliesTab.jsx
│   │   │   └── PartTemplatesTab.jsx
│   │   ├── items/
│   │   │   ├── StockItemsTable.jsx
│   │   │   ├── StockItemRow.jsx
│   │   │   ├── AddStockItemDialog.jsx
│   │   │   └── EditStockItemDialog.jsx
│   │   ├── families/
│   │   │   ├── StockFamiliesTable.jsx
│   │   │   ├── FamilyRow.jsx
│   │   │   └── SubfamilyRow.jsx
│   │   ├── templates/
│   │   │   ├── PartTemplatesTable.jsx
│   │   │   ├── PartTemplateForm.jsx
│   │   │   ├── TemplateFieldsTable.jsx
│   │   │   ├── TemplateGeneralInfoForm.jsx
│   │   │   ├── TemplateVersionDetailsDialog.jsx
│   │   │   ├── TemplateVersionsDialog.jsx
│   │   │   ├── AddTemplateFieldForm.jsx
│   │   │   └── EnumValuesForm.jsx
│   │   ├── search/
│   │   │   ├── StockItemSearch.jsx
│   │   │   ├── StockItemSearchDropdown.jsx
│   │   │   └── StockItemSearchSubcomponents.jsx
│   │   └── specs/
│   │       ├── StandardSpecsPanel.jsx
│   │       └── SearchSpecsDialog.jsx
│   │
│   ├── achats/
│   │   ├── tabs/
│   │   │   ├── SuppliersTab.jsx
│   │   │   ├── PurchaseRequestsTab.jsx
│   │   │   └── SupplierOrdersTab.jsx
│   │   ├── suppliers/
│   │   │   └── SuppliersTable.jsx
│   │   ├── manufacturers/
│   │   │   └── ManufacturersTable.jsx
│   │   ├── requests/
│   │   │   └── PurchaseRequestsTable.jsx
│   │   └── orders/
│   │       ├── SupplierOrdersTable.jsx
│   │       └── OrderLineTable/
│   │
│   ├── machines/
│   ├── equipements/
│   ├── preventive/
│   ├── technicien/
│   ├── anomalies/
│   └── [module]/
│       └── tabs/
│
├── pages/                        # Assemblage uniquement — max 50 lignes
│   ├── stock/
│   │   └── StockPage.jsx
│   ├── interventions/
│   │   ├── InterventionsList.jsx
│   │   ├── InterventionDetail.jsx
│   │   └── InterventionCreate.jsx
│   ├── machines/
│   │   ├── MachineList.jsx
│   │   └── MachineDetail.jsx
│   ├── equipements/
│   │   ├── EquipementsList.jsx
│   │   └── EquipementDetail.jsx
│   ├── achats/
│   │   └── ProcurementPage.jsx
│   ├── technicien/
│   │   ├── TechnicianHome.jsx
│   │   └── TechnicalWorkload.jsx
│   ├── anomalies/
│   │   └── AnomaliesSaisie.jsx
│   ├── qualite/
│   │   └── QualiteDonnees.jsx
│   ├── preventive/
│   │   └── PreventiveSuggestionsPage.jsx
│   ├── [module]/
│   │   └── [Module]Page.jsx
│   ├── ServiceStatus.jsx
│   ├── Login.jsx
│   └── NotFound.jsx
│
├── auth/
│   ├── AuthContext.jsx
│   └── useAuth.js
│
├── config/                       # Config globale uniquement
│   ├── colorPalette.js
│   ├── units.js
│   ├── interventionTypes.js
│   ├── stockReferencePatterns.js
│   └── badgeConfig.js
│
└── router/
    └── routes.jsx
```

---

## Les 5 règles absolues

### 1. Le backend assemble, le front affiche
Les données croisées (pièces d'une intervention + leurs fournisseurs, etc.) sont retournées
par le backend Python dans un seul appel. Le front ne fait **jamais** de jointure côté client.
Si deux domaines doivent se parler → c'est un endpoint backend, pas deux hooks.

### 2. La hiérarchie des responsabilités

```
Page (~40 lignes)
└── définit les onglets, importe les Tabs

Tab (~80 lignes) ← chef d'orchestre
├── appelle les hooks
├── gère loading / error
└── assemble les composants

Composant ← visuels
├── reçoit des props
├── appelle des callbacks
└── jamais de hook métier

Hook ← logique
├── appelle api/[domaine].js
├── gère l'état local
└── expose des fonctions propres

api/[domaine].js ← HTTP brut
└── appelle lib/api/client.js, rien d'autre
```

### 3. ui/ est aveugle au métier
Aucun mot métier (stock, intervention, machine, fournisseur...) dans `components/ui/`.
Si c'est là → mauvais endroit.

### 4. shared/ pour l'apparence cohérente
Un composant va dans `shared/` uniquement si :
- Il est utilisé dans **2 domaines différents**
- Il doit avoir la **même apparence partout**
- Il reçoit uniquement des **props** (jamais de hook)

### 5. Ajouter un module = 4 fichiers minimum, toujours les mêmes

```
api/[module].js
hooks/[module]/use[Module].js
components/[module]/tabs/[Module]Tab.jsx
pages/[module]/[Module]Page.jsx
```

---

## Limites de taille

| Fichier | Limite recommandée | Action si dépassé |
|---------|-------------------|-------------------|
| `pages/` | 50 lignes | Extraire dans un Tab |
| `tabs/` | 80 lignes | Extraire un sous-composant |
| `hooks/` | 150 lignes | Découper en 2 hooks |
| `composants` | 200 lignes | Découper en sous-composants |
| `api/[domaine].js` | 100 lignes | Vérifier cohérence du domaine |
