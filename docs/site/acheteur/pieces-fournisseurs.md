# Pièces et fournisseurs

L'écran **Stock** (menu) tient le catalogue des pièces. Il a trois onglets : *Pièces
référencées*, *Fournisseurs* et *Fabricants*.

![Pièces référencées](/captures/web-acheteur-stock-pieces.webp)

## Une limite à connaître

**Tunnel ne suit pas les quantités en stock.** Le stock de Tunnel est un **catalogue de pièces, pas une gestion de stock**. Il n'y a ni
mouvement d'entrée, ni mouvement de sortie, ni seuil, ni alerte, ni inventaire. La
quantité en stock est affichée « Non suivie ». Dans le formulaire d'une pièce, le champ
quantité est grisé avec la mention « La gestion des quantités n'est pas encore disponible ».

Le catalogue sert à une chose : identifier la pièce à acheter et savoir chez qui l'acheter.

## Pièces référencées

La liste montre, pour chaque pièce, la référence fabricant préférée (étoile), son libellé,
la référence interne (P000001…) et la famille. Vous pouvez chercher par texte et filtrer par
famille et sous-famille. Un clic ouvre la fiche à droite.

La fiche indique la référence interne, la famille, l'**emplacement** et l'unité.
L'emplacement est un texte libre (par exemple « A-23 »).

Avec les droits nécessaires :

- **Nouvelle pièce** (en haut de l'écran) crée une pièce ;
- **Modifier** change ses informations, dont l'emplacement.

Le bouton « Créer une demande d'achat » de la fiche est grisé : créez la demande depuis
l'écran Demandes d'achat.

## Références fabricant

Une pièce peut avoir plusieurs références fabricant (fabricant et référence). L'étoile
marque la référence préférée. Cliquez sur **Ajouter une référence fabricant** pour en
ajouter une.

## Références fournisseur

Sous chaque référence fabricant, le tableau **Fournisseurs** liste où l'acheter : nom du
fournisseur, référence chez le fournisseur, prix, délai en jours et lien vers la fiche
produit si elle existe.

- **Lier un fournisseur** ajoute une ligne (fournisseur existant ou nouvelle référence).
- L'étoile définit le fournisseur préféré.
- Le crayon modifie, la corbeille supprime. La suppression passe par l'audit : une fenêtre demande un motif.

Ces références pilotent le dispatch : tant qu'une pièce n'a aucune référence fournisseur,
ses demandes restent « Sans fournisseur ». Une demande est répartie dans **un panier par
fournisseur référencé** (voir [Répartir et comparer](./repartition)).

## Fournisseurs

L'onglet **Fournisseurs** liste toutes les références fournisseur : fournisseur, référence
interne, fabricant, référence fournisseur. Vous pouvez chercher, filtrer par fournisseur et
ouvrir le détail d'une ligne. **Nouveau fournisseur** (en haut de l'écran) crée un
fournisseur.

L'onglet **Fabricants** tient la liste des fabricants.
