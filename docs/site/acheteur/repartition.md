# Répartir vers les paniers et comparer

Une fois qualifiées et dotées d'un fournisseur, les demandes se répartissent dans des
**paniers fournisseurs**. Un panier regroupe les lignes à demander ou à commander à un même
fournisseur.

![Demandes d'achat à dispatcher](/captures/web-acheteur-demandes-achat.webp)

## Dispatcher

Le bouton **Dispatcher (n)** apparaît en haut de l'écran Demandes d'achat, dans l'onglet
*Demandes d'achat*, quand n demandes sont « À dispatcher » et que vos droits le permettent.
Il se rafraîchit toutes les 30 secondes.

1. Cliquez sur **Dispatcher (n)**. Une fenêtre **Aperçu du dispatch** s'ouvre.
2. Pour chaque demande, vous voyez le ou les paniers qu'elle rejoindra. Un panier marqué « nouveau panier » sera créé.
3. Décochez les demandes à écarter. Elles restent « À dispatcher ».
4. Une demande qui ne peut pas être répartie (par exemple : aucun fournisseur référencé) est signalée en rouge et ne peut pas être cochée.
5. Cliquez sur **Confirmer le dispatch**.

Comment Tunnel répartit :

- la demande entre dans **un panier par fournisseur référencé** pour sa pièce. Avec trois fournisseurs, elle figure dans trois paniers : c'est une consultation ;
- si un panier **ouvert** existe déjà pour ce fournisseur (statut « En mutualisation »), la demande y est ajoutée. Sinon, un panier est créé.

L'écran le rappelle : le dispatch **n'est pas réversible depuis cet écran**. Pour retirer une
demande d'un panier, passez par l'onglet *Paniers fournisseurs*.

## Comparer les offres

L'onglet **Comparateur** met les paniers côte à côte : une ligne par article, une colonne
par panier.

1. Ouvrez le comparateur de deux façons : par le bouton **Voir dans le comparateur** du détail d'une demande, ou par l'onglet lui-même, en choisissant les paniers (colonne d'ajout).
2. Le tableau montre, pour chaque article et chaque panier, l'offre : prix, délai.
3. Le crayon d'une carte permet de modifier le prix et le délai.
4. Cliquez sur une carte pour **retenir** cette offre.

Le repère « Meilleur prix ou délai » ne compare que les paniers réellement chiffrés. Si deux
paniers n'ont aucun article en commun, Tunnel l'indique.

La suite se passe dans le panier retenu : voir [Commandes fournisseurs](./commandes-fournisseurs).
