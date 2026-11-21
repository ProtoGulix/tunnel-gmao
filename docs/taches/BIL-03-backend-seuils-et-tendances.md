# BIL-03. API : seuils, badges d'un mot et tendances des indicateurs

- Statut : faite
- Agent : backend-dev
- Branche : feat/bilan-etat-allege (depuis develop, ADR 0008)
- Dépend de : ADR 0034 points 8 à 10
- Périmètre d'écriture : backend/api/stats/ (et backend/api/constants.py si les seuils y
  vont), backend/tests/, docs/api/ (doc de /stats/service-status et /stats/organisation, à
  chercher avec grep), CHANGELOG.md (« Non publié »), cette fiche. Exclus : web/, mobile/,
  migrations, toute dépendance.

## Contexte

ADR 0034 points 8 à 10 (à lire en entier). Statuts actuels : `_get_charge_status`,
`_get_frag_status`, `_get_pilot_status` dans backend/api/stats/repo.py ; indicateurs
mensuels d'Organisation dans backend/api/stats/organisation_repo.py (`monthly`).

## Critères d'acceptation

- [x] Seuils définis une seule fois (constantes nommées), utilisés à la fois par le calcul
      des statuts et par le champ `thresholds` de la réponse de `/stats/service-status`
      (forme exacte de l'ADR 0034 point 8, schéma Pydantic). Valeurs inchangées : charge
      75 / 100, fragmentation 5 / 15, pilotage 20 / 10 (direction below), mêmes bornes
      qu'aujourd'hui (vérifier < ou ≤ et le décrire dans le schéma).
- [x] Textes de statut d'un mot (ADR 0034 point 9) ; couleurs inchangées.
- [x] `/stats/organisation` renvoie `trends` (ADR 0034 point 10) ; fonction pure de calcul
      de tendance testée : moins de 3 valeurs → null, valeurs nulles ignorées, hausse, baisse,
      stable sous le seuil, série constante → stable. `preventive_hours_share` mensuel =
      heures PRE / heures totales du mois (mois sans heures ignoré).
- [x] Tests unitaires des statuts aux bornes ; tests existants inchangés (pas d'assertion
      affaiblie) ; tests d'intégration de /stats/organisation et /stats/service-status
      étendus aux nouveaux champs si des tests existent.
- [x] Doc d'endpoint à jour ; CHANGELOG à jour.
- [x] scripts/check.sh vert ; test-integration.sh vert (lire le résumé « N failed »).

## Compte rendu final

Fait : `api/stats/status_rules.py` (seuils et textes, source unique du calcul des statuts et
du champ `thresholds`), `api/stats/trends.py` (fonctions pures), `preventive_hours_share`
mensuel et `trends` dans `organisation_repo.py`, schémas, doc d'endpoint, CHANGELOG, tests
(`test_stats_seuils_tendances.py`, extension de l'intégration d'Organisation).

Bornes (identiques à l'existant) : above, orange dès >= orange, rouge dès >= red (charge 75 /
100, fragmentation 5 / 15) ; below, orange dès <= orange, rouge dès <= red (pilotage 20 / 10).
Tendance : stable si |variation| strictement sous le seuil. Variation = pente x (nombre de
mois de la période - 1), la pente étant calculée sur les positions réelles des mois non
nuls. `trends` est optionnel dans le schéma de réponse (défaut tout null) pour ne pas changer
les tests unitaires existants ; le dépôt le fournit toujours. Période vide de données
(`_empty_metrics`) : statuts de la valeur 0 (Normale, Maîtrisée, Absent).
Le web (hors périmètre) référence encore les anciens textes de statut.

Contrôle de l'agent principal (2026-11-21) : relecture APPROUVÉE. Correctif après relecture :
période sans heure saisie, `status` vaut `null` pour charge, fragmentation et pilotage (au lieu
d'un « Absent » rouge trompeur) ; test `test_periode_sans_heures_sans_statut`.
