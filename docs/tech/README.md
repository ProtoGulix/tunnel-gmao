# 📚 Documentation Technique - Tunnel GMAO

> Conventions de développement, contrats d'API et standards
>
> **Version**: 2.1.0  
> **Dernière mise à jour**: 2 janvier 2026

---

## 📖 Lecture Recommandée (Ordre)

### Avant de coder : Comprendre le métier

**⭐ 0. [../REGLES_METIER.md](../REGLES_METIER.md)** - **À LIRE EN PREMIER**

Concepts métier fondamentaux qui structurent tout le code :

- Demandes d'intervention (point d'entrée)
- Interventions (exécution terrain)
- Actions (unité de travail réel)
- Sous-tâches (organisation, pas traçabilité)

**Public** : TOUS les développeurs  
**Durée** : 5 minutes  
**Impact** : Architecture de données, DTOs, validations

---

### Documents Techniques Essentiels

### 1. [CONVENTIONS.md](./CONVENTIONS.md)

**Conventions de code obligatoires**

- Architecture et structure du projet
- Naming conventions
- **Standards des composants common (PropTypes, JSDoc, helpers)**
- Patterns React (composants, hooks, state)
- Gestion des API et formulaires
- Sécurité, performance, accessibilité
- Tests et déploiement
- Conventions Git

**Public**: Tous les développeurs  
**Durée de lecture**: 20 minutes

### 2. [API_CONTRACTS.md](./API_CONTRACTS.md)

**Contrats d'interface Frontend ↔ Backend**

- DTOs (Data Transfer Objects) par domaine
- Adapter pattern pour interopérabilité backend
- Validation et gestion d'erreurs
- Stratégie de migration backend
- Patterns d'implémentation

**Public**: Développeurs API, architecture  
**Durée de lecture**: 15 minutes

### 3. [features/standard-specs.md](./features/standard-specs.md)

**Spécifications standard des articles de stock**

- Structure de données
- Utilisation dans l'interface
- API et utilitaires
- Patterns de réutilisation

**Public**: Développeurs fonctionnels stock  
**Durée de lecture**: 10 minutes

---

## 🎯 Principes Fondamentaux

### Les 5 Piliers du Développement

```
┌─────────────────────────────────────────────┐
│  1. DRY (Don't Repeat Yourself)            │
│     ✅ Réutiliser les fonctions utilitaires│
│     ❌ Dupliquer du code                   │
├─────────────────────────────────────────────┤
│  2. KISS (Keep It Simple, Stupid)          │
│     ✅ Composants simples et focalisés    │
│     ❌ God components (> 500 lignes)      │
├─────────────────────────────────────────────┤
│  3. Performance First                       │
│     ✅ Lazy loading, caching              │
│     ❌ Tout charger au démarrage          │
├─────────────────────────────────────────────┤
│  4. Security by Default                     │
│     ✅ Sanitize, validate, authenticate   │
│     ❌ Faire confiance au client          │
├─────────────────────────────────────────────┤
│  5. Accessibility Matters                   │
│     ✅ Sémantique, ARIA, navigation clavier│
│     ❌ Interfaces inaccessibles           │
└─────────────────────────────────────────────┘
```

---

## 📂 Structure du Projet

### Arborescence Standardisée

```
tunnel-gmao/
├── docs/
│   ├── philosophy.md        # Philosophie du projet
│   ├── scope.md            # Périmètre fonctionnel
│   ├── installation.md     # Guide d'installation
│   └── tech/               # Documentation technique (CE DOSSIER)
│       ├── README.md       # Ce fichier
│       ├── CONVENTIONS.md  # Conventions de code
│       ├── API_CONTRACTS.md # Contrats d'API
│       └── features/       # Spécifications fonctionnelles
│
├── src/
│   ├── pages/              # Composants de route (PascalCase)
│   ├── components/         # Composants réutilisables
│   ├── hooks/              # Custom hooks
│   ├── contexts/           # React Context
│   ├── lib/
│   │   ├── api/            # Client API et adapters
│   │   └── utils/          # Fonctions utilitaires
│   ├── config/             # Configuration et constantes
│   ├── auth/               # Authentification
│   └── styles/             # Styles globaux
│
└── public/                 # Assets statiques
├── dist/                    # Build output (généré)
├── .env.example             # Template variables
├── .cursorrules             # Cursor/IDE rules
├── .copilot-conventions.md  # Conventions Copilot
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── index.html               # Entry point
└── jsconfig.json            # Path aliases
```

