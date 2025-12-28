# Tunnel GMAO

**Logiciel open-source de GMAO (Gestion de Maintenance Assistée par Ordinateur)**  
Sobre, orienté terrain, destiné aux PME industrielles.

---

## 🎯 Vision

Tunnel GMAO structure le travail de maintenance quotidien autour de **concepts métier clairs** :

- **Demandes d'intervention** : point d'entrée unique pour signaler un besoin
- **Interventions** : exécution réelle du travail de maintenance
- **Actions** : unités de travail tracées (temps, complexité, pièces)
- **Machines** : équipements à maintenir
- **Stock** : pièces détachées et consommables

### Principe fondamental

> **L'action est la seule unité de travail réel.**  
> Le temps, la complexité et les pièces vivent uniquement dans les actions.

Cette approche garantit une traçabilité fiable sans complexité organisationnelle excessive.

**Tunnel GMAO n'est pas** un ERP, un outil d'analyse prédictive ou une solution miracle.  
C'est un support pragmatique pour organiser et tracer la maintenance.

**Tunnel GMAO est** un outil qui enregistre la réalité terrain sans imposer de méthode.

Pour comprendre les règles métier en détail, consultez [docs/REGLES_METIER.md](docs/REGLES_METIER.md).

## Pour qui ?

Tunnel GMAO s'adresse aux **PME industrielles** qui ont besoin de structurer leur maintenance sans investir dans un logiciel lourd et coûteux.

Profils typiques :

- Ateliers de production avec 10 à 100 machines
- Équipes de maintenance de 1 à 10 personnes
- Entreprises qui veulent passer d'un système papier/Excel à un outil numérique simple
- Structures qui privilégient la maîtrise de leurs données et de leurs outils

Tunnel GMAO convient aussi aux prestataires et consultants en maintenance qui souhaitent déployer une solution open-source chez leurs clients.

## 📦 Périmètre fonctionnel

### ✅ Inclus dans Tunnel GMAO

#### 1. Concepts métier structurants

- **Demandes d'intervention** : signaler un besoin, qualifier, prioriser (peut exister sans intervention)
- **Interventions** : exécution terrain toujours issue d'une demande (1 demande = max 1 intervention)
- **Actions** : unités de travail tracées avec temps, complexité, pièces (rattachées à une intervention)
- **Sous-tâches** : outil d'organisation pour projets longs (sans valeur de traçabilité)

#### 2. Fonctionnalités opérationnelles

- **Gestion machines** : équipements, localisation, documentation technique, historique
- **Demandes terrain** : création responsive (web/mobile), photos, urgence, assignation
- **Traçabilité actions** : temps passé, type d'action, pièces utilisées, observations
- **Demandes d'achat** : suivi pièces détachées, lien interventions/machines
- **Stock basique** : articles disponibles, alertes seuil minimum
- **Tableaux de bord** : demandes en attente, retards, temps passé (graphiques simples)
- **Exports CSV** : données brutes pour analyse externe (Excel, BI)

### ❌ Exclu explicitement

- **Pas de KPI complexes** : pas de calcul automatique de MTBF, MTTR, TRS, OEE (données exportables pour calcul externe)
- **Pas d'ERP** : pas de gestion comptabilité, paie, commandes clients, production
- **Pas de SaaS** : pas de service hébergé multi-tenant (installation locale uniquement)
- **Pas d'automatisations lourdes** : pas de préventif prédictif, pas d'intégrations ERP/MES complexes
- **Pas de reporting avancé** : rapports simples (listes, totaux, exports CSV)

📖 Détails complets : [docs/scope.md](docs/scope.md)

---

## 📚 Documentation

### 🗂️ Navigation complète : [docs/INDEX.md](docs/INDEX.md)

### Documents de référence (par ordre de lecture recommandé)

1. **[REGLES_METIER.md](docs/REGLES_METIER.md)** ⭐ **À LIRE EN PREMIER**  
   Concepts métier fondamentaux : demandes, interventions, actions, sous-tâches  
   _Durée : 5 minutes_

2. **[philosophy.md](docs/philosophy.md)**  
   Vision du projet : terrain first, sobriété, propriété des données  
   _Durée : 8 minutes_

3. **[scope.md](docs/scope.md)**  
   Périmètre détaillé : inclus/exclus/refusé  
   _Durée : 10 minutes_

4. **[installation.md](docs/installation.md)**  
   Guide d'installation local (Docker + manuel)  
   _Durée : 15 minutes_

### Documentation technique (pour développeurs)

5. **[tech/README.md](docs/tech/README.md)**  
   Point d'entrée technique : principes, structure projet  
   _Durée : 15 minutes_

6. **[tech/CONVENTIONS.md](docs/tech/CONVENTIONS.md)**  
   Conventions de code obligatoires (architecture, React, API)  
   _Durée : 20 minutes_

7. **[tech/API_CONTRACTS.md](docs/tech/API_CONTRACTS.md)**  
   Contrats d'interface Frontend ↔ Backend (DTOs, adapters)  
   _Durée : 15 minutes_

--- Modèle d'installation

Tunnel GMAO s'installe **uniquement en local** (on-premise), sur les infrastructures choisies par l'entreprise.

Aucune version SaaS ne sera proposée. Chaque installation est indépendante et dédiée à une seule entreprise.

Stack technique :

- Base de données PostgreSQL
- Déploiement via Docker / Docker Compose
- Interface web accessible depuis navigateur ou mobile

L'entreprise reste maîtresse de ses données et de son installation.

Pour plus de détails, consultez [docs/installation.md](docs/installation.md).

## Licence open-source

Tunnel GMAO est distribué sous licence **AGPL-3.0-only**.

Le code source est ouvert et libre d'utilisation. Toute modification doit être redistribuée sous la même licence.

Les données appartiennent à l'entreprise qui les génère. Le logiciel ne collecte rien, ne transmet rien à l'extérieur.

Voir le fichier [LICENSE](LICENSE) pour le texte complet de la licence.

## Usage commercial et prestations

**Tunnel GMAO est un logiciel open-source.**

Le logiciel fonctionne sans contrat commercial. Vous pouvez l'installer, l'utiliser, le modifier librement, tant que vous respectez les termes de la licence AGPL-3.0.

**La valeur commerciale porte sur l'analyse, l'intégration et le support, pas sur la licence logicielle.**

Les prestations suivantes sont séparées et optionnelles :

- Analyse des besoins et accompagnement organisationnel
- Installation et configuration assistée
- Formation des équipes
- Support technique et maintenance
- Adaptation et développements spécifiques

Ces prestations peuvent être assurées par des prestataires indépendants ou par l'entreprise elle-même.

## Documentation

- [Philosophy](docs/philosophy.md) : la logique "terrain first", le refus de la complexité inutile
- [Scope](docs/scope.md) : liste précise des fonctionnalités incluses et refusées
- [Installation](docs/installation.md) : principe d'installation locale, stack technique

## État du projet

Actuellement, seule la structure de base et la documentation fondatrice sont en place.

Le code applicatif sera développé progressivement, en respectant les principes énoncés dans la documentation.

Les contributions sont bienvenues, à condition de respecter la philosophie du projet (voir [docs/philosophy.md](docs/philosophy.md)).

## Contact et contributions

Le projet est hébergé sur GitHub : [ProtoGulix/tunnel-gmao](https://github.com/ProtoGulix/tunnel-gmao)

Pour toute question, suggestion ou contribution, ouvrez une issue sur le dépôt GitHub.
