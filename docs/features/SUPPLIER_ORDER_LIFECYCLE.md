# Cycle de vie des paniers fournisseurs (supplier_order)

**Document de référence - Concept figé**  
Date: 2026-01-20  
Statut: ✅ LOCKED

---

## 📊 Statuts et regroupements UI

### Statuts en base de données

| Statut DB | Label UI | Onglet UI | Description |
|-----------|----------|-----------|-------------|
| `OPEN` | Mutualisation | Mutualisation | Panier en construction, accumule les DAs |
| `SENT` | En chiffrage | Envoyés | Envoyé au fournisseur pour devis/chiffrage |
| `ACK` | Commandé | Commandés | Devis accepté, commande passée |
| `RECEIVED` | Commandé | Commandés | Commande validée/reçue (alias de ACK) |
| `CLOSED` | Clôturé | Clôturés | Commande terminée et archivée |
| `CANCELLED` | Annulé | Clôturés | Commande annulée |

### Normalisation (groupement logique)

```javascript
BASKET_STATUS = {
  POOLING: ['OPEN', 'POOLING'],    // Mutualisation
  SENT: ['SENT'],                   // En chiffrage
  ORDERED: ['ACK', 'RECEIVED'],     // Commandé
  CLOSED: ['CLOSED', 'CANCELLED'],  // Clôturé
}
```

---

## 🔄 Cycle de vie complet

```
┌─────────────────────────────────────────────────────────────┐
│                    CRÉATION DU PANIER                        │
│                                                              │
│  Dispatch automatique des DAs par fournisseur préféré       │
│  → Création d'un panier OPEN pour chaque fournisseur       │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   OPEN (Mutualisation)│
            │  "En mutualisation"   │
            └──────────┬────────────┘
                       │
                       │ Conditions de sortie:
                       │ • Ligne urgente ajoutée
                       │ • Ligne normale > 7 jours
                       │ • Action manuelle
                       │
                       ▼
            ┌──────────────────────┐
            │   SENT (En chiffrage) │
            │  "Envoyé en chiffrage"│
            └──────────┬────────────┘
                       │
                       │ Après réception devis:
                       │ • Sélection lignes à commander
                       │ • Validation jumelles
                       │
                       ▼
            ┌──────────────────────┐
            │   ACK (Commandé)      │
            │   "Commandé"          │
            └──────────┬────────────┘
                       │
                       │ Après réception physique:
                       │
                       ▼
            ┌──────────────────────┐
            │  CLOSED (Clôturé)     │
            │  "Clôturé"            │
            └───────────────────────┘

         (Annulation possible à tout moment → CANCELLED)
```

---

## 🔐 Permissions par statut

### OPEN (Mutualisation)

**Droits:**
- ✅ Modifier lignes (quantité, prix, référence)
- ✅ Recevoir de nouvelles lignes (dispatch automatique)
- ❌ Sélectionner/désélectionner lignes (toutes auto-sélectionnées)

**Règles métier:**
- Toutes les lignes sont automatiquement sélectionnées
- Pas de purge possible
- Mutualisation rompue si:
  - Une ligne urgente est ajoutée
  - Une ligne normale dépasse 7 jours

### SENT (En chiffrage)

**Droits:**
- ✅ Modifier lignes (quantité, prix, référence)
- ✅ Sélectionner/désélectionner lignes
- ❌ Ajouter de nouvelles lignes

**Règles métier:**
- Une ligne ne peut être désélectionnée que si la même DA existe dans un autre panier actif
- Les lignes désélectionnées restent visibles (pas de purge automatique)
- Avant passage en ACK: validation obligatoire des lignes jumelles

### ACK / RECEIVED (Commandé)

**Droits:**
- ❌ Toute modification interdite (panier verrouillé)

**État:**
- Figé, en attente de réception physique
- Les quantités commandées sont définitives

### CLOSED / CANCELLED (Clôturé)

**Droits:**
- ❌ Toute modification interdite (archivé)

**Impact:**
- Les purchase_request liées passent en statut `received` (si CLOSED)
- Les purchase_request liées peuvent être redispatchées (si CANCELLED)

