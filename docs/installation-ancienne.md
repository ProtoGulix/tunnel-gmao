# Installation de Tunnel GMAO

## Principe général

Tunnel GMAO s'installe **localement**, sur les infrastructures choisies par l'entreprise.

Aucune connexion à un service externe n'est nécessaire pour le fonctionnement de l'application.

L'entreprise reste maîtresse de ses données et de son installation.

## Stack technique

Tunnel GMAO repose sur une stack simple et éprouvée :

- **Backend** : Node.js / API REST
- **Base de données** : PostgreSQL (gestion des données métier)
- **Frontend** : React 18 + Vite (application web moderne)
- **UI Framework** : Radix UI Themes (composants accessibles)
- **Déploiement** : Docker / Docker Compose pour simplifier l'installation

## Prérequis système

### Infrastructure minimale

- Un serveur Linux (physique ou virtuel)
- 2 CPU / 4GB RAM minimum (recommandé : 4 CPU / 8GB RAM)
- 20GB d'espace disque (système + données)
- Docker et Docker Compose installés
- Accès au réseau local de l'entreprise

### Pas besoin de

- Connexion internet permanente (seulement pour l'installation initiale)
- Infrastructure cloud
- Abonnement SaaS
- Serveur d'application externe

## Installation type

L'installation se fait en quelques étapes :

1. **Préparer l'environnement**

   ```bash
   # Cloner le dépôt
   git clone https://github.com/ProtoGulix/tunnel-gmao.git
   cd tunnel-gmao
   ```

2. **Configurer l'environnement**

   ```bash
   # Copier le fichier d'exemple
   cp .env.example .env

   # Éditer les variables (ports, mots de passe, etc.)
   nano .env
   ```

3. **Lancer les services avec Docker**

   ```bash
   # Démarrer tous les services (PostgreSQL, Backend, Frontend)
   docker-compose up -d

   # Vérifier que tout tourne
   docker-compose ps
   ```

4. **Initialiser la base de données**

   ```bash
   # Appliquer les migrations
   docker-compose exec backend npm run migrate

   # Créer le premier utilisateur admin
   docker-compose exec backend npm run seed:admin
   ```

5. **Accéder à l'application**
   - Frontend : http://localhost:3000
   - API : http://localhost:8055

### Installation manuelle (sans Docker)

Pour les environnements où Docker n'est pas disponible :

1. Installer PostgreSQL 14+
2. Installer Node.js 18+
3. Configurer les variables d'environnement
4. Installer les dépendances : `npm install`
5. Lancer les migrations : `npm run migrate`
6. Démarrer les services : `npm start`

Consulter la documentation technique complète dans `docs/tech/DEVOPS_GUIDE.md`.

## Maintenance et mises à jour

Tunnel GMAO ne propose pas de mises à jour automatiques.

Les mises à jour se font manuellement :

- Arrêt de l'application
- Récupération de la nouvelle version
- Relance de l'application

Les migrations de base de données sont gérées par des scripts fournis avec chaque version.

## Pas de garantie de disponibilité

Tunnel GMAO est un logiciel open-source fourni **sans garantie**.

Il n'y a pas de SLA (Service Level Agreement), pas de support 24/7 inclus, pas de promesse de disponibilité.

L'entreprise qui installe Tunnel GMAO est responsable de :

- La disponibilité de son serveur
- La sauvegarde de ses données
- La sécurité de son installation

## Support et accompagnement

Le logiciel est libre et gratuit.

Le support, l'installation assistée, la formation, et l'accompagnement sont des **prestations séparées**, assurées par des prestataires indépendants ou par l'entreprise elle-même.

Aucune obligation de contrat commercial pour utiliser le logiciel.

## Hébergement

L'entreprise peut choisir de :

- Héberger Tunnel GMAO sur ses propres serveurs
- Confier l'hébergement à un prestataire de confiance (qui installera une instance dédiée)

Dans tous les cas, il s'agit d'une installation **dédiée**, pas d'un service partagé multi-tenant.

## Sécurité

Tunnel GMAO est conçu pour fonctionner derrière un réseau local d'entreprise.

L'exposition sur internet n'est pas recommandée sans mesures de sécurité adaptées (VPN, reverse proxy avec authentification, etc.).

La responsabilité de la sécurité de l'installation incombe à l'entreprise qui l'exploite.
