# Stats

Endpoints d'analyse et de pilotage de la maintenance. Certains sont en BETA.

> Voir aussi : [Interventions](interventions.md) | [Equipement Classes](equipement-class.md) | [Complexity Factors](complexity-factors.md)

---

## `GET /stats/service-status`

Indicateurs de santé du service maintenance : charge, fragmentation, capacité de pilotage, top causes.

### Query params

| Param | Type | Défaut |
|---|---|---|
| `start_date` | date | 3 mois avant |
| `end_date` | date | aujourd'hui |

### Réponse `200`

Seuils (ADR 0034) : renvoyés dans `thresholds`, définis une seule fois côté API, bornes incluses. `above` : orange dès valeur >= `orange`, rouge dès valeur >= `red`. `below` : orange dès valeur <= `orange`, rouge dès valeur <= `red`. Valeurs : charge above 75 / 100 ; fragmentation above 5 / 15 ; pilotage below 20 / 10. Textes de statut d'un mot (`status.text`) : charge Normale / Élevée / Au plafond ; fragmentation Maîtrisée / Notable / Élevée ; pilotage Présent / Limité / Absent. Période sans heure saisie : `status` vaut `null` pour les trois (pas de badge).

Série mensuelle (ADR 0034 point 12) : `monthly` a un élément par mois calendaire touché par la période, classé comme les totaux (même règle SQL), donc la somme des `total_hours` mensuels égale `capacity.total_hours`. Pourcentages de 0 à 100, à 1 décimale. `capacity_hours` d'un mois est proratisée sur ses jours compris dans la période (400 h / 30 j). Un mois sans heure donne `charge_percent`, `frag_percent` et `pilot_percent` à `null`. `trends` : `"up"`, `"down"`, `"stable"` ou `null` pour `charge_percent`, `frag_percent` et `pilot_percent`, même calcul que pour `/stats/organisation` (stable sous 2 points ; mois partiels aux bornes inclus).

```json
{
  "monthly": [
    {
      "month": "2026-01",
      "total_hours": 150.0,
      "capacity_hours": 413.33,
      "charge_percent": 36.3,
      "frag_percent": 10.0,
      "pilot_percent": 20.0
    }
  ],
  "trends": { "charge_percent": "up", "frag_percent": "stable", "pilot_percent": null },
  "thresholds": {
    "charge": { "direction": "above", "orange": 75.0, "red": 100.0 },
    "fragmentation": { "direction": "above", "orange": 5.0, "red": 15.0 },
    "pilotage": { "direction": "below", "orange": 20.0, "red": 10.0 }
  },
  "period": { "start_date": "2025-11-15", "end_date": "2026-02-15", "days": 92 },
  "capacity": {
    "total_hours": 450.5,
    "capacity_hours": 600,
    "charge_percent": 75.1,
    "status": { "color": "orange", "text": "Élevée" }
  },
  "breakdown": {
    "prod_hours": 200.0,
    "dep_hours": 150.5,
    "pilot_hours": 50.0,
    "frag_hours": 50.0,
    "total_hours": 450.5
  },
  "fragmentation": {
    "action_count": 340,
    "short_action_count": 85,
    "short_action_percent": 25.0,
    "frag_percent": 11.1,
    "status": { "color": "orange", "text": "Notable" },
    "top_causes": [
      { "name": "Nettoyage", "total_hours": 15.0, "action_count": 60, "percent": 30.0 }
    ]
  },
  "pilotage": {
    "pilot_hours": 50.0,
    "pilot_percent": 11.1,
    "status": { "color": "orange", "text": "Limité" }
  },
  "site_consumption": [
    {
      "site_name": "Atelier principal",
      "total_hours": 300.0,
      "frag_hours": 35.0,
      "percent_total": 66.6,
      "percent_frag": 11.7
    }
  ]
}
```

---

## `GET /stats/charge-technique` [BETA]

Analyse de la charge technique par classe d'équipement. Identifie le dépannage évitable vs subi.

### Query params

| Param | Type | Défaut | Description |
|---|---|---|---|
| `start_date` | date | 3 mois avant | Début de période |
| `end_date` | date | aujourd'hui | Fin de période |
| `period_type` | string | `custom` | Découpage : `month`, `week`, `quarter`, `custom` |

