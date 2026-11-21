# Clore ou rouvrir une intervention

Clore, rouvrir ou ignorer une tâche sont des décisions hors du travail normal. Tunnel
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

## Rouvrir

Ouvrez l'intervention fermée, touchez **Statut**, puis choisissez un autre statut. La
feuille « Pourquoi rouvrir cette intervention ? » demande le motif. Une fois confirmé,
l'intervention reprend le statut choisi.

## Ignorer une tâche

Dans la liste des tâches d'une intervention, le bouton **Ignorer** met la tâche de côté. La
feuille « Pourquoi ignorer cette tâche ? » demande un motif. Le motif s'affiche ensuite sous
la tâche.

Sur une tâche terminée ou ignorée, le bouton **Remettre à faire** la rouvre. Ce geste ne
demande pas de motif.

Une tâche se termine par une action liée, pas par un bouton (voir
[Saisir une action](/technicien/saisir-une-action)).

## Sur le web

Dans le panneau de détail d'une intervention, le statut se change depuis l'en-tête. Il
reste modifiable une fois l'intervention fermée : rouvrir exige un motif, demandé par
une fenêtre de motif.

Quand vous enregistrez une action sur une intervention ouverte, une fenêtre propose de clore
l'intervention dans le même geste ; « Non, laisser ouverte » enregistre seulement l'action.
