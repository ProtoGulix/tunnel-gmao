# Tunnel Backend - Adapteur Équipements

**Date:** 2026-01-24  
**Statut:** ✅ Implémenté  
**Backend API:** tunnel-backend (FastAPI)  
**Frontend Provider:** `hybrid` mode

## Vue d'ensemble

Implémentation complète de l'adaptateur tunnel-backend pour les équipements (machines), permettant de migrer progressivement la logique métier vers le nouveau backend FastAPI tout en maintenant la compatibilité avec Directus.

### Architecture Hybrid Mode

```
Frontend (web.tunnel-gmao)
    ↓
API Facade (src/lib/api/facade.js)
    ↓
Hybrid Adapter (src/lib/api/adapters/hybrid.js)
    ├─→ tunnel-backend (/equipements, /stats) ← PORT 8000
    └─→ directus (interventions, stock, etc.) ← PORT 8055
```

## Endpoints Implémentés

### 1. Liste Simple - `GET /equipements`

**Utilisation:** `machines.fetchMachines()`

```javascript
// Appel frontend
import { machines } from '@/lib/api/facade';
const equipements = await machines.fetchMachines();
```

**Réponse normalisée:**

```typescript
Machine[] = [
  {
    id: "uuid",
    code: "M001" | undefined,
    name: "Presse hydraulique",
    location: "Atelier A" | undefined,
    parent: {
      id: "uuid",
      code: "EQM01",
      name: "Ligne de production"
    } | undefined
  }
]
```

**Mapping backend → frontend:**

- `equipement_mere` → `parent.id`
- `affectation` → `location`
- Support du champ `parent` direct (si présent)

---

### 2. Liste avec Statistiques - `GET /equipements/list`

**Utilisation:** `machines.fetchMachinesWithInterventions()`

```javascript
// Utilisé par MachineList.jsx
const equipements = await machines.fetchMachinesWithInterventions();
```

**Réponse normalisée:**

```typescript
MachineWithStats[] = [
  {
    ...Machine,
    status: "ok" | "maintenance" | "warning" | "critical",
    statusColor: "green" | "blue" | "orange" | "red",
    openInterventionsCount: 3,
    interventionsByType: {
      "CUR": 2,
      "PRE": 1
    },
    interventions: []  // Vide dans cette vue
  }
]
```

**Calculs backend:**

- `status`: urgent → critical, ≥3 ouvertes → warning, >0 → maintenance, else ok
- `open_interventions_count`: Nombre d'interventions ouvertes
- `interventions_by_type`: Comptage par type (CUR, PRE)

**Tri automatique:** Par `open_interventions_count` DESC, puis `name` ASC

---

### 3. Détail Simple - `GET /equipements/{id}`

**Utilisation:** `machines.fetchMachine(id)`

```javascript
const equipement = await machines.fetchMachine('123e4567-e89b-12d3-a456-426614174000');
```

**Réponse:** Identique à `fetchMachines()` mais pour un équipement unique.

---

### 4. Détail Décisionnel - `GET /equipements/{id}/detail`

**Utilisation:** `machines.fetchMachineDetail(id, periodDays)`

```javascript
// Utilisable par MachineDetail.jsx (futur)
const detail = await machines.fetchMachineDetail('123e4567...', 30);
```

**Query params:**

- `period_days` (default: 30) - Période pour interventions décisionnelles et temps passé

**Réponse normalisée:**

```typescript
MachineDetail = {
  ...Machine,
  status: 'critical',
  statusColor: 'red',
  parent: { id, code, name },

  // Interventions décisionnelles (ouvertes + clôturées < period_days)
  interventions: [
    {
      id: 'uuid',
      code: 'INT-2024-001',
      title: 'Fuite hydraulique',
      status: 'open' | 'in_progress' | 'closed',
      priority: 'normal' | 'urgent',
      reportedDate: '2024-01-15',
      type_inter: 'CUR' | 'PRE',
      closedDate: '2024-01-20' | null,
    },
  ],

  // Actions de la période
  actions: [
    {
      id: 'uuid',
      interventionId: 'uuid',
      timeSpent: 2.5, // heures
      createdAt: '2024-01-15T10:30:00Z',
    },
  ],

  timeSpentPeriodHours: 12.5, // Total heures période
  periodDays: 30,
};
```

**Tri interventions:** urgentes → ouvertes → en cours → clôturées (DESC reported_date)

---

### 5. Sous-Équipements - `GET /equipements/{id}/sous_equipements`

**Utilisation:** `machines.fetchSubEquipements(id)`

