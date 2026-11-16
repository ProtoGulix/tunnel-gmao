# TDB-01. Endpoint du tableau de bord d'un équipement

- Statut : faite (2026-11-16)
- Agent : backend-dev
- Branche : feat/equipement-tableau-de-bord (depuis develop, ADR 0008)
- Dépend de : aucune tâche ; décisions de l'utilisateur du 2026-11-16
- Périmètre d'écriture : backend/api/equipements/ (routes.py, repo.py, schemas.py,
  validators.py), backend/api/interventions/ (routes.py, repo.py, pour les deux filtres),
  backend/tests/ (nouveaux fichiers de test, et test_permission_matrix.py ou
  test_default_permissions.py seulement si un test de cohérence l'exige),
  docs/endpoints/ (équipements et interventions), CHANGELOG.md (« Non publié »).
  Exclu : alembic/, db/, toute écriture en base, web/, mobile/, toute dépendance.

## Contexte

L'utilisateur veut lire d'un coup d'œil l'état d'un équipement et son évolution
(vue master-detail du front web). Aucun endpoint n'agrège aujourd'hui par équipement
le temps passé, la complexité, les types d'intervention ni une tendance :
GET /equipements/{id}/stats ne compte que les statuts et priorités. Lecture seule,
aucune migration.

## Spécification

GET /equipements/{equipement_id}/dashboard, fonction `get_equipement_dashboard`
(code de droit `equipements:get_equipement_dashboard`, créé par sync_catalog ; GET donc
ouvert par défaut à RESP, TECH, ACHETEUR, MCP par default_permissions).

Paramètres : `start_date`, `end_date` (dates ISO ; défaut : du 1er jour du mois d'il y a
11 mois à aujourd'hui, soit 12 mois calendaires mois courant inclus), `include_descendants`
(bool, défaut false, même périmètre que GET /equipements/{id} : réutiliser
EquipementRepository.machine_scope / _descendants). Refus en 400 (ValidationError) si
start_date > end_date ou si la période dépasse 10 ans. 404 si l'équipement n'existe pas.

Règles de rattachement à la période :
- une intervention compte dans la période selon son `reported_date` ;
- sa fermeture est la date du dernier passage à `ferme` (CLOSED_STATUS_CODE) dans
  intervention_status_log, comme l'export de masse (EXPM-01) ;
- une action compte selon `created_at::date`, à défaut le `reported_date` de son
  intervention (created_at est nullable sur les données importées) ;
- les interventions archivées (printed_fiche) sont incluses.

Réponse (champs en anglais, durées en heures, arrondies à 2 décimales) :

    period: {start, end}
    scope: {equipement_id, include_descendants, equipement_count}
    kpis: {interventions_reported, interventions_closed, interventions_open_now,
           time_spent_hours, actions_count, avg_complexity, avg_close_delay_days}
    monthly: [{month: "AAAA-MM", reported, closed, reported_by_type: {CUR: n, ...},
               time_spent_hours, avg_complexity}]   tous les mois de la période, même vides
    by_type: [{code, label, color, count, time_spent_hours}]     depuis INTERVENTION_TYPES
    by_action_category: [{code, name, color, actions_count, time_spent_hours}]
    by_complexity_factor: [{code, label, count}]

`interventions_open_now` ignore la période (état actuel). Une moyenne sans donnée vaut
null, jamais 0. Un type inconnu de INTERVENTION_TYPES ou une action sans sous-catégorie
apparaît sous un code `null` avec un libellé « Non renseigné », pas silencieusement omis.
Requêtes paramétrées uniquement ; agrégats faits en SQL (GROUP BY), pas en Python ligne
à ligne.

Ajouts à GET /interventions (pour la modale du front) : `type_inter` (CSV de codes,
validé contre INTERVENTION_TYPE_IDS, 400 sinon) et `reported_from` / `reported_to`
(dates ISO, bornes incluses, sur reported_date). Sans ces paramètres, le comportement
actuel est inchangé.

## Critères d'acceptation

- [x] Tests du dashboard sur données contrôlées : comptages, heures, moyenne de
      complexité, délai de fermeture, mois vides présents, moyennes null sans donnée,
      include_descendants vrai et faux, catégorie et type « Non renseigné ».
- [x] Tests des erreurs : 400 période inversée ou trop longue, 404 équipement inconnu,
      aucun message brut de base renvoyé.
- [x] Test d'autorisation : le code `equipements:get_equipement_dashboard` existe au
      catalogue ; un rôle sans le droit reçoit 403 ; MCP peut lire.
- [x] Tests des filtres type_inter (valide, invalide en 400) et reported_from / reported_to
      sur GET /interventions ; appel sans ces paramètres inchangé.
- [x] docs/endpoints mis à jour pour les deux routes.
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert (requêtes sur la vraie base).
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (backend-dev, worktree feat/equipement-tableau-de-bord-tdb01) : route
GET /equipements/{id}/dashboard (`get_equipement_dashboard`, limitée à 60/min, agrégats en
SQL, périmètre des descendants par `_descendant_ids`) ; filtres `type_inter`,
`reported_from`, `reported_to` sur GET /interventions, par un helper commun à get_all et
count_all ; documentation dans docs/api/endpoints/ (le chemin docs/endpoints/ de la fiche
était faux) ; section « Non publié » du CHANGELOG créée.

Tests : 12 unitaires (backend/tests/test_equipement_dashboard.py), 9 d'intégration
(backend/tests/integration/test_equipement_dashboard_integration.py), dont TECH en 200
puis 403 après retrait du droit et clé MCP en 200.

Écarts acceptés par l'agent principal :
- comptes figés de la matrice des droits relevés de 1 par rôle dans
  test_bootstrap_integration.py et test_default_permissions_integration.py (hors
  périmètre listé, conséquence mécanique de la nouvelle route ; aucune autre assertion
  touchée, vérifié par git diff -w) ;
- `by_complexity_factor` ignore les actions sans facteur (facteur obligatoire seulement
  au-delà d'une complexité de 5) ; un facteur inconnu de la table garde son code comme
  libellé ;
- une intervention n'est comptée fermée que si elle l'est encore (comme l'export de
  masse) ; une intervention fermée sans ligne de journal n'est pas comptée fermée ;
- `by_type` liste tous les types connus, même à zéro (au front de masquer les zéros) ;
- `reported_from` > `reported_to` renvoie 400 ; « 10 ans » = 3660 jours ; une date
  malformée est refusée par FastAPI (422).

Commandes en échec (agent), corrigées : premier test-integration.sh 3 échecs sur 343
(deux comptes de droits, et des données de test qui tombaient dans la période de
test_export_masse_integration, déplacées en 2032-2033) ; un lancement ciblé de quatre
fichiers a donné « fixture 'client' not found » (non creusé, le lancement complet passe).

Contrôle de l'agent principal : diff --stat conforme au périmètre (hors les deux tests
de comptes ci-dessus) ; check.sh vert ; test-integration.sh 343 passés ; aucun
conteneur ni processus restant ; SQL relu, seules des constantes sont interpolées.

NON VÉRIFIÉ : performances sur le volume de production (aucune requête sur la base de dev).
