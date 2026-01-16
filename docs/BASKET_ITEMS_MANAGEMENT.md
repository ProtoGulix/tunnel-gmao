# Gestion des Items de Panier Fournisseur

## Vue d'ensemble

Implémentation d'une gestion cohérente des items de panier selon leur statut, avec des règles métier strictes et un verrouillage progressif des modifications.

## Architecture

### Fichiers clés

1. **`src/lib/purchasing/basketItemRules.js`** - Logique métier
   - Fonctions de garde (`canSelect`, `canDeselect`, `canPurge`, `canTransition`)
   - Normalisation des statuts
   - Gestion d'état initial

2. **`src/lib/purchasing/basketItemOperations.js`** - Opérations API
   - Suppression d'items et retour à "à dispatcher"
   - Transitions de statut
   - Exécution des validations

3. **`src/pages/Procurement.jsx`** - Orchestration
   - État de sélection par panier (`itemSelectionByBasket`)
   - Callbacks de gestion (`handleToggleItemSelection`, `handleBasketStatusChange`)
   - Initialisation et rafraîchissement

4. **`src/components/purchase/orders/SupplierOrdersTable.jsx`** - Tableau principal
   - Passage des props de sélection à OrderRow et OrderLineTable
   - Calcul du statut normalisé et du verrouillage

5. **`src/components/purchase/orders/OrderRow.jsx`** - Ligne panier
   - Affichage du statut avec icone 🔒 en commandé/clôturé
   - Désactivation du select en lecture seule

6. **`src/components/purchase/orders/OrderLineTable.jsx`** - Tableau des items
   - Checkboxes avec états visuels (grisé, verrouillé)
   - Icones distinctives par statut
   - Gestion du toggle avec appels API

## Statuts et Règles

### 1. MUTUALISATION (OPEN/POOLING)
```
✅ Tous les items sont automatiquement sélectionnés
❌ Désélection interdite (bouton checkbox désactivé)
✅ Tous exportables
🔄 Visible: Icone 🤝 "Mutualisation - Tous les items sélectionnés"
```

**Transition vers ENVOYÉ:**
- Les items non sélectionnés sont supprimés ✂️
- Chaque item supprimé retourne sa DA à "open" (à dispatcher)
- Vérification: tous les items supprimés doivent avoir une alternative

### 2. ENVOYÉ (SENT)
```
✅ Sélection/désélection possible
⚠️  RÈGLE CRITIQUE: Vérifier d'autres paniers actifs
   → Si aucune alternative trouvée: BLOQUER (message d'erreur)
✅ Items désélectionnés grisés (opacity 0.5, bg gris)
❌ Non suppression automatique
🔒 Tableau affiche: "Item désélectionné" avec icone 🚫
```

**Transition vers COMMANDÉ:**
- Vérifier qu'aucun item désélectionné n'est sans alternative
- Si OK: verrouiller tous les items (lecture seule)

### 3. COMMANDÉ (ACK/RECEIVED)
```
🔒 Tous les items verrouillés (lecture seule)
❌ Aucune sélection/désélection possible
🔒 Checkbox disabled
🔒 Icone 🔐 au lieu de 🚫
🔒 Select de statut désactivé + icone 🔒
```

### 4. CLÔTURÉ (CLOSED/CANCELLED)
```
🔒 Tous les items verrouillés (lecture seule)
❌ Aucune action possible
🔒 Affichage identique à COMMANDÉ
```

## Flux Visual en UI

### OrderLineTable - Affichage des items

```
┌─────────────────────────────────────────────────────────────────────┐
│ Lignes de commande (5)                                              │
│                                                  🤝 Mutualisation   │
├─────────────────────────────────────────────────────────────────────┤
│ ☑️  │ Article        │ Réf  │ Réf Fournisseur │ Qté │ Urgence │    │
├─────┼────────────────┼──────┼─────────────────┼─────┼─────────┼────┤
│ ☑️  │ Pièce A        │ PA01 │ SUP-001         │ 10  │ Normal  │ ✎  │  Sélectionné
│ ☑️  │ Pièce B        │ PA02 │ SUP-002         │ 5   │ Urgent  │ ✎  │  (en mutuali)
│ ☐   │ Pièce C (grisé)│ PA03 │ SUP-003         │ 2   │ Normal  │    │  Désélectionné
│ ☑️  │ Pièce D        │ PA04 │ SUP-004         │ 1   │ Normal  │ ✎  │  Sélectionné
│ 🔐  │ Pièce E        │ PA05 │ SUP-005         │ 3   │ Urgent  │    │  Verrouillé
└─────┴────────────────┴──────┴─────────────────┴─────┴─────────┴────┘

Légende:
☑️  = Sélectionné, modifiable
☐   = Désélectionné, grisé, modifiable (SENT seulement)
🔐  = Verrouillé, lecture seule (ORDERED/CLOSED)
```

