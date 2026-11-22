# 0039. Une seule écriture de la priorité « normale » : `normal`

- Statut : accepté (2026-11-21)
- Date : 2026-11-21
- Affine : CLAUDE.md section 2.4 (traçabilité), ADR 0030 (règles lues dans l'API)

## Contexte

La priorité d'une intervention est une chaîne libre (`intervention.priority varchar(20)`,
sans contrainte ; `priority: Optional[str]` dans les schémas Pydantic). La référence du
backend (`PRIORITY_TYPES`, api/constants.py) et la valeur par défaut de la colonne disent
`normal`, mais le mobile, la création depuis une demande, le préventif et une partie du web
écrivent `normale`. Base de dev au 2026-11-21 : 134 interventions en `normale`, 60 en
`normal`. Conséquences constatées : le tri par sévérité (interventions/repo.py) range
`normal` après `faible`, le filtre `priority=normale` est ignoré sans message, les compteurs
par priorité oublient l'une des deux valeurs.

Constat voisin, même chantier : les fronts filtrent sur des codes de statut qui n'existent
pas (`en_cours`, `en_attente`, `en_attente_pieces`, `en_attente_prod`) ; l'écran Coordination
cache ainsi les interventions en attente de pièces ou de production. Les libellés d'un même
statut changent d'un écran à l'autre.

## Décision

Décisions de l'utilisateur du 2026-11-21.

1. `normal` est la seule valeur de la priorité « normale ». Les quatre valeurs permises sont
   celles de `PRIORITY_TYPES` : `faible`, `normal`, `important`, `urgent`.
2. Une migration de données convertit `normale` en `normal`, en dev puis en production. C'est
   un changement hors travail normal : chaque intervention corrigée reçoit une ligne d'audit
   système avec un motif ajouté aux données de référence (même mécanisme que la migration
   0014, DATA_BACKFILL).
3. La valeur est contrôlée deux fois : l'API refuse une priorité hors de `PRIORITY_TYPES` à
   l'écriture (erreur 400 lisible), et la base porte une contrainte CHECK sur
   `intervention.priority` (choix de l'agent principal, l'utilisateur ayant demandé « le
   plus propre pour la suite » : aucune écriture, même hors de l'API, ne peut recréer
   l'écart).
4. Les fronts n'écrivent que `normal`, avec une seule table de libellés par front.
5. Les fronts ne filtrent que sur les codes réels de `intervention_status_ref` (`ouvert`,
   `attente_pieces`, `attente_prod`, `ferme`). La Coordination charge les trois statuts non
   fermés (écran peu utilisé selon l'utilisateur : correction minimale, son avenir va au
   backlog).
6. Libellés retenus : `ouvert` s'affiche « Ouvert » partout ; une tâche `skipped`
   s'affiche « Annulée » partout.

## Alternatives écartées

- Garder `normale` : la référence du backend, la valeur par défaut de la colonne et les
  filtres de l'API disent `normal` ; changer l'API publique pour suivre l'écart.
- Table de référence des priorités (comme les types, ADR 0026) avec une route qui l'expose :
  quatre valeurs fixes liées à un tri de sévérité, aucune demande de les rendre réglables ;
  plus lourd pour un gain nul aujourd'hui. Reste possible plus tard (backlog).
- Contrôle par l'API seulement : une écriture directe en base ou un futur script pourrait
  recréer l'écart sans que rien ne le signale.

## Conséquences

- Migration 0025 à jouer en dev (accord donné le 2026-11-21) puis en production à sa mise
  à jour ; la contrainte CHECK refuserait une valeur inconnue restée en base : la migration
  convertit d'abord, puis vérifie qu'il ne reste aucune valeur hors liste avant de poser la
  contrainte.
- Un client qui envoie `normale` reçoit désormais une erreur 400 : web et mobile sont
  corrigés dans le même chantier, avant la fusion.
- Les tests qui créent des interventions en `normale` passent en `normal` (donnée de test,
  aucune assertion affaiblie).
- `intervention_request.priorite` (toutes les lignes vides en dev) n'est pas concernée.
