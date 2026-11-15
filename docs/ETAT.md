# État d'avancement

Dernière mise à jour : 2026-11-16

À relire au début de chaque session et après chaque compaction (protocole de reprise,
en tête de CLAUDE.md). Mis à jour après chaque tâche terminée.

## Versions

- Dernière version publiée : **v5.3.1** (tag du 2026-11-15) : test de santé du front web
  derrière Cloudflare Access, bascule depuis la 3.57.0 (migration 0013,
  deploy/basculer-production.sh). Production basculée en 5.3.1 le 2026-11-15 (révision
  0013, 411 interventions retrouvées) ; clone dans ~/DEV/tunnel-gmao sur main, mises à
  jour par git pull et docker compose up -d --build. Restent à la main : domaine mobile
  vers /m, Grafana, clients MCP, cache des postes, puis suppression des anciens
  conteneurs et de l'archive après validation.
- develop contient depuis : export de masse des fiches des interventions fermées (EXPM-01, EXPM-02).

## Feuille de route fondatrice

Étapes 1 à 5 de CLAUDE.md section 10 closes. L'étape 5 (RBAC, ADR 0007) est livrée en
v5.1.0 avec ses réserves dans docs/backlog/suites-etape-5.md ; son critère de sortie
« tests rôle par endpoint verts » n'a pas été recontrôlé (NON VÉRIFIÉ).

## Chantiers

| Statut | Chantier | Branche | Référence |
| --- | --- | --- | --- |
| fait | Bascule de la production 3.57.0 vers la 5.x (fiches BASC-01 à BASC-04, spike 0003) : répétée sur une copie, script automatique essayé, fusionnée le 2026-11-15 ; bascule réelle à faire depuis une version publiée | — | décisions de l'utilisateur du 2026-11-15 |
| fait | Export de masse des fiches fermées (EXPM-01, EXPM-02), fusionné le 2026-11-16 après essai à l'écran ; plafond 100 ; bootstrap rejoué sur la base de dev, à rejouer en production à sa mise à jour | — | [EXPM-01](taches/EXPM-01-backend-export-masse-fiches.md), [EXPM-02](taches/EXPM-02-web-bouton-export-masse.md) |
| à cadrer | Contraintes d'intégrité perdues par le schéma de référence, [backlog](backlog/contraintes-perdues-reference.md) | à créer | spike 0003 |
| fait | Test de santé du front web derrière Cloudflare Access (SANTE-01), fusionné le 2026-11-15 ; vérification à l'écran en attente | — | décision de l'utilisateur du 2026-11-15 |
| fait | Suites de l'audit centralisé avant la version 5.3.0 (fiches SUIT-01, SUIT-02), fusionnées le 2026-11-15 après essai à l'écran | — | décisions de l'utilisateur du 2026-11-15 |
| fait | Audit centralisé dans le middleware (étapes 0 à 4), suivi dans [AUDC-plan.md](taches/AUDC-plan.md) ; étapes 0 à 4 fusionnées le 2026-11-14 | — | ADR 0018, 0019 |
| à faire ensuite | Changements hors travail normal (remise à faire, occurrence préventive, nettoyage, migration des motifs) | à créer | CLAUDE.md section 2.4 |
| à cadrer | Harmoniser la création des interventions (trois formulaires web, deux appels non atomiques), [backlog](backlog/creation-interventions-harmonisation.md) | à créer | inventaire du 2026-11-15 |
| à cadrer | Types et statuts d'intervention en base (écran Référentiel sans effet), [backlog](backlog/referentiel-types-statuts-en-base.md) | à créer | aucune fiche encore |
| à cadrer | Archivage en masse des interventions fermées | à créer | aucune fiche encore |

Onglet Tâches (ADR 0015) : fusionné dans develop le 2026-11-13, après validation à
l'écran par l'utilisateur, check.sh et test-integration.sh verts, reviewer APPROUVÉ.

Intégrité de l'audit (ADR 0017, fiches AUD-01 à AUD-05) : fusionnée dans develop le
2026-11-13, check.sh et test-integration.sh (107) verts, reviewer APPROUVÉ. Migration
0006 jouée sur la base de dev le 2026-11-13 avec l'accord de l'utilisateur (bootstrap,
révision 0006_audit_erreurs_visibles vérifiée). Production : à jouer à sa prochaine
mise à jour, avec les motifs de clôture (migration 0013, BASC-03).

Clôture en coordination (ADR 0016, fiches CLO-01 à CLO-06) : fusionnée dans develop le
2026-11-13, après validation à l'écran par l'utilisateur, check.sh et
test-integration.sh (97) verts, reviewer APPROUVÉ. Motifs de clôture posés dans la seed
et la base de dev ; autres bases : migration 0013 (BASC-03).

## Tâches

Fiches ouvertes : aucune. Closes aussi : EXPM-01, EXPM-02. Closes aussi : BASC-01 à BASC-04, SANTE-01. Closes aussi : SUIT-01 à SUIT-03. Fiches closes : AUDC-21 à AUDC-30 (étape 2), CLO-01 à CLO-06, AUD-01 à AUD-05, AUDC-00 et AUDC-10 à AUDC-15.

## Dernière décision

2026-11-16 : export de masse des fiches fermées en ZIP et en PDF unique, sur une période de fermeture (date du dernier passage à `ferme`), réservé à ADMIN et RESP, plafond 100 fiches (mesure : 0,31 s par fiche).

2026-11-15 : avant la version 5.3.0, retirer les quatre routes de référentiel cassées et leurs boutons, retirer le bouton Supprimer de l'onglet Pièces, refuser une règle de domaine de courriel qui exclurait l'admin qui la pose, retirer du catalogue des droits au démarrage les endpoints disparus du code. Types et statuts en base hors de cette version.
Avant : 2026-11-14 : étape 2 de l'audit centralisé fusionnée. Avant : une intervention vient toujours d'une demande ; la supprimer fait choisir
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

0. Plans préventifs (2026-11-14, branche fix/plan-preventif-inactif-affiche fusionnée) :
   badge « Inactif » et réactivation d'un plan (POST /preventive-plans/{id}/reactivate,
   routinière, ADMIN et RESP), validée à l'écran ; bootstrap rejoué sur la base de dev
   avec l'accord de l'utilisateur (2 droits ouverts).
0. Audit centralisé : étape 3 fusionnée le 2026-11-14 (essai web de l'utilisateur :
   désactivation d'un plan, suppression de références fabricant et fournisseur, motif
   exigé puis accepté ; suppressions d'articles, liens fournisseur et fabricants couvertes
   par les tests d'intégration seulement). Base de dev : migrations 0007 à 0011 jouées ;
   Suites :
   docs/backlog/suites-audc-etape-2.md. Étape 4 fusionnée le 2026-11-14 (essai à l'écran
   validé ; correctifs au passage : adresse IP des IP bloquées, saisie du formulaire de
   classe d'équipement). Base de dev : migrations jusqu'à 0012. Production : 0006 à 0012 à jouer à sa prochaine mise à jour.
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
