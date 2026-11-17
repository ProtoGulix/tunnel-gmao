# ENV-01. Corriger les quatre lectures cassées (édition et création d'action)

- Statut : faite (2026-11-17)
- Agent : principal
- Branche : refactor/enveloppe-reponses-web (depuis develop, ADR 0008) ; reprenable
  telle quelle en hotfix si l'utilisateur le décide
- Dépend de : ADR 0022
- Périmètre d'écriture : web/src/api/actions.js, web/src/api/planning.js,
  web/src/api/interventionTasks.js, cette fiche, CHANGELOG.md, docs/ETAT.md ; ni
  l'intercepteur (ENV-02), ni backend

## Contexte

Inventaire de l'ADR 0022 : avec l'intercepteur actuel, `fetchAction` lit l'enveloppe
`{ data, audit }` comme une action (formulaire « Éditer » pré-rempli à vide, risque
d'écrasement), `updateAction`, `createActionDirect` et
`createInterventionActionForTask` lisent `.data.data` sur une réponse déjà déballée.
Correctif minimal par `singleBody` (déjà en place), indépendant de l'intercepteur pour
rester livrable seul.

## Critères d'acceptation

- [x] Les quatre appels passent par `singleBody(response.data)`
- [x] À l'écran : « Éditer » sur une action affiche ses vraies valeurs ; après
      enregistrement la carte reste complète ; création d'action depuis l'onglet
      Actions et depuis une tâche sans régression
- [x] scripts/check.sh vert ; eslint sans nouvelle erreur sur les fichiers touchés
- [x] CHANGELOG (« Non publié », Corrigé) à jour

## Compte rendu final

Constat à l'écran par l'utilisateur le 2026-11-17, avant correctif : « Éditer » sur une
action ouvre un formulaire vide titré « Nouvelle action ». Correctif : `singleBody` sur
fetchAction, updateAction, createActionDirect, createInterventionActionForTask. Les
appelants de création ignorent la valeur rendue (vérifié : useInterventionDetail,
DayContextPanel, TaskDetail) : passer de undefined ou {} à l'action créée est sans
effet de bord. eslint : aucune erreur avant ni après sur les trois fichiers.

Essai à l'écran par l'utilisateur le 2026-11-17, après correctif : champs affichés à
l'édition, modification et création d'action fonctionnent. Restent, hors périmètre :
le formulaire d'édition est titré « Nouvelle action », et la carte affiche deux fois
le libellé quand la description de l'action reprend celui de sa tâche (backlog
action-edition-titre-et-libelle-double.md). Correctif urgent 5.6.1 : décision de
l'utilisateur en attente.