### Règles métier

- Analyse **par classe d'équipement** (jamais par machine, jamais par technicien)
- Une action DEP est **évitable** si :
  - `complexity_factor IS NOT NULL` (facteur renseigné = signal)
  - OU action répétée >= 3 fois (même `action_subcategory` + même `equipement_class`) sur la période
- Taux de dépannage évitable :
  - **< 20%** (vert) : Faible levier
  - **20-40%** (orange) : Levier de standardisation
  - **> 40%** (rouge) : Problème systémique

### Réponse `200`

```json
{
  "params": { "start_date": "2025-11-15", "end_date": "2026-02-15", "period_type": "custom" },
  "guide": {
    "objectif": "Identifier où passe le temps maintenance et quelle part est récupérable",
    "seuils_taux_evitable": [
      { "min": 0, "max": 20, "color": "green", "label": "Faible levier", "action": "..." },
      { "min": 20, "max": 40, "color": "orange", "label": "Levier de standardisation", "action": "..." },
      { "min": 40, "max": null, "color": "red", "label": "Problème systémique", "action": "..." }
    ],
    "actions_par_categorie": [
      { "category": "Logistique", "color": "#3b82f6", "action": "Optimiser les flux de pièces" }
    ]
  },
  "periods": [
    {
      "period": { "start_date": "2025-11-15", "end_date": "2026-02-15", "days": 92 },
      "charges": {
        "charge_totale": 450.5,
        "charge_depannage": 150.5,
        "charge_constructive": 300.0,
        "charge_depannage_evitable": 45.0,
        "charge_depannage_subi": 105.5
      },
      "taux_depannage_evitable": {
        "taux": 29.9,
        "status": { "color": "orange", "text": "Levier de standardisation" }
      },
      "cause_breakdown": [
        { "code": "PCE", "label": "Pièce", "category": "Logistique", "hours": 20.0, "action_count": 12, "percent": 44.4 }
      ],
      "by_equipement_class": [
        {
          "equipement_class_id": "uuid",
          "equipement_class_code": "SCIE",
          "equipement_class_label": "Scie",
          "charge_totale": 120.0,
          "charge_depannage": 60.0,
          "charge_constructive": 60.0,
          "charge_depannage_evitable": 25.0,
          "taux_depannage_evitable": 41.7,
          "status": { "color": "red", "text": "Problème systémique" },
          "evitable_breakdown": {
            "hours_with_factor": 15.0,
            "hours_systemic": 18.0,
            "hours_both": 8.0,
            "total_evitable": 25.0
          },
          "explanation": "25h évitables sur 60h de dépannage...",
          "top_causes": [
            { "code": "PCE", "label": "Pièce", "category": "Logistique", "hours": 15.0, "percent": 60.0 }
          ],
          "recommended_action": "Créer un stock tampon de pièces pour les scies"
        }
      ]
    }
  ]
}
```

---

## `GET /stats/anomalies-saisie` [BETA]

Détection des anomalies de saisie des actions d'intervention. 6 types de détection.

### Query params

| Param | Type | Défaut |
|---|---|---|
| `start_date` | date | 3 mois avant |
| `end_date` | date | aujourd'hui |

### Types d'anomalies

| Type | Sévérité | Détection |
|---|---|---|
| `too_repetitive` | high/medium | Même sous-catégorie + même machine > 3 fois/mois |
| `too_fragmented` | high/medium | Actions courtes (< 1h) apparaissant 5+ fois |
| `too_long_for_category` | high/medium | Actions > 4h sur catégories rapides (BAT_NET, BAT_RAN, etc.) |
| `bad_classification` | high/medium | Actions BAT_NET avec mots-clés techniques suspects |
| `back_to_back` | high/medium | Même tech + même intervention, < 24h d'écart |
| `low_value_high_load` | high/medium | Catégories faible valeur avec > 30h cumulées |

### Réponse `200`

