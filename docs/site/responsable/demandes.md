# Traiter les demandes

Toute intervention part d'une demande d'intervention (DI) : un demandeur, un équipement et
une description. Votre rôle est de décider de la suite : l'accepter en créant
l'intervention, ou la rejeter.

![Accueil direction technique : les demandes comptées par statut](/captures/web-direction-accueil.webp)

## Où les trouver

Ouvrez **Interventions**, puis l'onglet **Demandes d'intervention**. Vous pouvez aussi
cliquer sur « Voir toutes les demandes » depuis l'[accueil](/responsable/accueil).

- À gauche, la liste, avec une recherche. Par défaut elle masque les demandes clôturées et
  rejetées ; le commutateur **Voir les archivées (clôturées)** n'affiche que celles-là.
- À droite, le détail de la demande sélectionnée : code, statut, équipement (le code mène à
  la fiche équipement), date, demandeur et service, description, type d'intervention
  suggéré, puis l'**Historique** des changements de statut.
- Une demande créée par le préventif porte la mention « Générée automatiquement — moteur
  préventif ».

![Détail d'une demande créée par le préventif : Système préventif, Générée automatiquement, type suggéré Préventif, boutons Rejeter et Supprimer, historique](/captures/web-direction-demande-preventive.webp)

![Onglet Demandes d'intervention : la liste des demandes avec leur statut, et la zone de détail à droite](/captures/web-direction-demandes.webp)

## Les statuts

![Cycle de vie d'une demande d'intervention et de l'intervention liée : la création de l'intervention accepte la demande, la clôture de l'intervention clôt la demande, la réouverture la remet à acceptée](/schemas/cycle-demande-intervention.svg)

| Statut | Sens |
| --- | --- |
| Nouvelle | La demande vient d'arriver. |
| En attente | La demande est mise de côté. |
| Acceptée | Une intervention a été créée à partir d'elle. |
| Rejetée | La demande est refusée. Statut final. |
| Clôturée | L'intervention liée est terminée. Statut final. |

Les passages permis sont : nouvelle vers en attente, acceptée ou rejetée ; en attente vers
acceptée ou rejetée ; acceptée vers clôturée. Une demande rejetée ou clôturée ne change
plus.

::: warning Mettre en attente
Le statut « En attente » existe et l'API l'autorise, mais l'écran web ne propose pas de
bouton pour y passer une demande. Pour l'instant, vous pouvez accepter ou rejeter.
:::

## Accepter : créer l'intervention

Dans Tunnel, on n'accepte pas une demande avec un bouton « Accepter ». **Accepter, c'est
créer l'intervention liée.** La demande passe alors « acceptée », et son historique garde
la trace.

Le titre de l'intervention reprend la description de la demande, coupée à 200 caractères
au besoin ; le texte complet reste sur la demande.

1. Cliquez sur **Nouvelle intervention** (page Interventions) ou sur **Créer inter** dans
   la [Coordination](/responsable/coordination).
2. Cherchez l'équipement. La colonne de gauche liste ses **Demandes ouvertes**.
3. Cliquez sur la demande à traiter. Son résumé remplace le formulaire de demande, et le
   type suggéré, s'il existe, est proposé.
4. Choisissez la **date de prise en charge** et le **technicien pilote** (obligatoires), le
   **type** (obligatoire) et la **priorité**.
5. Cliquez sur **Enregistrer**.

![Fenêtre Nouvelle intervention : la demande choisie à gauche, son résumé à droite, puis date, technicien pilote, type et priorité](/captures/web-direction-intervention-creation.webp)

Le type ne peut pas être changé quand la demande vient du préventif et en impose un : le
champ indique « Type imposé par la demande ».

Les règles côté API : une demande ne se lie qu'à **une seule** intervention, et une
intervention vient toujours d'une demande. Si vous ne choisissez aucune demande, le
formulaire vous fait saisir le demandeur et la description : la demande et l'intervention
sont alors créées ensemble, sans notification. Voir
[Interventions et tâches](/responsable/interventions-taches).

## Rejeter

Sur une demande « nouvelle » ou « en attente », le bouton **Rejeter** apparaît dans le
détail.

1. Cliquez sur **Rejeter**.
2. La fenêtre « Raison de la modification » s'ouvre : le rejet exige toujours un motif.
   Choisissez-le dans la liste des motifs de rejet (hors du périmètre de la maintenance,
   doublon, déjà traité, demande incomplète, autre raison). Avec « Autre raison », la
   **Précision** devient obligatoire.
3. Cliquez sur **Confirmer**.

![Fenêtre de motif du rejet, avec la liste des motifs de rejet](/captures/web-direction-demande-rejet.webp)

Le texte de la précision est copié dans l'**Historique** de la demande. Une demande
préventive rejetée marque son occurrence comme « Ignorée ».

Ce motif est obligatoire quelle que soit la règle d'audit de votre installation. Voir
[Audit et motifs](/responsable/audit-motifs).

## Demande issue d'un constat

Le principe, en un schéma : [Le constat](/comprendre/constats).

Un constat saisi à la clôture d'une intervention crée une demande sur la machine visée, si
un levier choisi la génère (réglage du référentiel ; **Rien ne l'aurait évité** n'en crée pas,
le constat s'affiche alors **Sans demande**). Le
détail garde la présentation des autres demandes : sous le demandeur, **Constat de** et le code
de l'intervention d'origine (lien) ; dans le cadre, les réponses par question à la place du
texte brut. L'historique donne l'auteur de chaque changement. Une telle demande ne se supprime
pas.

![Demande issue d'un constat : lien vers l'intervention d'origine, réponses du constat par question, type suggéré Préventif, bouton Rejeter](/captures/web-direction-demande-constat.webp)

Le **type d'intervention suggéré** vient du premier choix typé du constat : tâche régulière
donne préventif, projet ou modification donne projet (une idée d'amélioration). Sans choix
typé, la demande n'a pas de type et attend votre tri. Acceptez ou rejetez comme toute demande.

Si la machine a des idées d'amélioration ouvertes, la demande propose **Idée d'amélioration
ouverte**. Choisissez-en une, puis **Rattacher** : le constat garde le lien, et la demande
est rejetée avec le motif « Doublon d'une demande existante ». Rattachement : responsable et
administrateur, tant que la demande peut être rejetée.

![Demande issue d'un constat sur MO-02, avec l'idée d'amélioration ouverte choisie et le bouton Rattacher](/captures/web-direction-demande-rattacher.webp)

## Supprimer une demande

Le bouton **Supprimer** est réservé aux erreurs de saisie et aux doublons. Il n'apparaît
que si la demande n'a pas d'intervention liée. La suppression est **définitive**, et un
motif est toujours demandé.

![Confirmation Supprimer la demande](/captures/web-direction-demande-supprimer.webp)

## Clôturer : pas de bouton

La demande ne se clôture pas à la main. Elle se clôture quand l'intervention liée est
clôturée. Tant que l'intervention est ouverte, l'API répond : « Clore l'intervention : elle
clôturera la demande. ». Si l'intervention est rouverte, la demande repasse « acceptée ».
