# Accueil direction technique

L'accueil de Tunnel dépend du rôle. La vue « Direction technique » fait d'abord le bilan des
demandes d'intervention à qualifier : est-ce que le stock monte, depuis quand il attend, où
il s'entasse. Un clic ouvre la liste concernée pour décider sur place.

![Accueil direction technique : flux, âge et lieux des demandes, puis les tuiles](/captures/web-direction-accueil.webp)

::: info Qui voit cette vue ?
L'administrateur choisit la vue d'accueil de chaque rôle. Elle s'applique à tous les
utilisateurs du rôle, pas à une personne seule. Si votre accueil est différent, demandez à
l'administrateur de vous affecter la vue « Direction technique ».
:::

## Le bilan des demandes

Le stock, ce sont les demandes « nouvelle » et « en attente ». Une demande en sort quand elle
est acceptée ou rejetée.

- **Flux** : le stock actuel, sa courbe sur 8 semaines et sa tendance (en hausse, stable,
  en baisse) ; les entrées et les sorties (acceptées, rejetées) sur la période.
- **Âge** : le stock par tranches d'ancienneté, de moins de 7 jours à plus de 90 jours. La
  tranche la plus ancienne passe en rouge dès qu'elle contient une demande.
- **Où** : le stock par site, puis par équipement (code et nom), avec l'âge de la plus
  ancienne demande. Cinq lignes par liste ; **Voir tout** déplie le reste.

La tendance est « stable » tant que le stock varie de moins de 3 demandes sur la période.

Sous le bilan, un bandeau d'une tuile par sujet : **Urgentes** (interventions non fermées de priorité
urgente), **En attente** (pièces ou production), **Sans action** (depuis le seuil de relance,
7 jours par défaut, voir les notifications plus bas), **Préventif** (échéances en retard ou
proches). Une intervention n'est comptée qu'une fois, dans la première tuile qui la cite.

Si votre installation a au moins deux sites (équipements racines), une liste « Tous les
sites » restreint le bilan et les tuiles à un site.

## Ouvrir une liste

Cliquez le stock, une tranche d'âge, un site, un équipement ou une tuile : le bilan se
replie en une ligne de rappel (stock, tranche la plus ancienne, tuiles, filtre actif) et la
liste prend la hauteur de l'écran. La liste est à gauche, le détail de la ligne choisie à
droite : on décide sans quitter l'accueil, puis la ligne suivante s'affiche. Un clic sur la
ligne de rappel ou sur le filtre actif rouvre le bilan. Le filtre et la ligne choisie figurent dans
l'adresse de la page : un lien copié rouvre la même vue.

![Liste des demandes de 7 à 30 jours, demande choisie à droite](/captures/web-direction-accueil-liste.webp)

Le lien « Toutes les demandes » ouvre la liste complète dans Interventions (voir
[Traiter les demandes](/responsable/demandes)).

## Qualifier une demande

Chaque demande affiche son code, l'équipement, sa description et son âge en jours. Le badge
**Constat** signale une demande issue d'un constat après intervention.

- **Accepter** ouvre une fenêtre courte : type d'intervention, technicien, priorité
  (facultative). La validation crée l'intervention. Pour une demande du préventif, le type
  est imposé.
- **Rejeter** demande un motif, dans la fenêtre de motif habituelle. Fermer la fenêtre
  annule le rejet.

Accepter et Rejeter n'apparaissent que si votre rôle a le droit de changer le statut d'une
demande. Une intervention choisie s'affiche dans le même panneau que dans Interventions.

## Le préventif

Une échéance qui a déjà sa demande ou son intervention ouvre celle-ci dans le détail. Si sa
demande attend d'être qualifiée, elle n'est comptée que dans les demandes. Sinon, le détail
montre le plan, l'équipement et l'échéance, avec **Lancer en avance** : la demande du
préventif est créée après confirmation, comme sur la fiche équipement (voir
[Lancer en avance](/responsable/preventif#lancer-en-avance)). Le bouton n'apparaît qu'avec
le droit correspondant.

## Créer une demande depuis l'accueil

Le bouton **Demande d'inter**, en haut à droite, ouvre la fenêtre « Nouvelle demande
d'intervention ». Renseignez :

1. l'équipement concerné ;
2. le demandeur ;
3. le service (facultatif) ;
4. la description.

La demande est créée au statut « nouvelle » et signale une notification « à traiter ».
Vous, qui l'avez créée, n'êtes pas notifié de votre propre demande.

## Les notifications

![Haut du menu : la cloche Notifications avec son compteur de non lues](/captures/web-direction-notifications-zone.webp)

La cloche **Notifications** se trouve en haut du menu de gauche, avec le nombre de
notifications non lues. Vous y recevez :

- les nouvelles demandes à traiter ;
- les préventifs en retard ;
- les interventions sans action depuis 7 jours.

Un préventif en retard ou une intervention sans action est rappelé chaque semaine. Dans
le panneau, vous pouvez « Tout marquer comme lu », « Supprimer les lues » ou « Tout
supprimer ». Un courriel part seulement pour une nouvelle demande, et seulement si
l'envoi de courriels est configuré sur votre installation.

![Panneau des notifications ouvert, avec Tout marquer comme lu et Tout supprimer](/captures/web-direction-notifications-panneau.webp)
