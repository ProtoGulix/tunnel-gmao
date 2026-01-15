# Refactoring: Système de mises à jour optimistes

## Problème identifié

Le système actuel recharge **TOUTES** les données à chaque interaction utilisateur :
- Ouverture des détails d'une DA → rechargement complet de la page
- Sélection d'une ligne dans un panier fournisseur → nécessite rafraîchissement manuel
- Ajout d'une référence fournisseur → rechargement de 3 collections
- Auto-refresh toutes les 5 secondes → rechargement complet

**Impact utilisateur :**
- ❌ Interface qui "clignote" constamment
- ❌ Perte de scroll lors des rechargements
- ❌ Interactions lentes (attente de l'API)
- ❌ UX dégradée (utilisateur doit rafraîchir manuellement)

## Solution mise en place

### 1. Hook `useOptimisticData` (CRÉÉ ✅)

Hook générique pour gérer les données avec mises à jour optimistes :

```javascript
// Principe : Mise à jour locale IMMÉDIATE + API en arrière-plan
const { data, loading, updateLocal, addLocal, removeLocal, invalidate } = useOptimisticData(fetchFn, onError);

// Exemple d'utilisation
updateLocal(itemId, { status: 'new_status' }); // ← Instantané (pas d'attente API)
```

**Avantages :**
- ✅ UI réactive instantanément
- ✅ Pas de rechargement complet
- ✅ Rollback automatique en cas d'erreur
- ✅ Annulation des requêtes en cours (AbortController)

### 2. Hooks spécialisés refactorisés

#### `usePurchaseRequestsManagement` (FAIT ✅)
```javascript
// AVANT
const updateStatus = async (id, status) => {
  await API.update(id, status);
  setRequests(prev => prev.map(...)); // après l'API
};

// APRÈS
const updateStatus = async (id, status) => {
  optimistic.updateStatus(id, status); // immédiat
  try {
    await API.update(id, status); // arrière-plan
  } catch {
    optimistic.invalidate(); // rollback si erreur
  }
};
```

#### `usePurchasingManagement` (FAIT ✅)
- Gestion optimiste des commandes fournisseurs
- `updateOrderLine(orderId, lineId, updates)` : mise à jour locale d'une ligne
- `updateOrderStatus(orderId, status)` : mise à jour statut commande

#### `useStockItemsManagement` (À FAIRE)
- À migrer vers système optimiste
- Gérer stock items, supplier refs, standard specs

### 3. Composants mis à jour

#### `OrderLineTable.jsx` (FAIT ✅)
```javascript
// AVANT : rechargement complet après chaque sélection
const handleToggleSelected = async (lineId, isSelected) => {
  await API.updateLine(lineId, { is_selected });
  await onRefresh(); // ← recharge TOUT
};

// APRÈS : mise à jour optimiste
const handleToggleSelected = async (lineId, isSelected) => {
  onLineUpdate(lineId, { is_selected }); // ← mise à jour locale immédiate
  try {
    await API.updateLine(lineId, { is_selected });
  } catch {
    onRefresh(); // seulement si erreur
  }
};
```

**Nouveaux props :**
- `onLineUpdate(lineId, updates)` : callback de mise à jour optimiste
- `onRefresh()` : callback de fallback en cas d'erreur

### 4. StockManagement.jsx (EN COURS)

**Modifications nécessaires :**

#### A. Remplacer les rechargements systématiques
```javascript
// AVANT
const onAddSupplierRef = async (itemId, data) => {
  await API.addRef(itemId, data);
  await stock.loadStockItems(false); // ← recharge TOUT
  await purchases.loadRequests(false); // ← recharge TOUT
};

// APRÈS
const onAddSupplierRef = async (itemId, data) => {
  const newRef = await API.addRef(itemId, data);
  stock.addSupplierRefLocal(itemId, newRef); // ← mise à jour locale
  // Pas de rechargement global
};
```

#### B. Gérer l'expansion sans rechargement
```javascript
// AVANT
const toggleExpand = (requestId) => {
  setExpandedRequestId(prev => prev === requestId ? null : requestId);
  // ← Cause un re-render complet car expandedRequestId change
};

// APRÈS
// Utiliser un state stable qui ne force pas le rechargement des données
// Les données sont déjà en local, pas besoin de recharger
```

#### C. Auto-refresh intelligent
```javascript
// AVANT
useAutoRefresh(async () => {
  await Promise.all([
    stock.loadStockItems(false),
    purchases.loadRequests(false),
    purchasing.loadAll(false)
  ]);
}, 5, true); // toutes les 5 secondes

// APRÈS
useAutoRefresh(async () => {
  // Rechargement silencieux en arrière-plan
  // Merge intelligent avec les données locales
  // Ne pas remplacer si l'utilisateur a des modifications en cours
  await Promise.all([
    stock.load(false, true), // silent=true
    purchases.load(false, true),
    purchasing.loadAll(false, true)
  ]);
}, 30, true); // réduire à 30 secondes
```

### 5. PurchaseRequestsTable.jsx (À OPTIMISER)

**Problème :** Ouverture du panel de détails cause un rechargement

```javascript
// AVANT
<Button onClick={() => {
  setDetailsExpandedId(id);
  // ← React re-rend tout le parent
}}>
  Détails
</Button>

// APRÈS
// Utiliser un contexte local ou un portail pour éviter le re-render parent
// Les données sont déjà chargées, juste afficher/masquer le panel
```

## Migration progressive

### Phase 1 (FAIT ✅)
- [x] Créer `useOptimisticData.js`
- [x] Migrer `usePurchaseRequestsManagement`
- [x] Migrer `usePurchasingManagement`
- [x] Optimiser `OrderLineTable` avec checkbox

### Phase 2 (EN COURS)
- [ ] Migrer `useStockItemsManagement`
- [ ] Mettre à jour `StockManagement.jsx` pour utiliser les callbacks optimistes
- [ ] Optimiser l'expansion des détails dans `PurchaseRequestsTable`

### Phase 3 (À FAIRE)
- [ ] Réduire la fréquence d'auto-refresh (5s → 30s)
- [ ] Ajouter un système de "version" pour détecter les conflits
- [ ] Implémenter un merge intelligent lors des auto-refresh

### Phase 4 (POLISH)
- [ ] Ajouter des indicateurs visuels (optimistic = grisé, confirmed = normal)
- [ ] Toast notifications pour les erreurs de synchronisation
- [ ] Bouton "Forcer le refresh" pour l'utilisateur

## Tests à effectuer

### Scénarios critiques
1. ✅ Sélectionner une ligne dans un panier → doit apparaître immédiatement sans rechargement
2. ⏳ Ouvrir les détails d'une DA → page ne doit pas scintiller
3. ⏳ Ajouter une référence fournisseur → apparition immédiate dans la liste
4. ⏳ Supprimer une DA → disparition immédiate de la liste
5. ⏳ Erreur réseau → rollback automatique + notification

### Tests de robustesse
- Requête lente (throttling réseau) → UI reste réactive
- Erreur API → rollback correct des données
- Plusieurs actions rapides → pas de conflit de state
- Auto-refresh pendant une édition → pas de perte de données

## Métriques de succès

**Avant refactoring :**
- ❌ Rechargement complet à chaque action
- ❌ 3-5 appels API par interaction utilisateur
- ❌ Délai perçu : 500ms-2s par action

**Objectif après refactoring :**
- ✅ Pas de rechargement complet (sauf erreur)
- ✅ 1 appel API par action (arrière-plan)
- ✅ Délai perçu : 0ms (mise à jour instantanée)
- ✅ Auto-refresh réduit à 30s
- ✅ UX fluide et réactive

## Notes techniques

### Gestion des conflits
Si l'utilisateur modifie des données pendant un auto-refresh :
1. Garder les modifications locales (priorité utilisateur)
2. Merger uniquement les données non modifiées
3. Détecter les conflits avec un système de version
4. Notifier l'utilisateur si conflit détecté

### AbortController
Toutes les requêtes utilisent AbortController pour :
- Annuler les requêtes obsolètes
- Éviter les race conditions
- Réduire la charge réseau

### Structure de données
```javascript
{
  data: [...], // données actuelles (local + API)
  loading: false,
  version: 123, // incrémenté à chaque changement
  optimisticUpdates: new Map(), // map des updates en cours
}
```

## Références

- [React Query - Optimistic Updates](https://react-query.tanstack.com/guides/optimistic-updates)
- [SWR - Optimistic UI](https://swr.vercel.app/docs/mutation#optimistic-updates)
- Pattern: Update-First, Sync-Later (UIU pattern)
