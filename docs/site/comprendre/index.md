# Comprendre Tunnel

Cette section explique comment Tunnel s'articule. Les pages « par rôle » montrent les
écrans. Ici, vous comprenez **pourquoi** les choses s'enchaînent ainsi.

![La chaîne du travail de Tunnel, de la demande d'intervention à la réception de la pièce, avec le préventif qui l'alimente et l'audit qui la trace](/schemas/chaine-du-travail.svg)

## La chaîne du travail

Tout part d'un besoin et finit, parfois, par une pièce reçue.

1. **La demande d'intervention** (DI) dit : « il y a quelque chose à faire sur cet
   équipement ». Elle a un demandeur et une description.
2. **L'intervention** naît de la demande. Une demande porte au plus une intervention, et une
   intervention vient toujours d'une demande.
3. **Les tâches** découpent l'intervention en morceaux à faire.
4. **Les actions** sont ce que les techniciens ont réellement fait : temps, nature du
   travail, complexité. C'est l'unité de travail réel de Tunnel.
5. **Les demandes d'achat** (DA) naissent d'une action quand il manque une pièce. Elles
   peuvent aussi se saisir seules, pour réapprovisionner.
6. **Les paniers fournisseurs** regroupent les demandes d'achat par fournisseur. Un panier est
   une **commande fournisseur** : il porte un numéro CMD-….
7. **La réception** clôt le panier. Les demandes d'achat liées passent alors à « Reçu ».

Le temps, la nature du travail, la complexité et les pièces se portent par **l'action**, pas
par l'intervention. Voir [Les actions](/comprendre/actions).

## Ce qui alimente la chaîne

**Le préventif.** Un plan, rattaché à une classe d'équipement, fait naître à échéance une
demande créée par le système. Cette demande suit ensuite le même chemin qu'une demande
humaine. Voir [Le préventif](/comprendre/preventif).

**Les équipements.** Chaque demande et chaque intervention porte sur un équipement. La fiche
équipement rassemble son historique : demandes, interventions, préventif.

## Ce qui trace la chaîne

**L'audit.** Le travail normal se raconte par les actions. Tout changement qui n'en vient pas
(clôturer, rouvrir, annuler, ignorer, rejeter, supprimer) demande un **motif**, choisi dans une liste.
L'auteur et la date sont toujours enregistrés. Voir [Audit et motifs](/comprendre/audit).

**Les codes.** Chaque demande, intervention, demande d'achat et commande porte un code lisible.
Voir [Les codes](/comprendre/codes).

## Qui fait quoi

Les droits exacts sont réglés par l'administrateur (voir
[Rôles et permissions](/administrateur/roles-permissions)). Voici ce que chaque rôle fait
d'habitude.

| Rôle | Ce qu'il fait dans la chaîne |
| --- | --- |
| Technicien | Crée des demandes d'intervention, saisit ses actions, crée des demandes d'achat. Voir [Technicien](/technicien/). |
| Responsable | Traite les demandes, crée et clôt les interventions, répartit les tâches, tient le préventif, lit le bilan. Voir [Responsable](/responsable/). |
| Acheteur | Qualifie les demandes d'achat, les répartit dans les paniers, compare les offres, suit la commande. Voir [Acheteur](/acheteur/). |
| Administrateur | Gère les comptes, les rôles, les référentiels et les règles d'audit. Voir [Administrateur](/administrateur/). |

Deux précisions, vérifiées dans le code :

- seuls le responsable et l'administrateur peuvent déclarer une tâche faite sans action, ou
  annuler une étape obligatoire d'un plan préventif ;
- une clé d'API de machine à machine (rôle MCP) ne fait que lire.

## Les pages de cette section

- [Les codes](/comprendre/codes) : à quoi ressemble chaque code et d'où vient chaque morceau.
- [Interventions et tâches](/comprendre/interventions-taches) : les statuts, la clôture, la
  réouverture.
- [Les actions](/comprendre/actions) : l'unité de travail réel.
- [Le préventif](/comprendre/preventif) : l'échéancier glissant.
- [Achats](/comprendre/achats) : de la demande d'achat à la réception.
- [Le stock et les pièces](/comprendre/stock) : le catalogue qui relie les achats aux fournisseurs.
- [Audit et motifs](/comprendre/audit) : travail routinier ou décision.
