# Rôles et permissions

Écran : **Administration**, onglet **Rôles & Permissions**.

![Administration, onglet Rôles & Permissions : matrice des droits, une colonne par rôle et un interrupteur par permission](/captures/web-admin-roles.webp)

La matrice liste, ligne par ligne, chaque action que l'application permet (une méthode
comme GET ou POST et son chemin, avec une description). Chaque colonne est un rôle. Un
interrupteur actif signifie que le rôle a le droit.

## Changer un droit

1. Repérez la ligne, rangée par module.
2. Basculez l'interrupteur dans la colonne du rôle.
3. Le message « Permission modifiée » confirme le changement.

Le droit est appliqué par le serveur, pas seulement masqué à l'écran. Le bouton
**Historique des modifications** ouvre la liste des changements de droits déjà faits.

Un tiret signifie qu'aucun droit n'est défini pour ce rôle sur cette ligne.

## Droits par défaut

À l'installation, Tunnel pose des droits de départ. Tout ce qui n'est pas ouvert est fermé.

| Rôle | Par défaut |
| --- | --- |
| ADMIN | Tout. |
| RESP | Lit tout, écrit sur tout le travail de maintenance. Gère les référentiels d'actions et d'interventions. Lit l'historique d'audit. |
| TECH | Lit tout, sauf l'historique d'audit. Crée des demandes d'intervention et des demandes d'achat. Modifie les interventions et les équipements, saisit des actions et des tâches. Ne crée ni ne supprime d'intervention. |
| ACHETEUR | Lit tout, sauf l'historique d'audit. Écrit sur les demandes d'achat, les commandes, les fournisseurs, les pièces et les familles de pièces. |
| MCP | Lecture seule. |

Les zones d'administration, les clés d'API et la sécurité sont fermées à tous sauf à
l'administrateur. Le responsable y a seulement un accès en lecture aux utilisateurs et aux
référentiels, et en écriture aux référentiels d'actions et d'interventions.

Ces droits sont un point de départ : vous pouvez les modifier dans la matrice. Un droit
que vous avez réglé à la main n'est pas remis à zéro par les mises à jour.

## Synchroniser les endpoints

Quand une nouvelle version ajoute des routes, le catalogue se met à jour. Le bouton
**Synchroniser les endpoints** force cette mise à jour et recharge la matrice.

## La vue d'accueil par rôle

En haut de la matrice, la ligne **Vue d'accueil** choisit l'écran d'accueil de chaque rôle.
Trois vues existent :

- **Technicien** : réservoir de tâches et fiche de la semaine ;
- **Acheteur** : demandes d'achat par statut ;
- **Direction technique** : demandes d'intervention par statut, porteur et échéance.

Sans réglage, un rôle garde la vue technicien. Choisissez la vue dans la liste de la
colonne du rôle.

![Haut de la matrice : colonnes des rôles, ligne Vue d'accueil avec une liste par rôle, puis les premières permissions](/captures/web-admin-roles-vue-accueil.webp)

## Les clés d'API (MCP)

Le rôle MCP est réservé aux clés d'API : voir [Sécurité](./securite). Il est en lecture
seule par conception : ne lui ouvrez pas de droit d'écriture.
