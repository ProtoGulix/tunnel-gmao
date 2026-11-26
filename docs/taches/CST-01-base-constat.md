# CST-01. Base : constat après intervention (migration 0028)

- Statut : faite
- Agent : db-dev (sonnet)
- Branche : feat/constat-intervention-cst01 (worktree depuis feat/constat-intervention)
- Dépend de : ADR 0043
- Périmètre d'écriture : backend/alembic/versions/0028_*.py (nouveau), backend/db/schema.sql
  (miroir si le projet l'y tient), backend/db/seed_reference.sql (bloc miroir idempotent),
  backend/tests/ (test d'intégration de la migration, tests qui comptent la révision attendue,
  sans affaiblir d'assertion), CHANGELOG.md. Exclus : backend/api, fronts. Aucune écriture
  sur la base de dev.

## Contexte

ADR 0043. Modèles : 0020_types_intervention_en_base.py (colonne ajoutée à intervention_type),
0024_motifs_rejet_demande.py et 0027 (motifs d'audit, idempotence, downgrade prudent).

## Contrat commun (CST-01 à CST-04)

- Questions : code, libellé, choix multiple ou unique, choix parent (sous-question montrée si
  ce choix est coché), ordre, actif. Choix : question, code, libellé, ordre, actif, type
  préconisé (code de intervention_type, nullable).
- Données de départ, dans l'ordre de l'écran :
  - LEVER (multiple) : TASK « Tâche de maintenance régulière » (PRE), PROJECT « Projet ou
    modification » (PRO), TRAINING « Formation », MONITORING « Surveillance ou inspection »,
    OTHER « Autre ».
  - FREQUENCY (unique, parent TASK) : hebdomadaire, mensuelle, trimestrielle, annuelle, lors
    d'un arrêt planifié.
  - KNOWN_SINCE (unique, parent PROJECT) : jamais (apparu brutalement), moins d'un mois,
    1 à 3 mois, plus de 3 mois.
  - DOMAIN (multiple, parent TRAINING) : électrique, automatisme, mécanique, pneumatique,
    logiciel, méthode ou procédure.
  - PARAMETER (multiple, parent MONITORING) : vibration, température, pression, niveau, état
    visuel, compteur.
  - SIGNAL (unique) : oui et je l'ai vu, oui mais non remonté, non.
  - PART (multiple) : automate, électrique, pneumatique, mécanique, bâtiment.
- Constat : id, intervention_id, machine_id (visée), created_by (jeton), created_at,
  supersedes_id (version remplacée, nullable, unique), request_id (DI créée),
  linked_request_id (idée d'amélioration rattachée, nullable). Version courante = non
  remplacée. Réponses : (constat_id, choice_code), choix actif au moment de la saisie.
- intervention_type.constat_required boolean NOT NULL DEFAULT false, true pour CUR.
- intervention_request.source_intervention_id (FK intervention, nullable).
- Motif d'audit de correction : décision `constat_corrected`, un seul motif CONSTAT_CORRECTION
  « Correction » (OTHER ne reçoit pas cette décision). REJECT_DUPLICATE existe déjà.
- Suppressions protégées (pas de cascade qui efface un constat) ; règles d'audit des nouvelles
  tables comme les autres entités.

## Critères d'acceptation

- [x] migration 0028 idempotente, upgrade et downgrade ; seed_reference.sql aligné (base neuve = base migrée)
- [x] test d'intégration de la migration (état attendu, rejouer sans effet, retour arrière puis remontée)
- [x] scripts/check.sh et scripts/test-integration.sh verts
- [x] CHANGELOG (« Non publié ») : migration 0028 à jouer en production

## Compte rendu final

Migration `0028_constat_intervention` (revises 0027). Seed miroir : mêmes instructions que la
migration (le seed passe en 0002, avant elle), vérifié par test. schema.sql non touché (base de
départ v4, comme pour 0020 et 0023).

Contrat de nommage pour CST-02 :
- `constat_question` (id, code, label, is_multiple, parent_choice_id, sort_order, is_active) ;
  `constat_choice` (id, question_id, code unique sur toute la table, label, sort_order,
  is_active, suggested_type_inter FK intervention_type.code).
- `constat` (id, intervention_id, machine_id, created_by NOT NULL, created_at, supersedes_id
  unique, request_id NOT NULL, non unique : les versions d'un constat partagent sa DI, linked_request_id) ; `constat_answer` (constat_id,
  choice_code), clé primaire du couple, FK vers constat_choice(code).
- Codes questions : LEVER, FREQUENCY, KNOWN_SINCE, DOMAIN, PARAMETER, SIGNAL, PART. Choix de
  LEVER : TASK (PRE), PROJECT (PRO), TRAINING, MONITORING, OTHER ; les autres sont préfixés :
  FREQ_*, SINCE_*, DOM_*, PARAM_*, SIGNAL_*, PART_*.
- Aucune cascade (suppression refusée). Audit : entités constat, constat_question,
  constat_choice routinières ; motif CONSTAT_CORRECTION (entité constat, décision
  constat_corrected).
- Retour arrière : refusé (ASSERT) s'il existe un constat ou une demande avec
  source_intervention_id ; sinon tables, colonnes, règles et motif retirés.

Tests : test_constat_migration_integration.py (état, rejeu sans écrasement, contraintes,
refus du retour arrière, retour arrière puis remontée) ; test_bootstrap_integration.py attend
0028. check.sh et test-integration.sh verts.
