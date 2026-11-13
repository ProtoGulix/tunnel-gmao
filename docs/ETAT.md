# État d'avancement

Dernière mise à jour : 2026-11-13

À relire au début de chaque session et après chaque compaction (protocole de reprise,
en tête de CLAUDE.md). Mis à jour après chaque tâche terminée.

## Versions

- Dernière version publiée : **v5.2.0** (tag du 2026-10-10).
- develop contient depuis : fin de l'ADR 0011 (équipements), codes internes cliquables
  (ADR 0009 et sa révision), en-tête compact du panneau d'intervention (ADR 0013),
  suppression de la page complète d'intervention (ADR 0014), correctifs divers.
  Détail dans CHANGELOG.md, section « Non publié ».

## Feuille de route fondatrice

Étapes 1 à 5 de CLAUDE.md section 10 closes. L'étape 5 (RBAC, ADR 0007) est livrée en
v5.1.0 avec ses réserves dans docs/backlog/suites-etape-5.md ; son critère de sortie
« tests rôle par endpoint verts » n'a pas été recontrôlé (NON VÉRIFIÉ).

## Chantiers

| Statut | Chantier | Branche | Référence |
| --- | --- | --- | --- |
| à cadrer | Clôture des tâches en réunion de coordination | à créer | décisions de l'utilisateur du 2026-11-13 ci dessous |
| à cadrer | Archivage en masse des interventions fermées | à créer | aucune fiche encore |

Onglet Tâches (ADR 0015) : fusionné dans develop le 2026-11-13, après validation à
l'écran par l'utilisateur, check.sh et test-integration.sh verts, reviewer APPROUVÉ.

Clôture en coordination, décisions de l'utilisateur (2026-11-13) : en réunion, RESP et
ADMIN passent une tâche en Terminé sans action, ou l'annulent avec le statut existant
Ignoré (skipped). La raison est rédigée pendant la réunion et portée par l'audit
(reason_code, reason_text, changed_by) : c'est le rôle même de l'audit. Pas de nouveau
statut. Contredit la règle actuelle « done seulement par une action »
(intervention_tasks/schemas.py) : ADR à écrire avant le code.

## Tâches

Aucune fiche ouverte. Le format est dans docs/taches/README.md.

## Dernière décision

2026-11-13 : clôture des tâches en coordination tracée par l'audit (voir Chantiers).
Avant : fusionné dans develop (05f7cd0), alignement de CLAUDE.md sur le schéma de pilotage éprouvé sur les projets
pantin et pétanque (protocole de reprise, docs/ETAT.md, docs/taches/, contrôle des
subagents, format de compte rendu imposé aux agents).

## Prochaine action

1. Clôture en coordination : ADR, fiche CLO-01, plan court soumis à l'utilisateur. À
   vérifier au cadrage : une tâche en attente bloque-t-elle la clôture d'une intervention
   côté backend ou seulement à l'écran ; inclure les retours mineurs de relecture de
   l'ADR 0015 (Supprimer proposé sur une tâche terminée ou ignorée sans action alors que
   le backend l'exige à faire, TaskLine.jsx ; compte à rebours 5 s contre 10 s annoncés
   dans TaskActionButtons.jsx).
2. Archivage en masse : ouvrir le chantier (code ARCH), écrire la fiche ARCH-01 de cadrage
   (inventaire de l'existant : statut fermé, champs ou tables d'archive, routes, écrans,
   besoin d'ADR, de migration ou d'écriture en base, ces deux dernières soumises à l'accord
   de l'utilisateur), puis proposer le plan court avant tout code.
3. Recontrôler le critère de sortie de l'étape 5 (un test de rôle par endpoint) : à
   ouvrir comme tâche quand l'utilisateur le décide, pour lever le NON VÉRIFIÉ.

## Divers

- Branche sauvegarde-avant-publication (dernier commit du 2026-10-07) non fusionnée :
  son sort est à trancher par l'utilisateur.
