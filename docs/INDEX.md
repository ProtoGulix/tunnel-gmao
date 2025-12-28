# 📚 Index Documentation - Tunnel GMAO

> Guide de navigation dans la documentation complète du projet

---

## 🎯 Par où commencer ?

### Nouveau contributeur ? Suivez cet ordre :

1. **[../README.md](../README.md)** - Vue d'ensemble projet (5 min)
2. **[REGLES_METIER.md](REGLES_METIER.md)** ⭐ - Concepts métier fondamentaux (5 min)
3. **[philosophy.md](philosophy.md)** - Vision et principes (8 min)
4. **[scope.md](scope.md)** - Périmètre inclus/exclu (10 min)
5. **[tech/README.md](tech/README.md)** - Point d'entrée technique (15 min)

**Total : 43 minutes** pour comprendre l'essentiel

---

## 📖 Documentation Métier

### [REGLES_METIER.md](REGLES_METIER.md) ⭐ **À LIRE EN PREMIER**

Modèle métier cible de Tunnel GMAO

**Contenu** :

- Demande d'intervention (point d'entrée unique)
- Intervention (exécution réelle du travail)
- Actions (seule unité de travail tracée)
- Sous-tâches (organisation, pas traçabilité)
- Règles métier non négociables
- Impact sur l'architecture technique

**Pour qui** : Développeurs, product owners, consultants  
**Prérequis** : Aucun  
**Durée** : 5 minutes

---

### [philosophy.md](philosophy.md)

Philosophie du projet et principes directeurs

**Contenu** :

