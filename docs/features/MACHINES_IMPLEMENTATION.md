# Pages Équipements — Spécification Frontend (corrigée)

**Version** : 2.1.0  
**Basé sur** : API Manifest `tunnel-backend` (2026-01-25)  
**Source unique de vérité** : `equipements`  
**Principe clé** : Backend décisionnel, frontend passif

---

## Principes non négociables

- Une **décision métier** vient du backend, jamais du front
- Le front **ne calcule pas**, **n'interprète pas**, **n'infère pas**
- Une requête API = un besoin métier clair
- Aucun hard-coding de règles, statuts ou seuils
- Les données lourdes sont **opt-in**

---

## Cache Frontend — Règle explicite

### Cache Équipements

- **Source** : `GET /equipements`
- **Chargement** : à l'entrée du module Équipements
- **Durée de vie** : session utilisateur (module actif)
- **Usages autorisés** :
  - Résolution `parent_id → code/name`
  - Résolution `children_ids → code/name`
- ❌ Pas de rafraîchissement automatique
- ❌ Pas de mutation locale

---

## Référentiel Statuts d'Intervention

### Source unique

```http
GET /intervention_status
```

### Règles Frontend

- Aucun statut codé en dur
- Les filtres utilisent **exclusivement** les `id` retournés par l'API
- La notion de "statuts actifs" est dérivée côté front à partir de `code`

Exemple :

```ts
ACTIVE_STATUS_CODES = ['OPEN', 'IN_PROGRESS'];
ACTIVE_STATUS_IDS = statuses.filter((s) => ACTIVE_STATUS_CODES.includes(s.code)).map((s) => s.id);
```

---

## PAGE 1 — Liste des Équipements

**Route** : `/equipements`
**Endpoint** : `GET /equipements`

### Rôle

Prioriser. Expliquer. Orienter l'action.
Pas décrire. Pas analyser.

---

### Données consommées

```json
{
  "id": "uuid",
  "code": "VLT",
  "name": "Site des Villettes",
  "health": {
    "level": "critical",
    "reason": "2 interventions urgentes ouvertes"
  },
  "parent_id": null
}
```

- Tri effectué backend (urgent → open → name)
- Endpoint cacheable

---

### Structure UI — Table (MVP)

| #   | Colonne         | Source                    |
| --- | --------------- | ------------------------- |
| 1   | Santé           | `health.level`            |
| 2   | Équipement      | `code` + `name`           |
| 3   | Cause           | `health.reason`           |
| 4   | Équipement mère | `parent_id` (cache local) |
| 5   | Action          | Lien vers détail          |

---

### Règles UI

- Badge santé = mapping **statique** (`ok|maintenance|warning|critical`)
- Texte affiché = `health.reason` brut
- Recherche front limitée à `code` et `name`
- ❌ Aucun compteur global
- ❌ Aucune stat
- ❌ Aucun calcul métier

---

### Éléments supprimés définitivement

- "100 % opérationnel"
- % critique / % attention
- Colonne "Interventions"
- Toute logique de seuil front

---

## PAGE 2 — Détail Équipement

**Route** : `/equipements/{id}`

### Rôle

Pourquoi cet équipement est dans cet état ?
Quelles actions immédiates ?

---

### Chargement des données (ordre strict)

#### 1. Identité + santé

```http
GET /equipements/{id}
```

```json
{
  "id": "uuid",
  "code": "VLT",
  "name": "Site des Villettes",
  "health": {
    "level": "critical",
    "reason": "2 interventions urgentes ouvertes",
    "rules_triggered": ["URGENT_OPEN >= 1"]
  },
  "parent_id": null,
  "children_ids": ["uuid"]
}
```

---

#### 2. Interventions actives

```http
GET /interventions
  ?equipement_id={id}
  &status={ACTIVE_STATUS_IDS}
  &sort=-priority,-reported_date
  &limit=50
```

- Retour : `InterventionOut[]`
- `actions = []` (conforme au manifest)

---

#### 3. Stats (opt-in)

```http
GET /equipements/{id}/stats
  ?start_date=YYYY-MM-DD
  &end_date=YYYY-MM-DD
```

### Cadre temporel

- `start_date` absent → historique complet
- `end_date` absent → NOW()
- Aucune période implicite non documentée

---

### Structure UI

#### A. Bandeau Santé (fixe)

- Code + nom
- Badge `health.level`
- Texte `health.reason`
- Debug optionnel : `rules_triggered` (replié)

---

#### B. Actions rapides

- Créer une intervention
- Voir toutes les interventions (pré-filtrées)

Aucune logique conditionnelle.

---

#### C. Bloc "Interventions actives"

| Colonne  | Contenu |
| -------- | ------- |
| Priorité | Badge   |
| Statut   | Badge   |
| Code     | Texte   |
| Titre    | Lien    |
| Date     | Date    |
| Type     | Badge   |
| Action   | Voir    |

Tri 100 % backend.

---

#### D. Arborescence équipement

- Mère : `parent_id`
- Enfants : `children_ids`
- Résolution via cache `/equipements`
- ❌ Aucun nouvel endpoint

---

#### E. Onglet "Stats"

- Open / Closed
- By status
- By priority
- Table simple (graphes facultatifs)

---

## Rafraîchissement Santé

### Règles

- ❌ Pas de polling automatique par défaut
- ✅ Bouton refresh manuel
- ✅ Polling `/equipements/{id}/health` autorisé si :
  - page active > 5 minutes
  - intervalle ≥ 60 s

---

## Mapping API → UI

| Besoin UI             | Endpoint                             |
| --------------------- | ------------------------------------ |
| Liste équipements     | `GET /equipements`                   |
| Identité + santé      | `GET /equipements/{id}`              |
| Interventions actives | `GET /interventions?equipement_id=…` |
| Stats détaillées      | `GET /equipements/{id}/stats`        |
| Refresh léger santé   | `GET /equipements/{id}/health`       |
| Référentiel statuts   | `GET /intervention_status`           |

---

## Gains validés

- Un seul vocabulaire : **équipement**
- Une seule hiérarchie : `parent_id / children_ids`
- Aucune duplication d'endpoint
- Frontend stable, léger, testable
- Backend maître de la décision
