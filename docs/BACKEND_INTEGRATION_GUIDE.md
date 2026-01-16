# 🔧 Guide d'implémentation Backend - Gestion des Items de Panier

## APIs à implémenter

Le frontend attend 3 endpoints pour finaliser la gestion des paniers.

### 1. Mettre à jour le statut d'un panier

**Endpoint:**
```
PATCH /api/supplier-orders/{basketId}
Content-Type: application/json

{
  "status": "SENT" | "ACK" | "RECEIVED" | "CLOSED" | "CANCELLED"
}
```

**Réponse (200):**
```json
{
  "id": "basket-001",
  "order_number": "CMD-2024-001",
  "status": "SENT",
  "supplier_id": "supp-001",
  "lines": [...],
  "updated_at": "2024-01-16T10:30:00Z"
}
```

**Erreurs:**
- 400: Statut invalide
- 404: Panier non trouvé
- 409: Transition impossible (contrainte métier)

**Appels frontend:**
```javascript
// Dans basketItemOperations.js
await suppliers.updateSupplierOrder(basketId, { status: newStatus });
```

---

### 2. Supprimer une ligne du panier

**Endpoint:**
```
DELETE /api/supplier-order-lines/{lineId}
```

**Réponse (204):**
```
No Content
```

**Erreurs:**
- 404: Ligne non trouvée
- 409: Ligne verrouillée (commandée/clôturée)

**Appels frontend:**
```javascript
// Dans basketItemOperations.js, handleBasketStatusChange()
await suppliers.deleteSupplierOrderLine(item.id);
```