### OrderRow - Ligne du panier

```
Status    Couleur   Icône   Select   Désactivé?
─────────────────────────────────────────────────
OPEN      Bleu      📖      ✔️       Non
SENT      Violet    📤      ✔️       Non
ACK       Vert      ✅      ✔️       Oui (désactivé)
RECEIVED  Vert foncé✔️      ✔️       Oui (désactivé)
CLOSED    Gris      📁      ✔️       Oui (désactivé)
CANCELLED Gris      ✘       ✔️       Oui (désactivé)
```

## Code - Points clés

### 1. Initialisation (Procurement.jsx)

```jsx
// État global de sélection par panier
const [itemSelectionByBasket, setItemSelectionByBasket] = useState({});

// Initialiser au chargement des commandes
useEffect(() => {
  if (purchasing.supplierOrders.length > 0) {
    initializeItemSelection();
  }
}, [purchasing.supplierOrders, initializeItemSelection]);

// Initialiser chaque panier selon son statut
const initializeItemSelection = useCallback(() => {
  const newSelection = {};
  purchasing.supplierOrders.forEach(basket => {
    newSelection[basket.id] = getInitialItemSelection(basket);
  });
  setItemSelectionByBasket(newSelection);
}, [purchasing.supplierOrders]);
```

### 2. Toggle avec validation (Procurement.jsx)

```jsx
const handleToggleItemSelection = useCallback((basketId, itemId) => {
  const basket = purchasing.supplierOrders.find(b => b.id === basketId);
  const currentSelection = itemSelectionByBasket[basketId] || {};
  const isCurrentlySelected = currentSelection[itemId] !== false;
  const item = basket.lines?.find(l => l.id === itemId);

  if (isCurrentlySelected) {
    // Vérifier la règle d'alternative
    const result = canDeselectItem(basket, item, purchasing.supplierOrders);
    if (!result.canDeselect) {
      // Afficher erreur
      return;
    }
  } else {
    // Vérifier la règle de sélection
    const result = canSelectItem(basket, item);
    if (!result.canSelect) {
      // Afficher erreur
      return;
    }
  }

  // Mettre à jour l'état
  setItemSelectionByBasket(prev => ({
    ...prev,
    [basketId]: {
      ...prev[basketId],
      [itemId]: !isCurrentlySelected
    }
  }));
}, [itemSelectionByBasket, purchasing.supplierOrders]);
```

### 3. Transition avec nettoyage (Procurement.jsx)

```jsx
const handleBasketStatusChange = useCallback(async (basketId, newStatus) => {
  const basket = purchasing.supplierOrders.find(b => b.id === basketId);
  const currentSelection = itemSelectionByBasket[basketId] || {};
  
  // Valider la transition
  const transitionResult = canTransitionBasket(
    basket,
    newStatus,
    currentSelection,
    purchasing.supplierOrders
  );

  if (!transitionResult.canTransition) {
    // Afficher erreur
    return;
  }

  try {
    // Supprimer les items sans alternative
    if (transitionResult.itemsToRemove.length > 0) {
      for (const item of transitionResult.itemsToRemove) {
        await deleteBasketLineAndResetRequest(item.id, item.purchaseRequestUid);
      }
    }

    // Transitionner le panier
    await updateBasketStatus(basketId, newStatus);
    await refreshOrders();
  } catch (error) {
    // Gestion erreur
  }
}, [itemSelectionByBasket, purchasing.supplierOrders, refreshOrders]);
```

### 4. UI - Checkboxes et état visuel (OrderLineTable.jsx)

