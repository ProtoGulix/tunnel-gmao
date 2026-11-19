# PREV-01. Backend : échéancier du préventif (calcul glissant, route en lecture)

- Statut : faite (2026-11-18)
- Agent : backend-dev (sonnet)
- Branche : feat/preventif-automatise (depuis develop, ADR 0008), worktree d'une
  sous-branche feat/preventif-automatise-prev01
- Dépend de : ADR 0023
- Périmètre d'écriture : backend/api/preventive_occurrences/ (routes.py, repo.py,
  schemas.py, nouveau module de calcul pur), backend/api/settings.py (réglage de
  prévenance), backend/db/default_permissions.py, backend/tests/,
  docs/api/endpoints/ (fichier du domaine), CHANGELOG.md (« Non publié »). Exclu :
  génération (PREV-02), web, mobile, migrations, schéma de base.

## Contexte

Aujourd'hui on ne voit une échéance qu'une fois l'occurrence générée, et rien ne dit
qu'elle est en retard. Décisions de l'utilisateur du 2026-11-18 : périodicité
**glissante**, dont la référence est la **date de clôture de la demande** liée à
l'occurrence (passage à `cloturee` dans `request_status_log`, via `di_id`), et
prévenance globale de 7 jours. Accord de l'utilisateur pour la nouvelle route en
lecture : 2026-11-18.

## Critères d'acceptation

- [x] Fonction de calcul pure (sans base), testée seule : à partir de la date de
      référence, de `periodicity_days`, d'aujourd'hui et de la prévenance, elle rend
      l'échéance et l'état `overdue` (échéance < aujourd'hui), `due_soon` (échéance ≤
      aujourd'hui + prévenance) ou `ok`
- [x] Date de référence d'un couple plan × machine : date du passage à `cloturee` de la
      demande de la dernière occurrence `completed` ; à défaut (occurrence `skipped`, ou
      demande sans ligne de clôture) sa `scheduled_date`. Sans historique : échéance =
      aujourd'hui (même règle que la génération actuelle)
- [x] Une occurrence active (`pending`, `generated`, `in_progress`) l'emporte :
      échéance = sa `scheduled_date`, et la réponse porte `occurrence_id`, `di_id`,
      `intervention_id`
- [x] Plans `hours` : listés avec l'état `not_computed` (le compteur actuel mesure le
      temps passé, pas le fonctionnement : docs/backlog/releve-compteur-heures.md)
- [x] `GET /preventive-occurrences/schedule` : une ligne par plan actif × machine de la
      classe, avec plan (id, code, libellé), machine (id, code, nom), date de référence,
      échéance, état, jours de retard ; filtres `machine_id` (+ `include_descendants`)
      et `state` (liste blanche) ; tri par échéance. Déclarée avant `/{id}`
- [x] Prévenance lue dans `api/settings.py` (défaut 7 jours), test du réglage
- [x] Autorisation : lecture ouverte aux rôles qui lisent (ADMIN, RESP, TECH,
      ACHETEUR, MCP), déclarée dans default_permissions.py ; test par rôle
- [x] Requêtes paramétrées, aucune écriture
- [x] scripts/check.sh vert ; test d'intégration de la requête sur la vraie base
      (test-integration.sh vert)
- [x] Doc d'endpoint et CHANGELOG (« Non publié ») à jour

## Compte rendu final

- Fait : module pur `backend/api/preventive_occurrences/schedule.py` (`compute_due`, `classify_due`, `not_computed`) ; `get_schedule` dans repo.py (une requête, deux LATERAL : occurrence active, dernière terminée avec date de clôture de la demande) ; route `GET /preventive-occurrences/schedule` avant `/{id}` ; réglage `PREVENTIVE_LEAD_DAYS` (7) dans settings.py ; doc d'endpoint ; CHANGELOG.
- Droit : aucune règle ajoutée dans default_permissions.py, la lecture y est déjà ouverte à RESP, TECH, ACHETEUR, MCP (ADMIN toujours) ; le catalogue passe de 256 à 257 endpoints, les comptes attendus des deux tests de matrice sont relevés de 1 par rôle.
- Tests : `tests/test_preventif_echeancier.py` (calcul pur, réglage, droit par rôle), `tests/integration/test_preventif_echeancier_integration.py` (requête sur vraie base, filtres, rôles).
- Reste hors périmètre : la génération (PREV-02) n'est pas modifiée ; `today` est la date du serveur, la date de clôture est celle du timestamp dans le fuseau de la session SQL.

Contrôle de l'agent principal (2026-11-18) : diff conforme au périmètre ; seuls deux
attendus de tests modifiés (comptes de la matrice relevés de 1 par rôle, route ajoutée,
aucun affaiblissement) ; même périmètre de machines que la génération vérifié. Commandes
en échec de l'agent, corrigées : ruff format, ordre des imports, 3 échecs d'intégration
(2 comptes de matrice, 1 erreur de son propre test). Après fusion : check.sh vert,
test-integration.sh vert (368 passed). NON VÉRIFIÉ : requête sur la base de dev, appel
réel avec la clé MCP.
