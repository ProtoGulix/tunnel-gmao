# État du Service : Analyse complète des calculs

## 🎯 Qu'est-ce que ServiceStatus ?

La page **ServiceStatus** affiche la santé du service de maintenance :
- **Charge actuelle** : Combien de temps le service bosse réellement vs sa capacité théorique ?
- **Fragmentation** : Y a-t-il trop d'actions courtes qui dispersent l'équipe ?
- **Capacité de pilotage** : Reste-t-il du temps pour s'améliorer ?

C'est un outil **décisionnel** : répondre en <30 secondes à "Le service peut-il tenir et progresser ?"

---

## 📊 Les données brutes

L'API fournit des **actions** (journées de travail enregistrées) avec :
- **Temps passé** : 2.5 heures
- **Type d'action** : Support, Dépannage, Fabrication, Documentation, etc.
- **Machine concernée** : Machine M50 → Équipement parent "Site A"
- **Date** : 15 janvier 2024

Exemple d'une action brute :
```javascript
{
  id: 1,
  timeSpent: 2.5,           // Heures
  subcategory: {
    id: 5,
    name: "Support",
    category: { id: 23, code: "SUP" }
  },
  intervention: {
    date: "2024-01-15",
    machine: {
      id: 50,
      name: "M50",
      is_mere: false,
      equipement_mere: {
        id: 1,
        name: "Site A"
      }
    }
  }
}
```

**Problème** : On reçoit potentiellement **5000+ actions** chaque fois qu'on change de période.

---

## 🧮 Les 8 calculs expliqués

### Calcul #1 : Filtrer par plage de dates

**Quoi ?**  
Garder uniquement les actions entre deux dates (ex: 1 janvier - 31 mars 2024).

**Pourquoi c'est utile ?**  
Pour analyser une période spécifique : mois, trimestre, année.

**Comment ça marche ?**
```javascript
const startDate = new Date("2024-01-01");
const endDate = new Date("2024-03-31");

const actionsData = allActions.filter((action) => {
  const actionDate = new Date(action.createdAt);
  return actionDate >= startDate && actionDate <= endDate;
});

// Résultat : 4500 actions (au lieu de 5000)
```

**Intérêt** :
- ✅ Concentrer l'analyse sur la période pertinente
- ✅ Éviter de mélanger les données anciennes et nouvelles

---

### Calcul #2 : Classer les actions (PROD / DEP / PILOT / FRAG)

**Quoi ?**  
Ranger chaque action dans une des 4 catégories de temps :
- **PROD** = Production/Fabrication (valeur directe)
- **DEP** = Dépannage (réactivité urgente)
- **PILOT** = Pilotage (amélioration, documentation, préventif)
- **FRAG** = Fragmentation (actions courtes dispersées)

**Pourquoi c'est utile ?**  
Comprendre où va le temps du service.

**Comment ça marche ?**

Les règles de classification :

```
SI catégorie = Support (ID 23) → FRAG
SINON SI catégorie = Support (code "SUP") → FRAG
SINON SI timeSpent < 0.5h ET catégorie ≠ "DEP" ET catégorie ≠ "PREV" → FRAG
    (Actions courtes non protégées = fragmentées)
SINON
  Utiliser la table de mapping :
  - ID 19 (Dépannage) → DEP
  - ID 20 (Fabrication) → PROD
  - ID 21 (Documentation) → PILOT
  - ID 22 (Préventif) → PILOT
  - ID 24 (Bâtiment) → PROD
  - Autre → PROD
```

**Exemple concret** :
```javascript
// Action 1 : Dépannage urgent, 0.25h
→ FRAG (< 0.5h, non protégée même si DEP... wait non)
→ Règle correction : DEP est protégé donc → DEP

// Action 2 : Support administratif, 0.75h
→ FRAG (category ID = 23 = Support)

// Action 3 : Fabrication, 3h
→ PROD (category ID = 20 = Fabrication, temps long)

// Action 4 : Documentation, 0.3h
→ PILOT (category ID = 21 = Documentation)
```

