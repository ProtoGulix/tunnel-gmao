# Exports

Génération de documents PDF et QR codes pour les interventions.

> Voir aussi : [Interventions](interventions.md) | [Purchase Requests](purchase-requests.md)

---

## `GET /exports/interventions/closed`

Export de masse des fiches des interventions fermées sur une période. Chaque fiche est
produite comme l'export unitaire (même données, même gabarit).

**Auth** : JWT Bearer. Droit réservé à ADMIN et RESP (TECH, ACHETEUR et clé MCP : 403).
**Limite de débit** : 2 requêtes par minute.

### Paramètres

| Nom | Obligatoire | Description |
|---|---|---|
| `date_from` | oui | Début de période `AAAA-MM-JJ`, inclus |
| `date_to` | oui | Fin de période `AAAA-MM-JJ`, incluse (`date_from` <= `date_to`) |
| `equipement_id` | non | UUID de l'équipement |
| `format` | oui | `zip` (un PDF par fiche) ou `pdf` (un seul PDF) |
| `include_printed` | non | `true` pour inclure les fiches déjà imprimées (`printed_fiche`, archivées) ; défaut `false` : exclues |

La date retenue est celle du dernier passage à `ferme` dans le journal des statuts.
Ordre de sortie : code de l'équipement (interventions sans équipement en dernier), puis
cette date, puis code de l'intervention. Plafond de 100 fiches : au-delà, refus (jamais de
troncature).

### Réponse `200`

- `zip` : `application/zip`, `Content-Disposition: attachment`, fichier
  `fiches-fermees_<from>_<to>.zip`, un PDF par fiche nommé `<rang>_<code assaini>.pdf` (`001_`, `002_`…, dans l'ordre de
  sortie).
- `pdf` : `application/pdf`, `Content-Disposition: inline`, fichier
  `fiches-fermees_<from>_<to>.pdf`.

### Erreurs

| Code | Description |
|---|---|
| 400 | Date ou UUID invalide, période inversée, plus de 100 fiches |
| 422 | Paramètre obligatoire absent ou format inconnu |
| 401 | JWT manquant ou invalide |
| 403 | Rôle sans le droit |
| 404 | Aucune intervention fermée (non imprimée, par défaut) sur la période |
| 429 | Limite de débit dépassée |

---

## `POST /exports/interventions/closed/mark-printed`

Marque comme imprimées (`printed_fiche` à vrai) les fiches d'un export de masse. L'export
reste sans effet de bord : ce marquage est un acte distinct, sur la même sélection
(même requête, mêmes validations, même plafond de 100 fiches).

**Auth** : JWT Bearer. Droit réservé à ADMIN et RESP (TECH, ACHETEUR et clé MCP : 403).
**Limite de débit** : 10 requêtes par minute.

### Corps JSON

| Champ | Obligatoire | Description |
|---|---|---|
| `date_from` | oui | Début de période `AAAA-MM-JJ`, inclus |
| `date_to` | oui | Fin de période `AAAA-MM-JJ`, incluse |
| `equipement_id` | non | UUID de l'équipement |
| `include_printed` | non | Même valeur que l'export (défaut `false`) |

### Réponse `200`

```json
{ "data": { "marked": 3, "total": 5 } }
```

`total` : fiches sélectionnées ; `marked` : celles qui n'étaient pas encore imprimées.
Idempotent (un second appel renvoie `marked: 0`). Ne modifie ni le statut ni le journal
des statuts.

### Audit

Chaque fiche réellement marquée (passée de faux à vrai) écrit une ligne `audit_log`
`printed_fiche_changed` sur l'entité `intervention`, comme le `PUT /interventions/{id}`
unitaire : motif routinier de l'entité, sans saisie de motif par l'utilisateur, auteur pris
du jeton (`changed_by`). L'écriture se fait dans la même transaction : si elle échoue,
aucune fiche n'est marquée. Rien n'est tracé pour une fiche déjà imprimée.

### Erreurs

Mêmes codes que l'export : 400 (date ou UUID invalide, période inversée, plus de 100
fiches), 401, 403, 404 (aucune intervention fermée sur la période), 429.

---

## `GET /exports/interventions/{id}/pdf`

Génère un rapport PDF complet pour une intervention.

**Auth** : JWT Bearer token requis

### Headers

```
Authorization: Bearer eyJhbG...
```

### Réponse `200`

- Content-Type: `application/pdf`
- Filename: `{code_intervention}.pdf` (ex: `CN001-REA-20260113-QC.pdf`)
- ETag: supporté pour cache client

### Contenu du PDF

- En-tête : logo, titre, code intervention, QR code
- Informations intervention : type, priorité, statut, dates, technicien, équipement
- Actions réalisées avec technicien, temps passé, catégorie, complexité
- Historique des changements de statut
- Demandes d'achat liées (8 colonnes : qté, réf. interne, désignation, fournisseur, réf. fournisseur, fabricant, réf. fabricant, urgence)
- Pied de page : version API, version template, code intervention, pagination (Page X / Y), date de génération

### Erreurs

| Code | Description |
|---|---|
| 400 | Format UUID invalide |
| 401 | JWT manquant ou invalide |
| 404 | Intervention non trouvée |
| 500 | Échec de génération PDF |

### Exemple

```bash
curl -X GET "http://localhost:8000/exports/interventions/5ecf60d5-8471-4739-8ba8-0fdad7b51781/pdf" \
     -H "Authorization: Bearer eyJhbG..." \
     -o intervention.pdf
```

---

## `GET /exports/interventions/{id}/qrcode`

Génère un QR code pointant vers la page détail de l'intervention dans le frontend.

**Auth** : Public (conçu pour impression sur rapports physiques)

### Réponse `200`

- Content-Type: `image/png`
- Filename: `{code_intervention}.png` (inline, pas téléchargement)
- Cache: `public, max-age=3600` (1 heure)

### Contenu du QR

URL : `{EXPORT_QR_BASE_URL}/{intervention_id}`

Exemple : `http://localhost:5173/interventions/5ecf60d5-8471-4739-8ba8-0fdad7b51781`

### Caractéristiques

- Correction d'erreur élevée (`ERROR_CORRECT_H`) pour fiabilité du scan
- Logo overlay optionnel (configurable via `EXPORT_QR_LOGO_PATH`)
- Optimisé pour impression sur papier

### Erreurs

| Code | Description |
|---|---|
| 400 | Format UUID invalide |
| 404 | Intervention non trouvée |
| 500 | Échec de génération QR |

### Exemple

```bash
curl -X GET "http://localhost:8000/exports/interventions/5ecf60d5-8471-4739-8ba8-0fdad7b51781/qrcode" \
     -o qrcode.png
```

---

## Configuration

| Variable | Défaut | Description |
|---|---|---|
| `EXPORT_TEMPLATE_DIR` | `config/templates` | Dossier des templates HTML |
| `EXPORT_TEMPLATE_FILE` | `fiche_intervention_v8.html` | Fichier template |
| `EXPORT_TEMPLATE_VERSION` | `v8.0` | Version du template |
| `EXPORT_TEMPLATE_DATE` | `2025-10-03` | Date de version du template |
| `EXPORT_QR_BASE_URL` | `http://localhost:5173/interventions` | URL frontend pour QR |
| `EXPORT_QR_LOGO_PATH` | `config/templates/logo.png` | Logo overlay QR |
