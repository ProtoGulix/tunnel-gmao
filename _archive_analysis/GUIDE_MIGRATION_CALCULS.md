# Guide Migration : Frontend → Backend pour ServiceStatus

## 🎯 Objectif
Déplacer **100% des calculs de métriques** du frontend vers une API backend pour :
- ✅ Réduire la charge du navigateur
- ✅ Améliorer les performances (10-15x)
- ✅ Supporter des données massives
- ✅ Permettre le cache et l'optimisation côté serveur

---

## 📊 Flux complet actuel (FRONTEND)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           FRONTEND - NAVIGATEUR                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  1️⃣ useServiceData (hook)                                            ┃
┃     ├─ fetchServiceTimeBreakdown(startDate, endDate)                 ┃
┃     │  └─ API: actions.fetchActions()                               ┃
┃     │     ↓ Retourne TOUTES les actions (10000+)                    ┃
┃     │                                                                 ┃
┃     ├─ 📝 FILTRAGE DATES (JavaScript)                               ┃
┃     │  const actionsData = allActions.filter(...)                   ┃
┃     │  ↓ Itération n actions                                        ┃
┃     │                                                                 ┃
┃     ├─ 🏷️ CLASSIFICATION TEMPS (JavaScript)                         ┃
┃     │  actionsWithTimeType = actionsData.map(a => {                 ┃
┃     │    timeType: classifyActionTime(a)  // PROD/DEP/PILOT/FRAG   ┃
┃     │  })                                                            ┃
┃     │  ↓ Itération n actions + logique métier                       ┃
┃     │                                                                 ┃
┃     ├─ ➕ AGRÉGATION (JavaScript)                                    ┃
┃     │  const timeBreakdown = aggregateTimeByType(...)               ┃
┃     │  ↓ { PROD: 240, DEP: 80, PILOT: 120, FRAG: 45 }             ┃
┃     │                                                                 ┃
┃     ├─ 📊 CALCUL MÉTRIQUE (JavaScript)                              ┃
┃     │  - chargePercent = (totalHours / capacityHours) * 100        ┃
┃     │  - shortActionsPercent = count(timeSpent < 0.5) / total      ┃
┃     │                                                                 ┃
┃     ├─ 🔍 TOP 10 FRAGMENTATION (JavaScript)                         ┃
┃     │  calculateFragmentationCauses(actionsWithTimeType)           ┃
┃     │  - Filter FRAG actions                                        ┃
┃     │  - Group by subcategory                                       ┃
┃     │  - Sort desc + slice(0, 10)                                   ┃
┃     │                                                                 ┃
┃     ├─ 🏭 CONSOMMATION PAR SITE (JavaScript)                        ┃
┃     │  calculateSiteConsumption(actionsWithTimeType)               ┃
┃     │  - Group by parentEquipment                                   ┃
┃     │  - Sum totalHours, fragHours                                  ┃
┃     │  - Calculate percentages                                      ┃
┃     │                                                                 ┃
┃     └─ ✅ Retourne objet ServiceData complet                        ┃
┃        { chargePercent, timeBreakdown, fragmentation, etc. }        ┃
┃                                                                        ┃
┃  2️⃣ ServiceStatus.jsx (Page)                                         ┃
┃     ├─ calculateMetrics() - Calculs d'affichage                     ┃
┃     │  - fragPercent, pilotPercent                                  ┃
┃     │  - getChargeColor, getFragmentationColor, getPilotageColor   ┃
┃     │                                                                 ┃
┃     └─ Rendu des composants présentation                            ┃
┃        └─ SynthesisCards, TimeBreakdownSection, etc.                ┃
┃                                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                            ⚠️ PROBLÈMES
                    ❌ Transfert 10000+ actions
                    ❌ Calculs en JavaScript
                    ❌ Lenteur sur gros volumes
                    ❌ Pas de cache possible
