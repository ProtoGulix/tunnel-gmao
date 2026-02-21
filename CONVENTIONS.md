# Conventions - Tunnel GMAO

> **Document Maître** : Toutes les conventions de développement du projet
>
> **Dernière mise à jour**: 21 février 2026
> **Version**: 3.3.0

---

## Lecture Obligatoire Avant Contribution

### Prérequis : Comprendre le métier

**Avant de lire ce document, lire impérativement :**
[REGLES_METIER.md](./docs/features/REGLES_METIER.md) - Concepts métier fondamentaux (5 min)

Les conventions de code découlent directement des règles métier. Par exemple :

- DTOs `Intervention` incluent toujours `request: { id, title }` (règle : intervention dépend de demande)
- DTOs `Action` portent `timeSpent`, `complexityScore` (règle : seule unité de travail tracée)
- `Subtask` n'a pas de champs analytiques (règle : organisation, pas traçabilité)

**Sans comprendre les règles métier, vous écrirez du code qui viole les concepts fondamentaux.**

---

## Table des Matières

### Essentiels

1. [Architecture & Structure](#1-architecture--structure)
   - 1.1 [Organisation des Dossiers](#11-organisation-des-dossiers)
   - 1.2 [Règles absolues de structure](#12-règles-absolues-de-structure)
   - 1.3 [Alias d'Import](#13-alias-dimport)
   - 1.4 [Créer une Nouvelle Page avec Menu](#14-créer-une-nouvelle-page-avec-menu-mandatory)
2. [Imports & Dépendances](#2-imports--dépendances)
3. [Naming Conventions](#3-naming-conventions)
4. [Composants React](#4-composants-react)

### Patterns & Bonnes Pratiques

5. [Hooks & State Management](#5-hooks--state-management)
6. [API & Data Fetching](#6-api--data-fetching)
7. [Formulaires](#7-formulaires)
8. [Gestion des Onglets](#8-gestion-des-onglets)

### Qualité & Sécurité

9. [Sécurité](#9-sécurité)
10. [Performance](#10-performance)
11. [Accessibilité](#11-accessibilité)
12. [Responsivité](#12-responsivité)

### Documentation

13. [Documentation du Code](#13-documentation-du-code)
14. [Erreurs & Logging](#14-erreurs--logging)
15. [Tests](#15-tests)

### DevOps & Déploiement

16. [Build & Deployment](#16-build--deployment)
17. [Git & Commits](#17-git--commits)
18. [Changelog & Versioning](#18-changelog--versioning)

---

## 1. Architecture & Structure

### 1.1 Organisation des Dossiers

```
src/
├── main.jsx
├── App.jsx
│
├── lib/                          # Infrastructure pure — zéro métier
│   ├── api/
│   │   ├── client.js             # fetch + headers + retry
│   │   └── errors.js             # ApiError, NotFoundError, ValidationError...
│   └── utils/
│       ├── dates.js
│       ├── formats.js
│       └── strings.js
│
├── api/                          # Appels HTTP bruts — un fichier par domaine
│   ├── interventions.js          # Le backend retourne les données déjà complètes
│   ├── machines.js               # Pas d'assemblage côté front
│   ├── equipements.js
│   ├── stock.js
│   ├── achats.js
│   ├── preventive.js
│   ├── anomalies.js
│   └── [module].js               # Nouveau module = nouveau fichier ici
│
├── hooks/                        # État et logique métier — par domaine
│   ├── interventions/
│   ├── machines/
│   ├── equipements/
│   ├── stock/
│   ├── achats/
│   ├── preventive/
│   ├── technicien/
│   ├── anomalies/
│   ├── [module]/                 # Nouveau module = nouveau dossier ici
│   └── shared/                   # Hooks utilitaires — aucune connaissance métier
│
├── components/
│   ├── ui/                       # Briques visuelles pures — zéro métier — props only
│   ├── layout/                   # Shell de l'application
│   ├── shared/                   # Composants métier réutilisables entre domaines
│   ├── interventions/
│   │   └── tabs/                 # Chefs d'orchestre des onglets
│   ├── stock/
│   │   └── tabs/
│   ├── achats/
│   │   └── tabs/
│   ├── machines/
│   ├── equipements/
│   ├── preventive/
│   ├── technicien/
│   ├── anomalies/
│   └── [module]/                 # Nouveau module = nouveau dossier ici
│       └── tabs/
│
├── pages/                        # Assemblage uniquement — max 50 lignes
│   ├── stock/
│   ├── interventions/
│   ├── machines/
│   ├── equipements/
│   ├── achats/
│   ├── technicien/
│   ├── anomalies/
│   ├── qualite/
│   ├── preventive/
│   └── [module]/
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

### 1.2 Règles absolues de structure

**Le backend assemble, le front affiche**

Les données croisées (pièces d'une intervention + leurs fournisseurs, etc.) sont retournées
par le backend Python dans un seul appel. Le front ne fait jamais de jointure côté client.
Si deux domaines doivent se parler → c'est un endpoint backend, pas deux hooks.

**La hiérarchie des responsabilités**

```
Page (~50 lignes max)
└── Shell + navigation entre onglets, zéro logique

Tab (~80 lignes max) — chef d'orchestre
├── Appelle les hooks de son domaine
├── Gère loading / error / notifications
└── Assemble les composants

Composant — visuel
├── Reçoit des props
├── Appelle des callbacks
└── Jamais de hook métier

Hook — logique
├── Appelle api/[domaine].js
├── Gère l'état local
└── Expose des fonctions propres

api/[domaine].js — HTTP brut
└── Appelle lib/api/client.js, rien d'autre
```

**Limites de taille — signaler si dépassé**

| Fichier            | Limite                          |
| ------------------ | ------------------------------- |
| `pages/`           | 50 lignes                       |
| `tabs/`            | 80 lignes                       |
| `hooks/`           | 150 lignes → à découper         |
| `composants`       | 200 lignes → à découper         |
| `api/[domaine].js` | 100 lignes → vérifier cohérence |

**Ajouter un module = toujours 4 fichiers minimum**

```
api/[module].js
hooks/[module]/use[Module].js
components/[module]/tabs/[Module]Tab.jsx
pages/[module]/[Module]Page.jsx
```

**shared/ pour l'apparence cohérente**

Un composant va dans `components/shared/` uniquement si :

- Il est utilisé dans 2 domaines différents
- Il doit avoir la même apparence partout
- Il reçoit uniquement des props (jamais de hook)

### 1.3 Alias d'Import

Utiliser `@/*` partout (défini dans `jsconfig.json`) :

```javascript
// BON
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuth } from '@/auth/AuthContext';

// MAUVAIS
import { LoadingState } from '../../../components/ui/LoadingState';
```

### 1.4 Créer une Nouvelle Page avec Menu (MANDATORY)

Le système V3 utilise l'**auto-discovery** via `import.meta.glob` pour détecter automatiquement les pages et leurs configurations sans modifier `menuConfig.js`.

#### 1.4.1 Principe d'Auto-Discovery

Chaque page déclare sa configuration dans un fichier colocalisé `[PageName].config.js`. Le système détecte automatiquement tous les fichiers `*.config.js` dans `src/pages/` et les ajoute au menu.

**Avantages** :

- Pas de modification manuelle de `menuConfig.js`
- Configuration colocalisée avec la page
- Découplage des domaines
- Facilite la maintenance

#### 1.4.2 Structure d'une Nouvelle Page

**Organisation domaine** : toujours créer un dossier par domaine

```
src/pages/[domaine]/
├── [PageName].jsx          # Page (max 50 lignes)
└── [PageName].config.js    # Configuration pour le menu
```

**Exemple complet** : créer une page "Quality" dans le domaine "qualite"

```javascript
// src/pages/qualite/QualityPage.jsx
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import QualityOverviewTab from '@/components/qualite/tabs/QualityOverviewTab';

const TABS = [
  { id: 'overview', label: 'Vue générale' },
  { id: 'audits', label: 'Audits' },
  { id: 'actions', label: 'Actions' },
];

export default function QualityPage() {
  const { activeTab, setActiveTab } = useTabNavigation('overview');

  return (
    <PageContainer>
      <PageHeader title="Qualité" />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'overview' && <QualityOverviewTab />}
      {activeTab === 'audits' && <QualityAuditsTab />}
      {activeTab === 'actions' && <QualityActionsTab />}
    </PageContainer>
  );
}
```

```javascript
// src/pages/qualite/QualityPage.config.js
import { CheckCircle } from 'lucide-react';

/**
 * Configuration de la page Qualité pour le menu
 * @type {import('@/config/menuConfig').PageConfig}
 */
export const PAGE_CONFIG = {
  id: 'quality', // Unique, kebab-case
  path: '/quality', // Route absolue
  label: 'Qualité', // Libellé menu
  icon: CheckCircle, // Icône Lucide React
  pageTitle: 'Gestion Qualité', // Titre dans la page
  pageSubtitle: 'Audits et actions qualité', // Sous-titre optionnel
  section: 'production', // Section du menu
  requiresAuth: true, // Protection par authentification
  public: false, // Accès public ou non
};
```

#### 1.4.3 Champs Obligatoires du Config

| Champ          | Type         | Description                    | Exemple             |
| -------------- | ------------ | ------------------------------ | ------------------- |
| `id`           | `string`     | Identifiant unique kebab-case  | `'quality'`         |
| `path`         | `string`     | Route React Router             | `'/quality'`        |
| `label`        | `string`     | Libellé affiché dans le menu   | `'Qualité'`         |
| `icon`         | `LucideIcon` | Import depuis lucide-react     | `CheckCircle`       |
| `pageTitle`    | `string`     | Titre dans le header de page   | `'Gestion Qualité'` |
| `section`      | `string`     | Section du menu (voir tableau) | `'production'`      |
| `requiresAuth` | `boolean`    | Nécessite authentification     | `true`              |
| `public`       | `boolean`    | Accessible sans auth           | `false`             |

**Champs optionnels** :

- `pageSubtitle` : sous-titre affiché sous le titre
- `order` : ordre d'affichage dans la section (défaut: alphabétique)

#### 1.4.4 Sections de Menu Disponibles

| Section       | Usage                                   |
| ------------- | --------------------------------------- |
| `maintenance` | Interventions, machines, équipements    |
| `stock`       | Stock, pièces, fournisseurs             |
| `production`  | Qualité, performance, indicateurs       |
| `admin`       | Paramètres, utilisateurs, configuration |
| `public`      | Pages accessibles sans authentification |

#### 1.4.5 Déclaration dans routes.jsx

Après avoir créé la page et son config, déclarer la route dans `src/router/routes.jsx` :

```javascript
import QualityPage from '@/pages/qualite/QualityPage'

// Dans createBrowserRouter
{
  path: '/quality',
  element: (
    <ProtectedRoute>
      <Layout>
        <QualityPage />
      </Layout>
    </ProtectedRoute>
  ),
}
```

**Pages publiques** (sans Layout) :

```javascript
{
  path: '/public/intervention-request',
  element: <InterventionRequestPage />,
}
```

#### 1.4.6 Vérification du Fonctionnement

L'auto-discovery dans `menuConfig.js` détecte automatiquement le nouveau fichier :

```javascript
// src/config/menuConfig.js (RIEN À MODIFIER)
const pageConfigModules = import.meta.glob('@/pages/**/*.config.js', { eager: true });

const discoveredPages = Object.values(pageConfigModules)
  .map((module) => module.PAGE_CONFIG)
  .filter(Boolean);

export const PAGES_CONFIG = [...discoveredPages, ...LEGACY_PAGES];
```

**Vérification** :

1. Le fichier `[PageName].config.js` doit exporter `PAGE_CONFIG`
2. Le pattern glob `@/pages/**/*.config.js` doit matcher le chemin
3. La page apparaît automatiquement dans la bonne section du menu

#### 1.4.7 Checklist Création de Page

- [ ] Dossier créé : `src/pages/[domaine]/`
- [ ] Page créée : `[PageName].jsx` (max 50 lignes)
- [ ] Config créé : `[PageName].config.js` avec export `PAGE_CONFIG`
- [ ] Tous les champs obligatoires renseignés
- [ ] Icône importée depuis `lucide-react`
- [ ] Section valide (`maintenance`, `stock`, `production`, `admin`, `public`)
- [ ] Route déclarée dans `routes.jsx`
- [ ] Layout appliqué (`<Layout>` pour pages protégées, rien pour public)
- [ ] ProtectedRoute si `requiresAuth: true`
- [ ] Page testée : route accessible, menu affiché

#### 1.4.8 Migration de LEGACY_PAGES

Pour migrer une page existante de `LEGACY_PAGES` vers le système d'auto-discovery :

1. Créer `src/pages/[domaine]/[PageName].config.js` avec la config
2. Copier les champs depuis `LEGACY_PAGES` dans `menuConfig.js`
3. Supprimer l'entrée de `LEGACY_PAGES`
4. Vérifier que la page apparaît toujours dans le menu

**Objectif** : réduire progressivement `LEGACY_PAGES` jusqu'à 0 entrées.

---

## 2. Imports & Dépendances

### 2.1 Ordre des Imports (MANDATORY)

```javascript
// 1. React core
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// 2. React Router
import { useParams, useNavigate, Link } from 'react-router-dom';

// 3. Librairies externes
import { format } from 'date-fns';

// 4. UI Libraries (Radix)
import { Box, Flex, Grid, Card, Text, Button } from '@radix-ui/themes';

// 5. Icons (toujours les composants Lucide)
import { ClipboardList, Plus, AlertTriangle } from 'lucide-react';

// 6. lib/
import { client } from '@/lib/api/client';

// 7. api/
import { fetchStockItems } from '@/api/stock';

// 8. hooks/
import { useStockItems } from '@/hooks/stock/useStockItems';
import { useNotification } from '@/hooks/shared/useNotification';

// 9. components/ui/
import { LoadingState } from '@/components/ui/LoadingState';

// 10. components/shared/
import { StockItemBadge } from '@/components/shared/StockItemBadge';

// 11. components/[domaine]/
import { StockItemsTable } from '@/components/stock/items/StockItemsTable';

// 12. config/
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
```

### 2.2 Interdiction des Emojis (MANDATORY)

Règle absolue : aucun emoji dans le code source.

```javascript
// INTERDIT
const message = '✅ Validation réussie';
return <Text>📦 Article : {name}</Text>;

// CORRECT — Icônes Lucide React uniquement
import { CheckCircle2, Package } from 'lucide-react';

return (
  <Flex align="center" gap="2">
    <Package size={16} />
    <Text>Article : {name}</Text>
  </Flex>
);
```

**Icônes Lucide recommandées par contexte :**

| Contexte      | Icône Lucide               | Usage                    |
| ------------- | -------------------------- | ------------------------ |
| Succès        | `CheckCircle2`, `Check`    | Validation, confirmation |
| Erreur        | `AlertTriangle`, `XCircle` | Erreurs, échecs          |
| Avertissement | `AlertTriangle`, `Info`    | Warnings                 |
| Article/Stock | `Package`, `Box`           | Produits, inventaire     |
| Document      | `FileText`, `File`         | Documents                |
| Ajout         | `Plus`, `PlusCircle`       | Création                 |
| Suppression   | `Trash2`, `X`              | Suppression              |
| Édition       | `Edit2`, `Edit3`           | Modification             |
| Recherche     | `Search`                   | Recherche, filtres       |
| Paramètres    | `Settings`, `Sliders`      | Configuration            |
| Utilisateur   | `User`, `Users`            | Profils, équipes         |

---

## 3. Naming Conventions

### 3.1 Fichiers & Dossiers

| Type       | Format               | Exemple                        |
| ---------- | -------------------- | ------------------------------ |
| Components | PascalCase           | `StockItemsTable.jsx`          |
| Pages      | PascalCase           | `StockPage.jsx`                |
| Hooks      | camelCase avec `use` | `useStockItems.js`             |
| API        | camelCase domaine    | `stock.js`, `interventions.js` |
| Utils      | camelCase            | `dates.js`, `formats.js`       |
| Dossiers   | kebab-case           | `components/stock-items/`      |

### 3.2 Variables & Fonctions

| Type       | Format               | Exemple                              |
| ---------- | -------------------- | ------------------------------------ |
| Functions  | camelCase            | `fetchStockItems()`, `handleClick()` |
| Components | PascalCase           | `<PageHeader />`, `<ErrorState />`   |
| Constants  | SCREAMING_SNAKE_CASE | `MAX_ITEMS = 100`                    |
| Booleans   | `is*` / `has*`       | `isLoading`, `hasError`              |
| Callbacks  | `on*` / `handle*`    | `onClick`, `handleDelete`            |
| Computed   | Substantifs          | `filteredData`, `stats`              |

### 3.3 Props

```javascript
// BON
function StockItemRow({
  item, // Data props : substantifs
  isSelected, // Boolean : is*/has*
  onEdit, // Callbacks : on*
  className = '', // Default values
}) {}

// MAUVAIS
function StockItemRow({
  data, // Trop vague
  loading, // Pas de préfixe is*
  click, // Pas de on*
}) {}
```

### 3.4 Style de Code Naturel (MANDATORY)

#### 3.4.1 Éviter les Patterns "IA"

```javascript
// MAUVAIS : Commentaires robotiques sur-documentés
/**
 * This function handles the click event
 * @param {Event} e - The click event object
 * @returns {void} Nothing is returned
 */
const handleClick = (e) => {
  // Prevent the default behavior of the event
  e.preventDefault();
  // Update the state with the new value
  setState(newValue);
};

// BON : Commentaires concis et pertinents
const handleClick = (e) => {
  e.preventDefault();
  setState(newValue);
};
```

#### 3.4.2 Nommage Authentique

```javascript
// MAUVAIS
const handleButtonClickEvent = () => {};
const isUserCurrentlyAuthenticated = false;

// BON
const handleSave = () => {};
const isAuthenticated = false;
```

#### 3.4.3 Structure Pragmatique

```javascript
// MAUVAIS : Sur-ingénierie
const DataProcessor = {
  process: (data) =>
    DataProcessor.validate(data) ? DataProcessor.transform(data) : DataProcessor.handleError(),
  validate: (data) => data !== null,
  transform: (data) => data.map((x) => x.value),
  handleError: () => null,
};

// BON : Simple et direct
const processData = (data) => {
  if (!data) return null;
  return data.map((x) => x.value);
};
```

#### 3.4.4 Checklist Code Naturel

- [ ] Pas de commentaires évidents ("// Import React", "// Return JSX")
- [ ] Variables nommées de façon concise
- [ ] Pas de sur-découpage en micro-fonctions
- [ ] Messages d'erreur directs et contextuels en français
- [ ] Code idiomatique JavaScript/React

---

## 4. Composants React

### 4.1 Standards des Composants ui/ (MANDATORY)

Tous les composants dans `src/components/ui/` doivent respecter :

#### PropTypes Obligatoires

```jsx
import PropTypes from 'prop-types';

export default function KPICard({ label, value, onClick }) {
  // ...
}

KPICard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func,
};
```

#### JSDoc Complet

```jsx
/**
 * @fileoverview Carte KPI générique — sans connaissance métier
 * @module components/ui/KPICard
 */

/**
 * Affiche une valeur clé avec son libellé
 * @component
 * @param {Object} props
 * @param {string} props.label - Libellé affiché
 * @param {string|number} props.value - Valeur principale
 * @param {Function} [props.onClick] - Callback optionnel
 * @returns {JSX.Element}
 * @example
 * <KPICard label="Total" value={42} />
 */
export default function KPICard({ label, value, onClick }) {
  // ...
}
```

#### Extraction de Helpers et Constantes

```jsx
// MAUVAIS : Logique inline
export default function Component({ progress }) {
  const color = progress >= 95 ? 'green' : progress >= 85 ? 'orange' : 'red'
  return <Box style={{ color }} />
}

// BON : Helper extrait avec constantes nommées
const SEUILS = { EXCELLENT: 95, BON: 85 }

const determinerCouleur = (progress) => {
  if (progress >= SEUILS.EXCELLENT) return 'green'
  if (progress >= SEUILS.BON) return 'orange'
  return 'red'
}

export default function Component({ progress }) {
  const color = determinerCouleur(progress)
  return <Box style={{ color }} />
}
```

#### Checklist Composant ui/

- [ ] PropTypes complets avec `.isRequired` appropriés
- [ ] JSDoc avec `@fileoverview`, `@module`, `@component`, `@example`
- [ ] Aucun hook métier, aucun import depuis `api/` ou `hooks/[domaine]/`
- [ ] Fichier < 200 lignes
- [ ] Complexité ≤ 10 par fonction
- [ ] Aucun warning ESLint

### 4.2 Structure d'une Page

```jsx
// pages/stock/StockPage.jsx — max 50 lignes
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import StockItemsTab from '@/components/stock/tabs/StockItemsTab';
import StockFamiliesTab from '@/components/stock/tabs/StockFamiliesTab';
import PartTemplatesTab from '@/components/stock/tabs/PartTemplatesTab';

const TABS = [
  { id: 'items', label: 'Pièces' },
  { id: 'families', label: 'Familles' },
  { id: 'templates', label: 'Templates' },
];

// Une Page = shell + navigation entre onglets
// Zéro état métier, zéro logique, zéro appel API
export default function StockPage() {
  const { activeTab, setActiveTab } = useTabNavigation('items');

  return (
    <PageContainer>
      <PageHeader title="Stock" />
      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === 'items' && <StockItemsTab />}
      {activeTab === 'families' && <StockFamiliesTab />}
      {activeTab === 'templates' && <PartTemplatesTab />}
    </PageContainer>
  );
}
```

### 4.3 Structure d'un Tab (chef d'orchestre)

```jsx
// components/stock/tabs/StockItemsTab.jsx — max 80 lignes
import { useStockItems } from '@/hooks/stock/useStockItems';
import { useNotification } from '@/hooks/shared/useNotification';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { StockItemsTable } from '@/components/stock/items/StockItemsTable';
import { AddStockItemDialog } from '@/components/stock/items/AddStockItemDialog';

// Un Tab = chef d'orchestre de son onglet
// Gère : chargement, erreur, notifications, assemblage
// Ne gère PAS : logique métier complexe (dans le hook), rendu détaillé (dans les composants)
export default function StockItemsTab() {
  const { items, loading, error, addItem } = useStockItems();
  const { notify } = useNotification();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const handleAdd = async (data) => {
    await addItem(data);
    notify('Pièce ajoutée avec succès');
  };

  return (
    <>
      <StockItemsTable items={items} />
      <AddStockItemDialog onSubmit={handleAdd} />
    </>
  );
}
```

### 4.4 Composants Domain

```jsx
/**
 * Ligne d'article en stock
 * @component
 * @param {Object} props
 * @param {Object} props.item - Données de l'article
 * @param {boolean} props.isSelected
 * @param {Function} props.onEdit
 */
export default function StockItemRow({ item, isSelected = false, onEdit }) {
  return (
    <Table.Row style={{ border: isSelected ? '2px solid var(--blue-9)' : undefined }}>
      {/* Contenu */}
    </Table.Row>
  );
}

StockItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
};
```

---

## 5. Hooks & State Management

### 5.1 Structure d'un Hook Métier

```javascript
// hooks/stock/useStockItems.js
import { useState, useEffect, useCallback } from 'react';
import { fetchStockItems, createStockItem } from '@/api/stock';

// Un hook = une responsabilité claire
// Expose : données + états + actions
export function useStockItems(filtres = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStockItems(filtres);
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filtres]);

  useEffect(() => {
    charger();
  }, [charger]);

  const addItem = async (data) => {
    const nouvelItem = await createStockItem(data);
    setItems((prev) => [...prev, nouvelItem]);
    return nouvelItem;
  };

  return { items, loading, error, addItem, recharger: charger };
}
```

### 5.2 Ordre des Hooks dans un Composant

```javascript
export default function MonComposant() {
  // 1. useState
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 2. useRef
  const initialLoadRef = useRef(false);

  // 3. Router hooks
  const { id } = useParams();

  // 4. Custom hooks métier
  const { items, addItem } = useStockItems();

  // 5. useMemo
  const filteredItems = useMemo(() => items.filter((i) => i.actif), [items]);

  // 6. useCallback
  const handleAdd = useCallback(
    async (data) => {
      await addItem(data);
    },
    [addItem]
  );

  // 7. useEffect
  useEffect(() => {
    // Protection contre le double appel en React StrictMode
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    charger();
  }, []);
}
```

### 5.3 Requêtes Parallèles

```javascript
// BON : Parallèle
const [items, suppliers] = await Promise.all([fetchStockItems(), fetchSuppliers()]);

// MAUVAIS : Séquentiel (2x plus lent)
const items = await fetchStockItems();
const suppliers = await fetchSuppliers();
```

---

## 6. API & Data Fetching

### 6.1 Structure d'un Fichier api/

```javascript
// api/stock.js
import { client } from '@/lib/api/client';

// Chaque fonction = un endpoint
// Nommage : verbe + entité
// Pas de transformation — retourne la réponse brute du backend

/**
 * Récupère la liste des articles en stock
 * @param {Object} params - Filtres et pagination
 * @returns {Promise<Array>}
 */
export async function fetchStockItems(params = {}) {
  return client.get('/stock/items', { params });
}

export async function fetchStockItem(id) {
  return client.get(`/stock/items/${id}`);
}

export async function createStockItem(data) {
  return client.post('/stock/items', data);
}

export async function updateStockItem(id, data) {
  return client.put(`/stock/items/${id}`, data);
}

export async function deleteStockItem(id) {
  return client.delete(`/stock/items/${id}`);
}
```

### 6.2 Règle fondamentale

Le backend Python assemble les données croisées. Le front ne recompose jamais
plusieurs appels pour construire un objet métier.

```javascript
// BON : un appel, objet complet retourné par le backend
const intervention = await fetchInterventionDetail(id);
// intervention.pieces[].fournisseur est déjà présent

// MAUVAIS : jointure côté front
const intervention = await fetchIntervention(id);
const pieces = await fetchPiecesIntervention(id);
const fournisseurs = await fetchFournisseurs();
```

### 6.3 Gestion des Erreurs dans api/

```javascript
// Dans api/ : laisser remonter, ne pas swallower
export async function fetchStockItems() {
  return client.get('/stock/items'); // pas de try/catch ici
}

// Dans le hook : capturer et exposer via state
try {
  const data = await fetchStockItems();
  setItems(data);
} catch (err) {
  setError(err); // le Tab affichera <ErrorState />
}
```

---

## 7. Formulaires

### 7.1 Pattern Contrôlé

```javascript
export default function StockItemForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validerFormulaire(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    await onSubmit(formData);
  };

  return <form onSubmit={handleSubmit}>{/* Champs */}</form>;
}
```

### 7.2 Formulaires dans Panneaux Expandables

```jsx
{
  isEditingMode && (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text weight="bold" size="3">
            Ajouter [entité]
          </Text>
        </Flex>

        <Flex gap="2" wrap="wrap" align="end">
          <Box style={{ flex: '1', minWidth: '200px' }}>
            <Text size="2" as="label" weight="bold">
              Label
            </Text>
            <TextField.Root
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder="Exemple..."
            />
          </Box>
        </Flex>

        <Flex gap="1">
          <Button size="2" color="green" onClick={handleSave}>
            Enregistrer
          </Button>
          <Button size="2" variant="soft" color="gray" onClick={handleCancel}>
            Annuler
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
```

### 7.3 Formulaires Standalone / Modaux

```jsx
export default function EntityForm({ onCancel, onSubmit, errors = [] }) {
  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">
            Nouvelle entité
          </Text>
        </Flex>

        {errors.length > 0 && (
          <Box
            style={{
              background: 'var(--red-3)',
              border: '1px solid var(--red-7)',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <Text color="red" weight="bold" size="2">
              Erreurs de validation
            </Text>
            {errors.map((err, idx) => (
              <Text key={idx} color="red" size="1">
                • {err}
              </Text>
            ))}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Champs */}
            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" onClick={onCancel} size="2">
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2">
                <Plus size={16} />
                Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
```

### 7.4 Règles d'Esthétique des Formulaires

- **Couleur Card** : `var(--blue-2)` + border `var(--blue-6)` pour tous les formulaires
- **En-tête** : icône `size={20}` + titre `size="3"` `weight="bold"`
- **Boutons** : `justify="end"`, Annuler (soft + gray), Action principale (blue + icône)
- **Size** : `size="2"` pour tous les boutons
- **Labels** : toujours présents, `weight="bold"`, pas de `color="gray"`
- **Erreurs** : bloc séparé rouge, liste à puces avec "•"
- **Contraste** : ratio minimum 4.5:1 (WCAG AA)
- **Champs obligatoires** : marquage visuel avec `*`

### 7.5 Checklist Formulaire

- [ ] Couleur Card cohérente : `var(--blue-2)`
- [ ] Icône dans l'en-tête (Plus, Edit2...)
- [ ] Titre explicite size="3" weight="bold"
- [ ] Bloc d'erreurs séparé avec fond rouge
- [ ] Boutons alignés à droite (`justify="end"`)
- [ ] Bouton Annuler : soft + gray
- [ ] Bouton principal : blue + icône + "Enregistrer"
- [ ] `size="2"` sur tous les boutons
- [ ] Labels toujours présents, en gras
- [ ] Champs obligatoires marqués avec `*`
- [ ] Validation avant submit
- [ ] PropTypes complets

---

## 8. Gestion des Onglets

### 8.1 Pattern Standard V3

La gestion des onglets est répartie sur 3 niveaux stricts :

**Page** : déclare les onglets, délègue tout le reste aux Tabs. Max 50 lignes.

**Tab** : chef d'orchestre de son onglet. Hooks, loading, erreur, assemblage. Max 80 lignes.

**Composants** : affichage pur, props only.

```javascript
// Constantes d'onglets — toujours en UPPER_CASE
const STOCK_TABS = {
  ITEMS: 'items',
  FAMILIES: 'families',
  TEMPLATES: 'templates',
};
```

### 8.2 Recherche et Filtrage

Toujours côté serveur avec debounce. Jamais de filtrage client sur volumes importants.

```javascript
// BON : debounce 600ms + URL sync
const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch('search', 600);

// Le terme est passé au hook qui l'envoie à api/[domaine].js
// Le backend filtre et retourne les résultats paginés
```

### 8.3 Pagination

Côté serveur pour les listes > 100 items.

```javascript
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(50)

// Reset page si recherche change
useEffect(() => { setCurrentPage(1) }, [debouncedSearchTerm])

<Pagination
  currentPage={currentPage}
  totalItems={pagination.total}
  itemsPerPage={itemsPerPage}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={(size) => { setItemsPerPage(size); setCurrentPage(1) }}
  pageSizeOptions={[25, 50, 100, 200]}
/>
```

### 8.4 Auto-Refresh

Seulement sur les onglets qui en ont besoin.

```javascript
const shouldAutoRefresh = activeTab === 'items';

useAutoRefresh(
  async () => {
    if (!shouldAutoRefresh) return;
    await recharger();
  },
  30,
  shouldAutoRefresh
);
```

### 8.5 Feedback Utilisateur

```javascript
const { notify } = useNotification();

// Après action réussie dans le Tab
const handleAdd = async (data) => {
  await addItem(data);
  notify('Pièce ajoutée avec succès');
};
```

### 8.6 Checklist Page Multi-Onglets

- [ ] Page < 50 lignes, Tab < 80 lignes
- [ ] Constantes `TABS` définies en UPPER_CASE
- [ ] Hook `useTabNavigation` avec paramètre URL
- [ ] Chaque onglet = un Tab autonome dans `components/[domaine]/tabs/`
- [ ] Recherche avec `useDebouncedSearch` (600ms)
- [ ] Pagination côté serveur si > 100 items
- [ ] Auto-refresh seulement sur onglets pertinents
- [ ] `LoadingState` et `ErrorState` gérés dans chaque Tab
- [ ] Notifications via `useNotification`

---

## 9. Sécurité

### 9.1 Sanitization HTML

```javascript
import { stripHtml, sanitizeHtml } from '@/lib/utils/strings'

<Text>{stripHtml(description)}</Text>
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(richContent) }} />
```

### 9.2 Validation des Entrées

```javascript
// BON : Validation stricte avant envoi
const validerEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

if (!validerEmail(userInput)) {
  setError('Email invalide');
  return;
}
```

### 9.3 Secrets & Variables d'Environnement

```javascript
// BON
const API_URL = import.meta.env.VITE_API_URL;

// MAUVAIS
const API_URL = 'https://api.example.com'; // Hardcoded — INTERDIT
```

---

## 10. Performance

### 10.1 useMemo pour Calculs Coûteux

```javascript
// MAUVAIS : Recalculé à chaque render
const stats = data.reduce((acc, item) => ({ total: acc.total + item.value }), { total: 0 });

// BON : Mémorisé
const stats = useMemo(() => {
  return data.reduce((acc, item) => ({ total: acc.total + item.value }), { total: 0 });
}, [data]);
```

### 10.2 Lazy Loading des Données

```javascript
// BON : Charger au besoin
useEffect(() => {
  if (activeTab === 'advanced' && !advancedLoaded) {
    chargerAvance();
    setAdvancedLoaded(true);
  }
}, [activeTab, advancedLoaded]);

// MAUVAIS : Tout charger d'un coup au mount
useEffect(() => {
  Promise.all([chargerResume(), chargerAvance(), chargerConfig()]);
}, []);
```

---

## 11. Accessibilité

### 11.1 Labels & ARIA

```javascript
// BON
<label htmlFor="email">Email</label>
<input id="email" type="email" />
<button aria-label="Fermer le dialogue"><XCircle /></button>

// MAUVAIS
<input type="email" />
<button><XCircle /></button>
```

### 11.2 Keys sur les Listes

```javascript
// BON
{
  items.map((item) => <Card key={item.id}>...</Card>);
}

// MAUVAIS — peut causer des bugs
{
  items.map((item, index) => <Card key={index}>...</Card>);
}
```

### 11.3 HTML Sémantique

```javascript
// BON
<button onClick={handleClick}>Cliquez</button>

// MAUVAIS
<div onClick={handleClick}>Cliquez</div>
```

---

## 12. Responsivité

### 12.1 Responsive Props (Radix UI)

```javascript
<Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
  <Card>...</Card>
</Grid>

<Box display={{ initial: 'none', md: 'block' }}>
  Desktop uniquement
</Box>
```

### 12.2 Breakpoints Radix

| Token     | Largeur          |
| --------- | ---------------- |
| `initial` | < 520px (mobile) |
| `xs`      | 520px            |
| `sm`      | 768px (tablet)   |
| `md`      | 1024px (desktop) |
| `lg`      | 1280px           |
| `xl`      | 1640px           |

---

## 13. Documentation du Code

### 13.1 JSDoc pour Fonctions Utilitaires

```javascript
/**
 * Calcule les statistiques d'actions
 * @param {Array<Object>} actions - Tableau d'actions
 * @param {number} actions[].duree - Durée en minutes
 * @returns {Object} Statistiques calculées
 * @throws {Error} Si actions n'est pas un tableau
 * @example
 * const stats = calculerStatsActions(actions)
 */
export function calculerStatsActions(actions) {
  if (!Array.isArray(actions)) throw new Error('actions doit être un tableau');
  // ...
}
```

### 13.2 Commentaires pour la Logique

```javascript
// BON : Explique le POURQUOI
useEffect(() => {
  // Protection contre le double appel en React StrictMode
  if (initialLoadRef.current) return;
  initialLoadRef.current = true;
  charger();
}, []);

// MAUVAIS : Explique le QUOI (évident dans le code)
useEffect(() => {
  // Récupère les données
  charger();
}, []);
```

---

## 14. Erreurs & Logging

### 14.1 Gestion des Erreurs

```javascript
// BON : ErrorState avec retry
if (error) return <ErrorState error={error} onRetry={recharger} />;

// MAUVAIS
if (error) return <div>Erreur</div>;
```

### 14.2 Logging

```javascript
// BON : Logs dev uniquement
if (import.meta.env.DEV) {
  console.log('Chargement des articles...');
}

// MAUVAIS
console.log('test'); // Oublié en prod
console.log(userData); // Sécurité !
```

### 14.3 Système de Notification (MANDATORY)

#### Interdiction de alert() / confirm() / prompt()

```javascript
// INTERDIT
window.alert('Opération réussie');
if (window.confirm('Supprimer ?')) {
}

// CORRECT : via useNotification
const { notify } = useNotification();
notify('Pièce ajoutée avec succès');
```

#### Types Standardisés (Radix UI Callout)

```javascript
// Erreur
<Callout.Root color="red" size="2">
  <Callout.Icon>
    <AlertTriangle size={18} />
  </Callout.Icon>
  <Callout.Text>Message d'erreur</Callout.Text>
</Callout.Root>

// Succès : color="green" + CheckCircle2
// Avertissement : color="amber" + AlertTriangle
// Info : color="blue" + Info
```

#### Palette de Couleurs

| Type          | Couleur | Icône                      |
| ------------- | ------- | -------------------------- |
| Erreur        | `red`   | `AlertTriangle`, `XCircle` |
| Avertissement | `amber` | `AlertTriangle`            |
| Succès        | `green` | `CheckCircle2`, `Check`    |
| Info          | `blue`  | `Info`, `HelpCircle`       |

#### Checklist Notifications

- [ ] Aucun `alert()`, `confirm()`, `prompt()`
- [ ] Icônes Lucide React uniquement
- [ ] Couleurs Radix UI standardisées
- [ ] `aria-live="polite"` pour notifications dynamiques
- [ ] `aria-describedby` pour erreurs de champs

---

## 15. Tests

### 15.1 Structure

```
src/
├── __tests__/
│   ├── utils/
│   │   └── dates.test.js
│   ├── hooks/
│   │   └── useStockItems.test.js
│   └── components/
│       └── StockItemsTable.test.jsx
```

### 15.2 Tests Manuels Essentiels

Avant chaque déploiement :

- [ ] État de chargement
- [ ] Affichage des erreurs avec retry
- [ ] Validation des formulaires
- [ ] Responsive (mobile / tablet / desktop)
- [ ] Accessibilité (Tab, Enter)

---

## 16. Build & Deployment

### 16.1 Commandes

```bash
npm run dev       # Développement
npm run build     # Build production
npm run preview   # Preview du build
npm run lint      # Vérification ESLint
```

### 16.2 Checklist Avant Deploy

- [ ] `npm run build` sans erreurs ni warnings
- [ ] `npm run lint` sans erreurs
- [ ] Pas de `console.log` hors blocs `import.meta.env.DEV`
- [ ] Variables d'environnement configurées
- [ ] Tests manuels passés
- [ ] Pas de secrets exposés dans le code

---

## 17. Git & Commits

### 17.1 Conventional Commits

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:      Nouvelle fonctionnalité
fix:       Correction de bug
refactor:  Restructuration sans changement fonctionnel
style:     Formatage (pas de logique)
docs:      Documentation
perf:      Amélioration performance
test:      Tests
chore:     Dépendances, config

# Exemples
git commit -m "feat(stock): ajout recherche par référence fournisseur"
git commit -m "fix(interventions): correction calcul durée totale"
git commit -m "refactor(stock): découpage StockItemsTab en sous-composants"
```

### 17.2 Branch Naming

```bash
feature/   → Nouvelle fonctionnalité
bugfix/    → Correction
refactor/  → Refactorisation
docs/      → Documentation

# Exemples
git checkout -b feature/recherche-reference-fournisseur
git checkout -b bugfix/calcul-duree-intervention
git checkout -b refactor/architecture-v3
```

---

## 18. Changelog & Versioning

### 18.1 Finalité du Changelog (NON NÉGOCIABLE)

Le changelog est un **outil de lecture produit et de pilotage**, pas un journal de développement.

Il doit permettre, en moins de 30 secondes, de répondre à :

- Qu'est-ce qui change **pour l'utilisateur** ?
- Le risque augmente-t-il ou diminue-t-il ?
- Cette version est-elle **fiable** ou **à surveiller** ?

Tout contenu ne répondant pas explicitement à ces questions est **interdit**.

### 18.2 Format Standardisé (OBLIGATOIRE)

```markdown
## X.Y.Z - YYYY-MM-DD

Stabilité : stable | en consolidation | expérimental

### Impact fonctionnel

- Changements visibles pour l'utilisateur final UNIQUEMENT

### Stabilisation / Dette technique

- Changements invisibles MAIS ayant un impact sur la fiabilité
- Formulation orientée risque évité / robustesse accrue
- ZERO détail d'implémentation

### Composants / Modules concernés

- Liste factuelle de périmètre, noms exacts, chemins courts

### Points de vigilance

- Ce qui peut casser
- Ce qui devient critique
- Contraintes pour les versions suivantes
```

### 18.3 Règles de Rédaction

**Langage NON-TECHNIQUE (OBLIGATOIRE)** :

Le changelog doit être compréhensible par un non-développeur (chef de projet, utilisateur final, direction).

Interdit :

- Noms de fichiers techniques (`menuConfig.js`, `routes.jsx`, `[PageName].config.js`)
- Chemins de code (`src/pages/`, `components/layout/`)
- Technologies/patterns (`import.meta.glob`, `auto-discovery`, `glob pattern`)
- Termes de développeur (`export`, `config`, `wrapper`, `hook`, `component`)
- Acronymes techniques non expliqués (API, DTO, CRUD, etc.)

Autorisé :

- Noms de domaines métier (Interventions, Stock, Achats)
- Noms de fonctionnalités utilisateur (Menu, Recherche, Formulaire)
- Concepts génériques compréhensibles (Structure, Organisation, Configuration)

**Impact fonctionnel** : si un utilisateur final ne peut pas le constater → interdit ici.

Verbes autorisés : Permet, Corrige, Améliore, Supprime, Bloque, Empêche, Rend possible.

**Stabilité** :

- stable : aucun refactor récent, minimum 2 versions sans modification de périmètre, aucun `eslint-disable`
- en consolidation : refactor récent, nettoyage large
- expérimental : nouvelle logique, règles non figées, feedback requis

**Stabilisation / Dette** : décrire le risque évité, jamais la solution technique.

Format : `[Action] → [Risque réduit]`

Exemples valides :

- "Découpage de composants critiques → réduction du risque de régression"
- "Sécurisation des interfaces publiques → détection précoce des erreurs"

Exemples interdits :

- "Ajout de PropTypes"
- "Extraction de helpers"
- "Migration vers X"
- "Optimisation bundler / hooks / build"

### 18.4 PATCH vs MINOR

**PATCH (X.Y.Z++)** — Un seul changement simple

```markdown
## X.Y.Z - YYYY-MM-DD

Stabilité : stable

### Impact fonctionnel

- Les demandes d'achat créées s'affichent immédiatement
```

Règles PATCH :

- Impact : 1 seule phrase claire, max 100 caractères
- Aucun jargon technique
- "Composants concernés" : ≤ 2 fichiers (sinon c'est un MINOR)
- "Points de vigilance" : uniquement si l'utilisateur doit agir

**MINOR (X.Y.0)** — Nouvelles capacités utilisateur, UX améliorée, changement de comportement perceptible.

**MAJOR (X.0.0)** — Rupture de modèle mental, migration requise, suppression de fonctionnalités.

Règle absolue : une version = **un seul type** (pas de mix PATCH + MINOR).

### 18.5 Clause Anti-Auto-Justification (CRITIQUE)

Interdit dans tout le changelog :

- Métriques internes (lignes, fichiers, kB, temps de build)
- Justification esthétique ou morale du travail
- Comparaison technique "avant / après"
- Valorisation du travail de développement

Le changelog **ne sert pas à prouver que le travail est bien fait**.

### 18.6 Checklist Finale (BLOQUANTE)

Avant commit :

- [ ] Impact utilisateur explicite ou explicitement nul
- [ ] Aucun détail d'implémentation
- [ ] Aucune métrique interne
- [ ] Aucun nom de fichier technique
- [ ] Aucun chemin de code (src/, components/, etc.)
- [ ] Aucun terme de développeur (hook, component, config, export, etc.)
- [ ] Stabilité cohérente avec le contenu
- [ ] Points de vigilance renseignés si refactor
- [ ] Lecture possible par un non-développeur sans contexte technique

Si un point échoue → réécriture obligatoire.

---

## Ressources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [Radix UI Themes](https://www.radix-ui.com/themes/docs/overview/getting-started)
- [Lucide React Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Accessibility](https://www.w3.org/WAI/)

---

**Ces conventions sont obligatoires pour tous les développements sur le projet Tunnel GMAO V3.**
