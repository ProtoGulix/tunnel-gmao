# Navigation URL avec Onglets et Recherche

## Vue d'ensemble

Le système de navigation permet de synchroniser l'état de l'interface (onglets actifs, recherches) avec l'URL via des query parameters. Cela permet de:

- **Partager des liens directs** vers un onglet ou une recherche spécifique
- **Naviguer via le bouton retour** du navigateur
- **Créer des liens cliquables** qui ouvrent directement la bonne vue

## Hooks Disponibles

### `useTabNavigation(defaultTab, paramName = 'tab')`

Synchronise l'onglet actif avec l'URL.

**Exemple d'utilisation:**

```javascript
import { useTabNavigation } from '@/hooks/useTabNavigation';

function MyComponent() {
  const [activeTab, setActiveTab] = useTabNavigation('requests', 'tab');

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.Trigger value="requests">Demandes</Tabs.Trigger>
      <Tabs.Trigger value="stock">Stock</Tabs.Trigger>
    </Tabs.Root>
  );
}
```

**Résultat URL:**

- Onglet "Demandes": `/stock-management?tab=requests`
- Onglet "Stock": `/stock-management?tab=stock`

### `useSearchParam(paramName = 'search', defaultValue = '')`

Synchronise un champ de recherche avec l'URL.

**Exemple d'utilisation:**

```javascript
import { useSearchParam } from '@/hooks/useSearchParam';

function MyComponent() {
  const [searchTerm, setSearchTerm] = useSearchParam('search', '');

  return (
    <TextField
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Rechercher..."
    />
  );
}
```

**Résultat URL:**

- Recherche vide: `/stock-management?tab=stock`
- Recherche "FA-123": `/stock-management?tab=stock&search=FA-123`

## Composant `StockRefLink`

Badge cliquable qui redirige vers StockManagement avec recherche pré-remplie.

**Props:**

- `reference` (string, required): Référence de l'article à rechercher
- `tab` (string, optional): Onglet de destination - défaut: `'stock'`
  - Valeurs: `'stock'`, `'requests'`, `'orders'`, `'suppliers'`, `'supplier-refs'`
- `color` (string, optional): Couleur du badge - défaut: `'gray'`
- `variant` (string, optional): Variante du badge - défaut: `'outline'`
- `size` (string, optional): Taille du badge - défaut: `'2'`

**Exemples d'utilisation:**

```jsx
import StockRefLink from '@/components/common/StockRefLink';

// Badge simple
<StockRefLink reference="FA-123" />

// Badge personnalisé vers l'onglet demandes
<StockRefLink
  reference="FA-123"
  tab="requests"
  color="blue"
  variant="soft"
/>

// Badge dans une table
<Table.Row>
  <Table.Cell>
    <StockRefLink reference={item.ref} />
  </Table.Cell>
</Table.Row>
```

**Résultat URL:**

- Clic sur "FA-123": `/stock-management?tab=stock&search=FA-123`
- L'onglet Stock s'ouvre automatiquement
- La recherche "FA-123" est pré-remplie
- Le tableau filtre automatiquement les résultats

## Cas d'Usage

### 1. Lien depuis une Intervention vers le Stock

Dans `InterventionDetail.jsx`, afficher un badge cliquable pour chaque article:

```jsx
import StockRefLink from '@/components/common/StockRefLink';

function ActionItemCard({ action }) {
  return (
    <Card>
      {action.purchaseRequests.map((pr) => (
        <Flex key={pr.id} align="center" gap="2">
          <StockRefLink reference={pr.stockItemCode} />
          <Text>{pr.itemLabel}</Text>
        </Flex>
      ))}
    </Card>
  );
}
```

**Résultat:** Clic sur le code article → ouvre StockManagement avec recherche automatique

### 2. Navigation avec Onglet et Recherche Combinés

Dans `StockManagement.jsx`, les deux hooks travaillent ensemble:

```jsx
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useSearchParam } from '@/hooks/useSearchParam';

function StockManagement() {
  const [activeTab, setActiveTab] = useTabNavigation('requests', 'tab');
  const [searchTerm, setSearchTerm] = useSearchParam('search', '');

  return (
    <>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.Trigger value="requests">Demandes</Tabs.Trigger>
        <Tabs.Trigger value="stock">Stock</Tabs.Trigger>
      </Tabs.Root>

      <TableHeader searchValue={searchTerm} onSearchChange={setSearchTerm} />
    </>
  );
}
```

**URL complète:** `/stock-management?tab=stock&search=FA-123`

### 3. Créer des Liens Programmatiques

```jsx
import { Link } from 'react-router-dom';

// Lien simple
<Link to="/stock-management?tab=stock&search=FA-123">Voir l'article FA-123</Link>;

// Lien dynamique
const reference = 'FA-123';
const url = `/stock-management?tab=stock&search=${encodeURIComponent(reference)}`;
<Link to={url}>Voir {reference}</Link>;
```

### 4. Navigation depuis le Code

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const goToStock = (reference) => {
    const url = `/stock-management?tab=stock&search=${encodeURIComponent(reference)}`;
    navigate(url);
  };

  return <Button onClick={() => goToStock('FA-123')}>Chercher FA-123</Button>;
}
```

## Pages Intégrées

### StockManagement

- **Onglets:** `?tab=requests|stock|orders|suppliers|supplier-refs`
- **Recherche:** `?search=<terme>`
- **Exemple:** `/stock-management?tab=stock&search=FA-123`

### InterventionDetail

- **Onglets:** `?tab=actions|summary|fiche|history`
- **Exemple:** `/intervention/abc123?tab=summary`

## Comportement

### Synchronisation Bidirectionnelle

- Changer d'onglet dans l'UI → Met à jour l'URL
- Modifier l'URL manuellement → Change l'onglet dans l'UI
- Bouton retour du navigateur → Revient à l'onglet précédent

### Gestion du Vide

- Recherche vide → Paramètre supprimé de l'URL
- Onglet par défaut → Pas de paramètre `tab` nécessaire (mais ajouté pour clarté)

### Encodage

- Les caractères spéciaux sont automatiquement encodés
- Exemple: `"FA/123"` → `"FA%2F123"` dans l'URL

## Avantages

✅ **Bookmarkable** - Les utilisateurs peuvent sauvegarder des liens directs
✅ **Shareable** - Partage facile de vues spécifiques
✅ **Browser-friendly** - Fonctionne avec les boutons retour/avant
✅ **SEO-friendly** - URLs descriptives et compréhensibles
✅ **Type-safe** - Validation des onglets via PropTypes
✅ **Performance** - `replace: true` évite la pollution de l'historique

## Notes Techniques

- Les hooks utilisent `useSearchParams` de React Router v6
- Option `replace: true` pour ne pas créer d'entrée dans l'historique à chaque frappe
- Les paramètres vides sont automatiquement supprimés de l'URL
- Compatible avec tous les composants Radix UI Tabs
