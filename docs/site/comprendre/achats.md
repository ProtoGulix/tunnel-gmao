# Achats : demandes d'achat et paniers fournisseurs

Quand une pièce manque, Tunnel suit le besoin de la **demande d'achat** (DA) jusqu'à la
**commande fournisseur**. Le statut d'une DA n'est jamais saisi : il se **déduit** de ce qui
se passe dans les paniers.

![De la demande d'achat à la réception : la demande, la pièce et ses références, la répartition en paniers par fournisseur, le devis, la commande, la réception](/schemas/chaine-achats.svg)

## La demande d'achat

Une DA naît de deux façons :

- **depuis une action** : une pièce manque pendant une intervention. La DA reste liée à cette
  action ;
- **de façon autonome** : un réapprovisionnement spontané, sans action ni intervention.

Elle porte un article, une quantité, une unité, une urgence, un demandeur et une raison.
Elle a un code `DA-AAAA-NNNN` (voir [Les codes](/comprendre/codes)).

Une DA ne se modifie plus dès qu'elle est entrée dans un panier. Elle reste éditable tant
qu'elle est « À qualifier », « Sans fournisseur » ou « À dispatcher » (voir
[Demandes d'achat](/acheteur/demandes-achat)).

## La pièce et ses références

Pour être répartie, une DA doit être liée à une **pièce du catalogue**. C'est la
**qualification**.

Une pièce porte :

- une **référence interne** générée (`P000123`) ;
- des **références fabricant** : un fabricant et sa référence, l'une pouvant être
  « préférée » ;
- des **références fournisseur**, rattachées à une référence fabricant : le fournisseur, sa
  référence, le prix, le minimum de commande, le délai, l'une pouvant être « préférée ».

Voir [Pièces et fournisseurs](/acheteur/pieces-fournisseurs).

## Les statuts dérivés d'une demande d'achat

Tunnel calcule le statut à partir de la pièce et des lignes de panier. Les règles
s'appliquent **dans cet ordre** : la première qui convient donne le statut.

| Statut | Ce qui le fait apparaître |
| --- | --- |
| À qualifier | Aucune pièce du catalogue n'est liée. |
| Sans fournisseur | Une pièce est liée, mais elle n'a aucune référence fournisseur. |
| À dispatcher | La pièce a un fournisseur, mais la demande n'est dans aucun panier. |
| Refusé | Tous ses paniers sont annulés ou clôturés, et aucune ligne n'est retenue. |
| Reçu | Un panier clôturé contient la ligne retenue, ou la quantité reçue atteint la quantité demandée. |
| En chiffrage | Un panier est envoyé ou en négociation, sans devis reçu ni ligne retenue. |
| Partiellement reçu | Une quantité reçue est enregistrée, sans que tout soit reçu. |
| Commandé | Une ligne de panier est retenue. |
| Devis reçu | Au moins un devis est marqué reçu. |
| Mutualisation | Dans tous les autres cas : la demande est dans un panier encore ouvert. |

Source : la vue `purchase_request_derived_status` (`backend/db/schema.sql`) et les libellés
de `DERIVED_STATUS_CONFIG` (`backend/api/constants.py`).

## La répartition, ou dispatch

Le **dispatch** place les demandes « À dispatcher » dans des paniers fournisseurs. C'est
l'acheteur qui le déclenche, après un aperçu en lecture seule.

![Le dispatch : une demande d'achat entre dans un panier par fournisseur référencé, en réutilisant le panier ouvert de ce fournisseur s'il existe](/schemas/dispatch-paniers.svg)

Les règles :

- la demande entre dans **un panier par fournisseur référencé** pour sa pièce. Avec trois
  fournisseurs, elle figure dans trois paniers : c'est une **consultation**. Le fournisseur
  « préféré » ne change que l'ordre de traitement, pas le nombre de paniers ;
- la **mutualisation** : si un panier **ouvert** existe déjà pour ce fournisseur, la demande y
  est ajoutée. Sinon, un panier est créé. Dans un même panier, une même pièce occupe une
  seule ligne, dont la quantité s'additionne ;
- une demande qui ne peut pas être répartie (pièce non liée, aucun fournisseur référencé) est
  signalée et ne s'écrit pas. Les demandes écartées dans l'aperçu restent « À dispatcher » ;
- chaque panier ou ligne créé laisse un événement du système.

Voir [Répartir et comparer](/acheteur/repartition).

## Le panier fournisseur

Un panier est une **commande fournisseur**. Son numéro est `CMD-AAAAMMJJ-NNNN`. Il a un
fournisseur, des lignes, et un statut.

![Statuts d'un panier fournisseur et passages permis : En mutualisation, Devis envoyé, En négociation, En cours de livraison, Clôturé, Annulé](/schemas/statuts-panier.svg)

| Statut | Sens | Passages possibles |
| --- | --- | --- |
| En mutualisation | Panier ouvert : de nouvelles demandes peuvent y entrer. | Devis envoyé, Annulé |
| Devis envoyé | Devis envoyé au fournisseur, en attente. Panier verrouillé. | En négociation, En cours de livraison, En mutualisation (réouverture), Annulé |
| En négociation | Réponse reçue : on choisit les lignes retenues. | En cours de livraison, Annulé |
| En cours de livraison | Commande passée, en attente de réception. | Clôturé |
| Clôturé | Tout est reçu. Statut final. | Aucun |
| Annulé | Commande annulée. Statut final. | Aucun |

Source : `ALLOWED_TRANSITIONS` dans `backend/api/supplier_orders/validators.py` et
`SUPPLIER_ORDER_STATUS_CONFIG` dans `backend/api/constants.py`.

Pour passer **En cours de livraison**, il faut :

1. au moins une ligne **retenue** ;
2. pour chaque article en **consultation** (présent dans plusieurs paniers), une ligne retenue
   quelque part.

Sinon Tunnel refuse et explique pourquoi.

## Devis et comparateur

Une ligne de panier porte la quantité, le prix, le délai de livraison, un indicateur
**devis reçu** et un indicateur **ligne retenue**. Pendant « Devis envoyé » et « En
négociation », l'acheteur renseigne les offres et retient une ligne par article.

Le **comparateur** met les paniers côte à côte, une ligne par article, une colonne par
panier, pour choisir l'offre à retenir. Voir [Commandes fournisseurs](/acheteur/commandes-fournisseurs).

## La réception

Quand la commande est livrée, le panier passe de « En cours de livraison » à « Clôturé ».
Les demandes d'achat liées passent alors à « Reçu ». Le panier n'envoie pas de courriel tout
seul : l'acheteur prépare le courriel de demande de devis depuis Tunnel et l'envoie depuis sa
messagerie.

L'écran ne propose pas de saisir les quantités reçues ligne par ligne (voir
[Commandes fournisseurs](/acheteur/commandes-fournisseurs)) ; la réception se traduit par le
changement de statut du panier.

## La limite : pas de suivi de quantités en stock

Le stock de Tunnel est un **catalogue de pièces**, pas une gestion de stock. Il garde les
familles, l'emplacement, les références fabricant et fournisseur. Il ne suit **ni quantités,
ni mouvements d'entrée et de sortie**. Aucune action ne décrémente de quantité, aucune
réception ne l'incrémente, et il n'y a ni seuil, ni alerte, ni inventaire. La réception d'une
commande ne change donc aucune quantité en stock.