**Intérêt** :
- ✅ Classer automatiquement sans l'intervalle d'un humain
- ✅ Logique métier transparente (on voit les règles)
- ✅ Permet analyses par type de temps

---

### Calcul #3 : Additionner les temps par type

**Quoi ?**  
Faire le total des heures pour chaque catégorie.

**Pourquoi c'est utile ?**  
Voir la répartition du temps : "On a passé 240h en production, 80h en dépannage, etc."

**Comment ça marche ?**
```javascript
const timeBreakdown = {
  PROD: 0,
  DEP: 0,
  PILOT: 0,
  FRAG: 0,
  total: 0
};

actionsClassifiées.forEach((action) => {
  timeBreakdown[action.timeType] += action.timeSpent;
  timeBreakdown.total += action.timeSpent;
});

// Résultat sur 3 mois :
// {
//   PROD: 240.5,    ← Fabrication
//   DEP: 80.2,      ← Dépannage
//   PILOT: 120.1,   ← Pilotage
//   FRAG: 45.3,     ← Fragmentation
//   total: 486.1    ← Total 3 mois
// }
```

**Intérêt** :
- ✅ Vue synthétique des heures
- ✅ Base pour les autres calculs

---

### Calcul #4 : Calculer la charge vs capacité

**Quoi ?**  
Comparer le temps travaillé vs le temps disponible théorique.

**Pourquoi c'est utile ?**  
Savoir si le service déborde ou pas. "On a travaillé 486h en 3 mois, c'est 78% de la capacité."

**Comment ça marche ?**

Capacité théorique = **320 heures/mois** (2 ETP = 2 × 160h)

Pour **3 mois (90 jours)** :
- Capacité = 320 × (90/30) = **960 heures**
- Heures travaillées = 486
- Charge % = (486 / 960) × 100 = **50.6%**

```javascript
const SERVICE_ETP_CAPACITY = 320; // heures par mois

// Calculer nombre de jours dans la période
const periodDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
// 90 jours

// Capacité proratisée
const capacityHours = SERVICE_ETP_CAPACITY * (periodDays / 30);
// 320 × (90/30) = 960

// Charge en %
const chargePercent = (totalHours / capacityHours) * 100;
// (486.1 / 960) × 100 = 50.6%
```

**Couleurs pour interpréter** :
- 🟢 **Green** < 75% : Charge normale
- 🟠 **Orange** 75-100% : Charge élevée
- 🔴 **Red** > 100% : Service au plafond (débordé)

**Intérêt** :
- ✅ Savoir si le service peut prendre plus
- ✅ Identifier les pics de charge
- ✅ Aide à la planification

---

### Calcul #5 : Pourcentage d'actions courtes

**Quoi ?**  
Calculer quel % d'actions durent <30 minutes (0.5h).

**Pourquoi c'est utile ?**  
Beaucoup d'actions courtes = fragmentation, perte d'efficacité.

**Comment ça marche ?**
```javascript
const shortActionsCount = actionsClassifiées.filter(
  a => a.timeSpent < 0.5
).length;
// 200 actions

const totalActionCount = actionsClassifiées.length;
// 5000 actions

const shortActionsPercent = (200 / 5000) * 100;
// 4%
```

**Interprétation** :
- 🟢 **< 5%** : Bon (actions généralement longues, concentrées)
- 🟠 **5-15%** : Moyen (fragmentation notable)
- 🔴 **> 15%** : Problématique (équipe dispersée)

**Exemple** :
Si 4% = 200 actions courtes, l'équipe est plutôt concentrée.

**Intérêt** :
- ✅ Détecter si trop de petites tâches dispersent l'équipe
- ✅ Aide à identifier besoin de restructuring

---

### Calcul #6 : Top 10 causes de fragmentation

**Quoi ?**  
Identifier les 10 sous-catégories qui créent le plus de fragmentation (actions courtes).

