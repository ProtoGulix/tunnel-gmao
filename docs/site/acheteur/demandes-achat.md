# Demandes d'achat

L'écran **Demandes d'achat** (menu, section Stock) a trois onglets : *Demandes d'achat*,
*Paniers fournisseurs* et *Comparateur*. Cette page décrit le premier.

![Liste des demandes d'achat](/captures/web-acheteur-demandes-achat.webp)

## Lire la liste

La liste est à gauche, le détail de la demande sélectionnée à droite. À l'ouverture, la
liste est filtrée sur le statut **À qualifier**.

Vous pouvez :

- chercher par texte ;
- filtrer par **statut** (chaque statut affiche son nombre de demandes) ;
- filtrer par **urgence** : Normal, Haute, Critique ;
- trier la liste ;
- cocher plusieurs demandes pour les supprimer ensemble, si vos droits le permettent.

La sélection est gardée dans l'adresse de la page : vous pouvez la partager.

## Les statuts

Le statut n'est pas saisi, il est **déduit** de la situation de la demande.

| Statut | Signification |
| --- | --- |
| À qualifier | Aucune pièce du catalogue n'est liée. |
| Sans fournisseur | Une pièce est liée, mais elle n'a aucune référence fournisseur. |
| À dispatcher | La pièce a un fournisseur, la demande n'est dans aucun panier. |
| Mutualisation | La demande est dans un panier fournisseur encore ouvert. |
| En chiffrage | Le devis est envoyé, pas encore de réponse. |
| Devis reçu | Au moins un devis est chiffré. |
| Commandé | Une ligne de panier est retenue. |
| Partiellement reçu | Une partie est livrée. |
| Reçu | Un panier lié est clôturé avec la ligne retenue. |
| Refusé | Tous les paniers liés sont annulés ou clôturés sans ligne retenue. |

## Voir le détail

Le détail affiche la demande (quantité, demandeur, atelier, motif, notes, date), l'intervention
liée, la pièce du catalogue et les **paniers fournisseurs** où la demande figure, avec
prix et statut. Un second onglet, **Historique**, retrace les changements.

Si la demande figure dans au moins deux paniers, le bouton **Voir dans le comparateur**
ouvre la comparaison (voir [Répartir et comparer](./repartition)).

## Qualifier une demande

Qualifier, c'est lier la demande à une pièce du catalogue. Sans cela, elle ne peut pas être
répartie.

1. Sélectionnez une demande « À qualifier ».
2. Cliquez sur **Qualifier**.
3. Dans la carte « Pièce catalogue », cherchez la pièce (au moins deux caractères : référence interne, fabricant, référence fabricant), puis cliquez sur **Lier cette pièce**. Si la pièce n'existe pas, cliquez sur **Créer une pièce**.
4. Vérifiez les champs de la demande : désignation, quantité (1 au minimum), unité, urgence, demandeur, atelier, motif, notes. La désignation, la quantité et le demandeur sont obligatoires.
5. Cliquez sur **Enregistrer**.

![Qualifier la demande : informations à gauche, carte Pièce catalogue à droite pour lier ou créer la pièce](/captures/web-acheteur-qualifier.webp)

Le même formulaire, appelé **Modifier**, sert aux demandes déjà qualifiées. On peut aussi
y délier la pièce.

Une demande ne se modifie que tant qu'elle est « À qualifier », « Sans fournisseur » ou
« À dispatcher ». Dès qu'elle est dans un panier actif, le bouton est grisé.

Si la demande reste « Sans fournisseur » après la qualification, ajoutez une référence
fournisseur à la pièce : voir [Pièces et fournisseurs](./pieces-fournisseurs).

## Créer une demande

Le bouton **Nouvelle demande**, en haut de l'écran, ouvre un formulaire. Vous pouvez en
enchaîner plusieurs. L'onglet **Import CSV** de cette fenêtre mène à l'[import CSV](./import-csv).

![Fenêtre Nouvelle demande d'achat : recherche de l'article, quantité, unité, urgence et demandeur](/captures/web-acheteur-demande-achat-creation.webp)

## Supprimer

**Supprimer** efface définitivement la demande. La suppression passe par l'audit : une
fenêtre vous demande un motif. L'intervention, la pièce et les paniers liés ne sont pas
supprimés.