```json
{
  "params": { "start_date": "2025-11-15", "end_date": "2026-02-15" },
  "summary": {
    "total_anomalies": 15,
    "by_type": { "too_repetitive": 5, "too_fragmented": 3, "too_long_for_category": 2, "bad_classification": 1, "back_to_back": 3, "low_value_high_load": 1 },
    "by_severity": { "high": 6, "medium": 9 }
  },
  "anomalies": {
    "too_repetitive": [
      {
        "category": "DEP_REM", "categoryName": "Remplacement pièce",
        "machine": "Scie 01", "machineId": "uuid",
        "month": "2026-01", "count": 5, "interventionCount": 3,
        "severity": "high",
        "message": "5 actions DEP_REM sur Scie 01 en janvier 2026"
      }
    ]
  },
  "config": {
    "thresholds": {
      "repetitive": { "monthly_count": 3, "high_severity_count": 6 },
      "fragmented": { "max_duration": 1.0, "min_occurrences": 5, "high_severity_count": 10 },
      "too_long": { "max_duration": 4.0, "high_severity_duration": 8.0 },
      "bad_classification": { "high_severity_keywords": 2 },
      "back_to_back": { "max_days_diff": 1.0, "high_severity_days": 0.5 },
      "low_value_high_load": { "min_total_hours": 30.0, "high_severity_hours": 60.0 }
    },
    "simple_categories": ["BAT_NET", "BAT_RAN", "BAT_DIV", "LOG_MAG", "LOG_REC", "LOG_INV"],
    "low_value_categories": ["BAT_NET", "BAT_RAN", "BAT_DIV", "LOG_MAG", "LOG_REC"],
    "suspicious_keywords": ["mécanique", "hydraulique", "électrique", "..."]
  }
}
```

---

## `GET /stats/qualite-donnees`

Détection des problèmes de complétude et cohérence des données. 13 règles sur 4 entités.

### Query params

| Param | Type | Description |
|---|---|---|
| `severite` | string | Filtrer : `high`, `medium` |
| `entite` | string | Filtrer : `intervention_action`, `intervention`, `stock_item`, `purchase_request` |
| `code` | string | Filtrer par code anomalie spécifique |

### Règles de détection

| Entité | Code | Sévérité | Description |
|---|---|---|---|
| intervention_action | `action_time_null` | high | Temps non saisi |
| intervention_action | `action_complexity_sans_facteur` | high | Complexité sans facteur |
| intervention_action | `action_subcategory_null` | high | Sous-catégorie manquante |
| intervention_action | `action_tech_null` | medium | Technicien manquant |
| intervention_action | `action_description_vide` | medium | Description vide |
| intervention_action | `action_time_suspect` | medium | Temps > 8h suspect |
| intervention_action | `action_sur_intervention_fermee` | high | Action après fermeture |
| intervention | `intervention_fermee_sans_action` | high | Fermée sans action |
| intervention | `intervention_sans_type` | medium | Sans type |
| intervention | `intervention_en_cours_inactive` | medium | En cours > 14 jours |
| stock_item | `stock_sans_seuil_min` | medium | Sans seuil minimum |
| stock_item | `stock_sans_fournisseur` | medium | Sans fournisseur |
| purchase_request | `demande_sans_stock_item` | medium | Sans article stock lié |

### Réponse `200`

```json
{
  "total": 42,
  "par_severite": { "high": 12, "medium": 30 },
  "problemes": [
    {
      "code": "action_time_null",
      "severite": "high",
      "entite": "intervention_action",
      "entite_id": "uuid",
      "message": "Temps non saisi sur l'action",
      "contexte": {
        "intervention_id": "uuid",
        "intervention_code": "CN001-REA-20260113-QC",
        "created_at": "2026-01-13T14:30:00",
        "stock_item_ref": null,
        "stock_item_name": null,
        "purchase_request_id": null
      }
    }
  ]
}
```

> Tri : high d'abord, puis medium, puis par entité, puis `created_at` DESC.

---

## `GET /stats/organisation`

Indicateurs d'organisation de l'équipe (ADR 0021). Lecture seule, 10 requêtes par minute. Droit : `stats:get_organisation`. Chiffres d'équipe uniquement : la réponse ne contient aucun identifiant, nom ni initiale de technicien.