```javascript
const sousEquipements = await machines.fetchSubEquipements('parent-id');
```

**Réponse:** `Machine[]` - Liste des équipements enfants

---

## Mappers de Données

### mapMachine (Base)

```javascript
const mapMachine = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || undefined,
  name: raw.name || raw.code || 'Équipement',
  location: raw.affectation || undefined,
  parent: raw.parent
    ? {
        id: raw.parent.id?.toString() || '',
        code: raw.parent.code || undefined,
        name: raw.parent.name || raw.parent.code || 'Équipement',
      }
    : raw.equipement_mere
      ? { id: raw.equipement_mere.toString() }
      : undefined,
});
```

**Gestion parent:**

1. Si `raw.parent` existe (objet complet) → utiliser directement
2. Sinon si `raw.equipement_mere` (UUID seul) → créer objet minimal
3. Sinon → `undefined`

---

### mapMachineWithStats (Liste)

```javascript
const mapMachineWithStats = (raw = {}) => ({
  ...mapMachine(raw),
  status: raw.status || 'ok',
  statusColor: raw.status_color || 'green',
  openInterventionsCount: raw.open_interventions_count ?? 0,
  interventionsByType: raw.interventions_by_type || {},
  interventions: [], // Vide, stats uniquement
});
```

---

### mapDecisionalIntervention (Détail)

```javascript
const mapDecisionalIntervention = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || '',
  title: raw.title || '',
  status: mapStatus(raw.status), // Normalisation
  type: raw.type_inter || 'CUR',
  priority: raw.priority,
  reportedDate: raw.reported_date,
  closedDate: raw.closed_date,
});
```

---

### mapDecisionalAction (Détail)

```javascript
const mapDecisionalAction = (raw = {}) => ({
  id: raw.id?.toString() || '',
  interventionId: raw.intervention_id?.toString() || '',
  timeSpent: Number(raw.time_spent ?? 0),
  createdAt: raw.created_at || new Date().toISOString(),
});
```

---

## Configuration Hybrid Mode

### .env

```bash
# Provider hybride : stats + machines → tunnel-backend, reste → directus
VITE_BACKEND_PROVIDER=hybrid

# URL backend FastAPI
VITE_TUNNEL_BACKEND_URL=http://localhost:8000

# URL Directus (legacy)
VITE_DATA_API_URL=http://192.168.1.137:8055
```

### Routing dans hybrid.js

```javascript
export const adapter = {
  name: 'hybrid',

  // Directus
  interventions: directusAdapter.interventions,
  actions: directusAdapter.actions,
  stock: directusAdapter.stock,
  // ... autres namespaces

  // Tunnel-backend
  stats: tunnelBackendAdapter.stats,
  machines: tunnelBackendAdapter.machines, // ← NOUVEAU
};
```

---

## Pages Impactées

### ✅ MachineList.jsx

**Avant:** `directus.machines.fetchMachinesWithInterventions()`  
**Après:** `tunnelBackend.machines.fetchMachinesWithInterventions()`

```javascript
import { machines } from '@/lib/api/facade';

const fetchMachinesWithInterventions = () => machines.fetchMachinesWithInterventions();

const { data: machines = [], loading, error } = useApiCall(fetchMachinesWithInterventions);
```

**Bénéfices:**

- Calculs de statut côté backend (ok/warning/critical/maintenance)
- Comptage interventions par type pré-calculé
- Tri automatique par priorité (critiques en premier)
- Réduction charge frontend

---

### ⏳ MachineDetail.jsx (Futur)

**Opportunité:** Utiliser `fetchMachineDetail(id, 30)` pour remplacer les calculs locaux

```javascript
// Au lieu de:
const decisionalInterventions = useMemo(
  () => filterDecisionalInterventions(interventions),
  [interventions]
);

const timeSpentLast30Days = useMemo(
  () => getTimeSpentInPeriod(actions, 30 * 24 * 60 * 60 * 1000),
  [actions]
);

// Utiliser directement:
const detail = await machines.fetchMachineDetail(id, 30);
// → detail.interventions (déjà filtrées)
// → detail.timeSpentPeriodHours (déjà calculé)
```

**Migration:** Optionnelle, nécessite refactoring de MachineDetail.jsx

---

## Tests de Vérification

### 1. Test Liste Simple

```bash
# Terminal 1: Démarrer tunnel-backend
cd ../tunnel-backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Démarrer frontend
cd web.tunnel-gmao
npm run dev
```

**Dans le navigateur:**

