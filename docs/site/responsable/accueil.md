# Accueil direction technique

L'accueil de Tunnel dépend du rôle. La vue « Direction technique » résume l'état des
demandes d'intervention, sans tableau ni colonnes.

![Accueil direction technique, avec les demandes par statut](/captures/web-direction-accueil.webp)

::: info Qui voit cette vue ?
L'administrateur choisit la vue d'accueil de chaque rôle. Elle s'applique à tous les
utilisateurs du rôle, pas à une personne seule. Si votre accueil est différent, demandez à
l'administrateur de vous affecter la vue « Direction technique ».
:::

## Ce que l'écran affiche

Le titre est **Direction technique**, avec le sous-titre « Demandes d'intervention par
statut ».

- **Une pastille par statut.** Chaque pastille compte les demandes : « 11 nouvelle »,
  « 2 en attente », « 9 acceptée », « 78 clôturée » dans la démonstration. Un statut sans
  demande n'est pas affiché.
- **Un avertissement « sans suite ».** Si des demandes « nouvelle » ou « en attente » ont
  plus de 30 jours, l'écran l'indique : « N demandes sans suite depuis plus de 30 jours ».
  Il cite les trois plus anciennes avec leur code et leur âge, puis « et N autre(s) ».
  L'âge se compte depuis la création de la demande.
- **Un lien « Voir toutes les demandes ».** Il ouvre la liste complète, dans
  Interventions, onglet « Demandes d'intervention » (voir
  [Traiter les demandes](/responsable/demandes)).

Si votre installation a au moins deux sites (équipements racines), une liste « Tous les
sites » apparaît en haut à droite et restreint les chiffres à un site.

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
