# Equipement Classes

Classification des équipements par type (SCIE, EXTRUDEUSE, etc.). Relation Many-to-One avec les [Equipements](equipements.md).

> Schema partagé : [EquipementClass](../shared-schemas.md#equipementclass)

---

## `GET /equipement-class`

Liste toutes les classes, triées par code ASC.

### Réponse `200`

```json
[
  {
    "id": "b28f1f4f-...",
    "code": "SCIE",
    "label": "Scie",
    "description": "Machines de sciage",
    "allowed_intervention_types": ["CUR", "PRE"]
  }
]
```

`allowed_intervention_types` : codes des types d'intervention permis pour la classe (ADR 0031),
triés ; liste vide = tous les types permis. Présent aussi dans le détail, la création et le
`PATCH`.

---

## `GET /equipement-class/{id}`

Détail d'une classe.

---

## `POST /equipement-class`

Crée une classe.

### Entrée

```json
{
  "code": "SCIE",
  "label": "Scie",
  "description": "Machines de sciage"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `code` | string | oui | Code unique |
| `label` | string | oui | Libellé |
| `description` | string | non | Description |

### Règles métier

- `code` doit être unique

---

## `PATCH /equipement-class/{id}`

Met à jour une classe. Même body, tous champs optionnels. Si `code` change, l'unicité est vérifiée.

---

## `DELETE /equipement-class/{id}`

Supprime une classe.

### Règles métier

- **Impossible de supprimer** une classe utilisée par un équipement → Retourne `409 Conflict`

### Réponse `204`

Pas de contenu.

---

## `GET /equipement-class/{id}/intervention-types`

Types permis de la classe. Ouvert à tout utilisateur authentifié.

### Réponse `200`

```json
{ "data": { "intervention_types": ["CUR", "PRE"] } }
```

---

## `PUT /equipement-class/{id}/intervention-types`

Remplace la liste des types permis (ADR 0031). Même droit que `PATCH /equipement-class/{id}`
(ADMIN, ou rôle auquel la matrice accorde `equipement-class:replace_allowed_intervention_types`;
par défaut RESP). Corps :

```json
{ "intervention_types": ["CUR", "PRE"] }
```

Liste vide = tous les types permis. Doublons ignorés. Code absent de `intervention_type` :
`400` (`Type d'intervention inconnu : ZZZ`), rien n'est écrit. Classe inconnue : `404`.
Réponse `200` : la classe, `{ "data": { id, code, label, description, allowed_intervention_types } }`.

Aucun effet sur les interventions existantes. Audit : événement `intervention_types_changed`
(`entity_type` `equipement_class`, anciennes et nouvelles listes), déposé seulement si la liste
change, motif routinier.

## Audit (ADR 0018, étape 4)

Création, modification et suppression sont tracées (`entity_type` `equipement_class`) en routine, sauf `DELETE` qui exige un `reason_code` (400 sinon).
