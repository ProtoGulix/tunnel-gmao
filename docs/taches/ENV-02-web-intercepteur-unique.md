# ENV-02. Intercepteur web : toujours déballer, lectures converties

- Statut : faite (2026-11-17)
- Agent : frontend-dev (sonnet)
- Branche : refactor/enveloppe-reponses-web, worktree créé depuis cette branche
- Dépend de : ADR 0022, ENV-01
- Périmètre d'écriture : web/src/lib/api/client.js, un nouveau module pur de
  déballage dans web/src/lib/api/ avec son test node, web/src/api/*.js,
  suppression de web/src/lib/api/singleBody.js et de son test ; rien hors de web/,
  aucun composant ni hook sauf si un appel y lit l'enveloppe (à signaler)

## Contexte

ADR 0022 points 1 à 4. Inventaire : 7 lectures fragiles (`response.data.data` sur des
routes avec audit : interventions.js, interventionTasks.js, planning.js,
purchaseRequests.js, intervention-requests.js), environ 65 lectures tolérantes
(`x.data?.data || x.data`, surtout admin*.js, auth.js, changelog.js, homeView.js).
Règle cible, la même que mobile/src/lib/api/client.js : objet non tableau avec une clé
`data` et sans clé `items` → `response.data = body.data`, `response.audit = body.audit`.

## Critères d'acceptation

- [x] Fonction pure de déballage testée : `{ data }`, `{ data, audit }` (audit conservé
      à part), `{ items, pagination }`, liste, objet nu, corps vide ou null
- [x] `grep -rn "data\.data\|data?\.data" web/src` ne renvoie plus rien hors du module
      de déballage et de son test
- [x] singleBody.js et son test supprimés
- [x] Le refresh de jeton (client.js) lit la nouvelle forme
- [x] scripts/check.sh vert ; eslint sans nouvelle erreur sur les fichiers touchés
- [x] Essai à l'écran par l'utilisateur : interventions (ouverture, statut, priorité),
      actions (édition, création), demandes d'achat (liste, détail), demandes
      d'intervention (détail, transition), administration (référentiels, rôles,
      utilisateurs, règles d'audit), connexion et profil
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Module `web/src/lib/api/unwrapEnvelope.js` (fonction pure, 7 tests node) utilisé par
l'intercepteur et par le refresh de jeton. 16 fichiers `web/src/api/*.js` convertis en
lecture directe de `response.data` (valeurs par défaut `?? []` / `?? {}` gardées).
`singleBody` supprimé. Aucune lecture d'enveloppe hors de `api/`. check.sh vert, build OK,
eslint : seule l'erreur de complexité préexistante d'interventions.js:54.
Essai à l'écran par l'utilisateur le 2026-11-17 : tous les écrans de la liste OK.
Reviewer APPROUVÉ (règle identique au mobile, formes backend recontrôlées route par
route, seul objet métier avec un champ `data` : la notification, non déballée à tort).
Mineur laissé : `extractAuthData` d'auth.js n'est plus qu'un `response?.data`.
