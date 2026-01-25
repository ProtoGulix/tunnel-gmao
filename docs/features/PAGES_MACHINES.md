# Pages Machines : Analyse complète du pilotage parc

## 🎯 Qu'est-ce que les pages Machines ?

Deux pages complémentaires pour piloter le parc d'équipements :

### **MachineList** : Vue d'ensemble du parc
- **Toutes les machines** avec leurs interventions ouvertes
- **Statistiques globales** : combien opérationnelles, en maintenance, critiques ?
- **Priorisation automatique** : machines avec interventions en haut, reste en bas
- **Auto-refresh 5s** : mise à jour en temps réel sans recharger

### **MachineDetail** : Pilotage opérationnel d'une machine
- **Interventions décisionnelles** : ouvertes + clôturées < 30 jours
- **Temps passé** : bilan période (30 jours par défaut)
- **Demandes d'achat** : liées aux interventions de cette machine
- **Suggestions préventif** : Top 5 actions pour éviter récurrence

**Objectif commun** : Répondre à "Quelles actions dois-je prendre ?" en < 30 secondes.

---

## 📊 Page 1 : MachineList - Vue d'ensemble du parc

### Les données brutes

L'API fournit la liste des machines avec leurs statistiques :

```javascript
{
  id: "machine-123",
  code: "M50",
  name: "Tour CN",
  status: "warning",                    // ok | maintenance | warning | critical
  statusColor: "orange",
  openInterventionsCount: 3,            // Nombre interventions ouvertes
  interventionsByType: {
    CUR: 2,                             // 2 curatives
    PRE: 1                              // 1 préventive
  },
  parent: {
    id: "equip-1",
    code: "SITE-A",
    name: "Site A"
  },
  zone: {
    id: "zone-1",
    name: "Atelier mécanique"
  },
  workshop: {
    id: "workshop-1",
    name: "Production"
  }
}
```

---

### Les 6 opérations de MachineList

#### Opération #1 : Chargement avec auto-refresh

**Quoi ?**  
Charger toutes les machines + rafraîchir toutes les 5 secondes en arrière-plan.

**Pourquoi c'est utile ?**  
Voir en temps réel les changements (nouvelle intervention, clôture, changement statut).

**Comment ça marche ?**

```javascript
// Chargement initial
const { 
  data: machines, 
  loading, 
  error, 
  execute: refetchMachines,           // Refresh visible (loading = true)
  executeSilent: backgroundRefetchMachines  // Refresh silencieux
} = useApiCall(fetchMachinesWithInterventions);

// Auto-refresh toutes les 5 secondes
useAutoRefresh(backgroundRefetchMachines, 5, true);

// Au bout de 5s, les données se mettent à jour sans spinner
```

**Résultat** :
- ✅ Première vue : Loading spinner
- ✅ Après 5s, 10s, 15s... : Mise à jour silencieuse (pas de flicker)
- ✅ Si nouvelle intervention → apparaît automatiquement

---

#### Opération #2 : Recherche multi-champs

**Quoi ?**  
Filtrer les machines par code, nom, équipement parent, zone ou atelier.

**Pourquoi c'est utile ?**  
Trouver rapidement "M50", "Tour", "Site A", etc.

**Comment ça marche ?**

```javascript
const [searchTerm, setSearchTerm] = useState("");

// Filtrage
const filtered = machines.filter(machine =>
  machine.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  machine.parent?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  machine.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  machine.workshop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
);

// Exemples :
// searchTerm = "M50" → Machine M50
// searchTerm = "Tour" → Toutes les machines contenant "Tour"
// searchTerm = "Site A" → Toutes machines de l'équipement parent Site A
// searchTerm = "Atelier" → Toutes machines de la zone "Atelier mécanique"
```