**Pourquoi c'est utile ?**  
Si beaucoup de "Support" → actions courtes, c'est une cible pour amélioration.

**Comment ça marche ?**

1. **Filtrer** les actions FRAG (fragmentation)
```javascript
const fragActions = actionsClassifiées.filter(a => a.timeType === 'FRAG');
// 500 actions fragmentées (45.3h total)
```

2. **Grouper** par sous-catégorie
```javascript
const grouped = {};
fragActions.forEach(action => {
  const subcatId = action.subcategory.id;
  const subcatName = action.subcategory.name;
  
  if (!grouped[subcatId]) {
    grouped[subcatId] = {
      id: subcatId,
      name: subcatName,
      totalHours: 0,
      actionCount: 0
    };
  }
  grouped[subcatId].totalHours += action.timeSpent;
  grouped[subcatId].actionCount += 1;
});

// Résultat :
// {
//   5: { name: "Support", totalHours: 15.5, actionCount: 23 },
//   8: { name: "Réunion", totalHours: 12.2, actionCount: 18 },
//   ...
// }
```

3. **Trier** par temps décroissant et prendre Top 10
```javascript
const top10 = Object.values(grouped)
  .sort((a, b) => b.totalHours - a.totalHours)
  .slice(0, 10);

// Résultat :
// [
//   { name: "Support", totalHours: 15.5, percent: 34% },
//   { name: "Réunion", totalHours: 12.2, percent: 27% },
//   ...
// ]
```

**Intérêt** :
- ✅ Identifier rapidement où va la "mauvaise" fragmentation
- ✅ Prioriser actions d'amélioration
- ✅ Exemple : "Support crée 34% de la fragmentation → réduire/automatiser"

---

### Calcul #7 : Consommation de capacité par site

**Quoi ?**  
Voir combien de temps chaque équipement/site a consommé (total et fragmentation).

**Pourquoi c'est utile ?**  
Savoir qui consomme le plus, qui a le plus de fragmentation → prioriser interventions.

**Comment ça marche ?**

1. **Regrouper** par équipement mère (site)
```javascript
const grouped = {};

actionsClassifiées.forEach(action => {
  // Remonter la hiérarchie machine
  const machine = action.intervention.machine;
  
  // Si elle a un parent, prendre le parent
  const parentId = machine.equipement_mere?.id || 
                   (machine.is_mere ? machine.id : null);
  
  if (!parentId) return; // Ignorer machines non rattachées
  
  if (!grouped[parentId]) {
    grouped[parentId] = {
      equipmentId: parentId,
      equipmentName: machine.equipement_mere?.name || machine.name,
      totalHours: 0,
      fragHours: 0
    };
  }
  
  grouped[parentId].totalHours += action.timeSpent;
  if (action.timeType === 'FRAG') {
    grouped[parentId].fragHours += action.timeSpent;
  }
});

// Résultat :
// {
//   1: { name: "Site A", totalHours: 250.5, fragHours: 20.2 },
//   2: { name: "Site B", totalHours: 150.3, fragHours: 15.1 },
//   ...
// }
```

2. **Calculer** les pourcentages
```javascript
const totalServiceHours = 486.1;  // Total général
const totalFragHours = 45.3;      // Total FRAG général

const sites = Object.values(grouped).map(site => ({
  ...site,
  percentTotal: (site.totalHours / totalServiceHours) * 100,
  // 250.5 / 486.1 = 51.5%
  percentFrag: (site.fragHours / totalFragHours) * 100
  // 20.2 / 45.3 = 44.6%
}));

// Résultat :
// [
//   { name: "Site A", totalHours: 250.5, fragHours: 20.2,
//     percentTotal: 51.5%, percentFrag: 44.6% },
//   { name: "Site B", totalHours: 150.3, fragHours: 15.1,
//     percentTotal: 30.9%, percentFrag: 33.3% }
// ]
```

