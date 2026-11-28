# Accueil direction technique

L'accueil de Tunnel dépend du rôle. La vue « Direction technique », intitulée **Ce qui attend
votre décision**, montre ce qui demande un choix : les demandes à qualifier, les
interventions bloquées, ce qui s'entasse. On décide sur place, sans ouvrir d'autre page.

![Accueil direction technique : bilan, demandes à trancher, cartes acheteur et production](/captures/web-direction-accueil.webp)

::: info Qui voit cette vue ?
L'administrateur choisit la vue d'accueil de chaque rôle. Elle s'applique à tous les
utilisateurs du rôle, pas à une personne seule. Si votre accueil est différent, demandez à
l'administrateur de vous affecter la vue « Direction technique ».
:::

Si votre installation a au moins deux sites (équipements racines), une liste « Tous les
sites » restreint tout l'écran à un site.

## Le bilan en une ligne

Une ligne résume les demandes à qualifier (statuts « nouvelle » et « en attente ») :

- leur nombre ;
- celles de plus de 90 jours, en rouge, quand il y en a ;
- les entrées et les sorties (acceptées ou rejetées) sur les dernières semaines ;
- la tendance du stock : en hausse, stable ou en baisse.

**Voir le bilan détaillé** déplie le flux (stock, entrées, sorties, courbe par semaine) et
l'âge du stock par tranches, de moins de 7 jours à plus de 90 jours.

![Bilan détaillé déplié : flux des demandes et âge du stock](/captures/web-direction-accueil-bilan.webp)

La tendance est « stable » tant que le stock varie de moins de 3 demandes sur la période.
Aucun chiffre n'est donné par personne.

## À trancher

La liste des demandes à qualifier, dans cet ordre :

1. **Urgentes** : les demandes d'urgence « urgent », quel que soit leur âge ;
2. **> 90 j** (la tranche d'âge la plus ancienne) : cinq lignes, **Voir les N
   autres** déplie le reste ;
3. **Autres** : le reste.

Chaque ligne donne la description (le titre ouvre la demande), le code, l'équipement et
l'âge en jours. Les boutons dépendent de votre rôle et du statut de la demande :

- **Accepter** ouvre une fenêtre courte : type d'intervention, technicien, priorité
  (reprise de l'urgence de la demande, modifiable). La validation crée l'intervention. Pour
  une demande du préventif, le type est imposé.
- **En attente** met la demande de côté ; elle reste dans la liste.
- **Rejeter** demande un motif, dans la fenêtre de motif habituelle. Fermer la fenêtre
  annule le rejet.

Une demande acceptée ou rejetée quitte la liste. Si la décision est refusée, le message
s'affiche en haut de l'écran et la ligne reste.

## À voir avec l'acheteur, à voir avec la production

Deux cartes listent les interventions bloquées depuis au moins N jours, les urgentes
d'abord, puis les plus anciennes. Un clic ouvre l'intervention.

- **À voir avec l'acheteur** : interventions en attente de pièces. Des pastilles disent où
  en sont les demandes d'achat (à qualifier, sans référence fournisseur…).
- **À voir avec la production** : interventions en attente de la production. La pastille
  reprend la note saisie au passage dans ce statut, ou « Aucun motif saisi ».

![Carte « À voir avec la production » : une intervention en attente, avec la note du passage](/captures/web-direction-accueil-blocages.webp)

Le seuil N vaut 7 jours par défaut. Il se règle à l'installation (variable
`BLOCKED_ALERT_DAYS`, voir `deploy/README.md`) ; chaque carte rappelle sa valeur. Une carte
sans intervention le dit : rien ne bloque de ce côté.

## Côté maintenance

Deux liens : les interventions **sans action** depuis le seuil de relance (voir les
notifications plus bas) et les **préventifs en retard**. Ils mènent à la liste concernée.

## Où ça s'entasse

Les demandes à qualifier par site, puis par équipement (code et nom), avec l'âge de la
plus ancienne. Un clic ouvre l'équipement.

## Urgence d'une demande

Chaque demande peut porter une urgence : faible, normale, importante ou urgente. Elle est
facultative. Le demandeur la choisit à la création. Sur une demande nouvelle ou en attente,
la direction peut la changer depuis le détail de la demande ; le changement est tracé dans
l'audit. Voir [Traiter les demandes](/responsable/demandes#urgence-d-une-demande).

## Créer une demande depuis l'accueil

Le bouton **Demande d'inter**, en haut à droite, ouvre la fenêtre « Nouvelle demande
d'intervention ». Renseignez :

1. l'équipement concerné ;
2. le demandeur ;
3. le service (facultatif) ;
4. la description ;
5. l'urgence (facultatif).

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
