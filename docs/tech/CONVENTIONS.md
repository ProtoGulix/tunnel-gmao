# 📚 Conventions - Tunnel GMAO

> **Document Maître** : Toutes les conventions de développement du projet
>
> **Dernière mise à jour**: 2 janvier 2026  
> **Version**: 2.1.0

---

## ⚠️ Lecture Obligatoire Avant Contribution

### Prérequis : Comprendre le métier

**Avant de lire ce document, lire impérativement :**  
📖 [../REGLES_METIER.md](../REGLES_METIER.md) - Concepts métier fondamentaux (5 min)

Les conventions de code découlent directement des règles métier. Par exemple :

- DTOs `Intervention` incluent toujours `request: { id, title }` (règle : intervention dépend de demande)
- DTOs `Action` portent `timeSpent`, `complexityScore` (règle : seule unité de travail tracée)
- `Subtask` n'a pas de champs analytiques (règle : organisation, pas traçabilité)

**Sans comprendre les règles métier, vous écrirez du code qui viole les concepts fondamentaux.**

---

## 📖 Table des Matières

### 🎯 Essentiels

1. [Architecture & Structure](#1-architecture--structure)
2. [Imports & Dépendances](#2-imports--dépendances)
3. [Naming Conventions](#3-naming-conventions)
4. [Composants React](#4-composants-react)

### 🔧 Patterns & Bonnes Pratiques

5. [Hooks & State Management](#5-hooks--state-management)
6. [API & Data Fetching](#6-api--data-fetching)
7. [Formulaires](#7-formulaires)
8. [Gestion des Onglets](#8-gestion-des-onglets)

### 🛡️ Qualité & Sécurité

9. [Sécurité](#9-sécurité)
10. [Performance](#10-performance)
11. [Accessibilité](#11-accessibilité)
12. [Responsivité](#12-responsivité)

### 📝 Documentation

13. [Documentation du Code](#13-documentation-du-code)
14. [Erreurs & Logging](#14-erreurs--logging)
15. [Tests](#15-tests)

### 🚀 DevOps & Déploiement

16. [Build & Deployment](#16-build--deployment)
17. [Git & Commits](#17-git--commits)

---

## 1. Architecture & Structure

### 1.1 Organisation des Dossiers

```
src/
├── pages/              # Route components (PascalCase)
│   └── public/        # Pages publiques (sans auth)
├── components/
│   ├── Layout.jsx     # Layout privé (sidebar + auth)
│   ├── PublicLayout.jsx # Layout public
│   ├── layout/        # PageHeader, composants de layout
│   ├── common/        # Réutilisables (ErrorState, KPICard)
│   ├── [domain]/      # Par domaine (actions/, interventions/, machines/)
│   └── ui/            # Wrappers Radix UI
├── hooks/             # Custom hooks (useApiCall, useStockData)
├── contexts/          # React Context (Auth, Error, Cache)
├── lib/
│   ├── api/           # API functions (fetchInterventions, etc.)
│   └── icons.js       # Export centralisé des icônes Lucide
├── config/            # Constantes (interventionTypes, anomalyConfig)
├── styles/            # CSS global
├── utils/             # Pure functions (formatters, helpers)
└── auth/              # AuthContext et useAuth
```

### 1.2 Alias d'Import

Utiliser `@/*` partout (défini dans `jsconfig.json`):

```javascript
// ✅ BON
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/auth/AuthContext';

// ❌ MAUVAIS
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/AuthContext';
```

---

## 2. Imports & Dépendances

### 2.1 Ordre des Imports (MANDATORY)

```javascript
// 1. React core
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// 2. React Router
import { useParams, useNavigate, Link } from 'react-router-dom';

// 3. External Libraries
import axios from 'axios';

// 4. UI Libraries (Radix)
import { Box, Flex, Grid, Card, Text, Button, Heading } from '@radix-ui/themes';

// 5. Icons (toujours importer les composants)
import { ClipboardList, Plus, AlertTriangle } from 'lucide-react';

// 6. Custom Components
import PageHeader from '@/components/layout/PageHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';

// 7. Custom Hooks
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from '@/auth/AuthContext';

// 8. Utilities
import { formatDate, calculateStats } from '@/lib/utils/actionUtils';

// 9. Config & Constants
import { INTERVENTION_TYPES, STATUS_CONFIG } from '@/config/interventionTypes';
```

### 2.2 Pas d'Imports Relatifs Imbriqués

```javascript
// ❌ MAUVAIS
import Button from '../../../../components/Button';

// ✅ BON
import Button from '@/components/ui/Button';
```

### 2.3 Interdiction des Emojis (MANDATORY)

**Règle absolue** : Aucun emoji dans le code source.

```javascript
// ❌ INTERDIT : Emojis dans le code
const message = '✅ Validation réussie';
const error = '❌ Erreur critique';
return <Text>📦 Article : {name}</Text>;

// ✅ AUTORISÉ : Icônes Lucide React uniquement
import { CheckCircle2, AlertTriangle, Package } from 'lucide-react';

const message = 'Validation réussie';
const error = 'Erreur critique';
return (
  <Flex align="center" gap="2">
    <Package size={16} />
    <Text>Article : {name}</Text>
  </Flex>
);
```

**Pourquoi cette règle ?**

- Cohérence visuelle avec le design system
- Contrôle total sur la taille et la couleur des icônes
- Accessibilité garantie (aria-label, screen readers)
- Rendu uniforme sur tous les navigateurs et OS
- Code professionnel et maintenable

**Icônes Lucide recommandées par contexte :**

| Contexte      | Icône Lucide               | Usage                    |
| ------------- | -------------------------- | ------------------------ |
| Succès        | `CheckCircle2`, `Check`    | Validation, confirmation |
| Erreur        | `AlertTriangle`, `XCircle` | Erreurs, échecs          |
| Avertissement | `AlertTriangle`, `Info`    | Warnings, attention      |
| Information   | `Info`, `HelpCircle`       | Infos, aide              |
| Article/Stock | `Package`, `Box`           | Produits, inventaire     |
| Document      | `FileText`, `File`         | Documents, fichiers      |
| Ajout         | `Plus`, `PlusCircle`       | Création, ajout          |
| Suppression   | `Trash2`, `X`              | Suppression              |
| Édition       | `Edit2`, `Edit3`           | Modification             |
| Recherche     | `Search`                   | Recherche, filtres       |
| Paramètres    | `Settings`, `Sliders`      | Configuration            |
| Utilisateur   | `User`, `Users`            | Profils, équipes         |

**Application de la règle :**

- ESLint : Ajouter une règle custom pour détecter les emojis
- Code review : Rejeter tout PR contenant des emojis
- Migration : Remplacer progressivement les emojis existants

---

## 3. Naming Conventions

### 3.1 Fichiers & Dossiers

| Type           | Format     | Exemple                             |
| -------------- | ---------- | ----------------------------------- |
| **Components** | PascalCase | `InterventionDetail.jsx`            |
| **Pages**      | PascalCase | `InterventionsList.jsx`             |
| **Hooks**      | camelCase  | `useApiCall.js`                     |
| **Utilities**  | camelCase  | `actionUtils.js`                    |
| **Config**     | camelCase  | `interventionTypes.js`              |
| **Dossiers**   | kebab-case | `src/components/purchase-requests/` |

### 3.2 Variables & Fonctions

| Type           | Format               | Exemple                                    |
| -------------- | -------------------- | ------------------------------------------ |
| **Functions**  | camelCase            | `fetchInterventions()`, `handleClick()`    |
| **Components** | PascalCase           | `<PageHeader />`, `<ErrorDisplay />`       |
| **Constants**  | SCREAMING_SNAKE_CASE | `MAX_ITEMS = 100`, `DEFAULT_SORT = 'date'` |
| **Booleans**   | `is*` / `has*`       | `isLoading`, `hasError`, `isVisible`       |
| **Callbacks**  | `on*` / `handle*`    | `onClick`, `onSubmit`, `handleDelete`      |
| **Computed**   | Substantifs          | `filteredData`, `stats`, `groupedItems`    |

### 3.3 Props

```javascript
// ✅ BON
function InterventionCard({
  data,           // Data props: substantifs
  isLoading,      // Boolean: is*/has*
  onClick,        // Callbacks: on*
  className = '' // Default values
}) {
  return ...;
}

// ❌ MAUVAIS
function InterventionCard({
  data,
  loading,        // ❌ Pas de préfixe
  click,          // ❌ Pas de on*
  style           // ❌ Pas d'alias pour className
}) {
  return ...;
}
```

### 3.4 Style de Code Naturel (MANDATORY)

**Objectif** : Écrire du code qui semble écrit par un développeur expérimenté, pas généré par l'IA.

#### 3.4.1 Éviter les Patterns "IA"

```javascript
// ❌ MAUVAIS : Commentaires robotiques et sur-documentés
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

// ✅ BON : Commentaires concis et pertinents
const handleClick = (e) => {
  e.preventDefault();
  setState(newValue);
};
```

#### 3.4.2 Nommage Authentique

```javascript
// ❌ MAUVAIS : Noms génériques et verbeux
const handleButtonClickEvent = () => {};
const processDataAndReturnResult = () => {};
const isUserCurrentlyAuthenticated = false;

// ✅ BON : Noms naturels et directs
const handleSave = () => {};
const processData = () => {};
const isAuthenticated = false;
```

#### 3.4.3 Structure de Code Pragmatique

```javascript
// ❌ MAUVAIS : Sur-ingénierie
const DataProcessor = {
  process: (data) => {
    return DataProcessor.validate(data)
      ? DataProcessor.transform(data)
      : DataProcessor.handleError();
  },
  validate: (data) => data !== null,
  transform: (data) => data.map((x) => x.value),
  handleError: () => null,
};

// ✅ BON : Simple et direct
const processData = (data) => {
  if (!data) return null;
  return data.map((x) => x.value);
};
```

#### 3.4.4 Gestion d'Erreurs Réaliste

```javascript
// ❌ MAUVAIS : Messages trop formels
throw new Error('An unexpected error has occurred while processing the request');
setError('The operation could not be completed successfully');

// ✅ BON : Messages directs
throw new Error('Impossible de traiter la demande');
setError("Échec de l'opération");
```

#### 3.4.5 Checklist Code Naturel

- [ ] Pas de commentaires évidents ("// Import React", "// Return JSX")
- [ ] Variables nommées de façon concise
- [ ] Pas de sur-découpage en micro-fonctions
- [ ] Messages d'erreur directs et contextuels
- [ ] Pas de patterns répétitifs (copier-coller détectable)
- [ ] Code idiomatique JavaScript/React
- [ ] Utilisation naturelle des hooks (pas d'enchaînements artificiels)

---

## 4. Composants React

### 4.0 Standards des Composants Common (MANDATORY)

Tous les composants dans `src/components/common/` doivent respecter ces règles:

#### 4.0.1 PropTypes Obligatoires

```jsx
import PropTypes from 'prop-types';

export default function MyComponent({ label, value, onClick }) {
  // Implementation...
}

MyComponent.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onClick: PropTypes.func,
};
```

**Règles:**

- ✅ Toujours importer `PropTypes` depuis `"prop-types"`
- ✅ Définir `ComponentName.propTypes` après la définition du composant
- ✅ Marquer les props obligatoires avec `.isRequired`
- ✅ Utiliser les types précis (`string`, `number`, `func`, `bool`, `array`, `object`)
- ✅ `oneOfType([...])` pour accepter plusieurs types
- ✅ `arrayOf(...)`, `shape({...})` pour structures complexes

#### 4.0.2 JSDoc Complet

```jsx
/**
 * @fileoverview Description du module en une ligne
 *
 * @module components/common/ComponentName
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */

/**
 * Description du composant en une phrase
 * @component
 * @param {Object} props
 * @param {string} props.label - Description de la prop
 * @param {string|number} props.value - Valeur principale
 * @param {Function} [props.onClick] - Callback optionnel
 * @returns {JSX.Element} Description du rendu
 * @example
 * <MyComponent label="Total" value={42} onClick={handleClick} />
 */
export default function MyComponent({ label, value, onClick }) {
  // ...
}
```

**Règles:**

- ✅ `@fileoverview` en haut du fichier
- ✅ `@module` pour identifier le module
- ✅ `@requires` pour lister les dépendances principales
- ✅ `@component` pour marquer les composants React
- ✅ `@param` pour chaque prop avec description
- ✅ `[props.name]` pour props optionnelles
- ✅ `@returns` pour décrire le rendu
- ✅ `@example` avec code réaliste

#### 4.0.3 Extraction de Helpers et Constantes

**Extraire la logique complexe dans des helpers:**

```jsx
// ❌ MAUVAIS: Logique inline
export default function Component({ color, progress }) {
  const displayColor = color
    ? color
    : progress !== undefined && typeof progress === "number"
      ? progress >= 95 ? "green" : progress >= 85 ? "orange" : "red"
      : "blue";

  return <Box style={{ color: displayColor }} />;
}

// ✅ BON: Helper extrait
/** Couleur par défaut */
const DEFAULT_COLOR = "blue";

/** Seuils de coloration */
const THRESHOLDS = { EXCELLENT: 95, GOOD: 85 };

/**
 * Détermine la couleur selon le contexte
 * @param {string|undefined} color - Couleur explicite
 * @param {number|undefined} progress - Valeur 0-100
 * @returns {string} Nom de couleur Radix UI
 */
const determineColor = (color, progress) => {
  if (color) return color;
  if (progress !== undefined && typeof progress === "number") {
    if (progress >= THRESHOLDS.EXCELLENT) return "green";
    if (progress >= THRESHOLDS.GOOD) return "orange";
    return "red";
  }
  return DEFAULT_COLOR;
};

export default function Component({ color, progress }) {
  const displayColor = determineColor(color, progress);
  return <Box style={{ color: displayColor }} />;
}
```

**Règles:**

- ✅ Extraire constantes en SCREAMING_SNAKE_CASE
- ✅ Helpers nommés avec verbes (`determine*`, `build*`, `calculate*`, `format*`)
- ✅ Documenter helpers avec JSDoc
- ✅ Garder composants < 200 lignes (config ESLint)
- ✅ Complexité cyclomatique ≤ 10 par fonction

#### 4.0.4 Extraction de Sous-composants

```jsx
// ❌ MAUVAIS: Tout dans un composant
export default function Card({ title, icon, items }) {
  return (
    <Box>
      <Flex>
        {icon && <Box>{icon}</Box>}
        <Heading>{title}</Heading>
      </Flex>
      <Box>
        {items.map((item, idx) => (
          <Box key={idx}>
            <Text>{item.label}</Text>
            <Text>{item.value}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ✅ BON: Sous-composants extraits
/**
 * En-tête de la carte
 * @param {Object} props
 * @param {string} props.title
 * @param {JSX.Element} [props.icon]
 */
function CardHeader({ title, icon }) {
  return (
    <Flex>
      {icon && <Box>{icon}</Box>}
      <Heading>{title}</Heading>
    </Flex>
  );
}

CardHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element,
};

/**
 * Item individuel
 * @param {Object} props
 * @param {string} props.label
 * @param {string} props.value
 */
function CardItem({ label, value }) {
  return (
    <Box>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </Box>
  );
}

CardItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

/**
 * Carte complète
 * @component
 */
export default function Card({ title, icon, items }) {
  return (
    <Box>
      <CardHeader title={title} icon={icon} />
      <Box>
        {items.map((item, idx) => (
          <CardItem key={idx} label={item.label} value={item.value} />
        ))}
      </Box>
    </Box>
  );
}

Card.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.element,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
};
```

**Règles:**

- ✅ Créer sous-composants pour blocs réutilisables
- ✅ Nommer avec préfixe du parent (`Card` → `CardHeader`, `CardItem`)
- ✅ Sous-composants non exportés sauf réutilisation externe
- ✅ PropTypes pour tous, même internes
- ✅ Documentation JSDoc minimale

#### 4.0.5 Checklist Composant Common

Avant de commit un composant dans `src/components/common/`:

- [ ] ✅ PropTypes complets avec `.isRequired` appropriés
- [ ] ✅ JSDoc avec `@fileoverview`, `@module`, `@component`, `@example`
- [ ] ✅ Constantes extraites (seuils, valeurs par défaut, styles)
- [ ] ✅ Helpers extraits si logique > 3 lignes ou réutilisée
- [ ] ✅ Sous-composants si rendu > 20 lignes ou répété
- [ ] ✅ Fichier < 200 lignes (ESLint: `max-lines`)
- [ ] ✅ Complexité ≤ 10 par fonction (ESLint: `complexity`)
- [ ] ✅ Aucun warning ESLint (`npm run lint`)
- [ ] ✅ Build réussi (`npm run build`)

**Exemple de référence:** `src/components/common/GenericTabComponents.jsx`

---

### 4.1 Structure Standard de Page

```jsx
// ===== IMPORTS =====
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { Box } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { useApiCall } from '@/hooks/useApiCall';
import { formatDate } from '@/lib/utils/actionUtils';

// ===== COMPONENT =====
export default function InterventionsList() {
  // ----- State -----
  const [activeTab, setActiveTab] = useState('all');
  const initialLoadRef = useRef(false);

  // ----- Router Hooks -----
  const navigate = useNavigate();

  // ----- API Calls -----
  const { data = [], loading, error, execute } = useApiCall(fetchInterventions);

  // ----- Computed Values -----
  const stats = useMemo(() => {
    return {
      total: data.length,
      open: data.filter((i) => i.status === 'open').length,
      inProgress: data.filter((i) => i.status === 'in_progress').length,
    };
  }, [data]);

  // ----- Callbacks -----
  const handleCreate = useCallback(() => {
    navigate('/interventions/create');
  }, [navigate]);

  // ----- Effects -----
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    execute();
  }, []);

  // ----- Render States -----
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={execute} />;
  if (data.length === 0) return <EmptyState onAdd={handleCreate} />;

  // ----- Main Render -----
  return (
    <Box>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        icon={ClipboardList}
        stats={[
          { label: 'Total', value: stats.total },
          { label: 'Ouvertes', value: stats.open },
        ]}
        actions={[
          {
            label: 'Nouvelle Intervention',
            icon: Plus,
            onClick: handleCreate,
          },
        ]}
        onRefresh={execute}
      />

      {/* Contenu principal */}
    </Box>
  );
}
```

### 4.2 Composants Domain

```jsx
/**
 * Carte de détail d'une action
 *
 * @component
 * @param {Object} props
 * @param {Object} props.action - Données de l'action
 * @param {string} props.action.id - ID unique
 * @param {string} props.action.description - Description
 * @param {boolean} props.isSelected - Si le composant est sélectionné
 * @param {Function} props.onClick - Callback au clic
 * @returns {JSX.Element}
 *
 * @example
 * <ActionCard
 *   action={actionData}
 *   isSelected={selected === action.id}
 *   onClick={() => handleSelect(action.id)}
 * />
 */
export default function ActionCard({ action, isSelected = false, onClick }) {
  return (
    <Card
      onClick={onClick}
      style={{
        border: isSelected ? '2px solid var(--blue-9)' : '1px solid var(--gray-6)',
      }}
    >
      {/* Contenu */}
    </Card>
  );
}
```

---

## 5. Hooks & State Management

### 5.1 Ordre des Hooks dans un Composant

```javascript
export default function MyComponent() {
  // 1. useState (tous d'abord)
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // 2. useRef (pour anti-patterns)
  const initialLoadRef = useRef(false);

  // 3. Router hooks
  const { id } = useParams();
  const navigate = useNavigate();

  // 4. Custom hooks (useApiCall, etc.)
  const { data: apiData, loading: apiLoading } = useApiCall(fetchData);

  // 5. Computed values (useMemo)
  const filteredData = useMemo(() => {
    return apiData?.filter((item) => item.status === 'active');
  }, [apiData]);

  // 6. Callbacks (useCallback)
  const handleAction = useCallback(() => {
    // ...
  }, [dependencies]);

  // 7. Effects (useEffect)
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    execute();
  }, []);

  // Render...
}
```

### 5.2 Protection contre React StrictMode

```javascript
const initialLoadRef = useRef(false);

useEffect(() => {
  if (initialLoadRef.current) return;
  initialLoadRef.current = true;

  fetchData(); // Sera appelé une seule fois
}, []);
```

### 5.3 Requêtes Parallèles

```javascript
// ✅ BON : Parallèle
const [data1, data2, data3] = await Promise.all([fetchData1(), fetchData2(), fetchData3()]);

// ❌ MAUVAIS : Séquentiel (3x plus lent)
const data1 = await fetchData1();
const data2 = await fetchData2();
const data3 = await fetchData3();
```

---

## 6. API & Data Fetching

### 6.1 Hook useApiCall

```javascript
import { useApiCall } from '@/hooks/useApiCall';

// Pour GET/Fetch
const {
  data = [],
  loading,
  error,
  execute,
  executeSilent,
} = useApiCall(
  fetchInterventions,
  { autoExecute: false } // Ne pas exécuter au mount
);

useEffect(() => {
  execute(); // Exécution manuelle
}, []);

// Refresh silencieux (pas de loader)
const handleRefresh = () => executeSilent();
```

### 6.2 Hook useApiMutation

```javascript
import { useApiMutation } from '@/hooks/useApiCall';

const { mutate, loading, error } = useApiMutation(updateIntervention, {
  onSuccess: () => {
    execute(); // Refetch après update
  },
});

const handleSave = async (data) => {
  await mutate(data);
};
```

### 6.3 Structurer les Appels API

```javascript
// src/lib/api/interventions.js
import { apiClient } from '@/lib/api/client';

/**
 * Récupère toutes les interventions
 * @returns {Promise<Array>} Interventions
 */
export async function fetchInterventions() {
  const response = await apiClient.get('/interventions', {
    params: {
      fields: ['*', 'machine_id.*', 'actions.*'],
      filter: { status: { _neq: 'deleted' } },
      sort: ['-date_creation'],
    },
  });
  return response.data;
}

/**
 * Crée une intervention
 * @param {Object} data - Données
 * @returns {Promise<Object>} Intervention créée
 */
export async function createIntervention(data) {
  const response = await apiClient.post('/interventions', data);
  return response.data;
}
```

---

## 7. Formulaires

### 7.1 Pattern Contrôlé

```javascript
export default function InterventionForm({ initialData }) {
  const [formData, setFormData] = useState(initialData || {});
  const [errors, setErrors] = useState({});

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear error pour ce champ
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    await mutate(formData);
  };

  return <form onSubmit={handleSubmit}>{/* Champs */}</form>;
}
```

### 7.2 Pattern: Formulaires dans Panneaux Dropdowns/Expandables

Pour les formulaires au sein de panneaux expandables (édition, ajout dans listes, etc.), utiliser ce pattern standardisé:

#### 7.2.1 Structure & Composants

```jsx
{
  /* Condition d'affichage du panel */
}
{
  isEditingMode && (
    <Card
      style={{
        backgroundColor: 'var(--blue-2)', // Bleu pour tous les formulaires
        border: '1px solid var(--blue-6)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* 1. En-tête avec icône */}
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text weight="bold" size="3">
            Ajouter [entité]
          </Text>
        </Flex>

        {/* 2. Champs du formulaire avec suggestions */}
        <Flex gap="2" wrap="wrap" align="end">
          {/* Champ simple */}
          <Box style={{ flex: '1', minWidth: '200px' }}>
            <Text size="2" as="label" weight="bold">
              Label (optionnel)
            </Text>
            <TextField.Root
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              placeholder="Placeholder..."
            />
          </Box>

          {/* Champ avec suggestions dropdown */}
          <Box
            style={{
              flex: '1',
              minWidth: '220px',
              position: 'relative',
            }}
          >
            <Text size="2" as="label" weight="bold">
              Label
            </Text>
            <TextField.Root
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Tapez pour rechercher..."
            />

            {/* Suggestions - positionnées en absolu */}
            {showSuggestions && suggestions.length > 0 && (
              <Card
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 10000,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  marginBottom: '4px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                {suggestions.map((item, idx) => (
                  <Box
                    key={item.id || idx}
                    p="2"
                    style={{
                      cursor: 'pointer',
                      borderBottom:
                        idx < suggestions.length - 1 ? '1px solid var(--gray-4)' : 'none',
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Empêche le blur
                      handleSelectSuggestion(item);
                      setShowSuggestions(false);
                    }}
                  >
                    <Text size="2" weight="bold">
                      {item.primaryField}
                    </Text>
                    {item.secondaryField && (
                      <Text size="1" color="gray">
                        {' '}
                        — {item.secondaryField}
                      </Text>
                    )}
                    {item.tertiaryField && (
                      <Text size="1" color="gray">
                        {' '}
                        • {item.tertiaryField}
                      </Text>
                    )}
                  </Box>
                ))}
              </Card>
            )}

            {/* Message feedback pour nouvelle valeur */}
            {inputValue && suggestions.length === 0 && showSuggestions && (
              <Text size="1" color="green" style={{ display: 'block', marginTop: '4px' }}>
                ✓ Nouvelle entrée « {inputValue} » sera créée
              </Text>
            )}
          </Box>
        </Flex>

        {/* 3. Boutons d'action */}
        <Flex gap="1">
          <Button size="2" color="green" onClick={handleSave} disabled={loading}>
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

#### 7.2.2 État Management

```javascript
export default function MyPanel() {
  // ----- Edit Mode -----
  const [isEditingMode, setIsEditingMode] = useState(false);

  // ----- Form Fields -----
  const [editField1, setEditField1] = useState('');
  const [editField2, setEditField2] = useState('');

  // ----- Suggestions State -----
  const [showSuggestions1, setShowSuggestions1] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  // ----- Computed -----
  const suggestions1 = useMemo(() => {
    const q = editField1.trim().toLowerCase();
    if (!q) return [];
    return data
      .filter(item => item.field1.toLowerCase().includes(q))
      .slice(0, 6);
  }, [editField1, data]);

  const suggestions2 = useMemo(() => {
    const q = editField2.trim().toLowerCase();
    if (!q) return [];
    return data
      .filter(item => item.field2.toLowerCase().includes(q))
      .slice(0, 8);
  }, [editField2, data]);

  // ----- Handlers -----
  const startEditing = (existingData) => {
    setEditField1(existingData.field1 || '');
    setEditField2(existingData.field2 || '');
    setIsEditingMode(true);
  };

  const cancelEditing = () => {
    setEditField1('');
    setEditField2('');
    setShowSuggestions1(false);
    setShowSuggestions2(false);
    setIsEditingMode(false);
  };

  const saveEditing = async () => {
    await onUpdate({
      field1: editField1,
      field2: editField2,
    });
    cancelEditing();
  };

  return (
    {/* Bouton pour ouvrir le panel */}
    <Button onClick={() => startEditing(currentData)}>Éditer</Button>

    {/* Panel */}
    {/* ... code du panel ... */}
  );
}
```

#### 7.2.3 Règles d'UX/UI

1. **Couleur du Panel:**
   - Utiliser `background: "var(--blue-2)"` pour fond léger
   - Utiliser `border: "1px solid var(--blue-6)"` pour bordure
   - Icônes et accents: `var(--blue-9)` pour cohérence visuelle
   - Cette couleur bleue est utilisée pour tous les formulaires (ajout et édition)

2. **Positionnement des Suggestions:**
   - `position: "absolute"` + `bottom: "100%"` pour suggestions au-dessus du champ
   - `zIndex: 10000` pour surpasser autres éléments
   - `maxHeight: "220px"` + `overflowY: "auto"` pour listes longues
   - `boxShadow: "0 4px 6px rgba(0,0,0,0.1)"` pour profondeur

3. **Interaction Suggestions:**
   - `onMouseDown` au lieu de `onClick` (empêche le blur de TextField)
   - `e.preventDefault()` pour garder le focus dans le champ
   - `setTimeout(..., 200)` au `onBlur` pour délai de fermeture

4. **Feedback Utilisateur:**
   - Message ✓ vert si nouvelle valeur (n'existe pas en suggestions)
   - Message gris si suggestions vides mais champ non vide (ambiguïté)
   - Désactiver Enregistrer si données invalides

5. **Responsive:**
   - `flex: "1"` + `minWidth: "200px"` pour champs flexibles
   - `gap="2" wrap="wrap"` pour reflow mobile
   - `align="end"` pour aligner boutons sur ligne des champs

6. **Visibilité et Contraste (MANDATORY):**
   - **Champs de formulaire** : Toujours avec bordure visible `1px solid var(--gray-7)` minimum
   - **Labels** : `weight="bold"` et `color` non grisé (éviter `color="gray"`)
   - **Placeholders** : Texte explicite, pas de dépendance au placeholder pour comprendre le champ
   - **Focus** : État focus natif Radix UI (contour bleu visible)
   - **Disabled** : `opacity: 0.5` avec curseur `not-allowed`
   - **Required** : Astérisque `*` après le label ou indication visuelle claire
   - **Contraste minimum** : Ratio 4.5:1 pour le texte (WCAG AA)
   - **Taille texte** : `size="2"` minimum pour les labels et champs (14px)
   - **Erreurs** : Fond `var(--red-3)` + bordure `var(--red-7)` + texte `color="red"`

#### 7.2.4 Checklist Implémentation

- [ ] Couleur de Card cohérente : `var(--blue-2)` (tous les formulaires)
- [ ] Border : `1px solid var(--blue-6)` (cohérent avec standalone)
- [ ] En-tête avec icône (Plus/Edit2) `size={20}` + titre `size="3"`
- [ ] Tous les champs ont labels explicites
- [ ] Au moins 1 champ a suggestions autocomplete
- [ ] `onMouseDown` sur suggestions (pas `onClick`)
- [ ] `e.preventDefault()` dans `onMouseDown`
- [ ] Délai `setTimeout` sur `onBlur` pour suggestions
- [ ] Message ✓ vert pour nouvelles valeurs
- [ ] Boutons : "Enregistrer" (bleu) + "Annuler" (gris soft)
- [ ] `size="2"` sur tous les boutons
- [ ] Bordures visibles sur tous les champs (pas de champs "fantômes")
- [ ] Labels en gras et non grisés
- [ ] Champs required marqués avec `*`
- [ ] États focus clairement visibles
- [ ] Contraste texte suffisant (ratio 4.5:1 minimum)
- [ ] Logs de débogage supprimés
- [ ] Aucun warning dans console

#### 7.2.5 Exemple Réel

Voir implémentation: [src/components/stock/SupplierRefsInlinePanel.jsx](../../src/components/stock/SupplierRefsInlinePanel.jsx)

- Formulaire édition fabricant (lignes ~370-510)
- Formulaire création référence fournisseur (lignes ~515-775)
- Patterns appliqués: suggestions, feedback, responsive, colors

---

### 7.3 Pattern: Formulaires Standalone/Modaux

Pour les formulaires de création/édition affichés comme composants indépendants (non inline dans des tableaux), utiliser ce pattern :

#### 7.3.1 Structure de Base

```jsx
export default function EntityForm({ initialState, metadata, onCancel, onSubmit }) {
  const form = useEntityForm(initialState); // Hook pour logique métier

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.validate()) return;
    onSubmit(form.state);
  };

  return (
    <Card
      style={{
        backgroundColor: 'var(--blue-2)', // Bleu pour tous les formulaires
        border: '1px solid var(--blue-6)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* En-tête avec icône */}
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">
            Nouvelle entité
          </Text>
        </Flex>

        {/* Erreurs de validation */}
        {form.errors.length > 0 && (
          <Box
            style={{
              background: 'var(--red-3)',
              border: '1px solid var(--red-7)',
              borderRadius: '6px',
              padding: '12px',
            }}
          >
            <Text color="red" weight="bold" size="2" mb="2">
              Erreurs de validation
            </Text>
            <Flex direction="column" gap="1">
              {form.errors.map((error, idx) => (
                <Text key={idx} color="red" size="1">
                  • {error}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Champs du formulaire */}
            <EntityFormFields state={form.state} handlers={form.handlers} />

            {/* Boutons alignés à droite */}
            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" onClick={onCancel} size="2">
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2" disabled={!form.isValid}>
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

#### 7.3.2 Règles d'Esthétique

1. **Couleur de la Card :**
   - **Standard** : `var(--blue-2)` + border `var(--blue-6)` + icône/bouton bleu
   - Utilisé pour tous les formulaires (création et édition)
   - **Erreur/Critique** : `var(--red-2)` + border `var(--red-6)` (cas exceptionnels uniquement)

2. **En-tête :**
   - Icône de contexte (Plus pour création, Edit2 pour édition) size={20}
   - Titre explicite : "Nouvelle [entité]" / "Modifier [entité]"
   - Text size="3" weight="bold"

3. **Erreurs de Validation :**
   - Box séparé avec fond `var(--red-3)` et border `var(--red-7)`
   - Liste à puces avec bullets "•"
   - Affiché conditionnellement (`{errors.length > 0 && ...}`)

4. **Boutons :**
   - **Position** : `justify="end"` (alignés à droite)
   - **Ordre** : Annuler (gauche) + Action principale (droite)
   - **Annuler** : `variant="soft"` `color="gray"` `size="2"`
   - **Action principale** :
     - Couleur : `color="blue"` (cohérent avec le formulaire)
     - Icône : Plus (création) ou Check/Edit2 (édition)
     - Texte : "Enregistrer" (standardisé)
   - **Size** : `size="2"` pour tous les boutons (cohérence)

5. **Spacing :**
   - `gap="3"` pour séparation entre sections
   - `gap="2"` pour boutons

6. **Visibilité et Contraste (MANDATORY):**
   - **Champs de formulaire** : Bordure visible `1px solid var(--gray-7)` minimum
   - **Labels** : Toujours présents, `weight="bold"`, pas de `color="gray"`
   - **Placeholders** : Exemples explicites, ne remplacent jamais le label
   - **Focus** : Contour bleu natif Radix UI visible et distinct
   - **Disabled** : `opacity: 0.5` + curseur `not-allowed`
   - **Required** : Marquage visuel clair (astérisque `*` ou indication)
   - **Contraste** : Ratio minimum 4.5:1 pour tout texte (WCAG AA)
   - **Taille minimum** : `size="2"` (14px) pour labels et valeurs
   - **Erreurs** : Bloc séparé rouge + bordure + liste à puces
   - **Background Card** : Suffisamment contrasté avec le fond de page

#### 7.3.3 Variante: Formulaire d'Édition

```jsx
<Card
  style={{
    backgroundColor: 'var(--blue-2)', // Bleu pour édition
    border: '1px solid var(--blue-6)',
  }}
>
  <Flex direction="column" gap="3">
    {/* En-tête */}
    <Flex align="center" gap="2">
      <Edit2 size={20} color="var(--blue-9)" />
      <Text size="3" weight="bold">
        Modifier l'entité
      </Text>
    </Flex>

    {/* Form + Boutons */}
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3">
        {/* Champs */}
        <EntityFormFields />

        {/* Boutons */}
        <Flex justify="end" gap="2">
          <Button type="button" variant="soft" color="gray" onClick={onCancel} size="2">
            Annuler
          </Button>
          <Button type="submit" color="blue" size="2">
            <Check size={16} />
            Enregistrer
          </Button>
        </Flex>
      </Flex>
    </form>
  </Flex>
</Card>
```

#### 7.3.4 Checklist Implémentation

- [ ] Couleur de Card cohérente : `var(--blue-2)` (tous les formulaires)
- [ ] Icône dans l'en-tête (Plus, Edit2, etc.)
- [ ] Titre explicite size="3" weight="bold"
- [ ] Bloc d'erreurs séparé avec fond rouge
- [ ] Boutons alignés à droite (`justify="end"`)
- [ ] Bouton Annuler : soft + gray
- [ ] Bouton principal : bleu + icône + "Enregistrer"
- [ ] `size="2"` sur tous les boutons
- [ ] Tous les champs ont des bordures visibles
- [ ] Labels toujours présents, en gras, non grisés
- [ ] Champs obligatoires marqués avec `*`
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Contraste texte ≥ 4.5:1 (vérifiable avec DevTools)
- [ ] Pas de dépendance aux placeholders pour comprendre les champs
- [ ] Validation avant submit
- [ ] PropTypes complets
- [ ] Hook personnalisé pour logique métier

#### 7.3.5 Cohérence Visuelle avec §7.2 (Formulaires Inline)

**Éléments IDENTIQUES (pour homogénéité totale) :**

- ✅ Couleurs : `var(--blue-2)` (fond) + `var(--blue-6)` (bordure) pour tous les formulaires
- ✅ En-tête : Icône `size={20}` + Titre `size="3"` `weight="bold"`
- ✅ Boutons : "Enregistrer" (bleu) + "Annuler" (gris soft) + `size="2"`
- ✅ Spacing : `gap="3"` entre sections, `gap="2"` pour boutons
- ✅ Texte standardisé : "Enregistrer" au lieu de "Ajouter"/"Mettre à jour"
- ✅ Visibilité : Bordures visibles, labels en gras, contraste 4.5:1

**Seules DIFFÉRENCES (selon contexte d'usage) :**

| Critère      | Formulaires Inline (§7.2)         | Formulaires Standalone (§7.3)      |
| ------------ | --------------------------------- | ---------------------------------- |
| **Position** | Dans Table.Row ou liste           | Composant indépendant (Card)       |
| **Layout**   | Responsive horizontal (flex wrap) | Vertical (colonne)                 |
| **Boutons**  | Alignés avec champs (align="end") | Alignés à droite (justify="end")   |
| **Usage**    | Ajout/édition dans tableaux       | Création/édition standalone/modale |

#### 7.3.6 Exemple Réel

Voir implémentation : [src/components/actions/ActionForm/index.jsx](../../src/components/actions/ActionForm/index.jsx)

- Formulaire de création d'action dans une intervention
- Hook useActionForm pour logique métier
- Validation avec affichage d'erreurs
- Sous-composants : ActionFormFields, ActionFormDescription, ActionFormComplexity

---

## 8. Gestion des Onglets

### 8.1 Pattern Recommandé

```javascript
export default function DetailPage() {
  const [activeTab, setActiveTab] = useState('summary');
  const [tabsLoaded, setTabsLoaded] = useState({});

  // Charger données critiques au démarrage
  useEffect(() => {
    loadEssentialData();
    loadBadgeData();
  }, []);

  // Lazy loading au changement d'onglet
  useEffect(() => {
    if (activeTab === 'advanced' && !tabsLoaded.advanced) {
      loadAdvancedData();
      setTabsLoaded((prev) => ({ ...prev, advanced: true }));
    }
  }, [activeTab, tabsLoaded.advanced]);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Trigger value="summary">
          Résumé
          <Badge count={stats.summary} />
        </Tabs.Trigger>
        <Tabs.Trigger value="advanced">
          Avancé
          <Badge count={stats.advanced} />
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="summary">{/* Contenu toujours chargé */}</Tabs.Content>

      <Tabs.Content value="advanced">
        {tabsLoaded.advanced ? <AdvancedContent /> : <LoadingState />}
      </Tabs.Content>
    </Tabs.Root>
  );
}
```

---

## 9. Sécurité

### 9.1 Sanitization HTML

```javascript
import { stripHtml, sanitizeHtml } from '@/lib/utils/htmlUtils';

// Pour texte brut (supprimer tout HTML)
<Text>{stripHtml(description)}</Text>

// Pour contenu riche (garder le HTML sûr)
<div dangerouslySetInnerHTML={{
  __html: sanitizeHtml(richContent)
}} />
```

### 9.2 Validation des Entrées

```javascript
// ✅ BON : Validation stricte
export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const isValid = validateEmail(userInput);
if (!isValid) {
  setError('Email invalide');
  return;
}

// ❌ MAUVAIS : Pas de validation
const sendEmail = (email) => {
  api.sendEmail(email); // Dangereuse !
};
```

### 9.3 Secrets & Variables d'Environnement

```javascript
// ✅ BON
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// .env (GIT IGNORE!)
VITE_API_URL=https://api.example.com
VITE_API_KEY=secret_key_here

// ❌ MAUVAIS
const API_URL = 'https://api.example.com'; // Hardcoded
const API_KEY = 'secret'; // Exposé dans le code
```

---

## 10. Performance

### 10.1 useMemo pour Calculs Coûteux

```javascript
// ❌ MAUVAIS : Recalculé à chaque render
const stats = data.reduce(
  (acc, item) => ({
    total: acc.total + item.value,
    avg: acc.total / data.length,
  }),
  { total: 0, avg: 0 }
);

// ✅ BON : Mémorisé
const stats = useMemo(() => {
  return data.reduce(
    (acc, item) => ({
      total: acc.total + item.value,
      avg: acc.total / data.length,
    }),
    { total: 0, avg: 0 }
  );
}, [data]);
```

### 10.2 Pagination pour Listes Longues

```javascript
// Pour > 100 items, implémenter la pagination
const [page, setPage] = useState(1);
const itemsPerPage = 20;
const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);
```

### 10.3 Lazy Loading des Données

```javascript
// ✅ BON : Charger au besoin
useEffect(() => {
  if (activeTab === 'summary' && !summaryLoaded) {
    loadSummary();
    setSummaryLoaded(true);
  }
}, [activeTab, summaryLoaded]);

// ❌ MAUVAIS : Tout charger d'un coup
useEffect(() => {
  Promise.all([loadSummary(), loadAdvanced(), loadSettings()]); // Trop lourd !
}, []);
```

---

## 11. Accessibilité

### 11.1 Labels & ARIA

```javascript
// ✅ BON
<label htmlFor="email">Email</label>
<input id="email" type="email" />

<button aria-label="Fermer le dialogue">
  <XIcon />
</button>

// ❌ MAUVAIS
<input type="email" /> {/* Pas de label */}

<button>
  <XIcon /> {/* Pas d'aria-label */}
</button>
```

### 11.2 Keys sur les Listes

```javascript
// ✅ BON
{items.map(item => (
  <Card key={item.id}>...</Card>
))}

// ❌ MAUVAIS
{items.map((item, index) => (
  <Card key={index}>...</Card> {/* Peut causer des bugs */}
))}
```

### 11.3 Semantic HTML

```javascript
// ✅ BON
<button onClick={handleClick}>Cliquez</button>

// ❌ MAUVAIS
<div onClick={handleClick}>Cliquez</div> {/* Non sémantique */}
```

---

## 12. Responsivité

### 12.1 Responsive Props (Radix UI)

```javascript
// ✅ BON : Mobile-first
<Grid
  columns={{
    initial: '1',  // < 520px
    sm: '2',      // >= 768px
    md: '3',      // >= 1024px
  }}
  gap="4"
>
  <Card>...</Card>
</Grid>

// Hide/show conditionnellement
<Box display={{ initial: 'none', md: 'block' }}>
  Desktop only
</Box>
```

### 12.2 Breakpoints Radix

- `initial`: < 520px (mobile)
- `xs`: 520px
- `sm`: 768px (tablet)
- `md`: 1024px (desktop)
- `lg`: 1280px
- `xl`: 1640px

---

## 13. Documentation du Code

### 13.1 JSDoc Standard

**Pour les composants React, voir [§4.0.2 Standards des Composants Common](#402-jsdoc-complet)**

Pour les fonctions utilitaires et helpers:

```javascript
/**
 * Calcule les statistiques d'actions
 *
 * @param {Array<Object>} actions - Tableau d'actions
 * @param {string} actions[].id - ID unique
 * @param {number} actions[].duration - Durée en minutes
 * @param {Object} complexityFactors - Facteurs de complexité
 * @returns {Object} Statistiques calculées
 *
 * @example
 * const stats = calculateActionStats(actions, complexityFactors);
 * console.log(stats.total); // 42
 *
 * @throws {Error} Si actions n'est pas un tableau
 */
export function calculateActionStats(actions, complexityFactors) {
  if (!Array.isArray(actions)) {
    throw new Error('actions doit être un tableau');
  }
  // ...
}
```

### 13.2 Comments pour la Logique

```javascript
// ✅ BON : Explique le POURQUOI
useEffect(() => {
  // Protection contre le double appel en React StrictMode
  if (initialLoadRef.current) return;
  initialLoadRef.current = true;

  execute();
}, []);

// ❌ MAUVAIS : Explique le QUOI (évident dans le code)
useEffect(() => {
  // Récupère les données
  execute();
}, []);
```

---

## 14. Erreurs & Logging

### 14.1 Gestion des Erreurs

```javascript
// ✅ BON : Affiche erreur + possibilité de retry
if (error) {
  return (
    <ErrorDisplay error={error} message="Impossible de charger les données" onRetry={execute} />
  );
}

// ❌ MAUVAIS : Erreur non gérée
if (error) {
  return <div>Erreur</div>;
}
```

### 14.2 Logging

```javascript
// ✅ BON : Logs utiles en dev
if (process.env.NODE_ENV === 'development') {
  console.log('Fetching interventions...');
}

// ❌ MAUVAIS : Logs partout
console.log('test'); // Oublié en prod
console.log(userData); // Sécurité !
```

---

### 14.3 Système de Notification Unif

ié (MANDATORY)

#### 14.3.1 Interdiction de `alert()` / `confirm()` / `prompt()`

**Règle absolue** : Ne jamais utiliser les dialogues natifs du navigateur.

```javascript
// ❌ INTERDIT
window.alert('Opération réussie');
if (window.confirm('Supprimer ?')) { ... }
const name = window.prompt('Nom :');

// ✅ AUTORISÉ : Composants React intégrés
<SuccessNotification message="Opération réussie" />
<ConfirmDialog onConfirm={handleDelete}>Supprimer ?</ConfirmDialog>
<InputDialog onSubmit={handleSubmit} label="Nom :" />
```

**Objectifs** : Notifications non bloquantes, accessibles, contextualisées et cohérentes avec le design system.

#### 14.3.2 Types de Notifications Standardisées

**1. Erreurs Inline (validation de formulaire)**

```javascript
<Box>
  <Text as="label" weight="bold" size="2">
    Email *
  </Text>
  <TextField.Root
    value={email}
    onChange={handleEmailChange}
    aria-invalid={!!errors.email}
    aria-describedby="email-error"
    style={{ borderColor: errors.email ? 'var(--red-7)' : undefined }}
  />
  {errors.email && (
    <Flex align="center" gap="1" mt="1">
      <AlertTriangle size={12} color="var(--red-9)" />
      <Text id="email-error" size="1" color="red">
        {errors.email}
      </Text>
    </Flex>
  )}
</Box>
```

**2. Erreurs Globales / Avertissements / Info / Succès**

```javascript
// Erreur
<Callout.Root color="red" size="2" mb="3">
  <Callout.Icon>
    <AlertTriangle size={18} />
  </Callout.Icon>
  <Callout.Text>
    <Text weight="bold" size="2" mb="1" as="div">
      Erreur
    </Text>
    <Text size="2">Message d'erreur</Text>
  </Callout.Text>
</Callout.Root>

// Avertissement (amber), Info (blue), Succès (green) : même structure
```

#### 14.3.3 Palette de Couleurs Standardisée

| Type              | Couleur | Fond             | Texte            | Icône                      |
| ----------------- | ------- | ---------------- | ---------------- | -------------------------- |
| **Erreur**        | `red`   | `var(--red-3)`   | `color="red"`    | `AlertTriangle`, `XCircle` |
| **Avertissement** | `amber` | `var(--amber-3)` | `color="orange"` | `AlertTriangle`            |
| **Succès**        | `green` | `var(--green-3)` | `color="green"`  | `CheckCircle2`, `Check`    |
| **Info**          | `blue`  | `var(--blue-3)`  | `color="blue"`   | `Info`, `HelpCircle`       |

#### 14.3.4 Checklist

- [ ] Aucun `alert()`, `confirm()`, `prompt()`
- [ ] Icônes Lucide React uniquement (pas d'emojis)
- [ ] Couleurs Radix UI standardisées
- [ ] `aria-live="polite"` pour notifications dynamiques
- [ ] `aria-describedby` pour erreurs de champs

Linting:

- La règle ESLint `no-alert` est activée.

---

## 15. Tests

### 15.1 Tests Unitaires (à venir)

Structure recommandée :

```
src/
├── __tests__/
│   ├── utils/
│   │   └── actionUtils.test.js
│   ├── hooks/
│   │   └── useApiCall.test.js
│   └── components/
│       └── ErrorDisplay.test.js
```

### 15.2 Tests Manuels Essentiels

Avant chaque déploiement, tester :

- ✅ État de chargement
- ✅ Affichage des erreurs
- ✅ Validation des formulaires
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Accessibilité (Tab, Enter, Screen readers)

---

## 16. Build & Deployment

### 16.1 Build Local

```bash
# Development
npm run dev

# Production build
npm run build

# Preview
npm run preview
```

### 16.2 Vérifications Avant Deploy

- [ ] `npm run build` sans erreurs
- [ ] Pas de console.log en prod
- [ ] Variables d'env configurées
- [ ] Tests manuels passés
- [ ] Pas de secrets exposés

---

## 17. Git & Commits

### 17.1 Conventional Commits

```bash
# Format
<type>(<scope>): <subject>

# Types
feat:     Nouvelle feature
fix:      Bug fix
refactor: Code restructuring
style:    Formatting (pas de logic change)
docs:     Documentation
perf:     Performance improvement
test:     Tests
chore:    Dépendances, config

# Exemples
git commit -m "feat(interventions): add anomaly detection"
git commit -m "fix(stock): resolve toFixed error in calculations"
git commit -m "refactor(components): extract PageHeader logic"
git commit -m "docs(readme): add setup instructions"
```

### 17.2 Branch Naming

```bash
# Format
<type>/<description>

# Types
feature/  - Nouvelle feature
bugfix/   - Correction
refactor/ - Refactorisation
docs/     - Documentation

# Exemples
git checkout -b feature/anomaly-detection
git checkout -b bugfix/excel-export-crash
git checkout -b refactor/error-handling
```

---

## 18. Changelog & Versioning

### 18.1 Finalité du changelog (NON NÉGOCIABLE)

Le changelog est un **outil de lecture produit et de pilotage**, pas un journal de développement.

Il doit permettre, en moins de 30 secondes, de répondre à :

- Qu'est-ce qui change **pour l'utilisateur** ?
- Le risque augmente-t-il ou diminue-t-il ?
- Cette version est-elle **fiable** ou **à surveiller** ?

Tout contenu ne répondant pas explicitement à ces questions est **interdit**.

---

### 18.2 Format standardisé (OBLIGATOIRE)

```markdown
## X.Y.Z - YYYY-MM-DD

Stabilité : 🟢 stable | 🟡 en consolidation | 🔴 expérimental

### 🎯 Impact fonctionnel

- Changements visibles pour l'utilisateur final UNIQUEMENT
- Comportement, capacité, limitation ou suppression
- "Aucun changement visible pour l'utilisateur" est un contenu valide

### 🧱 Stabilisation / Dette technique

- Changements invisibles MAIS ayant un impact sur la fiabilité
- Formulation orientée risque évité / robustesse accrue
- ZÉRO détail d'implémentation

### 🧩 Composants / Modules concernés

- Liste factuelle de périmètre
- Aucun commentaire

### ⚠️ Points de vigilance

- Ce qui peut casser
- Ce qui devient critique
- Contraintes pour les versions suivantes
```

Aucune section supplémentaire n'est autorisée par défaut.

---

### 18.3 Règles de rédaction (ANTI-DÉRIVE)

#### 1. 🎯 Impact fonctionnel (MANDATORY)

Règle absolue :
Si un utilisateur final ne peut pas le constater ou en subir l'effet → **interdit ici**.

Autorisé :

- "Aucun changement visible pour l'utilisateur"
- "Comportement fonctionnel inchangé"

Interdit (exemples) :

- ❌ "Build plus rapide"
- ❌ "Code plus maintenable"
- ❌ "Fichiers < 200 lignes"
- ❌ "Complexité réduite"
- ❌ "Refactor massif"

Verbes autorisés :

- Permet
- Corrige
- Améliore
- Supprime
- Bloque
- Empêche
- Rend possible

---

#### 2. Stabilité (MANDATORY, RÈGLES STRICTES)

- 🟢 **stable**
  - Aucun `eslint-disable`
  - Aucun refactor structurel récent
  - Minimum 2 versions consécutives sans modification du périmètre

- 🟡 **en consolidation**
  - Refactor récent
  - Nettoyage large
  - Sécurisation sans recul d'usage

- 🔴 **expérimental**
  - Nouvelle logique
  - Règles non figées
  - Feedback requis

Toute dérogation (`eslint-disable`, TODO critique, fallback temporaire) **interdit le statut 🟢 stable**.

---

#### 3. 🧱 Stabilisation / Dette technique (CADRÉE)

Objectif : décrire **le risque évité**, jamais la solution technique.

Format recommandé :

```
- [Action] → [Risque réduit]
```

Exemples acceptés :

- "Découpage de composants critiques → réduction du risque de régression"
- "Sécurisation des interfaces publiques → détection précoce des erreurs"

Exemples interdits :

- ❌ "Ajout de PropTypes"
- ❌ "Extraction de helpers"
- ❌ "Migration vers X"
- ❌ "Optimisation bundler / hooks / build"

---

#### 4. 🧩 Composants / Modules concernés

Règles :

- Noms exacts
- Chemins courts
- Pas de hiérarchie
- Pas de description

---

#### 5. ⚠️ Points de vigilance (MANDATORY)

Doit être renseigné dès qu'il y a :

- refactor
- changement de convention
- nettoyage large
- dette partiellement résolue

Interdit :

- "Performance identique"
- "Rien à signaler" (si refactor)

Attendu :

- contraintes nouvelles
- zones sensibles
- règles implicites désormais explicites

---

### 18.4 PATCH vs MINOR — Règles d'Or (BLOQUANTES)

#### PATCH (X.Y.Z++) — Règle du "1 seul changement simple"

**Limite absolue :**
- ✅ Impact utilisateur : **1 seule phrase claire** (max 100 caractères)
- ✅ Aucun jargon technique (hook, callback, synchronisation, optimiste, etc.)
- ✅ Vocabulaire utilisateur final UNIQUEMENT
- ✅ Pas de section "Stabilisation / Dette technique" (sauf sécurité critique)
- ✅ "Composants concernés" : ≤ 2 fichiers listés (sinon c'est un MINOR)
- ✅ "Points de vigilance" : uniquement si l'utilisateur doit agir

**Template PATCH (copier-coller) :**

```markdown
## X.Y.Z - YYYY-MM-DD

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- [UNE PHRASE SIMPLE décrivant ce qui change pour l'utilisateur]
```

**Exemples valides :**

```markdown
## 1.7.2 - 2026-01-18

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Les demandes d'achat créées s'affichent immédiatement
```

```markdown
## 1.5.3 - 2026-01-15

Stabilité : 🟢 stable

### 🎯 Impact fonctionnel

- Correction du calcul des totaux dans les paniers fournisseurs
```

**Exemples INTERDITS :**

```markdown
❌ "Implémentation des mises à jour optimistes"
❌ "Centralisation via useOptimisticPurchaseRequests"
❌ "Callback de notification parent-enfant"
❌ "Refactoring de la couche de données"
```

**Test de validation avant commit :**

1. Lis le changelog à voix haute
2. Un chef de projet / utilisateur final comprend-il en 10 secondes ?
3. Peut-il l'expliquer à un client sans dire "code", "technique", "hook" ?

Si NON → **réécriture obligatoirement**

---

#### MINOR (X.Y.0) — Nouvelles capacités

**Autorisé :**
- Section "Stabilisation / Dette technique" détaillée
- Plusieurs points en "Impact fonctionnel"
- Liste complète des composants concernés

**Règles :**
- Nouvelle capacité utilisateur
- UX, règles métier, visibilité améliorée
- Changement de comportement perceptible

---

#### MAJOR (X.0.0) — Ruptures

**Critères :**
- Rupture de modèle mental
- Migration requise pour l'utilisateur
- Changement de conventions fondamentales
- Suppression de fonctionnalités

**Règle absolue :** Une version = **un seul type** (pas de mix PATCH + MINOR)

---

### 18.5 Clause anti-auto-justification (CRITIQUE)

Interdit dans tout le changelog :

- métriques internes (lignes, fichiers, kB, temps de build)
- justification esthétique ou morale
- valorisation du travail de développement
- comparaison technique "avant / après"

Le changelog **ne sert pas à prouver que le travail est bien fait**.

---

### 18.6 Checklist finale (BLOQUANTE)

Avant commit :

- [ ] Impact utilisateur explicite ou explicitement nul
- [ ] Aucun détail d'implémentation
- [ ] Aucune métrique interne
- [ ] Stabilité cohérente avec le contenu
- [ ] Points de vigilance renseignés si refactor
- [ ] Lecture possible par un non-développeur

Si un point échoue → **réécriture obligatoire**.

---

## 📎 Ressources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [Radix UI Themes](https://www.radix-ui.com/themes/docs/overview/getting-started)
- [Lucide React Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Accessibility](https://www.w3.org/WAI/)

---

---

**Ces conventions sont obligatoires pour tous les développements sur le projet Tunnel GMAO.**
