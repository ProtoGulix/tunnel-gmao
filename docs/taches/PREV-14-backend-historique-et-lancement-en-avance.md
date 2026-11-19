# PREV-14. Backend : historique préventif d'une machine et lancement en avance

- Statut : faite (2026-11-19)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-suivi-equipement (depuis develop), worktree de la sous-branche
  feat/preventif-suivi-equipement-prev14
- Dépend de : PREV-01 à PREV-09 (préventif glissant, ADR 0023)
- Périmètre d'écriture : backend/api/preventive_occurrences/, backend/api/auth/permissions.py
  et le fichier de droits par défaut s'il faut y déclarer les routes, backend/api/audits/
  (exclusions si exigé par les tests), backend/tests/, docs/endpoints (préventif),
  CHANGELOG.md (« Non publié »), cette fiche. Exclu : web, mobile, migrations alembic (aucun
  changement de schéma), api/jobs.

## Contexte

Demande de l'utilisateur du 2026-11-19 : voir sur la fiche équipement si le préventif est à
jour, la liste des interventions préventives et une courbe d'avance ou de retard ; pouvoir
réaliser un préventif en avance (exemple : contrôleur des extincteurs venu plus tôt).
Aujourd'hui une occurrence n'est créée que par la génération, une semaine avant l'échéance,
et aucune route ne permet d'en créer une. Choix de l'utilisateur : « lancer en avance »
(création immédiate de l'occurrence et de sa demande, circuit normal ensuite), pas de
déclaration antidatée. Accord de l'utilisateur pour les deux routes (2026-11-19).

## Contrat d'API (fixé, lu par PREV-15)

`GET /preventive-occurrences/history?machine_id=<uuid>` (lecture, mêmes droits que
`GET /preventive-occurrences/schedule`, clé MCP autorisée en lecture) : 200
`{"items": [...]}`, une ligne par occurrence de la machine, la plus récente échéance
d'abord. Champs : `occurrence_id`, `plan_id`, `plan_code`, `plan_label`, `status`,
`scheduled_date` (échéance), `done_on` (date de clôture de la demande, null si non
terminée), `delta_days` (`done_on - scheduled_date` en jours : négatif = en avance,
positif = en retard ; null si non terminée), `skip_reason`, `di_id`, `intervention_id`,
`intervention_code`. 404 si la machine n'existe pas. Pas de pagination (volume par machine
faible) ; si une limite est jugée nécessaire, la justifier dans le compte rendu.

`POST /preventive-occurrences/anticipate` body `{"plan_id": <uuid>, "machine_id": <uuid>}`
(écriture, mêmes droits que `POST /preventive-occurrences/generate`, ADMIN et RESP ; clé
MCP refusée) : crée tout de suite l'occurrence et sa demande système, exactement comme la
génération (même code, mêmes règles d'audit et d'acceptation automatique du plan), sans
attendre la prévenance. `scheduled_date` = l'échéance théorique calculée comme dans
l'échéancier (glissante) ; si elle est déjà passée ou sans historique, aujourd'hui. 201 avec
l'occurrence créée (champs de `GET /preventive-occurrences/{id}`). Refus :

- 409 si une occurrence active (pending, generated, in_progress) existe pour ce plan et
  cette machine, avec son id dans le détail ;
- 422 si le plan est inactif, n'est pas à périodicité (les plans aux heures restent hors
  périmètre), si la machine n'est pas en service ou n'est pas de la classe du plan ;
- 404 si le plan ou la machine n'existe pas.

## Critères d'acceptation

- [x] Historique : contenu, ordre, `done_on` et `delta_days` justes pour une occurrence
      terminée en avance et une en retard, null pour une non terminée (test d'intégration)
- [x] Lancement en avance : occurrence et demande créées, échéance théorique conservée,
      demande visible comme celle de la génération ; le passage suivant de la génération ne
      crée pas de doublon ; après clôture, la prochaine échéance part de la date de clôture
      (tests d'intégration)
- [x] Les refus 409, 422 et 404 du contrat (tests)
- [x] Droits : TECH et ACHETEUR refusés sur anticipate, clé MCP refusée en écriture ;
      matrice de droits par défaut et comptes de tests à jour
- [x] Audit de la création identique à celui du bouton « Générer » (auteur du jeton)
- [x] scripts/check.sh et scripts/test-integration.sh verts
- [x] Doc d'endpoint et CHANGELOG (« Non publié ») à jour

## Compte rendu final


- Fait : routes `GET /history` et `POST /anticipate` ; la création de la génération est extraite
  dans `_create_occurrence` (repo.py) et partagée, ainsi que `_reference_date`. Règles 422 dans
  `validators.py` (`UnprocessableError`, le contrat impose 422 et la hiérarchie du projet n'a que
  ValidationError en 400). Audit : `audit("request", events_only=True)` comme `generate`.
  Mails « DI à traiter » envoyés en tâche de fond comme à la génération.
- Droits : la matrice par défaut couvre déjà les deux routes (RESP écrit tout le métier, TECH et
  ACHETEUR non, MCP lecture seule) ; aucune règle ajoutée. Les comptes attendus des deux tests de
  matrice passent de 259 à 261 endpoints (ADMIN 261, RESP 225, TECH 124, ACHETEUR 160, MCP 113).
  test_audit_coverage : aucun changement (route déclarée).
- Pas de pagination de l'historique : volume par machine faible (quelques occurrences par plan et par an).
- Fichiers : api/preventive_occurrences/{repo,routes,schemas,validators}.py,
  tests/integration/test_preventif_suivi_equipement_integration.py, tests/test_default_permissions.py,
  deux tests de comptes, docs/api/endpoints/preventive-occurrences.md (le chemin docs/endpoints
  de la fiche n'existe pas), CHANGELOG.md.
- Résultats : scripts/check.sh vert ; scripts/test-integration.sh 423 passés.
- Échecs intermédiaires : un premier test-integration.sh a échoué (2 tests de comptes de la
  matrice, 259 attendus contre 261), corrigé en mettant les comptes à jour.
