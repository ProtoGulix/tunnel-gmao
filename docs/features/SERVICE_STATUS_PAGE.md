# Page État du Service - Documentation

## Vue d'ensemble

Page d'aide à la décision permettant d'évaluer **en moins de 30 secondes** si le service est en capacité de tenir et de progresser.

**Objectif** : Fournir une vision synthétique de la charge, fragmentation et capacité de pilotage au niveau service (pas machine).

**Route** : `/service-status`

**Icône menu** : `Activity` (Lucide React)

---

## Structure de la page

### 1. En-tête

- **Titre** : État du service
- **Sous-titre** : Charge, fragmentation, capacité réelle
- **Sélecteur de période** : QuickDateRangeSelector (défaut : 3 mois glissants)

### 2. Vue synthèse (3 KPICards)

#### Card "Charge service"

- **Valeur** : % de charge vs capacité théorique ETP
- **Colorisation automatique** :
  - Vert : < 70%
  - Orange : 70-85%
  - Rouge : > 85%
- **Texte** : "Charge normale" / "Charge élevée" / "Service au plafond"

#### Card "Fragmentation"

- **Valeur** : % du temps classé FRAG
- **Colorisation** :
  - Vert : < 15%
  - Orange : 15-25%
  - Rouge : > 25%
- **Texte** : "Fragmentation maîtrisée" / "Fragmentation élevée : service morcelé"

#### Card "Temps de pilotage"

- **Valeur** : % du temps classé PILOT
- **Colorisation** :
  - Rouge : < 15%
  - Orange : 15-25%
  - Vert : > 25%
- **Texte** : "Aucune capacité d'amélioration" / "Capacité limitée" / "Capacité présente"

### 3. Répartition du temps

**Composant** : `DistributionCards`

Affiche la répartition du temps en 4 catégories :

- **PROD** (Production) - Vert
- **DEP** (Dépannage) - Bleu
- **PILOT** (Pilotage) - Violet
- **FRAG** (Fragmentation) - Orange

**Source** : Vue `service_time_breakdown` (backend)

### 4. Analyse de la fragmentation

**Card détaillée** affichant :

- % d'actions courtes (< 0,5h)
- Badge coloré : Vert (< 20%) / Orange (20-30%) / Rouge (> 30%)
- Texte interprétatif

### 5. Règles de lecture décisionnelle

**Callout bleu** avec règles factuelles :

- **PILOT < 15%** → Aucune capacité d'amélioration
- **FRAG > 25%** → Fuite organisationnelle
- **Charge > 85%** → Service au plafond

**Aucun jugement**, uniquement des règles factuelles basées sur des seuils métier.

### 6. Alerte critique (conditionnelle)

**Callout rouge** affiché uniquement si :

- Charge > 85% OU
- Fragmentation > 25% OU
- Pilotage < 15%

Liste les problèmes détectés :

- • Service saturé
- • Fragmentation excessive
- • Pas de temps pour amélioration

---

## Architecture technique

### Fichiers créés

```
src/
├── pages/
│   └── ServiceStatus.jsx                           # Page principale
├── hooks/
│   └── useServiceData.js                          # Hook API + calculs
├── config/
│   └── serviceTimeClassification.js               # Classification PROD/DEP/PILOT/FRAG
└── components/
    └── service/
        └── ServiceStatusComponents.jsx            # Composants présentation
```

### Composants réutilisés

- `PageHeader` - En-tête standard
- `KPICard` - Cartes indicateurs avec progression
- `DistributionCards` - Répartition visuelle avec badges
- `QuickDateRangeSelector` - Sélecteur période
- `LoadingState` / `ErrorDisplay` - États standards

### Hook personnalisé

**`useServiceData(startDate, endDate)`**

Encapsule l'appel API avec gestion automatique :

- Loading state
- Error handling
- Refetch capability

### Composants de présentation

**`ServiceStatusComponents.jsx`** exporte :