**Intérêt** :
- ✅ Recherche flexible (plusieurs champs)
- ✅ Insensible à la casse
- ✅ Instantané (pas d'appel API)

---

#### Opération #3 : Priorisation automatique

**Quoi ?**  
Séparer machines avec interventions ouvertes vs reste du parc + trier par criticité.

**Pourquoi c'est utile ?**  
Voir immédiatement où agir : les machines à problème en haut, le reste en bas.

**Comment ça marche ?**

```javascript
// 1. Séparer en 2 groupes
const withInterventions = filtered.filter(m => m.openInterventionsCount > 0);
const withoutInterventions = filtered.filter(m => m.openInterventionsCount === 0);

// 2. Trier groupe "avec interventions" par criticité
const statusOrder = { 
  critical: 0,    // Rouge = plus urgent
  warning: 1,     // Orange
  ok: 2,          // Vert
  maintenance: 3  // Bleu
};

withInterventions.sort((a, b) => {
  const orderA = statusOrder[a.status] ?? 4;
  const orderB = statusOrder[b.status] ?? 4;
  return orderA - orderB;
});

// 3. Concaténer : urgent d'abord, reste après
const prioritized = [...withInterventions, ...withoutInterventions];

// Résultat :
// [
//   { code: "M10", status: "critical", openInterventionsCount: 5 },  ← En haut
//   { code: "M50", status: "warning", openInterventionsCount: 3 },
//   { code: "M20", status: "ok", openInterventionsCount: 0 },        ← En bas
//   { code: "M30", status: "ok", openInterventionsCount: 0 }
// ]
```

**Intérêt** :
- ✅ Priorisation visuelle automatique
- ✅ Critiques d'abord → action immédiate
- ✅ Machines sans intervention en bas → pas urgent

---

#### Opération #4 : Calcul statistiques globales

**Quoi ?**  
Calculer totaux et pourcentages par statut.

**Pourquoi c'est utile ?**  
Vue synthétique de la santé du parc : "5% critiques, 85% opérationnelles".

**Comment ça marche ?**

```javascript
const stats = {
  total: machines.length,
  // Compter par statut
  ok: machines.filter(m => m.status === "ok").length,
  maintenance: machines.filter(m => m.status === "maintenance").length,
  warning: machines.filter(m => m.status === "warning").length,
  critical: machines.filter(m => m.status === "critical").length,
  // Total interventions ouvertes
  totalOpenInterventions: machines.reduce(
    (sum, m) => sum + (m.openInterventionsCount || 0), 
    0
  )
};

// Exemple parc de 100 machines :
// {
//   total: 100,
//   ok: 85,              ← 85%
//   maintenance: 5,      ← 5%
//   warning: 8,          ← 8%
//   critical: 2,         ← 2%
//   totalOpenInterventions: 25
// }

// Calcul pourcentages
const percentOk = (stats.ok / stats.total) * 100;        // 85%
const percentWarning = (stats.warning / stats.total) * 100;  // 8%
const percentCritical = (stats.critical / stats.total) * 100; // 2%
```

**Intérêt** :
- ✅ Vue santé globale du parc
- ✅ Identifier tendances (beaucoup de warning → anticiper)
- ✅ Benchmarking : "Notre parc = 85% OK, objectif 90%"

---

#### Opération #5 : Affichage deux tableaux séparés

**Quoi ?**  
Séparer l'affichage en 2 sections :
1. **Machines avec interventions ouvertes** (badge rouge avec nombre)
2. **Reste du parc** (badge gris avec nombre)

**Pourquoi c'est utile ?**  
Focalisation immédiate sur les machines nécessitant action.

**Comment ça marche ?**

```javascript
// Section 1 : Machines avec interventions
<InteractiveTable
  title="Machines avec interventions ouvertes"
  badge={<Badge color="red">{withInterventions.length}</Badge>}
  data={withInterventions}
  // Style spécial : bordure colorée selon criticité + fond ambré
  getRowStyle={(machine) => ({
    borderLeft: `4px solid var(--${STATUS_COLORS[machine.status]}-9)`,
    backgroundColor: "var(--amber-1)"
  })}
/>

// Section 2 : Reste du parc
<InteractiveTable
  title="Reste du parc"
  badge={<Badge color="gray">{withoutInterventions.length}</Badge>}
  data={withoutInterventions}
  // Style neutre : bordure grise + opacité réduite
  getRowStyle={(machine) => ({
    borderLeft: "4px solid var(--gray-6)",
    opacity: 0.85
  })}
/>
```

**Affichage visuel** :
```
┌─────────────────────────────────────────────────┐
│ Machines avec interventions ouvertes      [15]  │ ← Badge rouge
├─────────────────────────────────────────────────┤
│ 🔴 M10 | Site A | Critical | CUR: 5            │ ← Bordure rouge + fond ambré
│ 🟠 M50 | Site B | Warning  | CUR: 2, PRE: 1    │ ← Bordure orange + fond ambré
│ ...                                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Reste du parc                              [85] │ ← Badge gris
├─────────────────────────────────────────────────┤
│ 🟢 M20 | Site A | OK       | —                  │ ← Bordure grise + opacité
│ 🟢 M30 | Site C | OK       | —                  │
│ ...                                             │
└─────────────────────────────────────────────────┘
```

**Intérêt** :
- ✅ Séparation claire urgent / non-urgent
- ✅ Focus visuel (couleurs vives en haut)
- ✅ Pas besoin de scroller pour voir problèmes

---

#### Opération #6 : Navigation intelligente

**Quoi ?**  
Cliquer sur une machine → ouvre la page de détail (`/machines/{id}`).

**Pourquoi c'est utile ?**  
Accès rapide aux interventions, historique, actions recommandées.

**Comment ça marche ?**

```javascript
const handleOpenMachine = useCallback((machine) => {
  navigate(`/machines/${machine.id}`);
}, [navigate]);

// Clic sur ligne M50 → Navigue vers /machines/machine-123
// → Affiche page MachineDetail avec toutes les données
```

**Intérêt** :
- ✅ Navigation intuitive (clic = détail)
- ✅ Pas besoin de chercher bouton "Voir"
- ✅ Toute la ligne est cliquable

---

## 📊 Page 2 : MachineDetail - Pilotage opérationnel

### Les données brutes

L'API fournit les données complètes de la machine :

```javascript
// Machine
{
  id: "machine-123",
  code: "M50",
  name: "Tour CN",
  status: "warning",
  parent: { code: "SITE-A", name: "Site A" },
  zone: { name: "Atelier mécanique" }
}

// Interventions liées
[
  {
    id: "int-1",
    code: "INT-2024-045",
    title: "Fuite hydraulique",
    status: "open",              // open | in_progress | closed
    priority: "urgent",
    reported_date: "2024-01-15",
    closed_date: null,
    actions: [
      {
        id: "act-1",
        description: "Diagnostic initial",
        timeSpent: 1.5,          // Heures
        createdAt: "2024-01-15"
      }
    ]
  }
]

// Actions (toutes confondues)
[
  {
    id: "act-1",
    intervention_id: "int-1",
    timeSpent: 1.5,
    createdAt: "2024-01-15"
  }
]

// Demandes d'achat (toutes)
[
  {
    id: "req-1",
    intervention_id: "int-1",    // Lié à intervention M50
    itemLabel: "Joint hydraulique DN50",
    quantity: 2,
    status: "open"
  }
]
```

---

### Les 7 opérations de MachineDetail

#### Opération #1 : Filtrage interventions décisionnelles

**Quoi ?**  
Garder uniquement :
- **Interventions ouvertes** (status = open | in_progress)
- **Interventions clôturées < 30 jours** (closed_date récent)

**Pourquoi c'est utile ?**  
Afficher seulement ce qui impacte les décisions actuelles. Pas d'historique inutile.

**Comment ça marche ?**

```javascript
const filterDecisionalInterventions = (interventions) => {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(Date.now() - thirtyDaysMs);
  
  return interventions.filter(intervention => {
    // 1. Si ouverte → garder
    if (intervention.status === 'open' || intervention.status === 'in_progress') {
      return true;
    }
    
    // 2. Si clôturée → vérifier date
    if (intervention.closed_date) {
      const closedDate = new Date(intervention.closed_date);
      return closedDate >= thirtyDaysAgo;
    }
    
    // 3. Fallback : si reported_date récent
    if (intervention.reported_date) {
      const reportedDate = new Date(intervention.reported_date);
      return reportedDate >= thirtyDaysAgo;
    }
    
    return false;
  });
};

// Exemple :
// Aujourd'hui = 15 février 2024
// 
// INT-045 : open, 15 janvier → ✅ Garder (ouverte)
// INT-040 : closed, 10 février → ✅ Garder (< 30j)
// INT-030 : closed, 10 décembre → ❌ Exclure (> 30j)
```

**Intérêt** :
- ✅ Focus sur contexte récent
- ✅ Évite surcharge informations anciennes
- ✅ Voir si intervention clôturée = vraiment résolue

---

#### Opération #2 : Calcul temps passé période

**Quoi ?**  
Calculer combien d'heures ont été consacrées à cette machine sur une période (30 jours par défaut).

**Pourquoi c'est utile ?**  
Détecter dérive : "Machine normalement 5h/mois, là 25h → problème récurrent".

**Comment ça marche ?**

```javascript
const getTimeSpentInPeriod = (actions, periodMs) => {
  const periodStart = new Date(Date.now() - periodMs);
  
  return actions.reduce((total, action) => {
    // Date création action
    const createdAt = action.createdAt || action.created_at;
    if (!createdAt) return total;
    
    const actionDate = new Date(createdAt);
    
    // Si dans la période → additionner
    if (actionDate >= periodStart) {
      const timeSpent = parseFloat(action.timeSpent || action.time_spent || 0);
      return total + timeSpent;
    }
    
    return total;
  }, 0);
};

// Exemple :
// Aujourd'hui = 15 février 2024
// Period = 30 jours (depuis 15 janvier)
//
// Actions :
// - 20 janvier : 1.5h → ✅ Dans période
// - 25 janvier : 2.0h → ✅ Dans période
// - 10 février : 3.5h → ✅ Dans période
// - 10 décembre : 5.0h → ❌ Hors période
//
// Total période = 1.5 + 2.0 + 3.5 = 7.0 heures
```

**Conversion minutes** :
```javascript
const timeSpentLast30Days = getTimeSpentInPeriod(actions, 30 * 24 * 60 * 60 * 1000);
// 7.0 heures

const timeInMinutes = timeSpentLast30Days * 60;
// 420 minutes
```

**Intérêt** :
- ✅ Comparer vs historique (7h/mois vs moyenne 3h)
- ✅ Identifier machines chronophages
- ✅ Justifier investissement (remplacement, amélioration)

---

#### Opération #3 : Filtrage demandes d'achat liées

**Quoi ?**  
Extraire les demandes d'achat liées aux interventions de cette machine.

**Pourquoi c'est utile ?**  
Voir si on achète souvent la même pièce → standardiser stock ou revoir conception.

**Comment ça marche ?**

```javascript
const getMachineRequests = (allRequests, machineInterventions) => {
  // 1. Extraire IDs interventions de la machine
  const interventionIds = new Set(
    machineInterventions.map(i => i.id)
  );
  
  // 2. Filtrer demandes liées à ces interventions
  return allRequests.filter(req => 
    interventionIds.has(req.intervention_id)
  );
};

// Exemple :
// Machine M50 a 3 interventions : INT-045, INT-046, INT-047
//
// Demandes d'achat totales (toutes machines) :
// [
//   { id: "req-1", intervention_id: "INT-045", itemLabel: "Joint DN50" },
//   { id: "req-2", intervention_id: "INT-999", itemLabel: "Roulement" },
//   { id: "req-3", intervention_id: "INT-046", itemLabel: "Joint DN50" }
// ]
//
// Résultat filtré (M50 uniquement) :
// [
//   { id: "req-1", intervention_id: "INT-045", itemLabel: "Joint DN50" },
//   { id: "req-3", intervention_id: "INT-046", itemLabel: "Joint DN50" }
// ]
//
// → Observation : Joint DN50 demandé 2× → Stocker ?
```

**Intérêt** :
- ✅ Identifier pièces récurrentes
- ✅ Décider standardisation stock
- ✅ Remettre en cause conception (pourquoi cette pièce casse souvent ?)

---

#### Opération #4 : Détection alerte urgente

**Quoi ?**  
Vérifier si une intervention ouverte est marquée "urgent".

**Pourquoi c'est utile ?**  
Afficher alerte critique en haut de page → action immédiate requise.

**Comment ça marche ?**

```javascript
const hasUrgentAlert = (interventions) => {
  return interventions.some(i => 
    i.priority?.toLowerCase() === 'urgent'
  );
};

// Exemple :
// Interventions décisionnelles :
// [
//   { id: "int-1", priority: "normal" },
//   { id: "int-2", priority: "urgent" },  ← Trouvé !
//   { id: "int-3", priority: "normal" }
// ]
//
// hasUrgentAlert() → true
//
// → Affiche :
// ┌────────────────────────────────────────────┐
// │ ⚠️ ATTENTION : Intervention urgente        │
// │ Une intervention marquée urgente requiert  │
// │ une action immédiate.                      │
// └────────────────────────────────────────────┘
```

**Intérêt** :
- ✅ Impossible de manquer intervention urgente
- ✅ Priorisation visuelle (rouge, en haut)
- ✅ Décision claire : traiter maintenant

---

#### Opération #5 : Calcul statut global machine

**Quoi ?**  
Déterminer statut d'affichage : "critical" si urgent, sinon "ok".

**Pourquoi c'est utile ?**  
Couleur du header de page reflète urgence.

**Comment ça marche ?**

```javascript
const urgentAlert = hasUrgentAlert(decisionalInterventions);

const globalStatus = urgentAlert ? "critical" : "ok";

const STATUS_LABELS = {
  ok: { 
    label: "Opérationnelle", 
    color: "green", 
    Icon: CheckCircle2 
  },
  critical: { 
    label: "Critique", 
    color: "red", 
    Icon: AlertOctagon 
  }
};

const statusConfig = STATUS_LABELS[globalStatus];

// Exemple :
// urgentAlert = true
// → globalStatus = "critical"
// → statusConfig = { label: "Critique", color: "red", Icon: AlertOctagon }
//
// Header affiche :
// 🔴 M50 - Tour CN | État : Critique
```

**Intérêt** :
- ✅ Cohérence visuelle (rouge = urgent)
- ✅ Identification rapide situation
- ✅ Alignement liste/détail (même couleur)

---

#### Opération #6 : Construction statistiques header

**Quoi ?**  
Préparer les données à afficher dans le header de page.

**Pourquoi c'est utile ?**  
Vue synthétique immédiate sans scroller.

**Comment ça marche ?**

```javascript
const headerProps = {
  title: machine.code,                    // "M50"
  subtitle: machine.name,                 // "Tour CN"
  icon: statusConfig.Icon,                // AlertOctagon ou CheckCircle2
  
  stats: [
    { 
      label: "État", 
      value: statusConfig.label,          // "Critique" ou "Opérationnelle"
      color: statusConfig.color           // "red" ou "green"
    },
    { 
      label: "Interventions décisionnelles", 
      value: decisionalInterventions.length  // 5
    }
  ],
  
  actions: [
    {
      label: "Retour aux machines",
      onClick: () => navigate("/machines"),
      icon: ArrowLeft
    }
  ],
  
  onRefresh: reload  // Recharger données
};

// Affichage :
// ┌────────────────────────────────────────────────────────┐
// │ 🔴 M50                                    [↻] [←Retour] │
// │ Tour CN                                                 │
// │ État: Critique | Interventions décisionnelles: 5        │
// └────────────────────────────────────────────────────────┘
```

**Intérêt** :
- ✅ Info clé sans scroller
- ✅ Actions rapides (refresh, retour)
- ✅ Contexte clair (code + nom + statut)

---

#### Opération #7 : Organisation 4 blocs décisionnels

**Quoi ?**  
Afficher les informations dans un ordre stratégique de décision.

**Pourquoi c'est utile ?**  
Lecture top-down : urgent → détail → prévention.

**Comment ça marche ?**

**Ordre d'affichage** :
```
1. ALERTE URGENTE (si applicable)
   → Intervention priorité "urgent" détectée
   
2. INFORMATIONS GÉNÉRALES
   → Code, nom, zone, atelier, équipement parent
   
3. INTERVENTIONS DÉCISIONNELLES
   → Table : ouvertes + clôturées < 30j
   → Colonnes : code, titre, statut, priorité, actions
   
4. TEMPS PASSÉ PÉRIODE
   → 7h sur 30 derniers jours
   → Comparaison vs historique (si disponible)
   
5. DEMANDES D'ACHAT
   → Si au moins 1 demande liée
   → Table : article, quantité, statut
   
6. SUGGESTIONS PRÉVENTIF
   → Top 5 actions recommandées
   → Pour éviter récurrence pannes
```

**Exemple visuel** :
```
┌────────────────────────────────────────────────┐
│ M50 - Tour CN                                  │
│ État: Critique | Interventions: 5              │
├────────────────────────────────────────────────┤
│ ⚠️ ALERTE: Intervention urgente                │ ← Bloc 1
├────────────────────────────────────────────────┤
│ 📋 Code: M50 | Zone: Atelier | Parent: Site A │ ← Bloc 2
├────────────────────────────────────────────────┤
│ 📝 Interventions décisionnelles (5)            │ ← Bloc 3
│ ┌──────────────────────────────────────────┐  │
│ │ INT-045 | Fuite hydraulique | Ouvert     │  │
│ │ INT-046 | Bruit anormal | En cours       │  │
│ └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│ ⏱️ Temps passé (30 derniers jours): 7.0h      │ ← Bloc 4
│ vs historique moyen: 3.5h → Dérive 2×        │
├────────────────────────────────────────────────┤
│ 🛒 Demandes d'achat liées (2)                  │ ← Bloc 5
│ ┌──────────────────────────────────────────┐  │
│ │ Joint DN50 × 2 | Ouvert                  │  │
│ │ Joint DN50 × 1 | En cours                │  │ → Récurrence !
│ └──────────────────────────────────────────┘  │
├────────────────────────────────────────────────┤
│ 💡 Suggestions préventif (Top 5)               │ ← Bloc 6
│ 1. Révision circuit hydraulique                │
│ 2. Graissage roulements                        │
│ 3. Vérification alignement                     │
└────────────────────────────────────────────────┘
```

**Intérêt** :
- ✅ Lecture hiérarchique : urgent d'abord
- ✅ Pas besoin de deviner où chercher
- ✅ Chaque bloc = décision claire

---

## 💡 Cas d'usage réels

### Scénario 1 : Triage quotidien (MachineList)

**Situation** : Responsable maintenance arrive le matin.

**Action** :
1. Ouvre `/machines`
2. Voit :
   ```
   Machines avec interventions ouvertes [8]
   🔴 M10 - Compresseur | Critical | CUR: 3
   🟠 M50 - Tour CN     | Warning  | CUR: 2, PRE: 1
   🟠 M22 - Fraiseuse   | Warning  | CUR: 1
   ...
   ```
3. **Décision** : Traiter M10 d'abord (critique)
4. Clic sur M10 → Page détail

**Temps** : 10 secondes

---

### Scénario 2 : Investigation machine problématique (MachineDetail)

**Situation** : Machine M50 a 3 interventions ouvertes.

**Action** :
1. Clic sur M50 dans liste
2. Page détail affiche :
   ```
   ⚠️ ALERTE: Intervention urgente INT-046
   
   Interventions décisionnelles (3)
   - INT-045 : Fuite hydraulique (ouvert, 5 jours)
   - INT-046 : Bruit roulement (urgent, 1 jour)
   - INT-047 : Vibration (en cours, 3 jours)
   
   Temps passé 30 jours : 12.5h (vs moyen 4h)
   → Dérive 3× historique
   
   Demandes d'achat (2)
   - Joint DN50 × 2 (INT-045)
   - Joint DN50 × 1 (INT-047)
   → Récurrence détectée !
   
   Suggestions préventif (5)
   1. Révision complète circuit hydraulique
   2. Remplacement préventif joints DN50
   3. Contrôle alignement arbre
   ```

3. **Décisions prises** :
   - ✅ Traiter INT-046 (urgent) immédiatement
   - ✅ Standardiser Joint DN50 en stock
   - ✅ Planifier révision hydraulique
   - ✅ Vérifier si remplacement machine nécessaire (12.5h en 30j = trop)

**Temps** : 2 minutes

---

### Scénario 3 : Audit parc mensuel (MachineList)

**Situation** : Fin de mois, bilan santé parc.

**Action** :
1. Ouvre `/machines`
2. Regarde statistiques header :
   ```
   100 machines
   85.00% opérationnel
   
   Stats :
   - Interventions ouvertes : 25
   - % Attention : 8.00%
   - % Critique : 2.00%
   ```

3. **Analyse** :
   - 85% OK = bon (objectif 90%)
   - 2% critique = 2 machines → identifier lesquelles
   - 8% attention = 8 machines → surveiller

4. Recherche `critical` dans filtres → Voit M10 et M15

5. **Décisions** :
   - ✅ Focus M10 et M15
   - ✅ Anticiper passage 8 machines "warning" vers critique
   - ✅ Rapport mensuel : 85% santé, 25 interventions

**Temps** : 5 minutes

---

## 📊 Récapitulatif opérations

### MachineList (6 opérations)

| # | Opération | Entrée | Sortie | Intérêt |
|---|-----------|--------|--------|---------|
| 1 | Auto-refresh 5s | API machines | Données fraîches | Temps réel |
| 2 | Recherche multi-champs | texte | machines filtrées | Trouver rapidement |
| 3 | Priorisation | machines | urgent d'abord | Focus problèmes |
| 4 | Stats globales | machines | %, totaux | Santé parc |
| 5 | Deux tableaux | machines | séparation visuelle | Clarté |
| 6 | Navigation | clic | page détail | Drill-down |

### MachineDetail (7 opérations)

| # | Opération | Entrée | Sortie | Intérêt |
|---|-----------|--------|--------|---------|
| 1 | Filtre interventions | interventions | décisionnelles | Focus récent |
| 2 | Temps passé période | actions | heures | Détecter dérive |
| 3 | Demandes liées | requests | machine only | Récurrence pièces |
| 4 | Alerte urgent | interventions | bool | Ne pas manquer |
| 5 | Statut global | urgent? | critical/ok | Couleur page |
| 6 | Stats header | data | props | Vue synthèse |
| 7 | 4 blocs | data | layout | Lecture structurée |

---

## 🔧 Optimisations techniques

### MachineList

**Problème** : 100+ machines → liste lourde

**Solutions** :
```javascript
// 1. Virtualisation (react-window) si > 200 machines
import { FixedSizeList } from 'react-window';

// 2. Pagination (50 par page)
const paginated = machines.slice(page * 50, (page + 1) * 50);

// 3. Filtrage côté serveur (si API supporte)
const filtered = await machines.fetchMachines({ 
  status: 'critical',
  hasOpenInterventions: true 
});

// 4. Mémorisation calculs
const stats = useMemo(
  () => calculateStats(machines),
  [machines]
);

// 5. Debounce recherche (300ms)
const debouncedSearch = useDebounce(searchTerm, 300);
```

### MachineDetail

**Problème** : Chargement multiple (machine + interventions + actions + requests)

**Solutions** :
```javascript
// 1. Hook custom qui charge tout en parallèle
const useMachineData = (id) => {
  const [machine, setMachine] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [actions, setActions] = useState([]);
  
  useEffect(() => {
    // Lancer 3 requêtes en parallèle
    Promise.all([
      machines.fetchMachine(id),
      interventions.fetchInterventions(id),
      actions.fetchActions(id)
    ]).then(([m, i, a]) => {
      setMachine(m);
      setInterventions(i);
      setActions(a);
    });
  }, [id]);
};

// 2. Cache local (react-query)
const { data: machine } = useQuery(['machine', id], () => 
  machines.fetchMachine(id),
  { staleTime: 60000 }  // Cache 1 minute
);

// 3. Suspense boundaries
<Suspense fallback={<LoadingState />}>
  <MachineDetail />
</Suspense>
```

---

## 🎯 Conclusion

### MachineList : Vue d'ensemble
- **Objectif** : Prioriser actions maintenance
- **Méthode** : Auto-refresh + priorisation + stats
- **Résultat** : Savoir où agir en < 10s

### MachineDetail : Pilotage opérationnel
- **Objectif** : Décider actions concrètes
- **Méthode** : 4 blocs décisionnels (urgent → préventif)
- **Résultat** : Plan d'action clair en < 2 min

**Ensemble** :
- ✅ Triage quotidien rapide (MachineList)
- ✅ Investigation approfondie (MachineDetail)
- ✅ Décisions factuelles (données, pas intuition)
- ✅ Prévention (suggestions préventif)
- ✅ Optimisation (temps passé, récurrence pièces)

**Avec ces deux pages, vous pouvez** :
- Identifier machines à problème (liste)
- Comprendre causes (détail)
- Prendre décisions (interventions)
- Anticiper pannes (préventif)
- Justifier investissements (temps passé)