3. **Trier** par fragmentation (problème majeur)
```javascript
sites.sort((a, b) => b.fragHours - a.fragHours);
```

**Intérêt** :
- ✅ Identifier équipements/sites à problème
- ✅ Allouer ressources là où c'est nécessaire
- ✅ Exemple : "Site A = 51% du temps, 45% en fragmentation → intervention prioritaire"

---

### Calcul #8 : Couleurs et interprétations

**Quoi ?**  
Traduire les nombres en couleurs + texte pour décision rapide.

**Pourquoi c'est utile ?**  
Un manager lit une couleur en 1 seconde, pas des chiffres.

**Comment ça marche ?**

Pour chaque métrique, appliquer seuils :

**Charge** (chargePercent)
```javascript
if (chargePercent < 75) return { color: 'green', text: 'Charge normale' };
if (chargePercent < 100) return { color: 'orange', text: 'Charge élevée' };
return { color: 'red', text: 'Service au plafond' };

// 50.6% → 🟢 green "Charge normale"
```

**Fragmentation** (fragPercent = FRAG/total × 100)
```javascript
const fragPercent = (45.3 / 486.1) * 100; // 9.3%

if (fragPercent < 5) return { color: 'green', text: 'Fragmentation maîtrisée' };
if (fragPercent < 15) return { color: 'orange', text: 'Fragmentation notable' };
return { color: 'red', text: 'Fragmentation élevée' };

// 9.3% → 🟠 orange "Fragmentation notable"
```

**Capacité de pilotage** (pilotPercent = PILOT/total × 100)
```javascript
const pilotPercent = (120.1 / 486.1) * 100; // 24.7%

if (pilotPercent > 20) return { color: 'green', text: 'Capacité présente' };
if (pilotPercent > 10) return { color: 'orange', text: 'Capacité limitée' };
return { color: 'red', text: 'Aucune capacité' };

// 24.7% → 🟢 green "Capacité présente"
```

**Intérêt** :
- ✅ Décision visuelle rapide (rouge = problème, vert = OK)
- ✅ Dashboard type "feu tricolore"

---

## 📈 Exemple concret sur 3 mois

Imagine un service qui a enregistré 4500 actions de janvier à mars 2024 :

### Données brutes
- 4500 actions
- Durée totale : 486.1 heures
- Répartition : Support (500h), Dépannage (80h), Fabrication (240h), etc.

### Calcul #1-2 : Filtrage + Classification
```
Filtrer 2024-01-01 à 2024-03-31
↓
Classer chaque action : PROD/DEP/PILOT/FRAG
↓
Résultat : 4500 actions classifiées
```

### Calcul #3 : Répartition du temps
```
PROD (Fabrication)  : 240.5 heures
DEP (Dépannage)     : 80.2 heures
PILOT (Amélioration) : 120.1 heures
FRAG (Fragments)    : 45.3 heures
─────────────────────────────────
TOTAL               : 486.1 heures
```

### Calcul #4 : Charge
```
Capacité théorique : 320 h/mois × 3 = 960 heures
Heures réelles : 486.1
Charge % = 50.6%

Interprétation : 🟢 Charge normale
```

### Calcul #5 : Actions courtes
```
200 actions < 0.5h sur 4500
→ 4.4% fragmentation

Interprétation : 🟢 Bon (< 5%)
```

### Calcul #6 : Top 10 causes FRAG
```
1. Support         : 15.5h (34%)
2. Réunions        : 12.2h (27%)
3. Maintenance IT  : 8.1h  (18%)
... (7 autres)

Action : Réduire/automatiser Support
```

### Calcul #7 : Consommation par site
```
Site A  : 250.5h (51.5%) - 20.2h FRAG (44.6%)
Site B  : 150.3h (30.9%) - 15.1h FRAG (33.3%)
Site C  : 85.3h  (17.5%) - 10.0h FRAG (22.1%)
```

