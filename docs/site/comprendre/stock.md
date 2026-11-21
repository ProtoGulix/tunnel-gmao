# Le stock et les pièces

Le stock de Tunnel est un **catalogue de pièces** : il dit quelles pièces l'atelier
utilise, où elles se rangent, qui les fabrique et chez qui les acheter. C'est ce catalogue
qui relie une demande d'achat à un fournisseur. Ce n'est pas une gestion de stock : Tunnel
ne suit pas les quantités.

![Le modèle des pièces : une pièce classée par famille et sous-famille, ses références fabricant, les références fournisseur rattachées à chaque référence fabricant, et la demande d'achat liée à la pièce](/schemas/modele-pieces.svg)

## La pièce

Chaque pièce reçoit une **référence interne** générée par Tunnel : la lettre `P` suivie de
six chiffres (par exemple `P000001`, voir [Les codes](/comprendre/codes)). Elle porte :

- une **famille** et une **sous-famille**, obligatoires, choisies dans les listes de
  l'atelier (roulements, pneumatique, électrique…) ;
- une **unité** (pièce, mètre, boîte…) ;
- un **emplacement** en texte libre (« Magasin A3 », « Armoire élec. 2 »).

## Références fabricant et fournisseur

Une même pièce peut se trouver sous plusieurs références, d'où deux niveaux :

- **Références fabricant** : le fabricant et sa référence, avec un libellé. Une pièce peut
  en avoir plusieurs ; l'une est **préférée**.
- **Références fournisseur** : chacune est rattachée à une référence fabricant et dit chez
  quel fournisseur l'acheter, sous quelle référence, à quel prix, avec quel minimum de
  commande et quel délai. L'une est **préférée**.

Les fournisseurs eux-mêmes (nom, contact, courriel) sont tenus à part, dans l'onglet
Fournisseurs de l'écran Stock.

## Le lien avec les achats

Une demande d'achat est liée à une pièce du catalogue. C'est ce lien qui fait avancer son
statut (voir [Achats](/comprendre/achats)) :

- **À qualifier** : la demande n'est liée à aucune pièce. L'acheteur la qualifie en liant
  une pièce existante (« Lier cette pièce ») ou en en créant une (« Créer une pièce »).
- **Sans fournisseur** : la pièce n'a encore aucune référence fournisseur.
- Ensuite, la **répartition** place la demande dans un panier pour chaque fournisseur
  référencé sur la pièce ; les lignes de commande reprennent la référence fournisseur et
  le fabricant.

Plus le catalogue est complet, moins l'acheteur a de demandes à qualifier.

## Ce que Tunnel ne fait pas

- **Pas de suivi des quantités** : l'écran affiche la quantité comme « Non suivie ». Aucune
  action ne retire de pièce du stock, aucune réception n'en ajoute.
- **Pas de mouvements** d'entrée ou de sortie, **pas d'inventaire**, **pas de seuil** ni
  d'alerte de réapprovisionnement.

Le réapprovisionnement se fait par une demande d'achat saisie à la main (voir
[Demandes d'achat](/acheteur/demandes-achat)).

Pour les écrans : [Pièces et fournisseurs](/acheteur/pieces-fournisseurs).
