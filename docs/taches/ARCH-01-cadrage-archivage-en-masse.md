# ARCH-01. Cadrage : archivage en masse des interventions fermées

- Statut : faite (2026-11-22)
- Agent : principal (inventaire délégué à Explore, lecture seule)
- Branche : feat/archivage-en-masse (depuis develop, ADR 0008)
- Dépend de : chantier IMPR (fiches imprimées, groupe « À archiver »), ETAT.md « Prochaine action » point 3
- Périmètre d'écriture : cette fiche, docs/ETAT.md. Aucun code, aucune migration, aucune
  écriture en base.

## Contexte

Besoin noté dans ETAT.md : « Archivage en masse des interventions fermées », sans détail.
Le chantier IMPR (2026-11-17) a créé le marquage « imprimée » après export de masse et le
groupe « À archiver » du web. Avant tout code, il faut savoir ce qui existe et ce que
« archiver » veut dire dans Tunnel aujourd'hui.

## Critères d'acceptation

- [x] inventaire de l'existant : statut fermé, champs ou tables d'archive, routes, écrans, droits, audit
- [x] besoin d'ADR, de migration ou d'écriture en base identifié (chacun soumis à l'accord de l'utilisateur)
- [x] questions à trancher par l'utilisateur listées ; plan court proposé avant tout code

## Compte rendu final

Inventaire du 2026-11-22 (agent Explore, points clés revérifiés par l'agent principal).

Existant :
- Aucun statut ni colonne « archivé ». « Archivée » dans l'interface = `intervention.printed_fiche = TRUE`
  (colonne de la baseline, schema.sql:1637, sans date ni auteur ; l'audit les garde : règle
  `audit_rule` intervention/printed_fiche routinière, motif ROUTINE).
- Statut fermé `ferme` (api/constants.py:4) ; une intervention fermée est verrouillée (ADR 0030)
  et rangée dans le groupe « À archiver » (web et mobile) tant qu'elle n'est pas imprimée.
- `GET /interventions` cache les imprimées par défaut (`printed`, `include_printed`) ; l'historique
  d'un équipement les montre avec le badge « Archivée ».
- Marquage unitaire par le PUT ; marquage de masse seulement après un export
  (`POST /exports/interventions/closed/mark-printed`, même sélection que l'export : période de
  clôture, équipement, plafond MAX_BULK_SHEETS = 100), ADMIN et RESP, audité par fiche.
- Pas de dé-marquage de masse, pas de filtre « archivées » dans la liste, pas d'action mobile,
  aucun ADR sur l'archivage ; le guide n'en définit pas le terme.
- Code mort : api/intervention_status/repo.py:45 cite des codes inexistants (closed, cancelled, archived).

Ce qui manque pour un archivage en masse : marquer sans exporter, avec une sélection libre et un
plafond découplé de l'export PDF ; éventuellement distinguer « imprimée » et « archivée »
(colonne et migration, ADR) ; défaire un archivage ; un filtre « archivées » ; la page du guide.

NON VÉRIFIÉ : volume réel en base (requête de comptage en lecture non lancée), droits du PUT
unitaire sur `printed_fiche`, triggers éventuels sur la colonne, critère de la section
« Archivées » de la fiche équipement mobile.

Questions posées à l'utilisateur le 2026-11-22 : sens d'« archiver », mode de sélection, défaire.

Réponses de l'utilisateur (2026-11-22) : archivée = imprimée ; sélection par période et
équipement ; ni filtre ni désarchivage en masse ; plafond maintenu à 100 (déjà éprouvé).
Décision : ADR 0040. Suite : ARCH-02 (web), guide par l'agent principal. Code mort
au backlog (statuts-intervention-code-mort.md).