- Terrain first (conception pour utilisateurs réels)
- Refus de la complexité inutile
- Outil au service de la méthode (pas l'inverse)
- Propriété des données (pas de SaaS)
- Sobriété logicielle (stack simple, durable)
- Modèle économique honnête (open-source AGPL-3.0)

**Pour qui** : Tous (vision projet)  
**Prérequis** : [README.md](../README.md)  
**Durée** : 8 minutes

---

### [scope.md](scope.md)

Périmètre fonctionnel détaillé

**Contenu** :

- Fonctionnalités incluses (machines, demandes, interventions, stock, analyses)
- Fonctionnalités refusées (SaaS, ERP, KPI complexes, automatisations)
- Explications des exclusions

**Pour qui** : Product owners, développeurs, clients  
**Prérequis** : [REGLES_METIER.md](REGLES_METIER.md)  
**Durée** : 10 minutes

---

## 🔧 Documentation Installation

### [installation.md](installation.md)

Guide d'installation complète

**Contenu** :

- Stack technique (Node.js, PostgreSQL, React, Docker)
- Prérequis système
- Installation Docker (recommandée)
- Installation manuelle (sans Docker)
- Maintenance et mises à jour

**Pour qui** : Administrateurs systèmes, ops  
**Prérequis** : Connaissances Docker/Linux  
**Durée** : 15 minutes

---

## 💻 Documentation Technique

### [tech/README.md](tech/README.md)

Point d'entrée documentation technique

**Contenu** :

- Principes fondamentaux (DRY, KISS, Performance, Security, Accessibility)
- Structure du projet (arborescence)
- Documents essentiels (index)
- Standards de développement

**Pour qui** : Développeurs  
**Prérequis** : [REGLES_METIER.md](REGLES_METIER.md)  
**Durée** : 15 minutes

---

### [tech/CONVENTIONS.md](tech/CONVENTIONS.md)

Conventions de code obligatoires

**Contenu** :

- Architecture et structure projet
- Naming conventions (fichiers, variables, composants)
- Patterns React (composants, hooks, state management)
- Gestion API et formulaires
- Sécurité, performance, accessibilité
- Tests et déploiement
- Conventions Git

**Pour qui** : Développeurs (lecture obligatoire avant PR)  
**Prérequis** : [tech/README.md](tech/README.md)  
**Durée** : 20 minutes

---

### [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md)

Contrats d'interface Frontend ↔ Backend

**Contenu** :

- DTOs (Data Transfer Objects) par domaine
- Architecture Facade + Adapter Pattern
- Validation et gestion d'erreurs
- Stratégie de migration backend
- Patterns d'implémentation (normalizers, mappers)
- Checklist validation

**Pour qui** : Développeurs API, architectes  
**Prérequis** : [REGLES_METIER.md](REGLES_METIER.md), [tech/CONVENTIONS.md](tech/CONVENTIONS.md)  
**Durée** : 15 minutes

---

### [tech/features/standard-specs.md](tech/features/standard-specs.md)

Spécifications standard des articles de stock

**Contenu** :

- Structure de données (specs multiples par article)
- Utilisation dans l'interface (dropdown, défaut)
- API et utilitaires
- Patterns de réutilisation

**Pour qui** : Développeurs fonctionnels stock  
**Prérequis** : [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md)  
**Durée** : 10 minutes

---

## 🔍 Par thème

### Comprendre la vision

1. [../README.md](../README.md) - Vue d'ensemble
2. [philosophy.md](philosophy.md) - Principes
3. [scope.md](scope.md) - Périmètre

### Comprendre le métier

1. [REGLES_METIER.md](REGLES_METIER.md) ⭐ - Concepts fondamentaux
2. [scope.md](scope.md) - Fonctionnalités détaillées

### Installer l'application

1. [installation.md](installation.md) - Guide complet

### Développer

1. [REGLES_METIER.md](REGLES_METIER.md) ⭐ - **Lire en premier**
2. [tech/README.md](tech/README.md) - Principes techniques
3. [tech/CONVENTIONS.md](tech/CONVENTIONS.md) - Standards code
4. [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md) - Contrats API
5. [tech/features/](tech/features/) - Specs fonctionnelles

### Comprendre l'architecture

1. [REGLES_METIER.md](REGLES_METIER.md) - Impact sur l'architecture
2. [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md) - Adapter pattern
3. [tech/CONVENTIONS.md](tech/CONVENTIONS.md) - Structure projet

---

## 📊 Matrice de lecture

| Document                                       | Product Owner      | Développeur        | Ops                | Consultant |
| ---------------------------------------------- | ------------------ | ------------------ | ------------------ | ---------- |
| [README.md](../README.md)                      | ✅                 | ✅                 | ✅                 | ✅         |
| [REGLES_METIER.md](REGLES_METIER.md)           | ✅                 | ⭐ **Obligatoire** | ➖                 | ✅         |
| [philosophy.md](philosophy.md)                 | ✅                 | ✅                 | ➖                 | ✅         |
| [scope.md](scope.md)                           | ⭐ **Obligatoire** | ✅                 | ➖                 | ✅         |
| [installation.md](installation.md)             | ➖                 | ✅                 | ⭐ **Obligatoire** | ✅         |
| [tech/README.md](tech/README.md)               | ➖                 | ⭐ **Obligatoire** | ✅                 | ➖         |
| [tech/CONVENTIONS.md](tech/CONVENTIONS.md)     | ➖                 | ⭐ **Obligatoire** | ➖                 | ➖         |
| [tech/API_CONTRACTS.md](tech/API_CONTRACTS.md) | ➖                 | ⭐ **Obligatoire** | ➖                 | ➖         |
| [tech/features/\*](tech/features/)             | ➖                 | ✅ Selon besoin    | ➖                 | ➖         |

**Légende** :

- ⭐ **Obligatoire** : Lecture impérative avant contribution
- ✅ Recommandé : Fortement conseillé
- ➖ Optionnel : Selon besoin/contexte

---

## 🔄 Flux de lecture par profil

### 🎨 Product Owner / Consultant

```
README.md → REGLES_METIER.md → philosophy.md → scope.md
(Total : ~28 minutes)
```

### 💻 Développeur (nouveau)

```
README.md → REGLES_METIER.md → philosophy.md → scope.md
→ tech/README.md → tech/CONVENTIONS.md → tech/API_CONTRACTS.md
(Total : ~78 minutes)
```

### 🔧 Ops / Admin Système

```
README.md → philosophy.md → installation.md → tech/README.md
(Total : ~43 minutes)
```

### 🚀 Contributeur Quick Start

```
REGLES_METIER.md → tech/CONVENTIONS.md → tech/API_CONTRACTS.md
(Total : ~40 minutes, prêt à coder)
```

---

## 📝 Contribuer à la documentation

- Toute modification des règles métier doit être discutée (impact architecture)
- Respecter le format Markdown et les conventions de nommage
- Mettre à jour ce fichier INDEX.md si nouveaux documents
- Durées de lecture : estimer pour faciliter la planification

**Contact** : Voir [../README.md](../README.md) pour informations projet
