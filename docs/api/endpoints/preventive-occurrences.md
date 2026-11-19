# Preventive Occurrences

Occurrences de maintenance préventive générées par les plans actifs. Chaque occurrence lie un plan à une machine avec une date planifiée. Lors de la génération, une demande d'intervention (DI) est créée automatiquement.

> Voir aussi : [Preventive Plans](preventive-plans.md) | [Intervention Requests](intervention-requests.md) | [Intervention Tasks](intervention-tasks.md)

---

## Cycle de vie d'une occurrence

```
pending → generated → in_progress → completed
       ↘ skipped          ↑               ↑
         (via PATCH   DI acceptée    DI clôturée
          /:id/skip)  OU intervention  OU intervention
                         fermée (cascade)
```

| Statut        | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `pending`     | Générée, en attente de création de DI                                             |
| `generated`   | DI créée et liée via `di_id` (statut DI : `nouvelle`)                            |
| `in_progress` | DI acceptée — intervention liée via `intervention_id`, travaux en cours           |
| `completed`   | DI clôturée ou intervention fermée — passage automatique en cascade               |
| `skipped`     | Ignorée manuellement (raison obligatoire)                                         |

> **Rejet de la DI** : si la DI liée passe en `rejetee`, l'occurrence passe à `skipped` (`skip_reason` « Demande rejetée », `di_id` conservé, audit système). Elle ne sert pas de référence à l'échéance : le préventif reste dû et la génération suivante en crée une nouvelle (à l'échéance, ou aujourd'hui si cette date est déjà prise).
>
> **Machines hors service** : seules les machines au statut `EN_SERVICE` sont concernées par la génération, l'échéancier et les notifications de retard.

> **Acceptation en cascade** : DI `nouvelle` → `acceptee` passe l'occurrence à `in_progress` et renseigne `intervention_id`.

> **Clôture en cascade** : DI → `cloturee` **ou** fermeture de l'intervention (via PATCH ou POST /intervention-status-log) passent l'occurrence à `completed`.

---

## `GET /preventive-occurrences`

Liste les occurrences de maintenance préventive avec filtres optionnels.

### Query params

| Param                 | Type   | Description                                    |
| --------------------- | ------ | ---------------------------------------------- |
| `plan_id`             | uuid   | Filtrer par plan préventif                     |
| `machine_id`          | uuid   | Filtrer par machine                            |
| `include_descendants` | bool   | Avec `machine_id` : inclut les occurrences des équipements descendants (défaut `false`). Ignoré sans `machine_id` |
| `status`              | string | `pending`, `generated`, `completed`, `skipped` |
| `scheduled_date_from` | date   | Filtre date planifiée ≥ (format `YYYY-MM-DD`)  |
| `scheduled_date_to`   | date   | Filtre date planifiée ≤ (format `YYYY-MM-DD`)  |

### Réponse `200`

```json
[
  {
    "id": "uuid-occurrence-1",
    "plan_id": "uuid-plan",
    "plan_label": "Maintenance hebdomadaire scies",
    "machine_id": "uuid-machine",
    "machine_code": "SCIE-001",
    "machine_name": "Scie principale",
    "scheduled_date": "2026-04-14",
    "triggered_at": "2026-04-13T08:00:00",
    "hours_at_trigger": null,
    "di_id": "uuid-demande",
    "di_code": "DI-2026-0042",
    "di_statut": "nouvelle",
    "intervention_id": null,
    "status": "generated",
    "skip_reason": null,
    "created_at": "2026-04-13T08:00:00",
    "tasks": [
      {
        "id": "uuid-task",
        "gamme_step_id": "uuid-step",
        "label": "Graisser palier gauche",
        "sort_order": 1,
        "optional": false,
        "occurrence_id": "uuid-occurrence-1",
        "intervention_id": null,
        "action_id": null,
        "status": "todo",
        "skip_reason": null,
        "updated_at": null,
        "closed_by": null
      }
    ]
  }
]
```

> **Diagnostic** : si `intervention_id` est `null` sur les tâches alors que l'occurrence a un `intervention_id`, c'est le Bug 1 (corriger via `POST /repair`). Si toutes les tâches sont en `todo` sur une occurrence dont l'intervention est fermée, c'est le Bug 2.

---

## `GET /preventive-occurrences/schedule`

Échéancier du préventif : une ligne par plan actif et par machine de la classe du plan, triée
par échéance (les plans aux heures, sans échéance, en fin de liste). Lecture seule, ouverte
aux rôles qui lisent la matrice (ADMIN, RESP, TECH, ACHETEUR, MCP). Déclarée avant `/{id}`.

