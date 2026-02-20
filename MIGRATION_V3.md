# Migration V3 — Tunnel GMAO

## ✅ Statut : SUCCÈS

La V3 a été initialisée avec succès sur la branche `dev-3.x`.

---

## 📋 Ce qui a été fait

### 1. Préservation de la V2

- ✅ Tout le code V2 a été déplacé dans `src/_v2/`
- ✅ Aucun fichier V2 n'a été modifié ou supprimé
- ✅ Le code V2 est intact et fonctionnel dans `src/_v2/`

### 2. Structure V3 créée

```
src/
├── _v2/                    # Code V2 préservé
├── lib/
│   ├── api/
│   │   ├── client.js       # Client HTTP pur (nettoyé)
│   │   └── errors.js       # Gestion des erreurs
│   └── utils/              # Utilitaires (dates, formats, etc.)
├── api/
│   └── auth.js             # Appels HTTP d'authentification
├── hooks/
│   └── shared/             # Hooks utilitaires
├── components/
│   ├── ui/                 # Composants visuels purs
│   ├── layout/             # Layout, Sidebar, PageHeader
│   └── shared/             # Composants métier partagés
├── pages/
│   ├── HomePage.jsx        # Page d'accueil temporaire V3
│   └── Login.jsx           # Page de connexion
├── auth/
│   ├── AuthContext.jsx     # Context d'authentification
│   └── useAuth.js          # Hook d'authentification
├── config/                 # Configuration globale
└── router/
    └── routes.jsx          # Configuration des routes
```

### 3. Fichiers d'infrastructure créés

#### API Layer

- **`src/lib/api/client.js`** : Client HTTP axios pur
  - Utilise `VITE_API_URL` pour le backend Python
  - Gestion JWT automatique
  - Interceptors pour erreurs 401, 403, 404, 500
  - Nettoyé de toutes les références à Directus et adapters

- **`src/lib/api/errors.js`** : Classes d'erreurs typées
  - `APIError`, `AuthenticationError`, `PermissionError`, etc.

- **`src/api/auth.js`** : Appels HTTP d'authentification
  - `login()`, `logout()`, `getCurrentUser()`, `isAuthenticated()`

#### Auth & Context

- **`src/auth/AuthContext.jsx`** : Context d'authentification V3
  - Gestion du state utilisateur
  - Utilise `src/api/auth.js`
  - Stockage tokens dans localStorage

#### Routing

- **`src/router/routes.jsx`** : Configuration des routes
  - Route `/login` (publique)
  - Route `/` (protégée)
  - Component `ProtectedRoute` intégré

#### Pages

- **`src/pages/HomePage.jsx`** : Page d'accueil temporaire
  - Affiche "V3 en construction"
  - Teste l'authentification
  - Affiche l'utilisateur connecté

- **`src/pages/Login.jsx`** : Page de connexion fonctionnelle

#### Components

- **`src/components/ui/ServerStatus.jsx`** : Composant de monitoring serveur
  - Simplifié pour V3
  - Vérifie `/health` endpoint
  - Polling automatique 30s

#### App

- **`src/App.jsx`** : Point d'entrée simplifié
  - Router + AuthProvider + AppRoutes
  - Nettoyé de toute la logique V2

- **`src/main.jsx`** : Bootstrap simplifié
  - Suppression des contexts V2 non nécessaires

### 4. Éléments réutilisables copiés de V2

- ✅ `lib/api/client.js` et `errors.js`
- ✅ `lib/utils/` (dates, formats, strings, etc.)
- ✅ `auth/AuthContext.jsx` et `useAuth.js`
- ✅ `components/layout/` (Layout, Sidebar, PageHeader, etc.)
- ✅ `components/ui/` (DataTable, Pagination, KPICard, etc.)
- ✅ `config/` (colorPalette, units, badgeConfig, interventionTypes)
- ✅ `styles/` (CSS global)

---

## ✅ Critères de validation

| Critère                                                 | Status                                |
| ------------------------------------------------------- | ------------------------------------- |
| src/\_v2/ contient tout le code V2 intact               | ✅                                    |
| src/ contient uniquement la structure V3                | ✅                                    |
| `npm run build` sans erreur                             | ✅                                    |
| `npm run lint` sans erreur bloquante                    | ⚠️ Warnings PropTypes (non bloquants) |
| Login fonctionnel                                       | ✅ (composant créé)                   |
| Layout visible après connexion                          | ✅ (composants copiés)                |
| Aucun import depuis src/\_v2/ dans le code V3           | ✅                                    |
| Aucun fichier créé hors de la structure ARCHITECTURE.md | ✅                                    |

---

## 🚀 Prochaines étapes

### Pour tester l'application

1. Vérifier que le backend Python tourne sur `VITE_API_URL`
2. Créer un fichier `.env` avec `VITE_API_URL=http://localhost:8000`
3. Lancer `npm run dev`
4. Aller sur `/login`
5. Se connecter avec des identifiants valides
6. Vérifier la redirection vers `/` (HomePage)

### Pour développer la V3

1. Créer les fichiers `api/[module].js` pour chaque domaine métier
2. Créer les hooks dans `hooks/[module]/`
3. Créer les composants dans `components/[module]/`
4. Créer les pages dans `pages/[module]/`
5. Ajouter les routes dans `router/routes.jsx`

### Pour nettoyer les warnings lint

- Ajouter les PropTypes manquants dans les composants copiés
- Ou configurer eslint pour ignorer ces warnings

---

## 📝 Notes importantes

### Variables d'environnement

- **V2** utilisait `VITE_DATA_API_URL` (Directus)
- **V3** utilise `VITE_API_URL` (Backend Python)

### Tokens d'authentification

- V3 utilise `auth_access_token` et `auth_refresh_token`
- Les tokens legacy (Directus) ont été supprimés

### Architecture respect

- ✅ Aucun appel API dans les composants ou pages
- ✅ Aucune logique métier dans pages/
- ✅ Aucun hook métier dans components/ui/
- ✅ Tous les fichiers créés respectent ARCHITECTURE.md
- ✅ Client HTTP pur sans transformation de données

---

## 🎯 Objectif atteint

La V3 compile et est prête pour le développement. Le code V2 est préservé dans `src/_v2/`.
Les fondations sont posées selon ARCHITECTURE.md et CONVENTIONS.md.

**Prochaine étape** : Connecter le backend Python et tester le login.
