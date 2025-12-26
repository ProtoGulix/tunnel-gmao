# Installation de Tunnel GMAO

## Principe général

Tunnel GMAO s'installe **localement**, sur les infrastructures choisies par l'entreprise.

Aucune connexion à un service externe n'est nécessaire pour le fonctionnement de l'application.

L'entreprise reste maîtresse de ses données et de son installation.

## Stack technique

Tunnel GMAO repose sur une stack simple et éprouvée :

- **Backend** : À définir (selon implémentation future)
- **Base de données** : PostgreSQL
- **Frontend** : Application web moderne (accessible depuis navigateur ou mobile)
- **Déploiement** : Docker / Docker Compose pour simplifier l'installation

## Prérequis

- Un serveur Linux (physique ou virtuel)
- Docker et Docker Compose installés
- Accès au réseau local de l'entreprise

Pas besoin de :
- Connexion internet permanente
- Infrastructure cloud
- Abonnement SaaS

## Installation type

L'installation se fait en quelques étapes :

1. Cloner le dépôt Git de Tunnel GMAO
2. Configurer les variables d'environnement (port, base de données, etc.)
3. Lancer Docker Compose
4. Accéder à l'application via navigateur

Les détails techniques seront fournis dans la documentation d'installation complète lorsque le code applicatif sera disponible.

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