Périodicité **glissante** : échéance = date de référence + `periodicity_days`. La référence
est la date du passage à `cloturee` de la demande de la dernière occurrence `completed`
(`request_status_log`) ; à défaut (occurrence `skipped`, demande sans ligne de clôture), sa
`scheduled_date`. Sans historique, l'échéance est aujourd'hui. Une occurrence active
(`pending`, `generated`, `in_progress`) l'emporte : l'échéance est sa `scheduled_date`.

### Query params

| Param | Description |
|---|---|
| `machine_id` | Limite à une machine ; avec `include_descendants=true`, à ses descendants |
| `state` | `overdue`, `due_soon`, `ok` ou `not_computed` (autre valeur : 400) |

### Réponse `200`

Liste de `{ plan_id, plan_code, plan_label, machine_id, machine_code, machine_name,
reference_date, due_date, state, days_overdue, occurrence_id, di_id, intervention_id }`.
`state` : `overdue` (échéance passée), `due_soon` (échéance dans les `PREVENTIVE_LEAD_DAYS`
jours, 7 par défaut, aujourd'hui inclus), `ok`, `not_computed` (plan `hours` : le compteur
mesure le temps passé, pas le fonctionnement). `reference_date` est nul si une occurrence
active existe ou sans historique.

---

## `GET /preventive-occurrences/history`

Historique préventif d'une machine : une ligne par occurrence, échéance la plus récente
d'abord, sans pagination. Lecture seule (mêmes droits que `/schedule`, clé MCP incluse).

### Query params

| Param        | Type | Description                  |
| ------------ | ---- | ---------------------------- |
| `machine_id` | uuid | Équipement (obligatoire)     |

### Réponse `200`

`{"items": [...]}`, chaque élément : `occurrence_id`, `plan_id`, `plan_code`, `plan_label`,
`status`, `scheduled_date` (échéance), `done_on` (date de clôture de la demande, `null` si
l'occurrence n'est pas `completed`), `delta_days` (`done_on - scheduled_date` en jours :
négatif = en avance, positif = en retard ; `null` si non terminée), `skip_reason`, `di_id`,
`intervention_id`, `intervention_code`.

### Erreurs

`404` si la machine n'existe pas.

---

## `POST /preventive-occurrences/anticipate`

Lance un préventif en avance : crée tout de suite l'occurrence et sa demande système, par le
même code que la génération (mêmes événements d'audit `created`, même acceptation automatique
du plan), sans attendre la prévenance. Droits de `/generate` : ADMIN et RESP, clé MCP refusée.

### Entrée

```json
{ "plan_id": "<uuid>", "machine_id": "<uuid>" }
```

`scheduled_date` = échéance glissante théorique ; si elle est déjà passée ou sans historique,
aujourd'hui. Après clôture, la prochaine échéance part de la date de clôture.

### Réponse `201`

`{"data": <occurrence>}` (champs de `GET /preventive-occurrences/{id}`).

### Erreurs

- `409` : une occurrence active (`pending`, `generated`, `in_progress`) existe déjà pour ce
  plan et cette machine (son id est dans le détail), ou une occurrence existe déjà à la date du jour ;
- `422` : plan inactif, plan non à périodicité, machine hors service ou d'une autre classe que le plan ;
- `404` : plan ou machine inconnu.

---

## `GET /preventive-occurrences/{id}`

Détail d'une occurrence.

### Réponse `200`

Même structure que la liste, incluant `tasks`.

### Erreurs

| Code | Cas                        |
| ---- | -------------------------- |
| 404  | Occurrence introuvable     |

---

## `POST /preventive-occurrences/generate`

Déclenche la génération des occurrences pour tous les plans préventifs actifs.

**Logique de génération :**

- Pour chaque plan actif, pour chaque machine de la classe d'équipement du plan :
  - **trigger_type = `periodicity`** : périodicité glissante, même calcul que l'échéancier (`GET /schedule`). Génère dès que `référence + periodicity_days ≤ today + PREVENTIVE_LEAD_DAYS` (7 jours) ou si aucune occurrence précédente. `scheduled_date` = l'échéance (date future possible) et la DI système reçoit cette date dans `deadline`
  - **trigger_type = `hours`** : génère si `current_hours - last_trigger_hours ≥ hours_threshold`
  - Une occurrence déjà existante à cette date (même annulée) est vérifiée avant d'écrire et comptée dans `skipped_conflicts` — pas de doublon, pas d'erreur
  - Crée automatiquement une DI (`demandeur_nom = "Système préventif"`, `statut = "nouvelle"`, `is_system = true`, `suggested_type_inter = "PRE"`)
  - Si `plan.auto_accept = true` : crée aussi l'intervention (`type_inter = "PRE"`, `tech_initials = "SYS"`)

- **Tout ou rien** : toute la génération est une seule transaction. Une erreur SQL annule tout (réponse `500`, aucune occurrence, demande ni intervention créée).
- Audit : chaque occurrence, demande et intervention créée écrit un événement `created` au nom du système (motif `SYSTEM_CASCADE`), l'auteur étant l'utilisateur du jeton.

