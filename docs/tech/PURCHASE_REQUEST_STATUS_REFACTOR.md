# Simplification du Statut des Demandes d'Achat

## 📋 Problème Original

Avant, le statut de `purchase_request` était:
- **Stocké en double** dans la colonne `status` de la table
- **Maintenu manuellement** via des mises à jour dans les triggers et le code frontend
- **Redondant** avec les informations disponibles dans les relations

```
purchase_request.status → Données dupliquées ❌
```

## ✨ Solution: Dérivation Directe

Le statut est maintenant **dérivé automatiquement** des relations de table:

```
purchase_request
    ↓ (via supplier_order_line_purchase_request)
supplier_order_line
    ↓ (via supplier_order_id)
supplier_order (status = 'closed', 'ordered', 'sent', 'pooling')
    ↓
CALCUL DU STATUT ✨
```

## 🔄 Règles de Dérivation

| Situation | Statut Dérivé |
|-----------|--------------|
| Pas de lien avec une commande | `open` |
| Liée à une commande en mutualisation | `pooling` |
| Liée à une commande envoyée | `sent` |
| Liée à une commande passée | `ordered` |
| Fully reçue (qty_received = qty) ET commande fermée | `received` |
| Explicitement marquée cancelled | `cancelled` |

## 💡 Avantages

✅ **Pas de duplication** - Une source unique de vérité  
✅ **Automatique** - Plus besoin de triggers pour maintenir la synchro  
✅ **Fiable** - Toujours cohérent avec la réalité  
✅ **Flexible** - Les règles peuvent être ajustées sans migration BD  
✅ **Lisible** - La logique est explicite et centralisée  

## 📝 Migration Progressive

### Phase 1 (Actuellement): Dérivation Côté Frontend
- Garder `purchase_request.status` pour compatibilité
- Calculer `derived_status` via `derivePurchaseRequestStatus()`
- Utiliser `derived_status` dans l'UI et la logique

### Phase 2: Suppression des Mises à Jour du Statut
- Arrêter de mettre à jour `purchase_request.status` dans `orderReceptionUtils.js`
- Les statuts sont calculés à la volée

### Phase 3: Nettoyage BD (Futur)
- Optionnel: Supprimer la colonne `status` de `purchase_request`
- Garder seulement le flag `cancelled` ou `is_cancelled`

## 🔧 Utilisation

```javascript
import { derivePurchaseRequestStatus } from '@/lib/purchasing/purchaseRequestStatusUtils';

// Pour une demande unique
const status = derivePurchaseRequestStatus(purchaseRequest);

// Pour une liste avec enrichissement
const enriched = purchaseRequests.map(enrichPurchaseRequestWithDerivedStatus);

// Pour les statistiques
const stats = calculatePurchaseRequestStatusStats(purchaseRequests);

// Pour filtrer
const received = filterByDerivedStatus(purchaseRequests, 'received');
```

## 🗑️ Impact sur le Code Existant

### ❌ À supprimer progressivement:

`orderReceptionUtils.js`:
```javascript
// ❌ ANCIEN: Mises à jour manuelles du statut
await stock.updatePurchaseRequest(prId, { status: 'received' });
```

`statusChangeHandler.js`:
```javascript
// ❌ ANCIEN: Mises à jour lors du changement de statut
await updatePurchaseRequestStatuses(lines, daStatus);
```

### ✅ À utiliser à la place:

```javascript
import { derivePurchaseRequestStatus } from '@/lib/purchasing/purchaseRequestStatusUtils';

// L'affichage du statut sera automatiquement correct
const status = derivePurchaseRequestStatus(pr);
```

## 📊 Exemple Complet

```javascript
// Une demande avec ses relations:
const pr = {
  id: 'uuid-1',
  item_label: 'Vis M6',
  quantity: 100,
  // supplier_order_line_ids = relations M2M vers supplier_order_line
  supplier_order_line_ids: [
    {
      id: 'rel-1',
      supplier_order_line_id: {
        id: 'line-1',
        quantity: 100,
        quantity_received: 100, ✅ Fully received
        supplier_order_id: {
          id: 'order-1',
          status: 'CLOSED' ✅ Closed
        }
      }
    }
  ]
};

// Statut calculé automatiquement:
derivePurchaseRequestStatus(pr); // → 'received' ✨
```

## ⚠️ Cas Limites

1. **Demande liée à plusieurs commandes avec statuts différents**
   → Prend le statut le plus avancé

2. **Demande partiellement reçue**
   → Retourne 'ordered' (pas 'received')

3. **Demande sans aucun lien**
   → Retourne 'open' (état initial)

4. **Demande explicitement annulée**
   → Retourne toujours 'cancelled' peu importe les commandes

---

**Conclusion**: Cette approche simplifie drastiquement la logique en éliminant la redondance et les incohérences possibles. ✨