---

## 🎯 Transitions autorisées

### OPEN → SENT

**Déclencheur:** Action manuelle "Envoyer au fournisseur"

**Actions:**
1. Figer le panier (plus de dispatch possible)
2. Permettre la sélection des lignes
3. (Optionnel) Purger les lignes désélectionnées et retourner les DAs au dispatch

**Validation:** Aucune

### SENT → ACK

**Déclencheur:** Action manuelle "Valider la commande"

**Actions:**
1. Vérifier que toutes les lignes jumelles sont cohérentes
2. Vérifier qu'aucune ligne désélectionnée n'est orpheline
3. Figer définitivement le panier

**Validation:**
- ✅ Pas de lignes jumelles avec quantités incohérentes
- ✅ Toutes les lignes désélectionnées ont une alternative dans un autre panier actif

### ACK → CLOSED

**Déclencheur:** Réception physique complète des marchandises

**Actions:**
1. Marquer toutes les purchase_request liées comme `received`
2. Archiver le panier

**Validation:** Aucune (peut être partielle)

### * → CANCELLED

**Déclencheur:** Annulation manuelle à tout moment

**Actions:**
1. Retourner toutes les purchase_request liées au statut `open`
2. Archiver le panier comme annulé

**Validation:** Confirmation utilisateur

---

## 📝 Impact sur les demandes d'achat (purchase_request)

Le statut d'une purchase_request est **dérivé** du statut du supplier_order auquel elle est liée:

| Statut supplier_order | Statut dérivé purchase_request |
|-----------------------|--------------------------------|
| (aucun lien) | `open` |
| OPEN | `pooling` |
| SENT | `sent` |
| ACK / RECEIVED | `ordered` |
| CLOSED | `received` |
| CANCELLED | `open` (retour) |

⚠️ **Important:** Le champ `status` de la table `purchase_request` en base de données est progressivement déprécié au profit de la dérivation depuis `supplier_order_line_purchase_request` → `supplier_order_line` → `supplier_order`.

---

## 🔧 Implémentation technique

### Fichiers clés

- **Normalisation des statuts:** `src/lib/purchasing/basketItemRules.js`
- **Configuration statuts:** `src/config/purchasingConfig.js`
- **Dérivation statut DAs:** `src/lib/purchasing/purchaseRequestStatusUtils.js`
- **Regroupement UI:** `src/pages/Procurement.jsx` (ordersByState)

### Fonction de normalisation

```javascript
export const BASKET_STATUS = {
  POOLING: ['OPEN', 'POOLING'],
  SENT: ['SENT'],
  ORDERED: ['ACK', 'RECEIVED'],
  CLOSED: ['CLOSED', 'CANCELLED'],
};

export function normalizeBasketStatus(status) {
  const upperStatus = (status || '').toUpperCase();
  if (BASKET_STATUS.POOLING.includes(upperStatus)) return 'POOLING';
  if (BASKET_STATUS.SENT.includes(upperStatus)) return 'SENT';
  if (BASKET_STATUS.ORDERED.includes(upperStatus)) return 'ORDERED';
  if (BASKET_STATUS.CLOSED.includes(upperStatus)) return 'CLOSED';
  return 'UNKNOWN';
}
```

---

## ⚠️ Règles immuables

1. **Un panier OPEN ne peut jamais avoir de lignes désélectionnées** (toutes auto-sélectionnées)
2. **Un panier SENT ne peut recevoir de nouvelles lignes** (figé)
3. **Un panier ACK/RECEIVED/CLOSED/CANCELLED est totalement verrouillé** (lecture seule)
4. **Une ligne désélectionnée doit toujours avoir une alternative** dans un autre panier actif
5. **Les lignes jumelles doivent être validées** avant passage SENT → ACK

---

## 📚 Références

- Architecture générale: `docs/ARCHITECTURE_LOCKED.md`
- Gestion des achats: `docs/features/REGLES_METIER.md`
- Contrats API: `docs/tech/API_CONTRACTS.md`

---

**Ce document définit le comportement standard et ne doit pas être modifié sans validation architecturale.**
