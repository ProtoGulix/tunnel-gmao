# ADT-03. API : interventions bloquées par interlocuteur

- Statut : fait
- Agent : backend-dev
- Branche : feat/accueil-direction-a-trancher
- Dépend de : ADR 0047 points 4 et 5
- Périmètre d'écriture : backend/api/stats/ (routes, schemas, nouveau repo dédié), backend/api/settings.py (une variable), backend/tests/, docs/api/endpoints/ (stats), deploy/README.md et le fichier d'exemple d'environnement (variable), CHANGELOG.md, cette fiche. Exclu : migrations, autres domaines, fronts.

## Contexte

La liste des interventions ne donne pas la date d'entrée dans le statut. Une lecture dédiée, sur le modèle de `GET /stats/demandes`, calcule durée, seuil, causes et tri.

## Critères d'acceptation

- [x] variable d'environnement du seuil (7 par défaut, refus au démarrage si < 1), distincte de REMINDER_INTERVAL_DAYS, documentée dans deploy/README.md
- [x] `GET /stats/blocages?site_id=` : deux groupes, `parts` (`attente_pieces`) et `production` (`attente_prod`), plus `threshold_days` ; filtre de site comme `/stats/demandes` (descendants compris)
- [x] entrée dans le statut = dernière ligne de `intervention_status_log` vers le statut courant, à défaut `reported_date` ; seules les interventions au-delà du seuil
- [x] chaque élément : id, code, titre, équipement (id, code, nom), priorité, `days_in_status`, et la cause : compteurs de demandes d'achat (mêmes statuts dérivés que `stats.purchase_requests` de la liste) pour les pièces, `note` pour la production (textes écrits par la base exclus par liste nommée, sinon null)
- [x] tri : `urgent` en tête, puis durée décroissante (test)
- [x] aucune donnée par personne ; requêtes paramétrées ; lecture ouverte aux connectés par la règle par défaut (test)
- [x] tests d'intégration : bornes du seuil, repli sans journal, note système exclue, filtre de site
- [x] docs/api/endpoints ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Fait : `GET /stats/blocages?site_id=` (`blocages_repo.py`, schémas, route 10/min, droit `stats:get_blocages` par la règle de lecture par défaut) ; variable `BLOCKED_ALERT_DAYS` (7, refus au démarrage sous 1) dans settings, `deploy/.env.example`, `deploy/docker-compose.yml` (sans cela elle n'atteint pas le conteneur) et `deploy/README.md`.

Choix : borne inclusive, jours révolus (`days_in_status >= seuil`) ; durée calculée sur l'heure locale de session (le journal stocke un timestamp sans fuseau) ; `reported_date` pris à minuit. La note vient de la ligne d'entrée seule ; si elle est écrite par la base ou vide : null (liste nommée `SYSTEM_NOTES`, contrôlée par un test contre schema.sql). Un groupe ne porte que sa cause (l'autre champ vaut null).

Compteurs d'achat : requête LATERAL non factorisée avec `interventions/repo.py` (inline dans un gros f-string, hors périmètre) ; générée depuis `PURCHASE_COUNTERS`, un test vérifie l'alignement des statuts sur la liste.

Tests : `tests/test_stats_blocages.py` (7), `tests/integration/test_stats_blocages_integration.py` (12). Comptes de droits par défaut +1 par rôle ajustés dans `test_default_permissions_integration.py` et `test_bootstrap_integration.py`. Les tests d'intégration nettoient leurs interventions : des journaux antidatés faussaient `test_pieces_en_attente_mois_courant_egal_etat_actuel`.