### Calcul #8 : Synthèse visuelle
```
Charge    : 🟢 50.6% (normal)
Fragmentation : 🟠 9.3% (moyen)
Pilotage  : 🟢 24.7% (capacité)

Décision : Service peut prendre plus + work on fragmentation
```

---

## 💡 Intérêts globaux

### 1. Aide à la décision rapide
**Sans calculs** : "Comment va le service ?" → Flou
**Avec calculs** : "Comment va le service ?" → 3 couleurs + chiffres clairs

### 2. Identification de problèmes
**Top 10 FRAG** : Identifie immédiatement où agir
**Consommation sites** : Voit qui déborde
**Actions courtes %** : Détecte dispersion équipe

### 3. Planification
**Charge %** : Sait si peut prendre missions
**Capacité pilotage** : Sait si peut s'améliorer
**Consommation** : Alloue ressources efficacement

### 4. Suivi évolution
**Historique** : Voir tendance charge, FRAG, capacité
**Impact actions** : Mesurer résultats des changements

---

## 🔧 Comment reproduire ces calculs

### Option 1 : En JavaScript (Frontend)
```javascript
// Hook custom
function useServiceMetrics(startDate, endDate) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const calculate = async () => {
      // 1. Récupérer actions brutes
      const allActions = await actions.fetchActions();
      
      // 2. Filtrer dates (Calcul #1)
      const filtered = allActions.filter(a => 
        new Date(a.createdAt) >= startDate && 
        new Date(a.createdAt) <= endDate
      );
      
      // 3. Classifier (Calcul #2)
      const classified = filtered.map(a => ({
        ...a,
        timeType: classifyActionTime(a)
      }));
      
      // 4. Agréger (Calcul #3)
      const breakdown = classified.reduce((acc, a) => {
        acc[a.timeType] = (acc[a.timeType] || 0) + a.timeSpent;
        acc.total = (acc.total || 0) + a.timeSpent;
        return acc;
      }, {});
      
      // 5. Charge (Calcul #4)
      const chargePercent = (breakdown.total / capacityHours) * 100;
      
      // 6. Actions courtes (Calcul #5)
      const shortPercent = classified.filter(
        a => a.timeSpent < 0.5
      ).length / classified.length * 100;
      
      // 7. Top 10 FRAG (Calcul #6)
      const fragmentation = getTop10Fragmentation(classified);
      
      // 8. Consommation sites (Calcul #7)
      const sites = getConsumptionBySite(classified);
      
      // 9. Couleurs (Calcul #8)
      const colors = {
        chargeColor: chargePercent < 75 ? 'green' : 'orange',
        fragColor: shortPercent < 5 ? 'green' : 'orange'
      };
      
      setMetrics({
        chargePercent,
        breakdown,
        shortActionsPercent: shortPercent,
        fragmentation,
        siteConsumption: sites,
        colors
      });
    };
    
    calculate();
  }, [startDate, endDate]);
  
  return metrics;
}
```

### Option 2 : En SQL (Backend/Database)
```sql
-- Filtra + classe + agrège en une requête

WITH classified_actions AS (
  SELECT 
    a.id,
    a.time_spent,
    a.created_at,
    CASE 
      WHEN c.id = 23 THEN 'FRAG'
      WHEN c.code = 'SUP' THEN 'FRAG'
      WHEN a.time_spent < 0.5 AND c.code NOT IN ('DEP', 'PREV') THEN 'FRAG'
      WHEN c.id = 19 THEN 'DEP'
      WHEN c.id IN (20, 24) THEN 'PROD'
      WHEN c.id IN (21, 22) THEN 'PILOT'
      ELSE 'PROD'
    END as time_type
  FROM actions a
  JOIN subcategories s ON a.subcategory_id = s.id
  JOIN categories c ON s.category_id = c.id
  WHERE a.created_at >= ?1 AND a.created_at <= ?2
)
SELECT
  SUM(CASE WHEN time_type = 'PROD' THEN time_spent END) as prod_hours,
  SUM(CASE WHEN time_type = 'DEP' THEN time_spent END) as dep_hours,
  SUM(CASE WHEN time_type = 'PILOT' THEN time_spent END) as pilot_hours,
  SUM(CASE WHEN time_type = 'FRAG' THEN time_spent END) as frag_hours,
  SUM(time_spent) as total_hours,
  COUNT(*) as action_count,
  SUM(CASE WHEN time_spent < 0.5 THEN 1 ELSE 0 END) as short_action_count
FROM classified_actions;
```

