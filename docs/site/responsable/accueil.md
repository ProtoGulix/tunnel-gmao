# Accueil direction technique

L'accueil de Tunnel dépend du rôle. La vue « Direction technique » est une file de ce qui
attend une décision, avec l'action sur chaque ligne.

![Accueil direction technique : la file à gauche, la demande choisie à droite](/captures/web-direction-accueil.webp)

::: info Qui voit cette vue ?
L'administrateur choisit la vue d'accueil de chaque rôle. Elle s'applique à tous les
utilisateurs du rôle, pas à une personne seule. Si votre accueil est différent, demandez à
l'administrateur de vous affecter la vue « Direction technique ».
:::

## La file à traiter

L'écran a deux panneaux : la file à gauche, le détail de la ligne choisie à droite. On
décide sans quitter l'accueil. Après une décision, la file se met à jour et la ligne
suivante s'affiche. La ligne choisie figure dans l'adresse de la page : un lien copié
rouvre la même ligne.

La file est découpée en sections, dans cet ordre. Une section vide n'est pas affichée ; si
tout est vide, l'écran indique « Rien à traiter. ». Une intervention n'apparaît qu'une fois,
dans la première section qui la cite.

| Section | Ce qu'elle liste | Détail |
| --- | --- | --- |
| Demandes à qualifier | Demandes « nouvelle » et « en attente », les plus anciennes d'abord | La demande, avec Accepter et Rejeter |
| Urgentes | Interventions non fermées de priorité urgente | L'intervention complète |
| En attente | Interventions en attente de pièces ou de production | L'intervention complète |
| Sans action | Interventions non fermées sans action depuis le seuil de relance, les plus anciennes d'abord | L'intervention complète |
| Préventif | Échéances en retard, puis échéances proches | La demande ou l'intervention liée, sinon Lancer en avance |

Chaque ligne d'intervention rappelle, quand c'est le cas, le nombre d'achats non reçus et le
nombre de jours sans action. Le seuil, 7 jours par défaut, est celui des relances (voir les
notifications plus bas). Le panneau d'intervention est le même que dans Interventions :
statut, actions, tâches, achats.

Si votre installation a au moins deux sites (équipements racines), une liste « Tous les
sites » restreint toute la file à un site. Le lien « Toutes les demandes », en bas, ouvre
la liste complète dans Interventions (voir [Traiter les demandes](/responsable/demandes)).

## Qualifier une demande

Chaque demande affiche son code, l'équipement, sa description et son âge en jours. Le badge
**Constat** signale une demande issue d'un constat après intervention. Cliquez la ligne :
le détail montre la demande complète.

- **Accepter** ouvre une fenêtre courte : type d'intervention, technicien, priorité
  (facultative). La validation crée l'intervention. Pour une demande du préventif, le type
  est imposé.
- **Rejeter** demande un motif, dans la fenêtre de motif habituelle. Fermer la fenêtre
  annule le rejet.

Accepter et Rejeter n'apparaissent que si votre rôle a le droit de changer le statut d'une
demande.

## Le préventif

Une échéance qui a déjà sa demande ou son intervention ouvre celle-ci dans le détail. Si sa
demande attend d'être qualifiée, elle n'est listée que dans « Demandes à qualifier ». Sinon,
le détail montre le plan, l'équipement et l'échéance, avec **Lancer en avance** : la demande
du préventif est créée après confirmation, comme sur la fiche équipement (voir
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
