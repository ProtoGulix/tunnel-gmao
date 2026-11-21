# Acheteur

Ce guide s'adresse à la personne qui traite les achats : elle reçoit les demandes d'achat de
l'atelier, les répartit vers les fournisseurs, suit les commandes et tient le catalogue de
pièces.

## Le circuit en bref

1. Une demande d'achat arrive, créée par un technicien, un responsable ou vous.
2. Vous la **qualifiez** : vous la liez à une pièce du catalogue.
3. Vous **dispatchez** : Tunnel la range dans un panier par fournisseur référencé.
4. Vous **comparez** les paniers, retenez une offre et **commandez**.
5. Vous suivez la livraison, puis vous **clôturez** le panier.

## Les pages

- [Accueil acheteur](./accueil) : vos demandes d'achat groupées par avancement.
- [Demandes d'achat](./demandes-achat) : statuts, filtres, qualifier une demande.
- [Répartir vers les paniers et comparer](./repartition) : dispatcher, puis comparer les offres.
- [Commandes fournisseurs](./commandes-fournisseurs) : statuts, négociation, demande de devis par courriel, clôture.
- [Pièces et fournisseurs](./pieces-fournisseurs) : catalogue, références fabricant et fournisseur.
- [Import CSV](./import-csv) : créer plusieurs demandes d'achat depuis un fichier.

## Ce que Tunnel ne fait pas

**Tunnel ne suit pas les quantités en stock.** Le stock de Tunnel est un **catalogue de pièces** : familles, emplacement, références
fabricant et fournisseurs. Il n'y a **aucun mouvement d'entrée ni de sortie** et **aucune
alerte de seuil**. Une action ne retire rien du stock, une réception de commande n'y ajoute
rien. À l'écran, la quantité en stock est affichée « Non suivie ».