### Aliases d'Import

```javascript
// Tous les imports utilisent @/ pour src/
@/pages           → src/pages
@/components      → src/components
@/hooks           → src/hooks
@/lib             → src/lib
@/config          → src/config
@/utils           → src/utils
@/auth            → src/auth
```

---

## Conventions

### ✅ À LIRE OBLIGATOIREMENT

| Document                                 | Durée  | Pour Qui                 |
| ---------------------------------------- | ------ | ------------------------ |
| [CONVENTIONS.md](./CONVENTIONS.md)       | 20 min | Tous les développeurs    |
| [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) | 15 min | Avant de toucher à l'API |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md)   | 15 min | Avant de commit          |
| [UX_STANDARD.md](./UX_STANDARD.md)       | 10 min | Frontend developers      |

### Checklist Onboarding Développeur

- [ ] Cloner le repo
- [ ] `npm install` et `npm run dev`
- [ ] Lire [CONVENTIONS.md](./CONVENTIONS.md)
- [ ] Lire [SECURITY_GUIDE.md](./SECURITY_GUIDE.md)
- [ ] Lancer les tests : `npm test`
- [ ] Faire un commit test
- [ ] Demander review d'un senior

---

## Workflows

### 1. Développement Quotidien

```bash
# Matin: mise à jour
git checkout develop
git pull origin develop

# Créer une branche
git checkout -b feature/ma-feature

# Développer
npm run dev

# Tests avant commit
npm run lint
npm run test -- --run

# Commit
git commit -m "feat(domain): description courte"
git push origin feature/ma-feature

# PR + Review sur GitHub
```

### 2. Architecture d'une Nouvelle Page

```javascript
// 1. Créer le composant page
src/pages/MonPage.jsx

// 2. Structure type
import { ... } from 'react';
import { useApiCall } from '@/hooks/useApiCall';
import { MonPageAPI } from '@/lib/api/monDomain';

export default function MonPage() {
  // States, hooks, effects...
  return <PageHeader {...} />;
}

// 3. Créer les API calls
src/lib/api/monDomain.js
export async function fetchData() { ... }

// 4. Créer les utilitaires
src/utils/monDomainUtils.js
export function formatData(data) { ... }

// 5. Ajouter la route
src/config/menuConfig.js
```

---

## 📖 Documentation Externe

- [React 18](https://react.dev/)
- [Vite.js](https://vitejs.dev/)
- [Radix UI](https://www.radix-ui.com/themes/docs)
- [Lucide Icons](https://lucide.dev/)

---

## 🎯 Principes Non-Négociables

1. ✅ **LIRE** [CONVENTIONS.md](./CONVENTIONS.md) avant de coder
2. ✅ **TESTER** localement avant de pusher
3. ✅ **VALIDER** toutes les entrées utilisateur
4. ✅ **DOCUMENTER** les fonctions publiques (JSDoc)
5. ✅ **UTILISER** @/ pour les imports (pas de chemins relatifs)
6. ✅ **SUIVRE** les patterns définis dans API_CONTRACTS.md
7. ✅ **DEMANDER** une review avant merge

---

## 📝 Changelog

### v2.1.0 (2 Janvier 2026)

- ✅ Ajout standards composants common (PropTypes, JSDoc, helpers)
- ✅ Documentation extraction sous-composants et constantes
- ✅ Checklist validation composants réutilisables
- ✅ Référence à GenericTabComponents comme exemple

### v2.0.0 (26 Décembre 2025)

- ✅ Synthèse de la documentation technique
- ✅ Focus sur conventions, contrats API et standards
- ✅ Suppression de la documentation redondante
- ✅ Structure simplifiée

---

**Documentation = Code Quality. Gardez-la à jour!**
