# CDL-05. Web : section « Constats » du référentiel en administration

- Statut : faite 2026-11-26
- Agent : frontend-dev (sonnet)
- Branche : feat/constat-demande-selon-levier-cdl05 (worktree depuis feat/constat-demande-selon-levier, après CDL-04)
- Dépend de : ADR 0045 point 5, routes de CDL-04
- Périmètre d'écriture : web/src/components/admin/ (nouvelle section et ses fenêtres), web/src/components/admin/tabs/AdminReferentielTab.jsx, web/src/api/ et web/src/hooks/ (appels admin), leurs tests, docs/site/administrateur/referentiels.md. Rien dans le formulaire de constat (CDL-03 en parallèle), rien dans backend/.

## Contexte

Modèle : AdminRefInterventionsSection.jsx dans l'onglet Référentiel. Routes de CDL-04 :
`GET /admin/constat-questions`, `PATCH /admin/constat-questions/{id}`, `POST /admin/constat-choices`,
`PATCH /admin/constat-choices/{id}`.

## Travail

1. Section « Constats » : une question par bloc (sous-questions rattachées à leur choix parent), ses choix en tableau : libellé, type préconisé, génère une demande, exclusif, actif, ordre.
2. Modifier un choix (fenêtre) ; ajouter un choix à une question (code saisi, figé ensuite) ; activer ou désactiver ; renommer une question.
3. Rappel court qu'un réglage ne vaut que pour les constats saisis ensuite.
4. Textes sobres (CLAUDE.md 8.7), complexité ≤ 10, aucune couleur en dur.
5. Guide administrateur : la section et ses réglages.

## Critères d'acceptation

- [x] section visible dans l'onglet Référentiel, modifications envoyées aux routes de CDL-04, erreur de l'API affichée
- [x] tests unitaires pour toute mise en forme pure
- [x] npm test et npm run build verts ; scripts/check.sh vert
- [x] guide à jour

## Compte rendu final

Fait : sous-onglet « Constats » du Référentiel (AdminRefConstatsSection, fenêtres dans
AdminRefConstatDialogs, mise en forme pure dans constatReferentiel.js avec tests, hook
useConstatReferentiel, 4 appels dans api/adminReferentiel.js, 4 codes de droit dans
permissionCodes.js : admin:list_constat_questions, patch_constat_question, create_constat_choice,
patch_constat_choice, déduits du nom des fonctions de routes, NON VÉRIFIÉ contre le catalogue).
Type préconisé choisi parmi les types actifs. Erreur de l'API affichée par la notification de
l'onglet. Après chaque écriture la liste est rechargée. Guide et CHANGELOG à jour.
Hors périmètre listé : permissionCodes.js (indispensable aux droits d'affichage).
NON VÉRIFIÉ : rendu dans le navigateur.
