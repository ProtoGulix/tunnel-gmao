# 0022. Le client web déballe toujours l'enveloppe { data } des réponses

- Statut : accepté (validé par l'utilisateur le 2026-11-17)
- Date : 2026-11-17
- Affine : CLAUDE.md section 4 (les fronts sont des clients de l'API)

## Contexte

Le backend renvoie un objet unique par `single(data, audit_entity=None)`
(backend/api/utils/response.py) : `{ data }`, ou `{ data, audit }` quand la route
joint les règles d'audit de l'entité (9 routes sur environ 90, toutes en lecture).

L'intercepteur de réponse du client web (web/src/lib/api/client.js) ne retire
l'enveloppe que si `data` est la seule clé. La forme reçue par le code dépend donc
d'un détail de la route, invisible depuis le front : `{ data }` arrive déballé,
`{ data, audit }` arrive enveloppé. Le client mobile (mobile/src/lib/api/client.js)
déballe au contraire dès qu'il y a une clé `data` sans `items` : les deux fronts ne
lisent pas la même API de la même façon.

Inventaire du 2026-11-17 (agent Explore, lectures cassées revérifiées par l'agent
principal) :

- 4 lectures cassées dans web/src/api : `actions.js:60` (fetchAction lit l'enveloppe
  comme une action : le formulaire « Éditer » d'une action s'ouvre sur un objet vide),
  `actions.js:128` (updateAction : la carte d'action se vide après enregistrement),
  `planning.js:88` et `interventionTasks.js:84` (création d'action : retour vide). Un
  cinquième cas, l'en-tête d'intervention vidé après un PUT, a été corrigé le
  2026-11-17 par `lib/api/singleBody.js`.
- 7 lectures fragiles (`response.data.data` sur une route avec audit) : elles
  casseraient le jour où la route retire `audit`.
- Environ 65 lectures « tolérantes » (`x.data?.data || x.data`) qui masquent le
  problème, et environ 60 lectures directes de `response.data`.
- Le front ne lit `audit` que dans les réponses d'erreur (`lib/api/auditGuard.js`),
  jamais dans une réponse réussie.

Le défaut de fetchAction touche l'intégrité des données (CLAUDE.md section 3,
priorité 1) : un technicien qui enregistre le formulaire d'édition pré-rempli à vide
peut écraser la description, la date ou la catégorie d'une action.

## Décision

1. L'intercepteur web déballe toute réponse objet (non tableau) qui a une clé `data`
   et pas de clé `items`, comme le client mobile. Les règles d'audit éventuelles
   restent accessibles sur `response.audit`, sans être perdues.
2. Le code de web/src/api lit `response.data` comme l'objet ou la liste attendu,
   jamais `response.data.data`. Les lectures tolérantes `x.data?.data || x.data` sont
   remplacées par `x.data` : après le point 1, elles prendraient à tort un champ
   métier nommé `data`.
3. `lib/api/singleBody.js` est retiré une fois les appels convertis.
4. Un test node couvre l'intercepteur (fonction pure extraite de client.js) : `{ data }`,
   `{ data, audit }`, `{ items, pagination }`, liste, objet nu, corps vide.
5. Le backend ne change pas : aucune API publique n'est modifiée.

## Alternatives écartées

- Ne jamais déballer (supprimer l'intercepteur) : environ 60 lectures directes de
  `response.data` à réécrire, et le web divergerait encore du mobile. Plus de travail
  pour le même résultat.
- Garder l'intercepteur et généraliser `singleBody` à chaque appel : la règle reste
  conditionnelle et repose sur la discipline de chaque nouvel appel. Le bug reviendra.
- Uniformiser côté backend (toujours `{ data, audit }`, ou jamais `audit`) : change
  l'API publique (accord requis, clients MCP externes à recontrôler) sans supprimer le
  besoin d'une règle claire côté client.

## Conséquences

- Une seule règle, la même sur les deux fronts : « la réponse est l'objet ».
- Chantier web seul, découpé en tâches : correctif immédiat des 4 lectures cassées
  (intégrité), puis bascule de l'intercepteur et conversion des lectures fragiles et
  tolérantes, avec essai à l'écran des écrans touchés (actions, demandes d'achat,
  demandes d'intervention, administration).
- Risque : une route dont l'objet métier a réellement une clé `data` sans `items`
  serait déballée à tort. Aucune n'est connue ; le test de l'intercepteur documente
  la règle.
- Les clients MCP externes ne passent pas par cet intercepteur : non concernés.
