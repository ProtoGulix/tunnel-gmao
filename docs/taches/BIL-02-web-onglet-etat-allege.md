# BIL-02. Onglet « État » du Bilan allégé

- Statut : faite
- Agent : frontend-dev
- Branche : feat/bilan-etat-allege (depuis develop, ADR 0008)
- Dépend de : ADR 0034, BIL-01
- Périmètre d'écriture : web/src/components/bilan/, web/src/components/service-status/,
  web/src/components/organisation/, web/src/hooks/organisation/, web/src/hooks/bilan/,
  web/src/components/ui/ (nouveau composant partagé seulement), CHANGELOG.md (« Non publié »),
  cette fiche (compte rendu). Exclus : onglets Audit et Qualité, backend/, mobile/, docs/decisions,
  docs/ETAT.md, toute dépendance.

## Contexte

L'utilisateur trouve l'onglet « État » (BIL-01, web/src/components/bilan/tabs/ServiceTab.jsx)
mal organisé et trop verbeux. L'ADR 0034 (à lire en entier) fixe la refonte. Données :
`/stats/service-status` (totaux de période, sans série mensuelle) et `/stats/organisation`
(`totals` et `monthly`). Recharts est chargé à la demande (ADR 0020) : les mini-courbes sont
en SVG simple, pas en Recharts.

## Critères d'acceptation

- [x] Composant d'aide partagé (libellé + icône ⓘ, définition au survol et au focus clavier,
      Tooltip ou HoverCard de @radix-ui/themes, largeur limitée) ; aucune définition écrite en
      clair dans l'onglet État ; textes de définitions inchangés.
- [x] Bandeau : 8 chiffres (mêmes indicateurs qu'aujourd'hui), chacun : libellé + ⓘ, valeur,
      une ligne de détail courte (« 16 sur 56 »), badge de statut pour charge, fragmentation,
      pilotage (seuils de components/service-status/config.js). Mini-courbe SVG sur la
      période pour les chiffres qui ont une série dans `monthly` (urgences, chantiers coupés,
      interventions par journée, part du préventif dans les heures) ; une série d'un seul
      point n'affiche pas de courbe. Cartes de hauteur régulière.
- [x] Format unique : virgule décimale, espace avant l'unité, partout dans l'onglet (fonctions
      de hooks/organisation/organisationFormat.js) ; pas de « 115.2 % » ni « 807.0h ».
- [x] « Règles de lecture » (DecisionGuide) et alerte critique retirés de l'onglet ; seuils
      présents dans la définition ⓘ ; composants supprimés s'ils ne servent plus ailleurs.
- [x] Temps : une barre empilée compacte production / dépannage / pilotage / fragmentation
      (heures et %), catégories dans l'ⓘ ; une seconde barre « par type d'intervention »
      (curatif, préventif, projet, autres) depuis `totals.hours` ; titres qui distinguent
      clairement les deux.
- [x] Causes de la fragmentation et temps par site : tableaux repliés (fermés par défaut),
      encadrés bleus d'explication remplacés par une ⓘ au titre.
- [x] Les 5 graphiques Recharts d'Organisation ne sont plus affichés dans l'onglet ; le tableau
      « Valeurs par mois » reste replié et contient toutes les valeurs mensuelles. Code mort
      supprimé (OrganisationCharts s'il ne sert plus).
- [x] Préventif : trois chiffres courts (en attente avec âge du plus ancien, en retard,
      génération) avec badge et ⓘ, sans phrase.
- [x] Droits et requêtes inchangés (blocs Organisation absents sans stats:get_organisation).
- [x] Tests `node --test` des fonctions pures nouvelles (points de la mini-courbe, parts de
      la barre empilée) ; tests existants inchangés.
- [x] `cd web && npm test && npm run build` verts ; aucune nouvelle erreur eslint dans les
      fichiers touchés ; scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait : composant `InfoLabel` (components/ui, Tooltip Radix, ⓘ au survol et au focus) ; bandeau
de 8 `FigureCard` (badge de statut, mini-courbe SVG `Sparkline` sur 4 chiffres) ; barres
empilées `StackedBar` (catégories de travail, types d'intervention) ; `FoldedSection` pour les
causes de fragmentation et le temps par site ; `PreventiveFigures` (3 chiffres) ; tableau
« Valeurs par mois » complété des heures par type. Fonctions pures `sparklinePoints` et
`stackShares` (hooks/bilan/miniSeries.js) avec tests.

Supprimés : ServiceStatusComponents.jsx, ServiceStatusDetails.jsx (DecisionGuide,
CriticalAlert), HoursChart, AverageChart et OrganisationCharts par défaut (ShareChart reste,
utilisé par la Synthèse de l'audit), StateTiles. Textes de définitions inchangés, déplacés
(charge, pilotage, fragmentation et les deux explications de tableaux : service-status/config.js).
Contrôle de l'agent principal (2026-11-21) : relecture APPROUVÉE. « Les causes ci-dessus »
devenu « Ces causes » (le texte s'affiche en infobulle) ; ⓘ ouvrable au toucher (ouverture
pilotée, un appui ouvre, un second ferme), relevé par la relecture. Constats mineurs laissés :
barre vide sans message quand le temps total est nul ; parts d'une barre calculées sur la
somme des segments si elle dépasse le total affiché (cas improbable).

Tests : `npm test` 71 verts. Rendu à l'écran NON VÉRIFIÉ.
