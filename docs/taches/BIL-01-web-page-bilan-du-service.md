# BIL-01. Page web « Bilan du service » à deux onglets

- Statut : faite
- Agent : frontend-dev
- Branche : feat/bilan-service (depuis develop, ADR 0008)
- Dépend de : ADR 0033
- Périmètre d'écriture : web/src/ (pages, components, hooks, api, config, router),
  CHANGELOG.md (section « Non publié »), cette fiche (compte rendu). Exclus : backend/,
  mobile/, docs/decisions/, docs/ETAT.md, toute dépendance.

## Contexte

Regrouper les pages État du service (pages/service-status), Organisation
(pages/organisation) et Synthèse de l'audit (pages/audit-synthese) en une page à deux
onglets, selon l'ADR 0033 (à lire en entier). Page à onglets existante à imiter :
pages/preventive/PreventivePage.jsx (useTabNavigation, Tabs Radix). APIs :
`GET /stats/service-status?start_date&end_date`, `GET /stats/organisation?start_date`,
`GET /stats/audit-synthese?months=N`. Organisation et audit sont déjà en mois
calendaires (periodStartDate dans hooks/equipements/dashboardFilters.js).

## Critères d'acceptation

- [x] Route `/bilan`, onglets « État du service » (`?tab=service`, défaut) et « Qualité »
      (`?tab=qualite`) ; valeur d'onglet inconnue ou onglet sans droit : retombe sur
      « service ».
- [x] Menu : une seule entrée « Bilan du service » dans Production à la place des trois ;
      « Qualité Données » inchangée. `/service-status`, `/organisation` et
      `/audit-synthese` redirigent (Navigate replace) vers `/bilan?tab=service` ou
      `/bilan?tab=qualite`.
- [x] Une période commune (Select 3, 6, 12, 24 mois, défaut 3, mois courant inclus),
      gardée dans l'URL (`?months=`), envoyée aux trois requêtes ; pour État du service,
      start_date = 1er du mois de début, end_date = aujourd'hui. Vérifier dans
      backend/api/stats/ que `months=N` de l'audit a le même sens que periodStartDate
      (sinon le signaler, ne pas toucher au backend).
- [x] Onglet service : bandeau de 6 chiffres (charge, fragmentation, part d'urgences,
      chantiers coupés, part du préventif dans les heures, attente de pièces) en tête ;
      puis sections « Temps et capacité » (répartition, causes, consommation par site,
      règles de lecture, alerte critique), « Organisation du travail » (5 courbes, valeurs
      par mois), « Préventif » (tuiles d'état). Les SynthesisCards et les PeriodFigures
      d'Organisation ne sont plus affichées en double. Chaque chiffre garde sa
      définition (textes existants, non modifiés).
- [x] Droits : sans `stats:get_organisation`, les blocs Organisation et leurs chiffres du
      bandeau sont absents (pas de requête) ; sans `stats:get_audit_synthese`, l'onglet
      Qualité n'apparaît pas (pas de requête). Le bloc État du service reste visible de
      tout utilisateur connecté.
- [x] Onglet qualité : bandeau des 6 indicateurs de l'ADR 0032, note « données
      incomplètes », puis courbes, valeurs par mois, tableau des décisions.
- [x] Une requête n'est lancée que pour l'onglet affiché ; une erreur d'un bloc n'empêche
      pas les autres de s'afficher.
- [x] config.js de service-status : BAT (id 24) rangé sous PROD comme dans
      backend/api/stats/repo.py.
- [x] Les anciens fichiers de page devenus inutiles sont supprimés (pas de code mort) ;
      les composants réutilisés restent à leur place ou sont déplacés proprement.
- [x] Tests `node --test` des fonctions pures nouvelles (choix d'onglet, calcul des dates de
      période) ; tests existants inchangés et verts.
- [x] `cd web && npm run lint && npm test && npm run build` verts ; scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait : page `/bilan` (pages/bilan/BilanPage.jsx), onglets `?tab=service|qualite` et période
`?months=3|6|12|24` dans l'URL (hooks/bilan : bilanParams.js pur et testé, useBilanParams.js),
bandeau de six chiffres (components/bilan/ServiceKeyFigures.jsx), onglets ServiceTab et
QualityTab (service-status et organisation chargés séparément, une erreur n'arrête pas l'autre).
Menu : une entrée ; anciennes routes en `Navigate replace`. BAT rangé sous PROD. Supprimés :
trois anciennes pages, ServiceStatusTab, SynthesisCards, PeriodFigures et tuile pièces
d'Organisation (déplacées dans le bandeau). `useOrganisation(startDate, enabled)` ajoute le
paramètre `enabled` ; `fetchServiceStatus` prend désormais des chaînes AAAA-MM-JJ (date locale,
plus d'ISO UTC).

Sens de `months=N` (backend/api/stats/routes.py) : identique à `periodStart` (1er du mois, N mois
calendaires, mois courant inclus). Organisation reçoit `start_date` seule (fin par défaut :
aujourd'hui).

Points notés : le pilotage (3e carte des anciennes SynthesisCards) n'était plus en tête.
Contrôle de l'agent principal (2026-11-21) : relecture APPROUVÉE avec réserve « indicateurs
perdus » (temps de pilotage, interventions par journée de technicien) ; tous deux remis dans
le bandeau, qui passe à huit chiffres (ADR 0033 point 2 mis à jour). Mobile :
mobile/src/config/navigation.js garde `/service-status` (hors périmètre, route mobile, non touchée).

Tests : `npm test` 63 verts (5 nouveaux, bilanParams.test.js) ; `npm run build` vert ;
scripts/check.sh vert. `npm run lint` sort en erreur par héritage (324 erreurs avant, 322 après,
aucune dans les fichiers du Bilan). NON VÉRIFIÉ : affichage réel à l'écran, droits par rôle.

Suite (agent principal, 2026-11-21) : à la demande de l'utilisateur, trois onglets au lieu de
deux : « État » (`?tab=service`), « Audit » (`?tab=audit`, ancienne synthèse, droit
`stats:get_audit_synthese`) et « Qualité » (`?tab=qualite`, ancienne page Qualité des données,
sans période). QualityTab renommé AuditTab, DataQualityTab créé depuis
pages/quality-data/QualityDataPage.jsx (supprimée), entrée de menu retirée. resolveTab et son test mis à jour. npm test 63 verts, build vert, lint sans erreur
dans les fichiers touchés (3 erreurs héritées de develop). Puis, à la demande de
l'utilisateur, les redirections des quatre anciennes adresses sont retirées (elles mènent à
l'accueil par la route générique).
