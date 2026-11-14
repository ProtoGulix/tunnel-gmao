# État d'avancement

Dernière mise à jour : 2026-11-14

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
| en cours | Audit centralisé dans le middleware (étapes 0 à 4), suivi dans [AUDC-plan.md](taches/AUDC-plan.md) ; étapes 0, 1 et 2 fusionnées le 2026-11-14 ; étape 3 à planifier | à créer (étape 3) | ADR 0018, 0019 |
| à faire ensuite | Changements hors travail normal (remise à faire, occurrence préventive, nettoyage, migration des motifs) | à créer | CLAUDE.md section 2.4 |
| à cadrer | Archivage en masse des interventions fermées | à créer | aucune fiche encore |

Onglet Tâches (ADR 0015) : fusionné dans develop le 2026-11-13, après validation à
l'écran par l'utilisateur, check.sh et test-integration.sh verts, reviewer APPROUVÉ.

Intégrité de l'audit (ADR 0017, fiches AUD-01 à AUD-05) : fusionnée dans develop le
2026-11-13, check.sh et test-integration.sh (107) verts, reviewer APPROUVÉ. Migration
0006 jouée sur la base de dev le 2026-11-13 avec l'accord de l'utilisateur (bootstrap,
révision 0006_audit_erreurs_visibles vérifiée). Production : à jouer à sa prochaine
mise à jour, avec les motifs de clôture (backlog motifs-cloture-bases-existantes.md).

Clôture en coordination (ADR 0016, fiches CLO-01 à CLO-06) : fusionnée dans develop le
2026-11-13, après validation à l'écran par l'utilisateur, check.sh et
test-integration.sh (97) verts, reviewer APPROUVÉ. Motifs de clôture posés dans la seed
et la base de dev ; autres bases : docs/backlog/motifs-cloture-bases-existantes.md.

## Tâches

Fiches ouvertes : aucune. Fiches closes : AUDC-21 à AUDC-30 (étape 2), CLO-01 à CLO-06, AUD-01 à AUD-05, AUDC-00 et AUDC-10 à AUDC-15.

## Dernière décision

2026-11-14 : étape 2 de l'audit centralisé fusionnée. Avant : une intervention vient toujours d'une demande ; la supprimer fait choisir
entre rouvrir sa demande et la supprimer en cascade ; les interventions sans demande d'avant la séparation
restent telles quelles (ADR 0019).
Avant : 2026-11-13, audit centralisé dans le middleware, une transaction par requête (ADR 0018).
Avant : 2026-11-13 : l'audit est validé avant la mutation et ses erreurs ne sont plus masquées
(ADR 0017). Avant : tout changement hors travail normal passe par les règles d'audit du système
(CLAUDE.md section 2.4) ; clôture des tâches en coordination (ADR 0016).
Avant : fusionné dans develop (05f7cd0), alignement de CLAUDE.md sur le schéma de pilotage éprouvé sur les projets
pantin et pétanque (protocole de reprise, docs/ETAT.md, docs/taches/, contrôle des
subagents, format de compte rendu imposé aux agents).

## Prochaine action

0. Audit centralisé : étape 2 fusionnée le 2026-11-14 (essai web validé, essai mobile
   reporté, docs/backlog/websocket-hmr-proxy-dev.md). Base de dev : migrations 0007 à 0009
   jouées ; production : 0006 à 0009 à jouer à sa prochaine mise à jour. Suites :
   docs/backlog/suites-audc-etape-2.md. Prochaine étape : 3 (docs/taches/AUDC-plan.md),
   plan court à proposer à l'utilisateur.
1. Le bilan de sécurité interne (hors dépôt) est à compléter par l'utilisateur avec les
   correctifs de l'ADR 0017.
2. Chantier changements hors travail normal, décisions de l'utilisateur du 2026-11-13 :
   remettre à faire exige un motif (task_reopened : « Clôturée par erreur », « Travail à
   reprendre », OTHER) ; nouveau motif de clôture task_done « Oubli de clôture à la
   saisie » ; occurrence préventive ignorée par motif d'audit ; nettoyage du ROUTINE en
   dur du mobile et de GammeProgressBlock ; une base de production existe (indisponible
   pour l'instant) : migration de données idempotente pour tous les motifs.
3. Archivage en masse : ouvrir le chantier (code ARCH), écrire la fiche ARCH-01 de cadrage
   (inventaire de l'existant : statut fermé, champs ou tables d'archive, routes, écrans,
   besoin d'ADR, de migration ou d'écriture en base, ces deux dernières soumises à l'accord
   de l'utilisateur), puis proposer le plan court avant tout code.
4. Recontrôler le critère de sortie de l'étape 5 (un test de rôle par endpoint) : à
   ouvrir comme tâche quand l'utilisateur le décide, pour lever le NON VÉRIFIÉ.

## Divers

- Branche sauvegarde-avant-publication (dernier commit du 2026-10-07) non fusionnée :
  son sort est à trancher par l'utilisateur.