1. Ouvrir DevTools → Network
2. Aller sur `/machines`
3. Vérifier requête `GET http://localhost:8000/equipements/list`
4. Confirmer réponse avec `status`, `open_interventions_count`, etc.

---

### 2. Test Détail Équipement

```javascript
// Console navigateur
import { machines } from '@/lib/api/facade';

const detail = await machines.fetchMachineDetail('votre-equipement-id', 30);
console.log(detail);

// Vérifier:
// - detail.interventions (array)
// - detail.actions (array)
// - detail.timeSpentPeriodHours (number)
```

---

### 3. Test Sous-Équipements

```javascript
const subs = await machines.fetchSubEquipements('equipement-mere-id');
console.log(subs); // Array de Machine
```

---

## Gestion des Erreurs

### Endpoint Non Disponible

Si tunnel-backend n'est pas démarré:

```javascript
// Erreur capturée par apiCall wrapper
{
  name: "APIError",
  message: "Network Error",
  statusCode: 500,
  timestamp: "2026-01-24T..."
}
```

**Comportement UI:** ErrorDisplay avec bouton Retry

---

### Réponse Invalide

```javascript
// Backend retourne { error: "Not found" }
{
  name: "APIError",
  message: "TunnelMachines.fetchMachine failed",
  statusCode: 404,
  details: { error: "Not found" }
}
```

---

## Roadmap

### ✅ Phase 1 (Actuelle)

- [x] Adaptateur tunnel-backend pour équipements
- [x] Mappers EquipementOut → Machine
- [x] Mappers EquipementListItem → MachineWithStats
- [x] Mappers EquipementDetail → MachineDetail
- [x] Routing hybrid stats + machines → tunnel-backend
- [x] Support endpoints: `/equipements`, `/equipements/list`, `/equipements/{id}`, `/equipements/{id}/detail`, `/equipements/{id}/sous_equipements`

---

### 🔄 Phase 2 (Prochaine)

- [ ] Refactoriser `useMachineData` pour utiliser `fetchMachineDetail`
- [ ] Supprimer calculs locaux dans MachineDetail.jsx (`filterDecisionalInterventions`, `getTimeSpentInPeriod`)
- [ ] Tests unitaires pour mappers équipements
- [ ] Documentation Swagger tunnel-backend

---

### 📋 Phase 3 (Future)

- [ ] Migrer interventions vers tunnel-backend
- [ ] Migrer actions vers tunnel-backend
- [ ] Supprimer dépendance directus pour équipements
- [ ] Mode 100% tunnel-backend (retirer hybrid)

---

## Notes Techniques

### Terminologie

**Backend:** "equipement" (singulier), "equipements" (pluriel)  
**Frontend:** "machine" (alias legacy, maintenu pour compatibilité)

**Mapping:**

- API: `/equipements` → `machines.fetchMachines()`
- DTO: `EquipementOut` → `Machine`
- Type: `EquipementListItem` → `MachineWithStats`

---

### Normalisation Status

**Backend → Frontend:**

- `open` → `open`
- `in_progress` → `in_progress`
- `closed` → `closed`
- `in-progress` → `in_progress` (normalisation tiret)
- Autres → `open` (défaut)

**Fonction:** `mapStatus(status)`

---

### Performance

**fetchMachinesWithInterventions:**

- Backend calcule statuts en SQL (rapide)
- Comptage interventions en une requête
- Tri côté backend (pas de tri JS côté client)

**Avant (directus):** 3 requêtes + calculs JS  
**Après (tunnel-backend):** 1 requête + réponse pré-calculée

**Gain estimé:** ~40% réduction temps chargement MachineList

---

### Sécurité

**AUTH_DISABLED:** En développement uniquement, permet de tester sans JWT

**Production:** Toutes les routes nécessiteront JWT valide

```python
# tunnel-backend
@router.get("/equipements/list")
async def list_equipements(
    current_user: User = Depends(get_current_user_or_none)
):
    # Si AUTH_DISABLED=false, current_user est obligatoire
```

---

## Références

- **Manifest API:** Voir message utilisateur (section Equipements)
- **Adapter Pattern:** [docs/tech/API_CONTRACTS.md](./API_CONTRACTS.md)
- **Hybrid Mode:** [docs/tech/OPTIMIZATIONS_SUMMARY.md](./OPTIMIZATIONS_SUMMARY.md)
- **ServiceStatus Migration:** [docs/features/CALCULS_SERVICE_STATUS.md](../features/CALCULS_SERVICE_STATUS.md)

---

**Auteur:** GitHub Copilot (Claude Sonnet 4.5)  
**Date:** 2026-01-24  
**Version:** 1.0.0