### Réponse `200`

```json
{
  "generated": 5,
  "skipped_conflicts": 2,
  "skipped_active": 1,
  "errors": []
}
```

| Champ               | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `generated`         | Nombre d'occurrences créées avec succès                  |
| `skipped_conflicts` | Occurrences ignorées car déjà existantes à cette date    |
| `skipped_active`    | Machines ignorées car une occurrence non terminée existe |
| `errors`            | Toujours vide (conservé pour compatibilité) : une erreur annule la génération |

---

## `PATCH /preventive-occurrences/{id}/skip`

Ignore une occurrence en statut `pending`. Audité : le `reason_code` de la requête est validé par le middleware (règle routinière de `preventive_occurrence` si absent) ; `skip_reason` reste un texte libre.

### Entrée

```json
{
  "skip_reason": "Machine en arrêt technique prolongé"
}
```

| Champ         | Type   | Requis  | Description              |
| ------------- | ------ | ------- | ------------------------ |
| `skip_reason` | string | **oui** | Motif de l'ignorance (non vide) |

### Réponse `200`

Occurrence mise à jour avec `status = "skipped"`.

### Erreurs

| Code | Cas                                                           |
| ---- | ------------------------------------------------------------- |
| 400  | L'occurrence n'est pas en statut `pending`                    |
| 400  | `skip_reason` vide                                            |
| 404  | Occurrence introuvable                                        |

---

## `POST /preventive-occurrences/repair`

Répare les données corrompues par plusieurs bugs. 

Cette procédure est **idempotente** — elle peut être appelée plusieurs fois sans effet secondaire. Elle ne modifie que les enregistrements réellement dans un état incohérent.

### Bug 1 — Tâches non liées à l'intervention

Lors de l'acceptation manuelle d'une DI préventive, un problème de curseur partagé empêchait le rattachement des `intervention_task` à l'intervention créée. Les tâches restaient avec `intervention_id = NULL` et n'apparaissaient pas dans l'intervention.

**Correction appliquée** : pour chaque occurrence ayant un `intervention_id` (direct ou via la DI liée), les `intervention_task` dont `intervention_id` est encore `NULL` sont rattachées.

### Bug 2 — Occurrence bloquée à `generated` après fermeture de l'intervention

La fermeture d'une intervention via `PATCH /interventions/{id}` ne propageait pas l'état sur l'occurrence préventive liée ni sur la demande associée.

**Correction appliquée** : pour chaque occurrence en `generated` ou `in_progress` dont l'intervention liée est fermée (code `ferme`) :
- l'occurrence passe à `completed`
- la DI liée passe à `cloturee` (si encore `acceptee`) avec log dans `request_status_log`

### Bug 3 — `plan_id` null sur une intervention préventive

Lors de l'acceptation manuelle d'une DI préventive via `POST /interventions` (chemin direct, sans passer par `PATCH /intervention-requests/{id}/status`), le `plan_id` n'était pas résolu depuis l'occurrence. Conséquence : les tâches préventives n'apparaissaient pas dans la réponse `GET /interventions/{id}`.

**Correction appliquée** : pour chaque intervention dont `plan_id` est `NULL` mais qui est liée à une occurrence préventive ayant un `plan_id`, le `plan_id` est rétabli.

### Réponse `200`

```json
{
  "tasks_relinked": 12,
  "occurrences_relinked": 3,
  "occurrences_set_in_progress": 3,
  "occurrences_completed": 2,
  "requests_closed": 2,
  "interventions_plan_fixed": 1,
  "details": [
    "Bug 3 : 1 intervention(s) — plan_id rétabli",
    "Bug 1 : 12 tâche(s) rattachée(s) aux interventions : abc-123, def-456",
    "Étape 3 : 3 occurrence(s) → 'in_progress' (DI acceptée)",
    "Bug 2 : occurrence xyz-789 → 'completed' (intervention fermée : aaa-111)"
  ]
}
```

| Champ                        | Description                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `tasks_relinked`             | Nombre de `intervention_task` rattachées (Bug 1)                                   |
| `occurrences_relinked`       | Occurrences dont `intervention_id` a été rétabli depuis la DI liée                 |
| `occurrences_set_in_progress`| Occurrences passées de `generated` à `in_progress` (DI déjà acceptée)             |
| `occurrences_completed`      | Occurrences passées à `completed` (intervention fermée)                            |
| `requests_closed`            | DI clôturées en cascade                                                            |
| `interventions_plan_fixed`   | Interventions dont `plan_id` a été rétabli depuis l'occurrence liée (Bug 3)        |
| `details`                    | Journal détaillé de chaque correction appliquée                                    |
