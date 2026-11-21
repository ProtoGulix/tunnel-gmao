# Découvrir Tunnel

Tunnel suit le travail de maintenance tel qu'il se fait réellement. Voici les notions
qu'on retrouve partout dans l'outil.

## La chaîne du travail

Demande, intervention, tâches, actions, demandes d'achat, commandes fournisseurs. L'action
est l'unité de travail réel : le temps, la nature du travail, la complexité et les pièces
sont portés par l'action, pas par l'intervention.

## Les notions

**Demande d'intervention.** Toute nouvelle intervention part d'une demande, avec son
demandeur et son équipement. Accepter la demande crée l'intervention ; elle peut aussi être
rejetée.

**Intervention.** Le chantier de maintenance sur un équipement : type, priorité, statut.
Elle se clôt avec ses tâches vérifiées, et peut être rouverte avec un motif.

**Tâche.** Un morceau de l'intervention. Elle vient d'un responsable, d'un technicien ou
d'une étape de gamme préventive, et peut être obligatoire ou facultative.

**Action.** Ce qui a réellement été fait : temps passé (au quart d'heure), nature du travail
(catégorie et sous-catégorie) et complexité de 1 à 10, avec un facteur à préciser au-delà
de 5.

**Demande d'achat.** Elle naît d'une action (ou se saisit seule, pour réapprovisionner) et
suit la commande fournisseur jusqu'à la réception.

**Préventif.** Les plans se définissent par classe d'équipement, avec une gamme d'étapes qui
devient des tâches. L'échéancier est glissant : la prochaine échéance part de la dernière
réalisation. Les interventions sont créées une semaine avant l'échéance.

**Audit.** Chaque changement de statut est journalisé avec son auteur. Toute décision hors
du travail normal (clôture, réouverture, tâche ignorée) exige un motif choisi dans une
liste paramétrable. Le journal ne peut être ni modifié ni effacé par l'application.