### Query params

| Param | Type | Défaut |
|---|---|---|
| `start_date` | date | 1er jour du mois d'il y a 11 mois |
| `end_date` | date | aujourd'hui |

`400` si `start_date > end_date` ou si la période dépasse 3660 jours.

### Règles métier

- Date d'une action : `created_at::date`, à défaut le `reported_date` de l'intervention. Les actions sans technicien ne forment ni chantier ni journée-technicien.
- Chantier : couple (technicien, intervention PRO ou PRE) avec des actions sur au moins 2 jours distincts, rattaché au mois de son premier jour (le premier jour doit être dans la période, les jours suivants peuvent la dépasser). Coupé si le même technicien agit, un jour strictement entre le premier et le dernier, sur une intervention CUR de priorité `urgent`.
- Seule la priorité `urgent` compte comme urgence.
- Dispersion : interventions distinctes par journée-technicien ; `scattered_days_share` = part des journées à 3 interventions ou plus.
- `projects` : interventions PRO (tous techniciens) actives sur 2 jours ou plus, dont le premier jour est dans la période ; durée = dernier jour - premier jour + 1 ; `active_ratio` = somme des jours actifs / somme des durées, en %.
- `preventive` et `waiting_parts` : état actuel, hors période. Âges en jours depuis la génération de l'occurrence (`triggered_at`), la création de la demande ou le `reported_date`. `last_generated_at` : dernier `triggered_at` d'une occurrence liée à une demande.
- `preventive_hours_share` : heures PRE / heures totales du mois (`null` pour un mois sans heures), aussi dans `totals`.
- `trends` (ADR 0034 point 10) : pour `urgent_share`, `interrupted_share`, `avg_interventions_per_tech_day`, `scattered_days_share` et `preventive_hours_share`, `"up"`, `"down"`, `"stable"` ou `null`. Pente des moindres carrés sur les valeurs mensuelles non nulles (mois courant compris), au moins 3 valeurs sinon `null` ; variation estimée = pente x (nombre de mois de la période - 1) ; `stable` si sa valeur absolue est strictement sous 2 points (parts) ou sous 0,1 (interventions par journée). La charge, la fragmentation et le pilotage ont leur tendance dans `/stats/service-status`.
- `waiting_parts_count` (ADR 0034 point 12) : par mois, nombre d'interventions en attente de pièces au dernier jour du mois (aujourd'hui pour le mois courant), reconstitué depuis `intervention_status_log` (dernier changement de statut jusqu'à la fin de ce jour, une requête pour tous les mois) ; `null` pour un mois dont le dernier jour précède la première ligne du journal. `trends.waiting_parts_count` : même calcul, `stable` sous 1 intervention d'écart estimé.
- Parts en % à 1 décimale, `null` si le dénominateur vaut 0 ; heures à 2 décimales ; tous les mois de la période sont présents.

### Réponse `200`

```json
{
  "period": { "start": "2026-01-01", "end": "2026-03-31" },
  "monthly": [
    {
      "month": "2026-01",
      "interventions_reported": 40,
      "urgent_count": 12,
      "urgent_share": 30.0,
      "hours": { "CUR": 60.5, "PRE": 10.0, "PRO": 25.25, "other": 4.0, "total": 99.75 },
      "chantiers_started": 5,
      "chantiers_interrupted": 2,
      "interrupted_share": 40.0,
      "tech_days": 60,
      "avg_interventions_per_tech_day": 1.4,
      "scattered_days_share": 8.3,
      "preventive_hours_share": 10.0,
      "waiting_parts_count": 7
    }
  ],
  "trends": {
    "urgent_share": "down",
    "interrupted_share": null,
    "avg_interventions_per_tech_day": "stable",
    "scattered_days_share": "up",
    "preventive_hours_share": "stable",
    "waiting_parts_count": "up"
  },
  "totals": { "...": "mêmes champs que monthly, sans month" },
  "projects": { "count": 3, "avg_active_days": 2.0, "avg_span_days": 9.33, "active_ratio": 21.4 },
  "preventive": {
    "active_plans": 12,
    "occurrences_not_started": 30,
    "oldest_not_started_days": 190,
    "pending_requests": 30,
    "oldest_pending_request_days": 190,
    "last_generated_at": "2026-05-04T08:00:00Z"
  },
  "waiting_parts": { "count": 4, "median_age_days": 9.5, "max_age_days": 40 }
}
```

---

## `GET /stats/audit-synthese`

Synthèse de l'audit et du partage des tâches (ADR 0032). Lecture seule, 10 requêtes par minute. Droit : `stats:get_audit_synthese`, ouvert par défaut aux rôles qui lisent comme `stats:get_organisation` (à rejouer en production par le bootstrap à la mise à jour). Chiffres d'équipe uniquement : aucun identifiant, nom ni initiale de personne.

### Query params

| Param | Type | Défaut |
|---|---|---|
| `months` | int, 1 à 120 | 3 (mois calendaires, mois courant compris, du 1er du premier mois à aujourd'hui) |

`400` hors bornes.

### Définitions

- Garant d'une tâche : `assigned_to`. Exécutants : techniciens distincts des actions liées (`intervention_action_task`). Les indicateurs de tâches sont rattachés au mois de création de la tâche (`created_at`) et ne dépendent pas de `closed_by`.
- `tasks_without_guarantor` : tâches créées sans `assigned_to`.
- `done_without_guarantor_action` : tâches `done` avec garant dont le garant n'est le technicien d'aucune action liée. Part sur `tasks_done_with_guarantor`.
- `spotted_in_field` : tâches `done` créées par leur garant, qui en est aussi l'un des exécutants. Part sur `tasks_done_with_guarantor`.
- `shared_tasks` : tâches `done` avec au moins deux exécutants distincts. Part sur `tasks_done`.
- `decisions` : événements d'audit non système dont le motif est de catégorie `user` ou `manual`, par mois, type de décision et motif ; `decisions_total` en est le total du mois. Les événements sans motif n'y figurent pas, ni ceux du motif `LEGACY_STATUS_CHANGE` (journaux migrés, créations et suppressions mal étiquetées par l'ancien code : pas des décisions) ; ils restent comptés dans `audit_events`.
- `system_share` : événements `is_system` parmi tous les événements du mois (`audit_events`).
- `incomplete_data` : vrai si le mois commence avant `cascades_traced_from` (2026-11-20, ADR 0029) : `closed_by` et cascades y sont incomplets (novembre 2026 est donc signalé). Les indicateurs de tâches n'en dépendent pas, mais les décisions et la part système oui.
- Parts en % à 1 décimale, `null` si le dénominateur vaut 0 ; tous les mois de la période sont présents.
- `trends` (ADR 0035 point 4) : pour `without_guarantor_share`, `done_without_guarantor_action_share`, `spotted_in_field_share`, `shared_tasks_share`, `system_share` et `decisions_total`, `"up"`, `"down"`, `"stable"` ou `null`. Même calcul que `/stats/organisation` (pente des moindres carrés sur les valeurs mensuelles non nulles, au moins 3 valeurs sinon `null`, variation estimée = pente x (nombre de mois - 1)) ; `stable` sous 2 points pour une part, sous 2 décisions pour `decisions_total`. Les mois `incomplete_data` comptent comme les autres.

### Réponse `200`

```json
{
  "period": { "start": "2026-09-01", "end": "2026-11-20" },
  "cascades_traced_from": "2026-11-20",
  "monthly": [
    {
      "month": "2026-09",
      "incomplete_data": true,
      "tasks_created": 66,
      "tasks_without_guarantor": 0,
      "without_guarantor_share": 0.0,
      "tasks_done": 59,
      "tasks_done_with_guarantor": 59,
      "done_without_guarantor_action": 17,
      "done_without_guarantor_action_share": 28.8,
      "spotted_in_field": 35,
      "spotted_in_field_share": 59.3,
      "shared_tasks": 19,
      "shared_tasks_share": 32.2,
      "decisions_total": 20,
      "audit_events": 307,
      "system_events": 134,
      "system_share": 43.6
    }
  ],
  "trends": {
    "without_guarantor_share": "stable",
    "done_without_guarantor_action_share": "down",
    "spotted_in_field_share": null,
    "shared_tasks_share": "up",
    "system_share": "stable",
    "decisions_total": "down"
  },
  "totals": { "...": "mêmes compteurs et parts que monthly, sans month ni incomplete_data" },
  "decisions": [
    {
      "month": "2026-09",
      "decision_type": "assigned_to_changed",
      "reason_code": "TECHNICIAN_UNAVAILABLE",
      "reason_label": "Technicien indisponible",
      "count": 9
    }
  ]
}
```

## `GET /stats/demandes`

Bilan des demandes à qualifier (ADR 0046). Lecture seule, 10 requêtes par minute. Droit : `stats:get_demandes`, ouvert par défaut aux rôles qui lisent. Aucune donnée par personne.

Paramètres : `weeks` (1 à 52, défaut 8 ; semaines ISO, courante comprise), `site_id` (équipement racine, descendants compris ; UUID invalide : 400).

Stock = demandes `nouvelle` ou `en_attente`. Sortie = première transition vers `acceptee` ou `rejetee` du journal des statuts ; une demande supprimée n'est plus comptée.

- `flow` : une ligne par lundi (`week_start`) : `created`, `accepted`, `rejected`, `stock_end`. Le `stock_end` de la semaine courante égale `stock`.
- `trend` : `stock_end` de la dernière semaine moins le stock au début de la première.
- `age_buckets` : `lt_7`, `7_30`, `30_90`, `gt_90` ; `from_days` incluse, `to_days` exclue (`null` : sans limite), `count`, `min_days`, `max_days` (`null` si vide). Somme des `count` = `stock`.
- `sites` : équipements racines, `id`, `code`, `name`, `count`, `oldest_days`. Somme = `stock`.
- `equipments` : les 10 équipements les plus chargés, mêmes champs.
- `journal_gaps` : demandes dont le statut ne s'accorde pas au journal (sortie sans ligne de journal, ou ligne de sortie sur une demande encore à qualifier). Le statut fait foi pour le stock ; sans ligne de sortie, la date de sortie est celle de la dernière mise à jour de la demande.

## `GET /stats/constats`

Indicateurs des constats (ADR 0044). Lecture seule, 10 requêtes par minute. Droit : `stats:get_constats`, ouvert par défaut aux rôles qui lisent (créé par le bootstrap). Chiffres d'équipe : aucun auteur ni technicien.

Paramètres : `start_date`, `end_date` (AAAA-MM-JJ), mêmes règles et mêmes erreurs 400 que `/stats/organisation` (défaut : 12 mois calendaires jusqu'à aujourd'hui).

Seule la version courante d'un constat compte, datée de la première version de sa chaîne de corrections : une correction ne le change pas de mois. Les constats sans demande comptent partout sauf dans `outcomes`.

- `by_month` : tous les mois de la période, à 0 compris.
- `levers`, `signals`, `known_since` : choix des questions LEVER, SIGNAL, KNOWN_SINCE, dans l'ordre du référentiel. Choix actifs même à 0 ; un choix inactif seulement s'il a des réponses. Un constat à plusieurs leviers compte dans chacun.
- `outcomes` : statut de la demande issue du constat (constats avec demande seulement), ordre fixe `nouvelle`, `en_attente`, `acceptee`, `cloturee`, `rejetee`, `rattachee` (constat rattaché à une idée, couleur de `rejetee`).

```json
{
  "period": { "start_date": "2026-01-01", "end_date": "2026-11-30" },
  "total": 4,
  "by_month": [{ "month": "2026-11", "count": 4 }],
  "levers": [{ "code": "TASK", "label": "Tâche de maintenance régulière", "suggested_type_inter": "PRE", "count": 1 }],
  "signals": [{ "code": "SIGNAL_SEEN", "label": "Oui et je l'ai vu", "count": 1 }],
  "known_since": [{ "code": "SINCE_GT_3M", "label": "Plus de 3 mois", "count": 2 }],
  "outcomes": [{ "code": "nouvelle", "label": "Nouvelle", "color": "#3b82f6", "count": 2 }]
}
```