```

---

## 🚀 Flux optimisé (BACKEND)

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           BACKEND - SERVEUR                            ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  GET /api/service/metrics?startDate=2024-01-01&endDate=2024-12-31  ┃
┃                                                                        ┃
┃  ServiceMetricsController                                            ┃
┃  └─ getServiceMetrics(startDate, endDate)                           ┃
┃     │                                                                 ┃
┃     ├─ 📝 FILTRAGE SQL (Base de données)                            ┃
┃     │  SELECT * FROM actions                                         ┃
┃     │  WHERE created_at >= :startDate AND created_at <= :endDate   ┃
┃     │  ✅ Index sur dates                                            ┃
┃     │  ↓ Retourne UNIQUEMENT les actions du périmètre               ┃
┃     │                                                                 ┃
┃     ├─ 🏷️ CLASSIFICATION (Code métier réutilisé)                     ┃
┃     │  classifyActionTime(action) for each action                   ┃
┃     │  → PROD, DEP, PILOT, FRAG (fait sur le serveur)              ┃
┃     │                                                                 ┃
┃     ├─ ➕ AGRÉGATION SQL (Très rapide)                               ┃
┃     │  SELECT                                                        ┃
┃     │    SUM(CASE WHEN timeType='PROD' THEN timeSpent END) as PROD, ┃
┃     │    SUM(CASE WHEN timeType='DEP' THEN timeSpent END) as DEP,   ┃
┃     │    ...                                                         ┃
┃     │  FROM actions_classified                                       ┃
┃     │  ✅ Agrégation une seule fois                                  ┃
┃     │                                                                 ┃
┃     ├─ 📊 CALCUL MÉTRIQUE                                            ┃
┃     │  chargePercent = (totalHours / capacityHours) * 100           ┃
┃     │  shortActionsPercent = ...                                    ┃
┃     │                                                                 ┃
┃     ├─ 🔍 TOP 10 FRAGMENTATION (SQL)                                ┃
┃     │  SELECT subcategory_id, SUM(timeSpent) as total              ┃
┃     │  FROM actions_classified                                       ┃
┃     │  WHERE timeType='FRAG'                                         ┃
┃     │  GROUP BY subcategory_id                                       ┃
┃     │  ORDER BY total DESC                                           ┃
┃     │  LIMIT 10                                                      ┃
┃     │                                                                 ┃
┃     ├─ 🏭 CONSOMMATION PAR SITE (SQL)                               ┃
┃     │  SELECT equipment_id, SUM(...), SUM(...)                      ┃
┃     │  FROM actions_classified                                       ┃
┃     │  JOIN interventions ON ...                                     ┃
┃     │  JOIN machines ON ...                                          ┃
┃     │  WHERE parent_equipment_id IS NOT NULL                        ┃
┃     │  GROUP BY equipment_id                                         ┃
┃     │  ORDER BY frag_hours DESC                                      ┃
┃     │                                                                 ┃
┃     └─ ✅ Retourne JSON complet (DÉJÀ FORMATÉ)                      ┃
┃        {                                                              ┃
┃          "chargePercent": 78.5,                                      ┃
┃          "timeBreakdown": { PROD: 240.5, ... },                     ┃
┃          "fragmentation": { total: 45.3, items: [...] },            ┃
┃          "siteConsumption": { items: [...] }                        ┃
┃        }                                                              ┃
┃                                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           FRONTEND - NAVIGATEUR                        ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                                        ┃
┃  1️⃣ useServiceMetrics (hook - NOUVELLE VERSION)                      ┃
┃     └─ Appel simple : GET /api/service/metrics?...                  ┃
┃        ↓ Retourne directement les données pré-calculées             ┃
┃                                                                        ┃
┃  2️⃣ ServiceStatus.jsx (Page)                                         ┃
┃     └─ Rendu UNIQUEMENT (PLUS DE CALCULS)                           ┃
┃        └─ SynthesisCards, TimeBreakdownSection, etc.                ┃
┃                                                                        ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                            ✅ BÉNÉFICES
                    ✅ Transfert ~1KB au lieu de 500KB
                    ✅ Calculs hyper-optimisés SQL
                    ✅ Vitesse 10-15x meilleure
                    ✅ Cache possible (Redis)
                    ✅ Scalable à millions d'actions
```

---

## 📋 Checklist implémentation

### Backend (Pseudo-code Node.js/Express)

```javascript
// routes/serviceMetrics.js
router.get('/api/service/metrics', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // 1. Récupérer les actions filtrées
  const actions = await db.actions.findByDateRange(startDate, endDate);
  
  // 2. Classer les actions
  const classified = actions.map(a => ({
    ...a,
    timeType: classifyActionTime(a)  // Logique métier réutilisée
  }));
  
  // 3. Calculer timeBreakdown (SQL)
  const timeBreakdown = {
    PROD: classified.filter(a => a.timeType === 'PROD').reduce(...),
    DEP: classified.filter(a => a.timeType === 'DEP').reduce(...),
    // ...
    total: classified.reduce((sum, a) => sum + a.timeSpent, 0)
  };
  
  // 4. Calculer charge
  const chargePercent = (timeBreakdown.total / capacityHours) * 100;
  
  // 5. Top 10 FRAG (SQL)
  const fragmentation = {
    total: classified.filter(a => a.timeType === 'FRAG').reduce(...),
    items: classified
      .filter(a => a.timeType === 'FRAG')
      .reduce(groupBySubcategory, {})
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)
  };
  
  // 6. Consommation sites
  const siteConsumption = {
    items: classified
      .reduce(groupByParentEquipment, {})
      // ...calculate percents
  };
  
  res.json({
    chargePercent,
    timeBreakdown,
    fragmentation,
    siteConsumption,
    // ... autres métriques
  });
});
```