**Logique backend:**
- Supprimer la ligne du panier
- Décrémente le compteur de lignes du panier
- **Important:** Ne pas supprimer la demande d'achat associée
  (elle sera réinitialisée par l'endpoint #3)

---

### 3. Réinitialiser une demande d'achat à "à dispatcher"

**Endpoint:**
```
PATCH /api/purchase-requests/{uid}
Content-Type: application/json

{
  "status": "open"
}
```

**Réponse (200):**
```json
{
  "uid": "da-uuid-001",
  "status": "open",
  "quantity": 10,
  "created_at": "2024-01-14T14:00:00Z"
}
```

**Erreurs:**
- 404: Demande d'achat non trouvée
- 409: Impossible de réinitialiser ce statut

**Appels frontend:**
```javascript
// Dans executeBasketTransition()
// NOTE: Cette API n'est pas encore appelée
// A implémenter avec la fonction suivante:
// await purchases.updateStatus(item.purchaseRequestUid, 'open');
```

---

## Règles métier - Transitions autorisées

### États valides

```
POOLING (OPEN)
   ↓
  SENT
   ↓
  ACK (ORDERED)
   ↓
RECEIVED (ORDERED)
   ↓
CLOSED

Annotations:
- POOLING: Mutualisation, items auto-sélectionnés
- SENT: Attente fournisseur, items peuvent être désélectionnés
- ACK: Réponse du fournisseur reçue
- RECEIVED: Commandé (historique avant réception)
- CLOSED: Archivé
```

### Validations de transition

**POOLING → SENT:**
- ✅ Toujours autorisée
- 🗑️ Items non sélectionnés → Supprimés du panier + DA réinitialisées

**SENT → ACK:**
- ✅ Toujours autorisée
- 🔒 Items se verrouillent (lecture seule)

**ACK/RECEIVED → CLOSED:**
- ✅ Toujours autorisée
- 🔒 Items restent verrouillés

**CLOSED → ***:**
- ❌ Jamais autorisée (archive)

***** → CANCELLED:**
- ✅ Autorisée depuis n'importe quel état
- 🗑️ Items non sélectionnés → Supprimés + DA réinitialisées

---

## Schéma de données - Modifications

### Table `supplier_orders`

**Colonnes existantes à vérifier:**
- `id` (pk)
- `order_number` (unique)
- `supplier_id` (fk)
- `status` (enum: OPEN, SENT, ACK, RECEIVED, CLOSED, CANCELLED)
- `created_at`
- `updated_at`

**Pas de changement de schéma requis** - Les colonnes existantes suffisent.

### Table `supplier_order_lines`

**Colonnes existantes:**
- `id` (pk)
- `supplier_order_id` (fk)
- `purchase_request_uid` (fk)
- `stock_item_id` (fk)
- `supplier_ref_snapshot` (string)
- `quantity` (int)
- `unit_price` (decimal)
- `is_selected` (boolean) - ✅ Déjà utilisée par le frontend

**Pas de changement de schéma requis** - Le champ `is_selected` existe déjà.

### Table `purchase_requests`

**Colonnes existantes:**
- `uid` (pk)
- `status` (enum: open, linked, dispatched, received, cancelled)
- `stock_item_id` (fk)
- `quantity` (int)
- `created_at`
- `updated_at`

**Note:** La réinitialisation à `open` doit être possible depuis `dispatched`.

---

## Flux d'exécution côté backend

### Suppression d'une ligne de panier

```
DELETE /api/supplier-order-lines/{lineId}

1. Vérifier que la ligne existe
2. Récupérer le panier associé (supplier_order_id)
3. Vérifier que le panier n'est pas CLOSED/CANCELLED
4. Vérifier que la ligne n'est pas verrouillée (ORDERED/CLOSED)
5. Récupérer le purchase_request_uid associé
6. Supprimer la ligne
7. Décrémente le compteur de lignes du panier
8. Retourner 204 No Content

Note: Ne pas mettre à jour le statut de la DA ici.
C'est l'endpoint #3 qui le fera si nécessaire.
```

### Transition du statut du panier

```
PATCH /api/supplier-orders/{basketId}
{
  "status": "SENT"
}

1. Vérifier que le panier existe
2. Récupérer le statut actuel
3. Valider la transition (voir table plus haut)
4. Si POOLING → SENT:
   a. Récupérer toutes les lignes non sélectionnées
   b. Supprimer chaque ligne
   c. Ne pas modifier le statut des DAs (c'est optionnel)
5. Mettre à jour le statut du panier
6. Retourner le panier mis à jour (200)
```

### Réinitialiser une demande d'achat

```
PATCH /api/purchase-requests/{uid}
{
  "status": "open"
}

1. Vérifier que la DA existe
2. Vérifier que la transition est valide
3. Mettre à jour le statut à "open"
4. Retourner la DA mise à jour (200)
```

---

## Intégration avec les triggers existants

### Trigger sur `supplier_orders` status change

**Événement:** Quand le status change de POOLING → SENT

```sql
-- Possible trigger Directus
BEFORE UPDATE ON supplier_orders
WHEN NEW.status = 'SENT' AND OLD.status IN ('OPEN', 'POOLING')
THEN:
  -- Les lignes non sélectionnées sont déjà supprimées par l'API
  -- Ce trigger peut:
  -- 1. Vérifier qu'aucune ligne avec is_selected=false ne reste
  -- 2. Logger la transition
  -- 3. Notifier les fournisseurs (email, webhook)
```

### Trigger sur `supplier_order_lines` deletion

**Événement:** Quand une ligne est supprimée

```sql
-- Possible trigger Directus
AFTER DELETE FROM supplier_order_lines
THEN:
  -- 1. Décrémenter le compteur de lignes du panier
  -- 2. Si le panier devient vide, marquer le statut comme "empty" ou supprimer
  -- 3. Vérifier si c'était la dernière ligne pour cette DA
```

**Pas de trigger implicite requis** - L'API gère explicitement.

---

## Tests à valider

### Scénarios de test

```javascript
// Test 1: Suppression d'une ligne
DELETE /api/supplier-order-lines/line-001
→ Ligne supprimée
→ DA associée reste en "dispatched"

// Test 2: Transition POOLING → SENT avec items désélectionnés
PATCH /api/supplier-orders/basket-001 { status: "SENT" }
→ Avant: 5 lignes (3 sélectionnées, 2 non sélectionnées)
→ Après: 3 lignes (toutes sélectionnées)
→ Les 2 lignes supprimées → DAs restent "dispatched"

// Test 3: Réinitialiser DA à "open"
PATCH /api/purchase-requests/da-uuid-001 { status: "open" }
→ DA passe en "open"
→ Elle réapparaît dans la liste "à dispatcher" du frontend

// Test 4: Transition impossible
PATCH /api/supplier-orders/basket-closed { status: "SENT" }
→ 409 Conflict: "Cannot transition from CLOSED to SENT"
```

---

## Checklist d'implémentation

- [ ] Endpoint #1: `PATCH /api/supplier-orders/{id}` avec validation
- [ ] Endpoint #2: `DELETE /api/supplier-order-lines/{id}`
- [ ] Endpoint #3: `PATCH /api/purchase-requests/{uid}` (optional, peut être fait via UI)
- [ ] Tests unitaires pour les validations de transition
- [ ] Tests d'intégration des suppression en cascade
- [ ] Documentation Swagger/OpenAPI
- [ ] Vérifier que le schéma Directus expose `is_selected` en API
- [ ] Logs de transition pour audit

---

## Notes importantes

1. **Pas de suppressions en cascade:** Les DAs ne doivent jamais être supprimées automatiquement.
   Elles retournent à l'état "open" (à dispatcher).

2. **Idempotence:** Si une ligne est déjà supprimée, `DELETE` doit retourner 404 (pas 200).

3. **Atomicité:** La suppression des 2+ lignes + transition de statut doit être atomique.
   Utiliser une transaction si possible.

4. **Audit trail:** Logger les transitions de statut avec l'utilisateur et l'heure.

5. **Notifications:** Les fournisseurs peuvent avoir besoin d'être notifiés des modifications.
   À mettre en place après la réception du changement de statut.

---

## Contacts et questions

Pour des clarifications sur la logique métier, voir:
- `docs/BASKET_ITEMS_MANAGEMENT.md` - Documentation complète du frontend
- `IMPLEMENTATION_SUMMARY.md` - Résumé des changes
- `src/lib/purchasing/basketItemRules.js` - Code source des règles

Le code du frontend est auto-documenté et traçable.
