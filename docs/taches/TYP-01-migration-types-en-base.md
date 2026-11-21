# TYP-01. Migration 0020 : types d'intervention en base

- Statut : faite, relue, migration 0020 jouée en dev, essai à l'écran validé (2026-11-20)
- Agent : db-dev (sonnet)
- Branche : feat/types-intervention-en-base (depuis develop), worktree de la sous-branche
  feat/types-intervention-en-base-typ01
- Dépend de : ADR 0026
- Périmètre d'écriture : backend/alembic/versions/0020_*.py, backend/db/seed_reference.sql
  (grep, ne pas lire en entier), backend/tests/ (tests de migration et de bootstrap),
  cette fiche. Exclu : backend/api/, fronts, dépendances.

## Contexte

ADR 0026. Table `intervention_type` (id, code varchar(10) unique, label, color, is_active)
vide en base de dev. `intervention.type_inter` varchar(10) NOT NULL et
`intervention_request.suggested_type_inter` varchar(255) portent des codes. Modèle de
migration conditionnelle et idempotente : 0019 et 0018 ; tests : test_motifs_ignorer_
occurrence_migration_integration.py, test_bootstrap_integration.py (tête attendue).

## Données (validées par l'utilisateur le 2026-11-20)

| code | label | color | description |
| --- | --- | --- | --- |
| CUR | Curatif | red | Réparer une panne ou un défaut constaté sur un équipement. |
| PRE | Préventif | green | Entretien planifié pour éviter la panne (plan préventif). |
| REA | Réapprovisionnement | blue | Réapprovisionner des pièces ou des consommables. |
| BAT | Batiment | gray | Travaux sur les locaux et les réseaux du bâtiment, hors équipement de production. |
| PRO | Projet | blue | Amélioration, modification ou ajout sur un équipement ou une installation. |
| COF | Remise en conformité | amber | Mise aux normes ou correction suite à un contrôle (sécurité, réglementaire). |
| PIL | Pilotage | blue | Organisation et suivi du service : documentation, réunions, formation. |
| MES | Mise en service | amber | Installation et démarrage d'un équipement neuf ou déplacé. |

Le libellé « Batiment » est repris tel qu'aujourd'hui (sans accent) pour ne rien changer à
l'affichage ; l'utilisateur pourra le corriger dans l'administration.

## Critères d'acceptation

- [x] 0020 (down_revision 0019_motifs_ignorer_occurrence) : colonne `description text`
      ajoutée si absente ; 8 types insérés si leur code est absent (ON CONFLICT DO NOTHING,
      rien d'écrasé) ; description remplie seulement si NULL ; séquence recalée
- [x] Avant les clés étrangères : tout code utilisé par intervention.type_inter ou
      intervention_request.suggested_type_inter et absent de la table est inséré (label =
      code, is_active = false) et journalisé, pour que la migration ne casse jamais une base
- [x] Clés étrangères `intervention.type_inter` → `intervention_type(code)` et
      `intervention_request.suggested_type_inter` → `intervention_type(code)` (NULL permis),
      posées si absentes, nommées explicitement ; downgrade qui les retire et retire la
      colonne seulement si vide (ne supprime pas les lignes de types)
- [x] Mêmes instructions dans seed_reference.sql (installation neuve)
- [x] Tests d'intégration : base neuve (8 types, FK présentes, insertion d'un type inconnu
      refusée), rejouabilité, code orphelin préexistant rattrapé ; tête attendue du bootstrap
      mise à jour
- [x] scripts/check.sh vert, scripts/test-integration.sh vert (IT_DB_NAME/IT_DB_PORT
      dédiés) ; aucune écriture sur la base de dev

## Compte rendu final

Migration 0020_types_intervention_en_base livrée. Contraintes posées :
intervention_type_inter_fkey (intervention.type_inter) et
intervention_request_suggested_type_inter_fkey (intervention_request.suggested_type_inter),
toutes deux vers intervention_type(code). Le CHECK chk_suggested_type_inter (0018) est retiré
(la clé étrangère le remplace, sinon un type ajouté en administration serait refusé en
suggestion) ; le downgrade le remet si aucune demande ne le viole. Rattrapage des codes
orphelins : inactifs, libellé = code, journalisés (logger alembic). Seed : mêmes instructions
générées depuis upgrade_statements (le seed tourne en 0002, avant 0020, donc complet).
Tests existants adaptés : codes 'COR' et 'ZZZ' (inconnus, désormais refusés par la clé
étrangère) remplacés par CUR et PIL ; test 0018 : chk_suggested_type_inter exclu de
l'inventaire. Intégration : 477 passés (dont 5 nouveaux), check.sh vert. Base de dev non touchée.