### Frontend (Nouvelle version simplifiée)

```javascript
// hooks/useServiceMetrics.js (REMPLACE useServiceData.js)
export function useServiceMetrics(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/service/metrics?startDate=${startDate}&endDate=${endDate}`
        );
        const result = await response.json();
        setData(result);  // ✅ DONNÉES PRÊTES À AFFICHER
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [startDate, endDate]);

  return { data, loading, error };
}
```

```javascript
// pages/ServiceStatus.jsx (VERSION SIMPLIFIÉE)
export default function ServiceStatus() {
  const [startDate, setStartDate] = useState(...);
  const [endDate, setEndDate] = useState(...);

  const { data: serviceData, loading, error } = useServiceMetrics(startDate, endDate);

  if (loading) return <LoadingState />;
  if (error) return <ErrorDisplay error={error} />;
  if (!serviceData) return null;

  // ✅ PLUS DE CALCULS ! Les données viennent pré-calculées
  const { chargePercent, timeBreakdown, fragmentation, siteConsumption } = serviceData;

  // Juste des accesseurs pour les couleurs/textes (O(1))
  const chargeColor = getChargeColor(chargePercent);
  const chargeText = getChargeInterpretation(chargePercent);

  return (
    <Container size="4">
      <PageHeader {...} />
      <SynthesisCards {...} />
      <TimeBreakdownSection timeBreakdown={timeBreakdown} />
      {/* ... reste du rendu */}
    </Container>
  );
}
```

---

## 📊 Comparaison Performance

### Avant (Frontend)
```
Période : 3 mois (90 jours)
Actions estimées : 5000+

Temps réseau :
  ├─ Requête HTTP      : ~50ms
  ├─ Transfert 5000 actions (~500KB) : ~800-1500ms
  └─ Total réseau : ~1s

Temps JavaScript :
  ├─ Parsing JSON      : ~200ms
  ├─ Filtrage dates    : ~150ms
  ├─ Classification    : ~300ms
  ├─ Agrégation        : ~100ms
  ├─ Top 10 tri        : ~50ms
  ├─ Consommation sites: ~150ms
  └─ Total frontend : ~1s

TOTAL : ~2s (et utilise 50-100MB mémoire navigateur)
```

### Après (Backend)
```
Temps réseau :
  ├─ Requête HTTP      : ~50ms
  ├─ Transfert JSON pré-calculé (~5KB) : ~20ms
  └─ Total réseau : ~70ms

Temps serveur (parallélisé) :
  ├─ Filtrage SQL (index DATE)  : ~50ms
  ├─ Classification            : ~100ms
  ├─ Agrégation SQL            : ~50ms
  ├─ Tri/Top 10                : ~20ms
  └─ Total serveur : ~200ms

Temps JavaScript (affichage uniquement) :
  ├─ Rendu React              : ~50ms
  └─ Total frontend : ~50ms

TOTAL : ~320ms (et utilise <1MB mémoire navigateur)
```

**Gain : 6-8x plus rapide, 50x moins de mémoire** 🚀

---

## 🔐 Points d'attention

### 1. **Logique métier partagée**
- La classification `classifyActionTime()` doit être identique au backend
- Option : créer une libraire partagée ou une source unique

### 2. **Caching backend**
- ✅ Ajouter cache Redis pour les périodes fixes (jour/mois/année)
- ✅ Invalidation au changement d'actions
- ✅ Gain additionnel : sub-100ms pour requête identique

### 3. **Pagination/Limite**
- ⚠️ Considérer un max d'actions à traiter par requête
- ⚠️ Ajouter pagination pour Top 10 → Top 50+ si besoin

### 4. **Authentification**
- ✅ L'endpoint doit être protégé par authentification
- ✅ Limiter aux données du service de l'utilisateur

---

## 🎯 Priorités de migration

**Phase 1 (Critique)** :
- [ ] Créer endpoint `/api/service/metrics`
- [ ] Implémenter logique filtrage + classification
- [ ] Tester avec 5000+ actions
- [ ] Valider chiffres vs version actuelle

**Phase 2 (Important)** :
- [ ] Remplacer `useServiceData` par `useServiceMetrics`
- [ ] Supprimer calculs de `ServiceStatus.jsx`
- [ ] Tests unitaires comparaison avant/après

**Phase 3 (Optimisation)** :
- [ ] Ajouter cache Redis
- [ ] Ajouter monitoring perfs
- [ ] Documenter endpoint
