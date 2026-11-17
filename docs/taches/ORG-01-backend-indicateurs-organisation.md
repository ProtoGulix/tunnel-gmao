# ORG-01. Endpoint des indicateurs d'organisation

- Statut : terminée (reviewer APPROUVÉ le 2026-11-17)
- Agent : backend-dev
- Branche : feat/page-organisation (depuis develop, ADR 0008)
- Dépend de : ADR 0021 (définitions, aucun chiffre individuel)
- Périmètre d'écriture : backend/api/stats/ (routes.py, repo.py ou un nouveau
  organisation_repo.py, schemas.py), backend/tests/ (nouveaux fichiers de test ; comptes
  figés des droits dans test_bootstrap_integration.py et
  integration/test_default_permissions_integration.py seulement s'ils l'exigent, +1 par
  rôle), docs/api/endpoints/ (page stats), CHANGELOG.md (« Non publié »).
  Exclu : alembic/, db/, toute écriture en base, web/, mobile/, toute dépendance.

## Contexte

L'utilisateur veut que l'équipe suive elle-même, chaque mois, les interruptions des
chantiers par les urgences, la part d'urgences, le préventif en attente et la dispersion
des journées (analyse du 2026-11-16 sur la base de production). Lecture seule.

## Spécification

GET /stats/organisation, fonction `get_organisation` (droit `stats:get_organisation`,
créé par sync_catalog, ouvert par défaut aux rôles qui lisent), limitée à 10/minute
comme les autres routes de /stats.

Paramètres : `start_date`, `end_date` (dates ISO ; défaut : 1er jour du mois d'il y a
11 mois jusqu'à aujourd'hui). 400 (ValidationError) si start_date > end_date ou si la
période dépasse 3660 jours.

Les définitions sont celles de l'ADR 0021, point 3, sans écart. Réponse (champs en
anglais, heures arrondies à 2 décimales, parts en pourcentage arrondies à 1 décimale,
null quand le dénominateur vaut 0, jamais 0 à la place) :

    period: {start, end}
    monthly: [{month: "AAAA-MM",
               interventions_reported, urgent_count, urgent_share,
               hours: {CUR, PRE, PRO, other, total},
               chantiers_started, chantiers_interrupted, interrupted_share,
               tech_days, avg_interventions_per_tech_day, scattered_days_share}]
               tous les mois de la période, même vides
    totals: {interventions_reported, urgent_count, urgent_share,
             hours: {CUR, PRE, PRO, other, total},
             chantiers_started, chantiers_interrupted, interrupted_share,
             tech_days, avg_interventions_per_tech_day, scattered_days_share}
    projects: {count, avg_active_days, avg_span_days, active_ratio}
             interventions PRO (tous techniciens confondus) avec des actions sur au
             moins 2 jours, dont le premier jour est dans la période ;
             active_ratio = somme des jours actifs / somme des durées (en %)
    preventive: {active_plans, occurrences_not_started, oldest_not_started_days,
                 pending_requests, oldest_pending_request_days, last_generated_at}
                état actuel, hors période
    waiting_parts: {count, median_age_days, max_age_days}   état actuel

Contraintes :
- Aucun identifiant, nom, initiale ni ligne par technicien dans la réponse, même
  imbriqué (ADR 0021, point 2). Le technicien sert seulement à former les couples dans
  le SQL.
- Seule la priorité `urgent` compte comme urgence (les variantes « normale » et
  « normal » existent en base, elles sont sans effet ici).
- `scattered_days_share` : part des journées-technicien à 3 interventions distinctes
  ou plus.
- Requêtes paramétrées uniquement, agrégats en SQL (GROUP BY, fenêtres), pas en Python
  ligne à ligne. Aucune écriture.

## Critères d'acceptation

- [x] Tests sur données contrôlées : chantier coupé et non coupé (urgence le premier ou
      le dernier jour = non coupé, entre les deux = coupé, urgence d'un autre
      technicien = non coupé, CUR non urgent = non coupé), chantier d'un seul jour
      ignoré, mois vides présents, parts null sans dénominateur, dispersion (journée à
      1 et à 3 interventions), heures par type, préventif en attente et dernière
      génération, attente de pièces.
- [x] Test qui vérifie qu'aucune clé de la réponse ne contient d'identifiant ou de nom de
      technicien (parcours récursif de la réponse).
- [x] Tests des erreurs : 400 période inversée ou trop longue ; aucun message brut de
      base renvoyé.
- [x] Test d'autorisation : le code `stats:get_organisation` existe au catalogue ; TECH
      lit en 200, un rôle sans le droit reçoit 403 ; la clé MCP lit.
- [x] docs/api/endpoints/ mis à jour (page stats).
- [x] scripts/check.sh vert ; scripts/test-integration.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait : `GET /stats/organisation` (`get_organisation`, 10/minute), dépôt dédié
`backend/api/stats/organisation_repo.py` (agrégats SQL paramétrés, lecture seule),
schémas, route. Période par défaut et validation (400) réutilisent
`resolve_dashboard_period` et `month_keys` du tableau de bord d'équipement.

Choix de définition (ADR 0021 les laissait ouverts) :
- Les actions sans technicien ne forment ni chantier ni journée-technicien ; elles
  comptent dans les heures et dans `projects`.
- Durée d'un chantier de projet = dernier jour - premier jour + 1 (bornes comprises).
- Âge d'une occurrence en attente : depuis `triggered_at` (à défaut `created_at`) ;
  demandes en attente : `nouvelle` et liées à une occurrence ; `last_generated_at` =
  dernier `triggered_at` d'une occurrence liée à une demande.
- Un déclencheur force `status_actual = 'ouvert'` à l'insertion : les tests posent
  `attente_pieces` par UPDATE.

Tests : 8 unitaires (`test_stats_organisation.py`), 8 d'intégration
(`test_stats_organisation_integration.py`, données en 2034 et 1999, nettoyées).
Comptes figés des droits +1 par rôle (255/219/122/158/111).
check.sh : 369 passés ; test-integration.sh : 351 passés.
