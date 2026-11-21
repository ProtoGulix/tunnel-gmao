# BIL-08. Web : onglet « Audit » allégé

- Statut : faite
- Agent : frontend-dev
- Branche : feat/bilan-audit-allege (depuis develop, ADR 0008)
- Dépend de : ADR 0035 ; BIL-07 (en parallèle, forme fixée par l'ADR)
- Périmètre d'écriture : web/src/components/bilan/, web/src/components/audit-synthese/,
  web/src/components/organisation/OrganisationCharts.jsx (suppression si mort),
  web/src/hooks/audit-synthese/, web/src/hooks/bilan/, web/src/api/auditSynthese.js,
  CHANGELOG.md (« Non publié »), cette fiche. Exclus : onglets État et Qualité (hors
  réutilisation de leurs composants sans en changer le rendu), backend/, mobile/, dépendances.

## Contexte

ADR 0035 (à lire, avec l'ADR 0034 pour les composants à réutiliser : FigureCard, Sparkline,
InfoLabel, FoldedSection dans web/src/components/bilan/ et components/ui/). Onglet actuel :
web/src/components/bilan/tabs/AuditTab.jsx.

## Critères d'acceptation

- [x] Six cartes au modèle de l'onglet État, sans badge ; définitions inchangées derrière ⓘ ;
      mini-courbe depuis `monthly`, tendance depuis `trends` (rien si absent ou null).
- [x] Texte garant / exécutants et mention « données incomplètes » derrière une ⓘ, sur une
      ligne courte.
- [x] Les cinq graphiques retirés ; « Valeurs par mois » et le tableau des décisions repliés.
      Code mort supprimé (AuditSyntheseCharts, et OrganisationCharts/ShareChart s'ils ne
      servent plus nulle part ; Recharts reste utilisé ailleurs ? le vérifier, ne pas retirer
      la dépendance).
- [x] Format des nombres identique à l'onglet État.
- [x] Tests `node --test` des fonctions pures touchées ; tests existants inchangés.
- [x] `cd web && npm test && npm run build` verts ; aucune nouvelle erreur eslint dans les
      fichiers touchés ; scripts/check.sh vert ; CHANGELOG à jour.

## Compte rendu final

Fait : nouvel AuditKeyFigures (six FigureCard sans badge, parts lues de 0 à 100 comme l'API,
tendances depuis `trends` avec tolérance à son absence). AuditTab : ⓘ « Garant et exécutants »
et ⓘ « Données incomplètes » sur une ligne, deux tableaux repliés (FoldedSection).
Supprimés : AuditSyntheseCharts.jsx, OrganisationCharts.jsx (plus utilisé nulle part) ; PeriodFigures
retiré de AuditSyntheseFigures. Recharts reste utilisé par les composants équipements.
Aucune fonction pure touchée : pas de nouveau test (78 existants verts).

Suite (agent principal, 2026-11-21, demandes de l'utilisateur) : le choix de période passe dans
l'en-tête de la page, au modèle de l'accueil (PageHeader `actions`, boutons soft gris de taille 2,
séparateur, plage de dates) : components/bilan/BilanPeriodControls.jsx ; le libellé de plage est
mis en commun (`formatDateRangeLabel` dans components/planning/planningUtils.js, utilisé aussi par
`formatWeekLabel`, testé). Masqué sur l'onglet Qualité ; barre d'onglets standard. npm test 81
verts, build vert.
