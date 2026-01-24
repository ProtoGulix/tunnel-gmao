# Analyse détaillée : Calcul de l'État du Service

## 📋 Vue d'ensemble

La page `ServiceStatus.jsx` affiche l'état du service (charge, fragmentation, capacité réelle). **Actuellement, TOUS les calculs sont faits côté frontend** après récupération des données brutes de l'API.

---

## 🔄 Architecture actuelle (Frontend)

```
┌─────────────────────────────────────────────────────────────────┐
│ ServiceStatus.jsx (Page)                                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
       ┌─────────────────────────────┐
       │ useServiceData (Hook)        │
       │                             │
       │ - Charge les actions        │
       │ - Lance les calculs         │
       └────────────────┬────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │ fetchServiceTimeBreakdown()       │
        │ (Fonction async)                  │
        │                                   │
        │ 1️⃣ Appel API                      │
        │ 2️⃣ Filtrage par dates            │
        │ 3️⃣ Classification actions        │
        │ 4️⃣ Agrégation temps             │
        │ 5️⃣ Calcul métriques             │
        └────────────────┬──────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   Calculs       Classifications   Agrégations
   Frontend      Frontend          Frontend
```

---

## 📊 Flux détaillé des calculs FRONTEND

### Étape 1️⃣ : Récupération des données brutes
**Fichier** : `useServiceData.js` → `fetchServiceTimeBreakdown()`

```javascript
const allActions = await actions.fetchActions();
// Retourne TOUTES les actions de l'API sans filtrage
```

**Données reçues** :
- Toutes les actions stockées (potentiellement des milliers)
- Chaque action contient :
  - `id`, `timeSpent` (heures)
  - `subcategory` → `category` (ID et code)
  - `intervention` → `machine` (arborescence équipements)
  - Dates d'exécution

**Charge côté frontend** ⚠️ : 
- Transfert réseau de TOUTES les actions
- Traitement de données massives en JavaScript

---

### Étape 2️⃣ : Filtrage par plage de dates
**Fichier** : `useServiceData.js` → ligne 232

```javascript
const actionsData = allActions.filter((action) => {
  const actionDate = action.createdAt || action.created_at || 
                     action.intervention?.date || 
                     action.intervention?.createdAt;
  
  const date = new Date(actionDate);
  return date >= startDate && date <= endDate;
});
```

**Charge côté frontend** ⚠️ :
- Itération sur TOUTES les actions
- Parsing de dates pour chaque action
- Comparison de dates

---

### Étape 3️⃣ : Classification de chaque action (PROD/DEP/PILOT/FRAG)
**Fichier** : `serviceTimeClassification.js` → `classifyActionTime()`

```javascript
const actionsWithTimeType = actionsData.map((action) => ({
  ...action,
  timeType: classifyActionTime(action),  // ← Fonction appliquée à CHAQUE action
}));
```

**Logique de classification** (dans `classifyActionTime()`):

```
1. Extraire : timeSpent, categoryId, categoryCode
2. Appliquer les règles :

   SI (categoryId === 23 OU categoryCode === 'SUP') → FRAG
   SINON SI (timeSpent < 0.5h ET categoryCode ≠ 'DEP' ET categoryCode ≠ 'PREV') → FRAG
   SINON
     - ID 19 → DEP (Dépannage)
     - ID 20 → PROD (Fabrication)
     - ID 21 → PILOT (Documentation)
     - ID 22 → PILOT (Préventif)
     - ID 24 → PROD (Bâtiment)
     - Défaut → PROD
```

**Charge côté frontend** ⚠️ :
- Classification appliquée à chaque action (boucle map)
- Vérifications conditionnelles répétées
- Peut être slow sur 10000+ actions

---

### Étape 4️⃣ : Agrégation des temps par type
**Fichier** : `serviceTimeClassification.js` → `aggregateTimeByType()`

```javascript
const timeBreakdown = aggregateTimeByType(actionsWithTimeType);
// Retourne : { PROD: 240.5, DEP: 80.2, PILOT: 120.1, FRAG: 45.3, total: 486.1 }
```

**Logique** :
```javascript
actions.forEach(action => {
  breakdown[action.timeType] += action.timeSpent;
  breakdown.total += action.timeSpent;
});
```

**Charge côté frontend** ⚠️ :
- Boucle sur toutes les actions filtrées

---

### Étape 5️⃣ : Calcul des métriques de synthèse
**Fichier** : `useServiceData.js` → ligne 241-251

