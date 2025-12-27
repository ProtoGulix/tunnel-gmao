# 🎯 Actions Prioritaires Post-Verrouillage

## ✅ Architecture Complète

L'architecture est **100% verrouillée** avec les 6 verrous en place.

---

## 🔥 Actions Immédiates (Cette Session)

### 1. Tester le Mock Adapter

```bash
# Windows
$env:VITE_BACKEND_PROVIDER="mock"; npm run dev

# Linux/Mac
VITE_BACKEND_PROVIDER=mock npm run dev
```

**Attendu**: L'app démarre sans erreur, affiche des données minimales.

---

### 2. Corriger la Violation ESLint Critique

**Fichier**: [src/pages/InterventionDetail.jsx](src/pages/InterventionDetail.jsx#L291)

**Erreur détectée**:

```
291:87  error  Backend-specific term "directus" must not appear outside adapters
```

**Action**: Remplacer la référence "directus" par une alternative backend-agnostic.

---

## 📋 Nettoyage des Violations (Prochains Jours)

Le script `arch-check` a détecté **41 violations** à corriger:

### 🔴 Priorité 1: Fuites "directus" (12 occurrences)

| Fichier                                            | Ligne(s)                | Action                                     |
| -------------------------------------------------- | ----------------------- | ------------------------------------------ |
| `src/components/ServerStatus.jsx`                  | 5                       | Refactorer pour ne pas exposer le provider |
| `src/lib/api/client.js`                            | 164, 176, 178, 215, 216 | Déplacer logic backend dans adapter        |
| `src/lib/api/facade.js`                            | 16, 40, 49              | Nettoyer commentaires/docs                 |
| `src/lib/api/normalizers/normalizeStatus.ts`       | 8                       | Supprimer commentaire                      |
| `src/components/stock/SupplierRefsInlinePanel.jsx` | 173                     | Refactorer                                 |
| `src/pages/InterventionDetail.jsx`                 | 291                     | **CRITIQUE** ⚠️                            |

### 🟠 Priorité 2: Import "axios" (1 occurrence)

| Fichier                   | Action                             |
| ------------------------- | ---------------------------------- |
| `src/lib/serverStatus.js` | Utiliser `client.api` de la facade |

### 🟡 Priorité 3: Filtres Backend (28 occurrences)

Ces fichiers utilisent des filtres backend-specific (`_eq`, `_and`, `_or`):

**Composants**:

- `src/components/machine/OpenInterventionsTable.jsx` (7x)
- `src/components/purchase/SupplierOrdersTable.jsx` (2x)

**Config**:

- `src/config/anomalyConfig.js` (2x)
- `src/config/purchasingConfig.js` (2x)
- `src/config/stockManagementConfig.js` (2x)

**Hooks**:

- `src/hooks/useMachineStats.js` (2x)

**Utils**:

- `src/lib/utils/actionUtils.js` (4x)
- `src/lib/utils/interventionUtils.jsx` (2x)

**Pages**:

- `src/pages/InterventionCreate.jsx` (5x)
- `src/pages/InterventionsList.jsx` (1x)

**Solution recommandée**:

1. Déplacer la logique de filtrage dans l'adapter
2. Exposer des méthodes filtrées via la facade (ex: `fetchOpenInterventions()`)
3. Ou créer un helper de filtrage backend-agnostic

---

## 🚀 Validation Finale (Avant Production)

### Checklist

- [ ] **Corriger la violation critique** (InterventionDetail.jsx:291)
- [ ] **Tester le mock adapter** (`VITE_BACKEND_PROVIDER=mock npm run dev`)
- [ ] **Lancer arch-check** → doit passer (0 violations)
- [ ] **Build avec directus** → doit réussir
- [ ] **Build avec mock** → doit réussir
- [ ] **Tests manuels** → app fonctionne normalement

### Commandes de Validation

```bash
# 1. Vérifier l'architecture
npm run arch:check

# 2. Lint complet
npm run lint

# 3. Build production
npm run build

# 4. Build avec mock
VITE_BACKEND_PROVIDER=mock npm run build
```

---

## 🎓 Guide Rapide pour l'Équipe

### Utiliser la Facade (Composants)

```javascript
// ✅ BON
import { machines, stock } from 'src/lib/api/facade';

const machines = await machines.fetchMachines();
const items = await stock.fetchStockItems();

// ❌ MAUVAIS (ESLint erreur)
import axios from 'axios';
import { adapter } from 'src/lib/api/adapters/directus';
```

### Utiliser les Normalizers (Adapters)

```typescript
// ✅ BON
import { normalizeInterventionStatus } from 'src/lib/api/normalizers';

const status = normalizeInterventionStatus(rawData.status);

// ❌ MAUVAIS (pas de normalisation)
const status = rawData.status_actual?.value || 'open';
```

### Créer un Nouveau Normalizer

```typescript
// src/lib/api/normalizers/normalizeDates.ts
export const normalizeDateString = (input: unknown): string | undefined => {
  if (typeof input === 'string') {
    return new Date(input).toISOString();
  }
  // ... autres formats
  return undefined;
};
```

---

## 📚 Documentation de Référence

- **Architecture complète**: [docs/ARCHITECTURE_LOCKED.md](docs/ARCHITECTURE_LOCKED.md)
- **Résumé des changements**: [docs/ARCHITECTURE_CHANGES.md](docs/ARCHITECTURE_CHANGES.md)
- **Contrats API**: [docs/tech/API_CONTRACTS.md](docs/tech/API_CONTRACTS.md)
- **Interface ApiAdapter**: [src/lib/api/adapters/ApiAdapter.ts](src/lib/api/adapters/ApiAdapter.ts)

---

## 🎯 Objectif Final

**État cible**: `npm run arch:check` → ✅ 0 violations

**Quand atteint**:

- L'architecture est 100% propre
- Changement de backend devient mécanique
- Les développeurs ne peuvent plus faire fuir du backend par erreur

---

## 💡 Aide Mémoire

### Phrase Magique avec Copilot

> **"Do not leak backend details outside adapters."**

### Scripts Utiles

```bash
# Vérifier l'architecture
npm run arch:check

# Linter et corriger auto
npm run lint:fix

# Build avec mock
VITE_BACKEND_PROVIDER=mock npm run build
```

### Structure Clé

```
src/lib/api/
├── adapters/
│   ├── ApiAdapter.ts      ← Contrat
│   ├── provider.ts        ← Registry
│   ├── directus/          ← Production
│   └── mock/              ← Tests
├── normalizers/           ← 1 source de vérité
├── client.js              ← SEUL endroit axios
├── errors.js              ← Erreurs typées
└── facade.js              ← API publique
```

---

**🔒 L'architecture veille. Tu peux coder sereinement.**
