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
| à planifier | Backlog audit et erreurs relevé pendant CLO | à créer | voir Prochaine action |
| à cadrer | Archivage en masse des interventions fermées | à créer | aucune fiche encore |

Onglet Tâches (ADR 0015) : fusionné dans develop le 2026-11-13, après validation à
l'écran par l'utilisateur, check.sh et test-integration.sh verts, reviewer APPROUVÉ.

Clôture en coordination (ADR 0016, fiches CLO-01 à CLO-06) : fusionnée dans develop le
2026-11-13, après validation à l'écran par l'utilisateur, check.sh et
test-integration.sh (97) verts, reviewer APPROUVÉ. Motifs de clôture posés dans la seed
et la base de dev ; autres bases : docs/backlog/motifs-cloture-bases-existantes.md.

## Tâches

Aucune fiche ouverte. Fiches closes du chantier CLO : docs/taches/CLO-01 à CLO-06.

## Dernière décision

2026-11-13 : tout changement hors travail normal passe par les règles d'audit du système
(CLAUDE.md section 2.4) ; clôture des tâches en coordination (ADR 0016).
Avant : fusionné dans develop (05f7cd0), alignement de CLAUDE.md sur le schéma de pilotage éprouvé sur les projets
pantin et pétanque (protocole de reprise, docs/ETAT.md, docs/taches/, contrôle des
subagents, format de compte rendu imposé aux agents).

## Prochaine action

1. Plan du backlog relevé pendant CLO, à soumettre à l'utilisateur.
2. Demandé par l'utilisateur le 2026-11-13, à traiter test d'abord (un test qui échoue
   avant le correctif) : (a) fn_audit_log_decision avale ses erreurs
   (docs/backlog/audit-erreurs-avalees.md, migration soumise à accord) ; (b) remettre à
   faire une tâche close ou annulée est une correction hors travail normal : motif
   d'audit exigé (CLAUDE.md section 2.4).
3. Archivage en masse : ouvrir le chantier (code ARCH), écrire la fiche ARCH-01 de cadrage
   (inventaire de l'existant : statut fermé, champs ou tables d'archive, routes, écrans,
   besoin d'ADR, de migration ou d'écriture en base, ces deux dernières soumises à l'accord
   de l'utilisateur), puis proposer le plan court avant tout code.
4. Recontrôler le critère de sortie de l'étape 5 (un test de rôle par endpoint) : à
   ouvrir comme tâche quand l'utilisateur le décide, pour lever le NON VÉRIFIÉ.

## Divers

- Branche sauvegarde-avant-publication (dernier commit du 2026-10-07) non fusionnée :
  son sort est à trancher par l'utilisateur.