#### 5a) Calcul des actions courtes
```javascript
const shortActionsPercent = calculateShortActionsPercent(actionsWithTimeType);
// % d'actions < 0.5h
```

#### 5b) Calcul de la charge vs capacité
```javascript
const totalHours = timeBreakdown.total;
const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
const capacityHours = SERVICE_ETP_CAPACITY * (periodDays / 30);  // 320h/mois
const chargePercent = (totalHours / capacityHours) * 100;
```

**Charge côté frontend** ⚠️ :
- Calculs mathématiques simples (mais fait APRÈS boucles coûteuses)

---

### Étape 6️⃣ : Calcul des causes de fragmentation (Top 10)
**Fichier** : `useServiceData.js` → `calculateFragmentationCauses()` (ligne 52-95)

```javascript
const fragActions = actionsData.filter(a => a.timeType === 'FRAG');

// Grouper par sous-catégorie
fragActions.forEach(action => {
  groupedBySubcategory[subcategoryId] = {
    totalHours: sum,
    actionCount: count,
  }
});

// Trier et prendre Top 10
const causes = Object.values(groupedBySubcategory)
  .sort((a, b) => b.totalHours - a.totalHours)
  .slice(0, 10);
```

**Charge côté frontend** ⚠️ :
- Filtrage des actions FRAG
- Groupement par clé
- Tri décroissant
- Calculs de pourcentages

---

### Étape 7️⃣ : Calcul de la consommation par site/équipement
**Fichier** : `useServiceData.js` → `calculateSiteConsumption()` (ligne 153-198)

```javascript
// Itérer sur TOUTES les actions
actionsData.forEach(action => {
  const machine = action.intervention?.machine;
  const parentEquipment = getParentEquipment(machine);
  
  // Accumuler temps par équipement mère
  groupedByEquipment[equipmentId].totalHours += timeSpent;
  if (action.timeType === 'FRAG') {
    groupedByEquipment[equipmentId].fragHours += timeSpent;
  }
});

// Calculer pourcentages
sites.forEach(site => {
  site.percentTotal = (site.totalHours / totalServiceHours) * 100;
  site.percentFrag = (site.fragHours / totalFragHours) * 100;
});
```

**Charge côté frontend** ⚠️ :
- Parcours hiérarchique machine → équipement mère
- Groupement et calculs par équipement

---

### Étape 8️⃣ : Calculs d'affichage dans la page
**Fichier** : `ServiceStatus.jsx` → ligne 166-191

```javascript
// Arrondir les valeurs
const roundedTimeBreakdown = Object.fromEntries(
  Object.entries(timeBreakdown).map(([key, value]) => 
    [key, Number((value ?? 0).toFixed(2))]
  )
);

// Calculer les couleurs et textes d'interprétation
const metrics = calculateMetrics(serviceData);

// Fonctions : getChargeColor(), getFragmentationColor(), etc.
const chargeColor = getChargeColor(chargePercent);  // → Détermine 'green'/'orange'/'red'
const fragText = getFragmentationInterpretation(fragPercent);  // → "Fragmentation élevée"
```

---

## 🎯 Résumé des calculs FRONTEND

| # | Calcul | Fichier | Complexité | Occurrence |
|---|--------|---------|-----------|-----------|
| 1 | Récupération actions | `useServiceData.js:211` | O(1) API | 1x par charge |
| 2 | Filtrage par dates | `useServiceData.js:218` | O(n) | 1x par charge |
| 3 | Classification actions | `useServiceData.js:224` | O(n) | 1x par charge |
| 4 | Agrégation temps | `serviceTimeClassification.js:168` | O(n) | 1x par charge |
| 5 | Actions courtes % | `serviceTimeClassification.js` | O(n) | 1x par charge |
| 6 | Charge vs capacité | `useServiceData.js:241` | O(1) | 1x par charge |
| 7 | Top 10 FRAG causes | `useServiceData.js:52` | O(n log n) | 1x par charge |
| 8 | Consommation sites | `useServiceData.js:153` | O(n) | 1x par charge |
| 9 | Couleurs/textes | `ServiceStatus.jsx:105-120` | O(1) | 1x par rendu |

**Total complexité globale** : **O(n)** où n = nombre total d'actions sur la période

---

## ⚠️ Problèmes identifiés

### 1. **Transfert réseau coûteux**
- ❌ Toutes les actions sont envoyées par l'API (10000+ potentielles)
- ❌ Données complètes + relationnelles incluses
- ❌ Pas de filtrage côté serveur
- ❌ Bande passante gaspillée si l'utilisateur fait plusieurs recherches

