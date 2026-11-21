# BIL-05. API : séries mensuelles de charge, fragmentation, pilotage et attente de pièces

- Statut : faite
- Agent : backend-dev
- Branche : feat/bil-05 (depuis feat/bilan-etat-allege, ADR 0008)
- Dépend de : ADR 0034 point 12, BIL-03
- Périmètre d'écriture : backend/api/stats/, backend/tests/, docs/api/endpoints/stats.md,
  CHANGELOG.md (« Non publié »), cette fiche. Exclus : web/, mobile/, migrations, dépendances.

## Contexte

L'utilisateur veut une courbe et une tendance sur les huit chiffres du bandeau. ADR 0034
point 12 (forme exacte des champs, à ne pas changer : le web est écrit en parallèle).
Calcul actuel des totaux : StatsRepository.get_service_status (backend/api/stats/repo.py),
tendance : backend/api/stats/trends.py, attente de pièces : `_waiting_parts` dans
organisation_repo.py. Journal des statuts : `intervention_status_log (intervention_id,
status_from, status_to, date)` ; statut « attente_pieces ».

## Critères d'acceptation

- [x] `monthly` et `trends` de /stats/service-status conformes au point 12 ; la somme des heures
      mensuelles égale `total_hours` de la période (test) ; classement PROD/DEP/PILOT/FRAG
      partagé avec le calcul des totaux (pas de deuxième copie de la règle).
- [x] `waiting_parts_count` mensuel et `trends.waiting_parts_count` conformes ; requête
      paramétrée ; le mois courant égale le compte actuel (`status_actual`) quand le journal est
      complet (test d'intégration) ; mois antérieur au journal → null.
- [x] Tendances réutilisant trends.py avec les seuils du point 12.
- [x] Tests unitaires et d'intégration ; aucune assertion existante affaiblie.
- [x] Doc d'endpoint et CHANGELOG à jour ; scripts/check.sh et test-integration.sh verts.
- [x] Temps de réponse : une seule requête groupée par mois, pas une requête par mois.

## Compte rendu final

Fait. `monthly` et `trends` dans /stats/service-status ; `waiting_parts_count` mensuel et
`trends.waiting_parts_count` dans /stats/organisation. Choix : pourcentages de 0 à 100 à
1 décimale ; capacité mensuelle = 400 h x jours du mois dans la période / 30 (la somme des mois
égale la capacité de la période) ; mois sans heure : pourcentages null ; classement partagé
par `time_classification.CLASSIFIED_ACTIONS_CTE` (une seule requête mensuelle groupée) ;
pièces en attente : une requête LATERAL pour tous les mois, mois courant arrêté à aujourd'hui,
mois futur null, mois dont le dernier jour précède la première ligne du journal null.
`compute_trends` garde ses cinq champs (assertion existante) ; la tendance des pièces est
`compute_waiting_trend`. Fichiers : api/stats/ (service_monthly.py, time_classification.py,
repo.py, organisation_repo.py, trends.py, schemas.py), tests unitaires et d'intégration,
docs/api/endpoints/stats.md, CHANGELOG.
