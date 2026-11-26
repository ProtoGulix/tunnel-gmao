# DIR-02. Web : indicateurs des constats, onglet du Bilan et page Direction

- Statut : faite (2026-11-23)
- Agent : frontend-dev (sonnet)
- Branche : feat/vue-direction-constats-dir02 (worktree depuis feat/vue-direction-constats)
- Dépend de : ADR 0044, contrat de DIR-01 (fiche docs/taches/DIR-01-backend-stats-constats.md)
- Périmètre d'écriture : web/src/ (api, hooks, components/bilan, pages, router, config de menu,
  auth/permissionCodes.js), docs/site/responsable/bilan.md. Rien dans backend/.

## Contexte

ADR 0044. La route est écrite en parallèle par DIR-01 : coder contre le contrat de sa fiche.
Repères : web/src/pages/bilan/BilanPage.jsx (onglets, useBilanParams, période),
web/src/components/bilan/tabs/ServiceTab.jsx (Block : chargement, erreur, contenu),
web/src/api/organisation.js (appel stats), web/src/config/pagesConfig.js (menu),
recharts déjà présent (web/src/components/equipements/EquipementDashboardCharts.jsx,
dashboardColors.js `typeColor`). Pas de dépendance ajoutée, pas de couleur hex en dur
(variables Radix, `typeColor`, et la couleur de statut renvoyée par l'API comme RequestStatusBadge).

## Travail

1. `fetchConstatStats({startDate, endDate})` et un hook (data, loading, error).
2. Un composant `ConstatInsights({startDate, endDate})` à quatre blocs :
   - Volume par mois : barres.
   - Leviers : barres horizontales ; couleur `typeColor(suggested_type_inter)` si typé, sinon gris.
   - Signal précurseur : barres horizontales, et « Connu depuis » à côté.
   - Devenir des demandes : barre empilée ou barres, couleurs de l'API.
   - Total en tête ; état vide « Aucun constat sur la période ».
3. Onglet « Constats » de /bilan (même période que les autres onglets).
4. Page /direction : titre « Direction », sélecteur de période du Bilan (même composant et mêmes
   paramètres d'URL si possible), puis `ConstatInsights`. Entrée de menu « Direction » à côté de
   Bilan, conditionnée à `PERM.stats.constats` (`stats:get_constats`).
5. Textes sobres (CLAUDE.md 8.7) ; complexité ≤ 10, lint du dépôt.
6. Guide : docs/site/responsable/bilan.md, quelques lignes sur l'onglet et la page.

## Critères d'acceptation

- [x] un seul composant pour l'onglet et la page
- [x] quatre blocs, état vide, erreur affichée comme les autres blocs du Bilan
- [x] menu « Direction » visible avec le droit, masqué sans
- [x] tests unitaires (vitest, comme constatRules.test.js) pour toute mise en forme des données
- [x] check.sh vert ; `npm run build` du web vert
- [x] guide à jour

## Compte rendu final

Fait : API `fetchConstatStats`, hook `useConstatStats`, composant unique `ConstatInsights` (onglet
Constats de /bilan et page /direction), mise en forme pure testée (`constatInsightsFormat`),
droit `PERM.stats.constats`, menu « Direction » conditionné par `requiredPermission`, guide.
Tests : npm test 103 verts, check.sh vert, npm run build vert. Non vérifié : rendu réel contre
la route de DIR-01 (non disponible), accès direct à /direction sans droit (le backend répond 403,
aucune garde de route côté web). Lint : erreurs préexistantes ailleurs (complexité, routes.jsx).

Retouche de l'agent principal après essai (2026-11-23) : la page /direction et son menu sont
retirés ; le composant est placé dans l'accueil « Direction technique »
(TechnicalDirectionHomeView.jsx, sous les demandes, 3 mois par défaut). Décision de l'utilisateur.
Deuxième retouche après essai (2026-11-23, « comme pour les autres indicateurs ») : présentation
de l'onglet État, bandeau de quatre chiffres clés (FigureCard, mini-courbe des constats par mois ;
signal visible, signal non remonté, suggestions retenues) puis barres empilées « Où agir »
(StackedBar, qui accepte désormais un format de valeur et un texte de total).
Troisième retouche (2026-11-23) : le bloc de l'accueil « Direction technique » est retiré, à la
demande de l'utilisateur (pas adapté à un accueil). Les indicateurs restent dans l'onglet Constats.
