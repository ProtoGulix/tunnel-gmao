# 📚 Conventions - GMAO MVP Frontend

> **Document Maître** : Toutes les conventions de développement du projet
>
> **Dernière mise à jour**: 26 décembre 2025  
> **Version**: 2.0.0

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

---

## 4. Composants React

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

### 14.3 Feedback Utilisateur (UI) — Interdiction de `alert()`

- MANDATORY: Ne jamais utiliser `window.alert()`, `window.confirm()` ou `window.prompt()` dans l’application.
- Intégrer toutes les erreurs et confirmations dans l’interface utilisateur.
- Objectifs: non bloquant, accessible, contextualisé, et cohérent avec le design system.

Recommandations pratiques:

- Erreurs de champ: afficher le message à proximité du champ, avec état visuel (couleur, bordure) et `aria-describedby`.
- Erreur globale de formulaire: bannière/boîte d’erreur au-dessus du formulaire (avec `aria-live="polite"`).
- Notifications non bloquantes: utiliser une bannière/zone dédiée; éviter les modales sauf confirmation critique.

Exemple — Remplacer `alert()` par un message d’erreur intégré:

```jsx
import React, { useState } from 'react';
import { Box, Text, Button } from '@radix-ui/themes';

function ExampleForm({ onSubmit }) {
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!value.trim()) {
      // ❌ Ne pas faire: alert('Champ requis')
      // ✅ Faire: message d’erreur dans l’UI
      setFormError('Le champ est requis.');
      return;
    }

    try {
      await onSubmit({ value });
    } catch (err) {
      setFormError('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-live="polite">
      {formError && (
        <Box
          mb="2"
          style={{
            background: 'var(--red-3)',
            border: '1px solid var(--red-7)',
            borderRadius: 6,
            padding: 12,
          }}
        >
          <Text color="red" weight="medium">
            {formError}
          </Text>
        </Box>
      )}

      <input
        aria-invalid={Boolean(formError)}
        aria-describedby={formError ? 'field-error' : undefined}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {formError && (
        <Text id="field-error" size="1" color="red" style={{ display: 'block', marginTop: 4 }}>
          {formError}
        </Text>
      )}

      <Button type="submit">Envoyer</Button>
    </form>
  );
}
```

Linting:

- La règle ESLint `no-alert` est activée (au minimum en warning). En cas de besoin, nous pourrons la passer en `error` pour l’appliquer strictement.

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

## 📎 Ressources

- [React Hooks Best Practices](https://react.dev/reference/react)
- [Radix UI Themes](https://www.radix-ui.com/themes/docs/overview/getting-started)
- [Lucide React Icons](https://lucide.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Accessibility](https://www.w3.org/WAI/)

---

---

**Ces conventions sont obligatoires pour tous les développements sur le projet Tunnel GMAO.**