### Option 3 : En Python (Data Science)
```python
import pandas as pd
from datetime import datetime

# 1-2. Charge les données et filtre/classe
actions = load_actions_from_api()
filtered = actions[
    (actions['created_at'] >= start_date) & 
    (actions['created_at'] <= end_date)
]

# Fonction classification
def classify_action(row):
    if row['category_id'] == 23 or row['category_code'] == 'SUP':
        return 'FRAG'
    if row['timeSpent'] < 0.5 and row['category_code'] not in ['DEP', 'PREV']:
        return 'FRAG'
    mapping = {19: 'DEP', 20: 'PROD', 21: 'PILOT', 22: 'PILOT', 24: 'PROD'}
    return mapping.get(row['category_id'], 'PROD')

filtered['timeType'] = filtered.apply(classify_action, axis=1)

# 3. Agrégation
breakdown = filtered.groupby('timeType')['timeSpent'].sum()
# PROD     240.5
# DEP       80.2
# PILOT    120.1
# FRAG      45.3

# 4. Charge
total_hours = breakdown.sum()  # 486.1
capacity = 960  # 3 mois
charge_percent = (total_hours / capacity) * 100  # 50.6%

# 5. Actions courtes
short_actions_percent = (filtered['timeSpent'] < 0.5).sum() / len(filtered) * 100

# 6. Top 10 FRAG
frag_only = filtered[filtered['timeType'] == 'FRAG']
top10 = (frag_only.groupby('subcategory_name')['timeSpent']
         .agg(['sum', 'count'])
         .sort_values('sum', ascending=False)
         .head(10))

# 7. Consommation sites
sites = (filtered.groupby('equipment_parent_name')
         .agg(totalHours=('timeSpent', 'sum'),
              fragHours=('timeSpent', lambda x: x[filtered['timeType'] == 'FRAG'].sum()))
         .sort_values('fragHours', ascending=False))
```

---

## 📋 Résumé pratique

| Calcul | Quoi ? | Pourquoi ? | Comment ? |
|--------|--------|-----------|----------|
| #1 | Filtrer dates | Analyser période spécifique | Filter par date |
| #2 | Classifier | Comprendre types de temps | Appliquer règles métier |
| #3 | Agréger | Voir répartition | Sum par type |
| #4 | Charge % | Savoir si débordé | total/capacité × 100 |
| #5 | Actions courtes % | Détecter dispersion | Count < 0.5h / total |
| #6 | Top 10 FRAG | Identifier problèmes | Group/sort/limit |
| #7 | Sites | Allouer ressources | Group/sum par site |
| #8 | Couleurs | Décider rapidement | Apply thresholds |

---

## 🎯 Conclusion

Ces 8 calculs transforment **5000 données brutes** en **4 indicateurs clés** :

1. **Charge** 🟢 : Service OK ?
2. **Fragmentation** 🟠 : Équipe dispersée ?
3. **Pilotage** 🟢 : Peut s'améliorer ?
4. **Top 10 causes** : Par où commencer ?

**Avec ce document, vous pouvez** :
- ✅ Comprendre chaque calcul en détail
- ✅ Reproduire les calculs (JS, SQL, Python)
- ✅ Implémenter vous-même
- ✅ Adapter pour d'autres besoins
- ✅ Optimiser (index DB, cache, etc.)

**Les intérêts** : Décision rapide, identification de problèmes, planification, suivi.