- `SynthesisCards` - Bloc 3 KPICards
- `TimeBreakdownSection` - Distribution temps
- `FragmentationDetail` - Analyse fragmentation
- `DecisionGuide` - Règles de lecture
- `CriticalAlert` - Alerte conditionnelle
- `THRESHOLDS` - Seuils de colorisation

---

## Données et classification

### Classification automatique du temps

Le temps est classé automatiquement via `serviceTimeClassification.js` :

- **PROD** (Production) : Fabrication, Bâtiment/Nettoyage
- **DEP** (Dépannage) : Actions de dépannage urgentes
- **PILOT** (Pilotage) : Documentation, Préventif, Support/Administratif
- **FRAG** (Fragmentation) : Toute action < 0,5h (peu importe la catégorie)

### Mapping catégories existantes

Utilise les catégories déjà présentes dans `action_category` :

| ID  | Code | Nom                   | Type temps |
| --- | ---- | --------------------- | ---------- |
| 19  | DEP  | Dépannage             | DEP        |
| 20  | FAB  | Fabrication           | PROD       |
| 21  | DOC  | Documentation         | PILOT      |
| 22  | PREV | Préventif             | PILOT      |
| 23  | SUP  | Support/Administratif | PILOT      |
| 24  | BAT  | Bâtiment/Nettoyage    | PROD       |

### Calcul des métriques

**Source** : API Directus `actions.fetchActions()`

Le hook `useServiceData` :

1. Récupère toutes les actions sur la période
2. Filtre par date (startDate → endDate)
3. Classifie chaque action (PROD/DEP/PILOT/FRAG)
4. Agrège les temps par type
5. Calcule le % d'actions courtes (< 0,5h)
6. Calcule la charge vs capacité théorique ETP

**Capacité théorique** : 160h/mois (1 ETP) - à configurer selon le nombre d'ETP réels

---

## Contraintes respectées

✅ **Réutilisation composants communs** : KPICard, DistributionCards, PageHeader

✅ **Respect conventions** : Ordre imports, nommage, structure, PropTypes

✅ **Pas de composants spécifiques** : Uniquement composition de composants existants

✅ **Pas de logique métier complexe** : Uniquement calculs simples (pourcentages, colorisation)

✅ **Style sobre, lisible** : Pas de décoratif, orientation décision

✅ **Pas de drill-down** : Aucun lien vers machines/interventions/techniciens

✅ **Données remplaçables** : Mock facilement remplaçable par API réelle

✅ **Code simple, cohérent** : Complexité < 10, < 200 lignes/fichier

---

## Intégration

### Menu

Ajouté dans `menuConfig.js` :

```javascript
{
  id: 'service-status',
  path: '/service-status',
  label: 'État du service',
  icon: Activity,
  pageTitle: 'État du service',
  pageSubtitle: 'Charge, fragmentation, capacité réelle',
  requiresAuth: true,
}
```

### Routes

Ajouté dans `routes.js` :

```javascript
import ServiceStatus from './ServiceStatus';

export const ROUTE_COMPONENTS = {
  // ...
  'service-status': ServiceStatus,
};
```

---

## PAméliorations possibles

- **Configurer la capacité ETP** : Externaliser `SERVICE_ETP_CAPACITY` dans une table meta
- **Filtre date côté serveur** : Ajouter paramètres date à `actions.fetchActions()`
- **Export PDF** : Rapport service avec graphiques
- **Comparaison période précédente** : Trends et évolution
- **Alertes automatiques** : Notifications si seuils critiques dépassés
- **Historique états** : Tracking évolution dans le temps
- **Multi-service** : Si plusieurs services/équipes à analyser
- Historique des états (tracking évolution)
- Drill-down vers analyse détaillée (si besoin métier évolue)

---

## Validation

✅ Build sans erreur
✅ ESLint 0 erreur
✅ Complexité cyclomatique < 10
✅ Fichiers < 200 lignes
✅ PropTypes déclarés
✅ Conventions respectées
✅ Composants réutilisés

**Statut** : ✅ **Prêt pour intégration**

(Mock à remplacer par API réelle dès disponible)
