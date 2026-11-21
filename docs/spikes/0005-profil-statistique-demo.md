# Spike 0005. Profil statistique de la production pour la base de démonstration

- Date : 2026-11-21 (fiche DEMO-03, ADR 0036 point 1)
- Source : base de dev (copie de la production), lue par l'agent principal en lecture seule
  (`PGOPTIONS=-c default_transaction_read_only=on`), requêtes d'agrégats uniquement :
  [0005-profil-statistique-demo.sql](0005-profil-statistique-demo.sql)
- Règle : chiffres arrondis seulement ; aucun texte, nom, code d'équipement, fournisseur ni
  date précise. Fenêtre : 12 derniers mois sauf mention.

## Volumes sur 12 mois

| Objet | Ordre de grandeur |
| --- | --- |
| Interventions | ~330 (de ~10 à ~40 par mois, creux en été) |
| Demandes d'intervention | ~290 (presque toutes « signalées », ~1 % « directes ») |
| Actions | ~1 400 |
| Demandes d'achat | ~530 (~40 % autonomes, sans action liée) |
| Commandes fournisseurs | ~120 |

## Interventions

- Types : curatif ~60 %, préventif ~20 %, bâtiment ~6 %, projet ~5 %, pilotage ~4 %, autres
  (mise en service, conformité, réappro) ~5 %.
- Priorités : normale ~50 %, urgente ~30 %, importante ~15 %, faible ~5 %.
- Durée de l'ouverture à la fermeture : médiane ~2 jours, 9e décile ~90 jours (projets).
- Passage par « attente pièces » : ~5 % des interventions.
- Stock ouvert à un instant donné : ~10 % ouvertes, ~3 % en attente pièces.

## Actions

- Actions par intervention : médiane 1, 9e décile ~7 (quelques projets très longs).
- Temps par action : quartiles 1 h, 2,5 h, 4,5 h ; 9e décile 8 h.
- Score de complexité : 1 (~35 %), 2 (~30 %), 3 (~20 %), 4-5 (~10 %), 6-10 (~5 %).
- Catégories (part des actions / part des heures) : fabrication ~28 % / ~43 %, dépannage
  ~23 % / ~21 %, préventif ~18 % / ~5 %, bâtiment ~15 % / ~18 %, support ~11 % / ~7 %,
  documentation ~5 % / ~5 %. Les 35 sous-catégories du référentiel sont utilisées.
- Facteurs de complexité les plus fréquents (codes du référentiel de départ) : OUT ~20 %,
  DOC ~17 %, CMP ~12 %, VIE ~10 %, ACC ~8 %, puis PCS, RCH, TEM.
- Actions avec une demande d'achat liée : ~7 %.

## Achats

- Urgence des demandes : normale ~94 %, le reste réparti entre haute, urgente et critique.
- Lignes par commande : médiane 3. Délai commande → réception : médiane ~2 jours.
- Commandes : ~75 % closes, ~10 % annulées, le reste ouvert, envoyé ou accusé.

## Équipements et préventif

- Parc : ~350 équipements, quelques racines (sites) et un seul niveau en dessous ; ~30
  équipements « mère » ; ~70 classes. Pour une PME de démonstration : ~30 équipements sur
  3 niveaux, ~8 classes (cible ADR 0036).
- Plans préventifs : peu nombreux (4 actifs), tous par périodicité, périodicité médiane
  ~1 an, ~4 étapes de gamme par plan. Occurrences : ~50, dont ~40 % terminées, ~50 %
  générées en attente.
- Tâches : ~40 % issues d'un plan, ~60 % créées par le technicien ; ~10 % facultatives.

## Équipe

- ~8 techniciens distincts déclarés sur les actions ; comptes actifs : quelques ADMIN et
  RESP, un TECH (les techniciens saisissent souvent via un compte partagé ou le bureau).

## Remarques pour le scénario

- Une démonstration lisible demande plus de préventif que la production (qui en a peu) : le
  scénario vise ~25 % d'heures préventives et ~6 plans, avec avances et retards visibles.
- Écarts de données relevés, sans action ici : priorités « normal » et « normale »
  coexistent ; ~3 % d'actions ont un score de complexité 0 alors que la règle actuelle
  impose 1 à 10 (données antérieures à la règle).
