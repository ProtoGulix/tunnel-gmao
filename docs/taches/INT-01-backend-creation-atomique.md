# INT-01. Backend : création atomique demande, intervention et tâches

- Statut : faite
- Agent : backend-dev (sonnet)
- Branche : feat/creation-intervention-atomique (depuis develop), worktree de la sous-branche
  feat/creation-intervention-atomique-int01
- Dépend de : ADR 0025
- Périmètre d'écriture : backend/api/interventions/, backend/api/intervention_requests/
  (repo, routes, schemas, validators), backend/api/intervention_tasks/ si une fonction
  d'insertion doit être réutilisée, backend/tests/, docs/api/endpoints/ (interventions,
  intervention-requests), CHANGELOG.md (« Non publié »), cette fiche. Exclu : migrations,
  web/, mobile/, toute dépendance.

## Contexte

ADR 0025. Aujourd'hui demande, intervention et tâches sont créées en appels séparés ;
`origine` est ignoré ; l'INSERT d'intervention est écrit deux fois
(interventions/repo.py `add`, intervention_requests/repo.py `transition_status`, vers
l.923) et l'acceptation perd titre et technicien (routes.py vers l.181). Le trigger
`fn_notify_di_a_traiter` ne notifie pas une demande d'origine « directe ».

## Critères d'acceptation

- [x] `POST /interventions` accepte `request_id` OU `request` (demandeur_nom, description,
      service_id), exclusifs (422 sinon), et `tasks` facultatif (champs de la création de
      tâche actuelle) ; un appel avec `request_id` seul garde son comportement
- [x] Tout dans une seule transaction : test d'intégration où une tâche invalide fait
      échouer l'appel et ne laisse ni demande, ni intervention, ni tâche, ni notification
- [x] Demande créée par cette route : origine « directe », aucune notification en base,
      aucun mail en tâche de fond (test)
- [x] Une seule fonction insère une intervention ; l'acceptation d'une demande l'utilise et
      garde titre et tech_id reçus (test)
- [x] Autorisation : création de demande et de tâches contrôlée comme sur leurs routes
      propres (permission de créer une demande exigée si `request` est envoyé) ; tests
- [x] Audit : la création reste tracée (intervention, demande, tâches) avec l'auteur réel
- [x] docs/api/endpoints à jour, CHANGELOG « Non publié »
- [x] scripts/check.sh vert, scripts/test-integration.sh vert

## Compte rendu final

Fait. Une seule transaction (un curseur partagé, un commit) : `InterventionRepository.add`
appelle `InterventionRequestRepository.insert_request` (origine « directe »),
`insert_intervention` (seule fonction qui insère une intervention, aussi utilisée par
l'acceptation d'une demande), `_link_request` et `InterventionTaskRepository.insert_task`
(aussi utilisée par `POST /intervention-tasks`). Pas de mail : la route n'a pas de tâche de
fond. L'acceptation garde `title` (nouveau champ facultatif de `StatusTransitionIn`) et
`tech_id` ; le validateur d'acceptation accepte `tech_id` seul (il exigeait à tort
`tech_initials`), et une priorité absente vaut « normale ». Les statuts initiaux restent ceux
d'avant (« ouvert » à la création directe, statut « pris en charge » résolu à l'acceptation).
Tests : `tests/integration/test_int01_creation_atomique_integration.py`.

### Contrat d'API figé (les fronts s'en servent)

`POST /interventions`, corps JSON :

```json
{
  "machine_id": "uuid",              // requis
  "type_inter": "CUR",               // requis
  "tech_id": "uuid",                 // requis (pilote)
  "title": "string | absent",
  "priority": "string | absent",
  "reported_by": "string | absent",
  "status_actual": "string | absent",
  "printed_fiche": false,
  "reported_date": "YYYY-MM-DD | absent",
  "request_id": "uuid",              // OU request : exactement un des deux, sinon 422
  "request": {                       // nouvelle demande, origine « directe », sans notification
    "demandeur_nom": "string",       // requis
    "description": "string",         // requis
    "service_id": "uuid | absent"
  },
  "tasks": [                         // facultatif, défaut []
    {
      "label": "string",             // requis
      "origin": "tech | resp | plan", // défaut tech
      "optional": false,
      "assigned_to": "uuid | absent", // défaut : tech_id de l'intervention
      "due_date": "YYYY-MM-DD | absent",
      "sort_order": 0
    }
  ],
  "reason_code": "ROUTINE (facultatif, routinier)",
  "reason_text": "string | absent"
}
```

Réponse `201` : `{ "data": <intervention complète> }` avec `request` (demande liée, statut
`acceptee`), `tasks` (tâches créées), equipement, stats, actions, status_logs. Erreurs :
`422` (request_id et request ensemble ou absents, champ invalide), `403` (droit de
`POST /intervention-requests` manquant si `request`, de `POST /intervention-tasks` si
`tasks`), `400`/`409` (règles métier, code d'intervention déjà pris), `500` générique
(détail dans les logs). Rien n'est écrit quand l'appel échoue. Un appel avec `request_id`
seul se comporte comme avant.
