# Commandes fournisseurs

L'onglet **Paniers fournisseurs** de l'écran Demandes d'achat liste les commandes. Un panier
est une commande fournisseur : il porte un numéro (CMD-…), un fournisseur, des lignes et un
statut.

![Paniers fournisseurs](/captures/web-acheteur-commandes-fournisseurs.webp)

## Trouver un panier

La liste est à gauche, le détail à droite. Par défaut, la liste montre les paniers
**actifs** (tout sauf Clôturé et Annulé). Vous pouvez filtrer par statut et par
fournisseur, ou chercher par numéro ou nom de fournisseur.

## Les statuts

| Statut | Signification |
| --- | --- |
| En mutualisation | Panier ouvert : de nouvelles demandes peuvent y entrer. |
| Devis envoyé | Devis envoyé, en attente de réponse. Panier verrouillé. |
| En négociation | Réponse reçue, vous choisissez les lignes retenues. |
| En cours de livraison | Commande passée, en attente de réception. |
| Clôturé | Tout est reçu : fin de vie du panier. |
| Annulé | Commande annulée. |

## Les transitions

Le bouton **Changer le statut** propose uniquement les passages permis.

- En mutualisation vers Devis envoyé ou Annulé.
- Devis envoyé vers En négociation, En cours de livraison, En mutualisation (réouverture : les lignes sont conservées) ou Annulé.
- En négociation vers En cours de livraison ou Annulé.
- En cours de livraison vers Clôturé.
- Clôturé et Annulé sont finaux : plus aucune modification.

Pour passer **En cours de livraison**, il faut au moins une ligne retenue, et chaque
consultation doit avoir un fournisseur retenu. Sinon, Tunnel refuse et explique pourquoi.

## Demander un devis par courriel

1. Sélectionnez le panier.
2. Cliquez sur **Envoyer la demande de devis**.
3. Tunnel prépare le courriel (objet et texte) et ouvre votre messagerie.

Il faut que le fournisseur ait une adresse courriel. Sinon, Tunnel affiche « Aucun email
fournisseur configuré pour cette commande. ». Ce bouton n'envoie rien tout seul et ne change
pas le statut : vous envoyez le courriel depuis votre messagerie, puis vous passez le
panier en « Devis envoyé ». Le bouton **CSV** exporte les lignes retenues en fichier.

## Négocier

Dans les statuts « Devis envoyé » et « En négociation », les lignes deviennent modifiables :

- case à cocher pour **retenir** la ligne ;
- quantité et prix unitaire ;
- date de **livraison prévue** pour tout le panier (bouton Enregistrer).

Le total de chaque ligne et le montant du panier sont calculés par Tunnel. La colonne
« Consultation » montre les autres paniers en concurrence et ouvre le comparateur.

## Réception et clôture

Quand la commande est livrée, passez le panier de « En cours de livraison » à
« Clôturé ». Les demandes d'achat liées passent alors à « Reçu ».

Limites à connaître :

- Tunnel ne propose pas, à l'écran, de saisir les quantités reçues ligne par ligne. La réception se traduit par le changement de statut.
- La réception **n'augmente pas** la quantité en stock : il n'y a pas de gestion de stock (voir [Pièces et fournisseurs](./pieces-fournisseurs)).

## Historique et suppression

L'onglet **Historique** du détail retrace les changements du panier. **Supprimer** efface le
panier et passe par l'audit : une fenêtre vous demande un motif.
