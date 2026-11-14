# Services

Référentiel des services/départements pour les demandes d'intervention. Chaque service a un code unique et un libellé, avec un statut d'activation.

Relation One-to-Many avec [Intervention Requests](intervention-requests.md) via `service_id`.

---

## `GET /services`

Liste tous les services actifs, triés par libellé ASC.

### Réponse `200`

```json
[
  {
    "id": "a1b2c3d4-...",
    "code": "PROD",
    "label": "Production",
    "is_active": true
  },
  {
    "id": "e5f6g7h8-...",
    "code": "MAINT",
    "label": "Maintenance",
    "is_active": true
  }
]
```

---

## `GET /services/{id}`

Détail d'un service.

### Réponse `200`

```json
{
  "id": "a1b2c3d4-...",
  "code": "PROD",
  "label": "Production",
  "is_active": true
}
```

### Erreurs

| Code | Cas                 |
| ---- | ------------------- |
| 404  | Service introuvable |

---

## `POST /services`

Crée un nouveau service.

### Entrée

```json
{
  "code": "PROD",
  "label": "Production",
  "is_active": true
}
```

| Champ       | Type    | Requis | Défaut | Description            |
| ----------- | ------- | ------ | ------ | ---------------------- |
| `code`      | string  | oui    | —      | Code unique (immuable) |
| `label`     | string  | oui    | —      | Libellé du service     |
| `is_active` | boolean | non    | `true` | Statut d'activation    |

### Règles métier

- `code` doit être unique
- `code` ne peut jamais être modifié après création

### Réponse `201`

Identique à `GET /services/{id}`.

### Erreurs

| Code | Cas                        |
| ---- | -------------------------- |
| 422  | `code` ou `label` manquant |
| 409  | `code` existe déjà         |

---

## `PATCH /services/{id}`

Met à jour un service. Seuls `label` et `is_active` peuvent être modifiés.

### Entrée

```json
{
  "label": "Production - Nouveau nom",
  "is_active": false
}
```

| Champ       | Type    | Optionnel | Description                 |
| ----------- | ------- | --------- | --------------------------- |
| `label`     | string  | oui       | Nouveau libellé             |
| `is_active` | boolean | oui       | Nouveau statut d'activation |

### Règles métier

- **Le `code` ne peut jamais être modifié** — toute tentative lève `400`
- Pour soft-delete un service, passer `is_active = false`

### Réponse `200`

Identique à `GET /services/{id}`.

### Erreurs

| Code | Cas                                 |
| ---- | ----------------------------------- |
| 404  | Service introuvable                 |
| 400  | Tentative de modification du `code` |

---

## Notes

- Les services inactifs (`is_active = false`) n'apparaissent pas en `GET /services`
- Une demande d'intervention liée à un service inactif conserve la référence, mais celle-ci ne sera plus visible dans les listes de services actifs
- Pas de DELETE hard : utiliser le PATCH avec `is_active = false` pour désactiver

## Audit (ADR 0018, étape 4)

Création et modification sont tracées (`entity_type` `service`) en routine.
