# Tunnel GMAO

> Ne vous contentez pas de gérer votre maintenance. Faites-la progresser.

GMAO (gestion de maintenance assistée par ordinateur) open source pour les PME
industrielles de 10 à 100 machines et les équipes de maintenance de 1 à 10
personnes. Tunnel fait passer une maintenance tenue sur Excel, Access ou papier à une
maintenance structurée et traçable. L'action est l'unité de travail réel : temps,
complexité et pièces sont tracés là où le travail se fait.

> Version 5.12.1. Installation : voir `deploy/README.md`. Présentation : <https://frezille.fr>.
> Guide utilisateur : <https://tunnel.frezille.fr/docs/>.

Essayer sans rien installer : <https://demo.frezille.fr>, données fictives, un compte par
rôle (identifiants sur <https://frezille.fr/demo>), réinitialisée chaque nuit. Pour monter
sa propre démo : `deploy/demo/README.md`.

## Ce que fait Tunnel

Uniquement ce qui est livré ; le détail et la preuve de chaque point sont dans le
[cahier fonctionnel](docs/cahier-fonctionnel.md).

- **Interventions** : toute nouvelle intervention part d'une demande, avec son demandeur
  et son équipement ; elle se découpe en tâches, et chaque tâche en actions réellement
  faites. Chaque action enregistre son temps (au quart d'heure), la nature du travail
  (catégorie et sous-catégorie) et sa complexité de 1 à 10, avec un facteur au-delà de 5.
- **Traçabilité** : chaque changement de statut est journalisé avec son auteur ; une
  décision hors du travail normal (clôture, réouverture, rejet d'une demande, tâche
  ignorée…) exige un motif
  choisi dans une liste paramétrable ; le journal d'audit ne peut être ni modifié ni
  effacé par l'application.
- **Préventif** : plans par classe d'équipement, avec une gamme d'étapes qui devient des
  tâches ; échéancier glissant (la prochaine échéance part de la dernière réalisation) ;
  interventions créées une semaine avant l'échéance ; retards et interventions sans
  action depuis 7 jours notifiés ; lancement en avance, avec l'avance ou le retard mesuré.
- **Équipements** : arborescence jusqu'à 4 niveaux ; une fiche par équipement (santé,
  préventif, historique, évolution sur 12 mois).
- **Pilotage** : bilan du service (charge, organisation du travail, audit, qualité des
  données), sans aucun chiffre individuel par technicien ; un accueil par rôle
  (technicien, acheteur, direction technique) ; droits réglés par rôle, endpoint par
  endpoint.
- **Terrain** : interface mobile pour les techniciens, servie sous `/m`.
- **Achats et pièces** : les demandes d'achat naissent des actions, sont réparties en
  paniers par fournisseur et suivent la commande jusqu'à la réception ; catalogue de
  pièces (familles, emplacement, références fabricant et fournisseurs), sans suivi des
  quantités en stock.

Ce qui vient (constats structurés, analyse du responsable, puis exploitation des
constats) est décrit à part dans le cahier fonctionnel : rien de cela n'est encore livré.

## Contenu

- `backend/` : API FastAPI + PostgreSQL, source de vérité unique
- `web/` : front web (bureau, responsables, acheteurs)
- `mobile/` : front mobile des techniciens, servi sous `/m`
- `deploy/` : installation par Docker Compose, mise à jour, sauvegarde
- `docs/` : philosophie, cahier fonctionnel, décisions d'architecture, guides

## Sécurité

Tunnel sert du HTTP. Une instance accessible hors du réseau de l'usine doit
toujours être placée derrière un proxy HTTPS (ADR 0006).

## Licence

AGPL-3.0. Les données appartiennent à l'entreprise qui les produit : aucune
collecte, aucune transmission vers l'extérieur.

Tunnel GMAO est édité par Frézille (<https://frezille.fr>).
