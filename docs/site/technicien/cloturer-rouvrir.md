# Clore ou rouvrir une intervention

Clore, rouvrir ou annuler une tâche sont des décisions hors du travail normal. Tunnel
demande alors un **motif**, choisi dans une liste. Le motif et son auteur sont conservés
dans le journal d'audit.

![Détail d'une intervention sur le mobile](/captures/mobile-technicien-intervention.webp)

## Clore, sur le mobile

Deux chemins mènent à la clôture.

**Après la dernière tâche.** Quand une action termine la dernière tâche ouverte, une
fenêtre « Dernière tâche terminée » demande : « Clore l'intervention ? ». Touchez **Oui,
clore l'intervention**, ou **Non, laisser ouverte** : dans ce cas rien ne change. Cette
proposition n'apparaît que si votre rôle a le droit de modifier une intervention.

**À la main.** Dans le détail de l'intervention, touchez **Statut**, puis le statut de
clôture dans la feuille « Changer le statut ». La même confirmation s'affiche.

### Le motif

Si les règles d'audit exigent un motif, la feuille « Pourquoi clore cette intervention ? »
liste les motifs disponibles. Touchez-en un. Certains motifs demandent de préciser en
texte (« Précisez le motif… ») : saisissez-le, puis touchez **Valider**. Les motifs sont
ceux que l'administrateur a paramétrés ; vous n'en saisissez pas de votre côté.

Si Tunnel refuse la clôture, le message du serveur s'affiche dans la fenêtre.

### Le constat

Pour certains types d'intervention (le curatif, par défaut), un **constat** est obligatoire
avant de clore. Si aucun n'existe, le formulaire « Constat » s'ouvre avant la confirmation.

Répondez en touchant des cases, sans rien écrire :

- « Qu'est-ce qui aurait réduit ou évité cet arrêt ? » : un ou plusieurs choix. Chaque choix
  peut ouvrir une question de détail (fréquence, domaines, paramètres…). **Rien ne l'aurait
  évité** se coche seul : le cocher décoche les autres choix, et inversement.
- « Signal visible avant la panne ? ».
- **Équipement** : celui de l'intervention, modifiable.

Touchez **Envoyer**. La clôture se poursuit ensuite. Tunnel refuse de clore sans constat,
par tous les chemins.

Seuls certains leviers créent une demande d'intervention sur la machine visée (réglage du
référentiel) ; le responsable décide de la suite. Sans levier concerné, le constat reste
enregistré **Sans demande**.

### Ajouter un constat après la clôture

Dans la fiche de l'intervention, le bouton **Constat** ouvre le même formulaire. Il est
accepté après la clôture, et masqué si l'intervention est archivée. Plusieurs constats sont
possibles ; chacun garde son auteur.

## Rouvrir

Ouvrez l'intervention fermée, touchez **Statut**, puis choisissez un autre statut. La
feuille « Pourquoi rouvrir cette intervention ? » demande le motif. Une fois confirmé,
l'intervention reprend le statut choisi.

Une intervention archivée (mention « Archivée ») ne se rouvre pas : le statut n'est plus
proposé. Créez une nouvelle intervention pour reprendre le travail.

## Annuler une tâche

Dans la liste des tâches d'une intervention, le bouton **Annuler** met la tâche de côté. La
feuille « Pourquoi annuler cette tâche ? » demande un motif. Le motif s'affiche ensuite sous
la tâche.

Sur une tâche terminée ou annulée, le bouton **Remettre à faire** la rouvre, avec un motif
(« Pourquoi remettre à faire ? »).

Une tâche se termine par une action liée, pas par un bouton (voir
[Saisir une action](/technicien/saisir-une-action)).

## Sur le web

Dans le panneau de détail d'une intervention, le statut se change depuis l'en-tête. Il
reste modifiable une fois l'intervention fermée : rouvrir exige un motif, demandé par
une fenêtre de motif.

Quand vous enregistrez une action sur une intervention ouverte, une fenêtre propose de clore
l'intervention dans le même geste ; « Non, laisser ouverte » enregistre seulement l'action.

### Le constat, sur le web

Si le type exige un constat et qu'il manque, **Oui, clôturer** ouvre d'abord le formulaire
de constat, puis clôt. Depuis l'en-tête, **Clôturer** ouvre le même formulaire dans la
fenêtre « Constat avant clôture ». Si Tunnel refuse, le message s'affiche.

L'onglet **Constats** de l'intervention liste les constats, numérotés. Chacun montre ses
réponses par question puis, sous un trait, sa **demande liée** (code et statut), le **motif** de
son dernier changement (**motif du rejet** en rouge), avec qui l'a pris et quand, et son **commentaire**, l'**intervention créée** ou l'idée à
laquelle il est **rattaché** ; le cadre prend la couleur du statut. **Ajouter** en crée un autre (hors
intervention archivée).

### Corriger un constat

**Corriger** ouvre le formulaire pré-rempli. La fenêtre de motif propose « Correction ». La
nouvelle version remplace la précédente, qui reste dans le journal d'audit. Seuls l'auteur,
le responsable et l'administrateur corrigent, tant que la demande issue du constat est
« nouvelle ». Un constat sans demande se corrige tant que l'intervention n'est pas archivée ;
si la nouvelle version l'exige, la demande est alors créée.