```jsx
return (
  <Table.Row style={{
    opacity: !isSelected && disabled ? 0.5 : 1,
    backgroundColor: !isSelected && disabled ? 'var(--gray-2)' : 'transparent',
  }}>
    <Table.Cell>
      <Flex align="center" gap="2">
        <Checkbox
          checked={isSelected || isPooling}
          onCheckedChange={handleCheckboxChange}
          disabled={disabled || isPooling}
        />
        {disabled && !isPooling && <Ban size={14} title="Désélectionné" />}
        {isPooling && <Lock size={14} title="Mutualisation" />}
      </Flex>
    </Table.Cell>
    {/* ... autres cellules ... */}
  </Table.Row>
);
```

## Flux d'exécution complet

```
Utilisateur clique checkbox Item
         ↓
handleToggleItemSelection(basketId, itemId)
         ↓
Déterminer action: sélectionner ou désélectionner?
         ↓
┌─ SÉLECTION: canSelectItem(basket, item)
├─ DÉSÉLECTION: canDeselectItem(basket, item, allBaskets)
         ↓
Règles respectées?
         ├─ NON: Afficher erreur, STOP
         └─ OUI: Mettre à jour l'état local
              ↓
         Mettre à jour UI immédiatement
              ↓
         Appeler API (arrière-plan)
              ↓
         Erreur? Rafraîchir depuis API


Utilisateur clique "Transition" du Select de statut
         ↓
handleBasketStatusChange(basketId, newStatus)
         ↓
canTransitionBasket(basket, newStatus, selection, allBaskets)
         ↓
Transition possible?
         ├─ NON: Afficher raison, STOP
         └─ OUI: 
              ├─ Supprimer items (si POOLING → SENT)
              │  └─ Chaque item → deleteBasketLineAndResetRequest()
              │     └─ Supprimer ligne, Réinitialiser DA
              ├─ Transitionner panier → updateBasketStatus()
              ├─ Rafraîchir UI → refreshOrders()
              └─ Afficher succès
```

## État de sélection - Structure

```javascript
itemSelectionByBasket = {
  "basket-1": {
    "line-1": true,      // Sélectionné
    "line-2": true,      // Sélectionné
    "line-3": false,     // Désélectionné
    "line-4": true,      // Sélectionné
  },
  "basket-2": {
    "line-5": true,
    "line-6": true,
  },
  // ...
}
```

## Cas d'usage - Comparaison de fournisseurs

Scénario: Acheter une pièce auprès du fournisseur le moins cher

```
1. Créer 3 paniers (un par fournisseur)
   Panier A: Fournisseur 1 - 100€
   Panier B: Fournisseur 2 - 95€   ← Moins cher
   Panier C: Fournisseur 3 - 110€

2. En statut SENT, désélectionner dans A et C
   Panier A: [✗ Item]
   Panier B: [✓ Item]   ← Reste sélectionné
   Panier C: [✗ Item]

3. Valider chaque panier individuellement
   → A et C: Chercher alternative dans B ✓
   → Transition autorisée

4. Passer à COMMANDÉ
   → Tous les paniers se verrouillent
   → Seul B sera effectivement commandé
   → A et C restent en trace mais modifiables jamais
```

## APIs manquantes à implémenter

1. **`suppliers.updateSupplierOrder(basketId, { status })`**
   - Mettre à jour le statut d'un panier
   - Statuts: SENT, ACK, RECEIVED, CLOSED, CANCELLED

2. **`suppliers.deleteSupplierOrderLine(lineId)`**
   - Supprimer une ligne d'un panier
   - Libère l'item pour réallocation

3. **`purchases.updateStatus(purchaseRequestUid, status)`**
   - Mettre à jour le statut d'une demande d'achat
   - Utilisé pour retourner à "open" après suppression d'item

## Tests à faire

- [ ] Mutualisation: tous les items sélectionnés, checkbox désactivée
- [ ] Envoyé: désélection bloquée sans alternative
- [ ] Envoyé: désélection autorisée avec alternative
- [ ] Commandé: lecture seule totale
- [ ] Clôturé: lecture seule totale
- [ ] Transition POOLING→SENT: items non sélectionnés supprimés
- [ ] Transition SENT→COMMANDÉ: validation des alternatives
- [ ] UI: grisage des items désélectionnés
- [ ] UI: icones distinctives par état
- [ ] API: rafraîchissement après action