### 2. **Calculs répétitifs au frontend**
- ❌ Chaque changement de période recharge TOUT et recalcule TOUT
- ❌ JavaScript dans le navigateur : plus lent qu'une DB
- ❌ Boucles imbriquées sur grosses données → lag utilisateur

### 3. **Pas de cache**
- ❌ Les mêmes période = recalcul complet
- ❌ Pas de memoization intelligente

### 4. **Complexité cachée**
- ❌ Traversal profond : `action.intervention.machine.equipement_mere`
- ❌ Parsing dates répété à chaque filtre
- ❌ Formatage/rounding retardé jusqu'à l'affichage

---

## ✅ Solution : Déplacer les calculs au BACKEND

### Architecture proposée

```
┌──────────────────────────────────────────┐
│ ServiceStatus.jsx (Page)                 │
└────────────────┬─────────────────────────┘
                 │
                 ▼
       ┌─────────────────────────────┐
       │ useServiceMetrics (Hook)    │
       │                             │
       │ - Appel 1 endpoint          │
       │ - Données pré-calculées     │
       └────────────────┬────────────┘
                        │
                        ▼
        ┌─────────────────────────────────────┐
        │ API Backend                         │
        │ GET /api/service/metrics            │
        │ ?startDate=...&endDate=...          │
        │                                     │
        │ ✅ Filtrage SQL (DATE WHERE)        │
        │ ✅ Classification SQL/code          │
        │ ✅ Agrégation GROUP BY              │
        │ ✅ Tri/Top10 (LIMIT/ORDER BY)      │
        │ ✅ Retourne UNIQUEMENT les stats    │
        └─────────────────────────────────────┘
```

### Réponse API proposée

```javascript
GET /api/service/metrics?startDate=2024-01-01&endDate=2024-12-31

{
  chargePercent: 78.5,
  timeBreakdown: {
    PROD: 240.5,
    DEP: 80.2,
    PILOT: 120.1,
    FRAG: 45.3,
    total: 486.1
  },
  shortActionsPercent: 12.3,
  fragmentation: {
    total: 45.3,
    items: [
      { subcategoryId: 5, subcategoryName: "Support", totalHours: 15.5, actionCount: 23, percent: 34 },
      { subcategoryId: 8, subcategoryName: "Réunion", totalHours: 12.2, actionCount: 18, percent: 27 },
      ...  // Top 10
    ]
  },
  siteConsumption: {
    totalServiceHours: 486.1,
    totalFragHours: 45.3,
    items: [
      { equipmentId: 1, equipmentName: "Site A", equipmentCode: "SITE-A", 
        totalHours: 250.5, fragHours: 20.2, percentTotal: 51.5, percentFrag: 44.6 },
      ...
    ]
  }
}
```

---

## 🚀 Bénéfices

| Aspect | Avant | Après |
|--------|-------|-------|
| **Transfert réseau** | 10000+ actions | Métriques pré-calculées uniquement |
| **Temps chargement** | ~2-3s (JS) | ~200-500ms (DB optimisée) |
| **Calculs frontend** | O(n) complexe | O(1) simple affichage |
| **Mémoire navigateur** | Haute | Très basse |
| **Scalabilité** | Mauvaise (limite ~5000 actions) | Excellente (millions d'actions) |
| **Cache possible** | Non | Oui (Redis) |

---

## 📝 Implémentation étapes

### Phase 1 : Backend
1. Créer endpoint `/api/service/metrics`
2. Implémenter tous les calculs en SQL/code serveur
3. Tester avec données volumineuses

### Phase 2 : Frontend
1. Créer `useServiceMetrics()` hook remplaçant `useServiceData()`
2. Appeler nouvel endpoint
3. Simplifier `ServiceStatus.jsx` (supprimer tous les calculs)
4. Garder composants affichage (`SynthesisCards`, etc.)

### Phase 3 : Validation
1. Tests de perf (avant/après)
2. Validation des chiffres
3. Cache backend (optionnel)

---

## 📚 Fichiers impactés

### À modifier :
- `src/hooks/useServiceData.js` → remplacer par appel API simple
- `src/pages/ServiceStatus.jsx` → supprimer fonctions calcul (garder affichage)

### À créer :
- Backend : endpoint `/api/service/metrics`

### À garder :
- `src/components/service/*` (présentation inchangée)
- `src/config/serviceTimeClassification.js` (logique métier copiée au backend)
