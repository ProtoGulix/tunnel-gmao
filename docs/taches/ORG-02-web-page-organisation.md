# ORG-02. Page « Organisation » du front web

- Statut : fait (essai à l'écran validé le 2026-11-17, reviewer APPROUVÉ)
- Agent : frontend-dev
- Branche : feat/page-organisation (depuis develop, ADR 0008)
- Dépend de : ORG-01 (contrat de GET /stats/organisation), ADR 0020 (Recharts), ADR 0021
- Périmètre d'écriture : web/src/pages/organisation/, web/src/components/organisation/,
  web/src/hooks/organisation/ (fonctions pures et leurs tests), web/src/api/ (fonction
  d'appel), web/src/config/pagesConfig.js et le routage de la page s'il est ailleurs,
  web/src/auth/permissionCodes.js, CHANGELOG.md (« Non publié »).
  Exclu : backend/, mobile/, toute dépendance, les autres pages.

## Contexte

Page vue par toute l'équipe, techniciens compris, pour suivre l'organisation du travail
mois après mois (ADR 0021). Elle doit se lire sans explication orale : chaque indicateur
porte sa définition en une phrase.

## Attendu

- Entrée de menu « Organisation » dans la section « Production », à côté de « État du
  service », visible avec le droit `stats:get_organisation` (PERM).
- Sélecteur de période : 6 mois, 12 mois (défaut), 24 mois.
- En tête, des tuiles d'état actuel, en texte d'encre, pastille de statut avec icône et
  libellé (jamais la couleur seule) :
  « Préventif : N demandes en attente, la plus ancienne depuis N jours » ;
  « Dernière génération du préventif : il y a N jours » (alerte au-delà de 35 jours) ;
  « Attente de pièces : N interventions, âge médian N jours ».
- Tuiles de la période : chantiers coupés par une urgence (part), part d'urgences,
  interventions par journée de technicien, part du préventif dans les heures.
- Graphiques mensuels sur le même axe des mois, une seule échelle par graphique :
  part des chantiers coupés ; part d'urgences ; heures par type empilées (CUR, PRE,
  PRO, autres, mêmes couleurs que le tableau de bord d'équipement pour CUR, PRE, PRO) ;
  dispersion (moyenne et part des journées à 3 ou plus, en deux graphiques si les
  échelles diffèrent).
- Sous chaque graphique, sa définition en une phrase, reprise de l'ADR 0021.
- Tableau repliable « Valeurs par mois » (Table Radix, size 1).
- Style aligné sur la section « État et évolution » du panneau équipement (TDB-03) :
  Radix Themes, variables CSS, thème clair et sombre ; Recharts chargé en React.lazy.
- Aucun chiffre ni nom par technicien (l'API n'en renvoie pas, ne rien reconstituer).
- États vide, chargement et erreur avec LoadingState / ErrorState.

## Critères d'acceptation

- [x] Page visible avec le droit, absente du menu sans le droit.
- [x] Changement de période relance la requête.
- [x] Parts null affichées « — », jamais 0 %.
- [x] Définition affichée sous chaque graphique.
- [x] Tests des fonctions pures (formatage des parts et des âges, alerte de génération).
- [x] npm run build vert, aucune erreur de lint ajoutée (comparaison avant et après),
      scripts/check.sh vert ; poids du chunk noté.
- [x] Essai à l'écran par l'utilisateur (2026-11-17).
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait : page /organisation (menu Production, après « État du service »), tuiles d'état
et de période, cinq graphiques Recharts en React.lazy, tableau repliable, définitions de
l'ADR 0021 sous chaque indicateur. Droit `stats:get_organisation` (PERM.stats.organisation).

Écarts à la fiche : le menu ne filtrait que par rôle ; ajout de `requiredPermission` dans
pagesConfig, menuConfig (getMenuItems/getMenuSections reçoivent `can`) et Sidebar, hors
périmètre listé mais indispensable au critère « absente du menu sans le droit ». La page
redirige vers / sans le droit. Un `eslint-disable-next-line` justifie le code du catalogue
(« _or » dans get_organisation déclenche à tort la règle des filtres Directus).
Période : on réutilise periodStartDate de hooks/equipements/dashboardFilters.

Vérifications : npm test 42 verts (5 tests ajoutés) ; npm run build vert, chunk des
graphiques OrganisationCharts 17,12 kB (6,38 kB gzip), page 3,81 kB gzip ; lint 505
problèmes dont 328 erreurs, identique à avant ; scripts/check.sh vert.

Essai à l'écran validé par l'utilisateur le 2026-11-17 sur les données de production copiées.
Revue : APPROUVÉ ; suite à la revue, `const { can } = usePermissions()` déplacé avec les
autres hooks de Sidebar.
