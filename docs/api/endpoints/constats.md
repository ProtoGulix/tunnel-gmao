# Constats

Retour terrain après une intervention (ADR 0043) : formulaire fixe, uniquement par sélection. Chaque constat crée une demande d'intervention (DI) sur la machine visée, avec `source_intervention_id`. Aucun texte libre.

> Voir aussi : [Interventions](interventions.md) | [Intervention Requests](intervention-requests.md) | [Admin](admin.md)

Les questions et choix vivent en base (`constat_question`, `constat_choice`). Le type préconisé d'un choix (`suggested_type_inter`) n'est pas exposé : le serveur l'applique.

## Routes

| Méthode | Chemin                                  | Droit                  | Codes            |
| ------- | --------------------------------------- | ---------------------- | ---------------- |
| GET     | `/constats/questions`                   | authentifié            | 200              |
| GET     | `/interventions/{id}/constats`          | authentifié            | 200, 404         |
| POST    | `/interventions/{id}/constats`          | TECH, RESP, ADMIN      | 201, 400, 403, 404 |
| GET     | `/constats/by-request/{request_id}`     | authentifié            | 200, 404         |
| POST    | `/constats/{id}/corrections`            | TECH, RESP, ADMIN (auteur ou RESP, ADMIN) | 201, 400, 403, 404, 409 |
| GET     | `/constats/{id}/improvement-ideas`      | authentifié            | 200, 404         |
| POST    | `/constats/{id}/link`                   | RESP, ADMIN            | 200, 400, 403, 404, 409 |

ACHETEUR et la clé d'API MCP sont refusés en écriture (`403`). Une liste est un tableau JSON ; une écriture renvoie `{ "data": <constat> }`.

## `GET /constats/questions`

Questions actives dans l'ordre de l'écran : `code`, `label`, `is_multiple`, `parent_choice_code` (sous-question affichée si ce choix est coché), `sort_order`, `choices` (`code`, `label`, `sort_order`). Codes de départ : `LEVER`, `FREQUENCY`, `KNOWN_SINCE`, `DOMAIN`, `PARAMETER`, `SIGNAL`, `PART`.

## `POST /interventions/{id}/constats`

```json
{ "choices": ["TASK", "FREQ_MONTHLY", "SIGNAL_SEEN", "PART_PLC"], "machine_id": null }
```

`machine_id` : machine visée, celle de l'intervention par défaut. L'auteur est celui du jeton (`created_by`).

Règles (`400` sinon) : choix connu et actif ; un seul choix pour une question à choix unique ; questions sans parent obligatoires (`LEVER`, `SIGNAL`, `PART`) ; sous-question exigée si et seulement si son choix parent est coché ; machine existante ; intervention non archivée. Accepté après la clôture.

Dans une même transaction : le constat, sa DI (origine signalée, notifiée comme toute DI, `created_by` = auteur, texte construit depuis les libellés des choix) et leur trace d'audit. Type préconisé de la DI : celui du premier choix coché, dans l'ordre de l'écran, qui porte un type (TASK : PRE, PROJECT : PRO) ; sinon `null`. Un type désactivé depuis est ignoré.

Réponse : `id`, `intervention_id`, `machine_id`, `machine_code`, `machine_name`, `created_by`, `author_first_name`, `author_last_name`, `created_at`, `supersedes_id`, `request_id`, `request_code`, `request_status`, `suggested_type_inter`, `linked_request_id`, `linked_request_code`, `request_status_label`, `request_status_color`, `request_intervention_id`, `request_intervention_code` (intervention créée à l'acceptation, sinon `null`), `request_status_reason` (libellé du motif d'audit du dernier événement de la demande, création ou changement de statut ; `null` sans motif), `request_status_comment` (commentaire saisi avec ce motif, sinon `null`), `request_status_by` (nom de l'auteur de cet événement), `request_status_at` (sa date), `source_intervention_code`, `answers` (`question_code`, `question_label`, `choice_code`, `label`), `can_correct`.

**Audit** : routinier (`ROUTINE`).

## `GET /interventions/{id}/constats`, `GET /constats/by-request/{request_id}`

Versions courantes seulement (non remplacées), même forme que ci-dessus. `can_correct` : vrai pour l'auteur, RESP et ADMIN tant que la DI est « nouvelle ».

## `POST /constats/{id}/corrections`

Même corps, avec `reason_code` (et `reason_text` si `OTHER`). Crée une version qui remplace l'ancienne (`supersedes_id`) ; la DI est mise à jour (machine, texte, type préconisé recalculé). Réservé à l'auteur du constat, RESP et ADMIN (`403` sinon), tant que la DI est « nouvelle » (`400` sinon) ; intervention archivée : `400` ; version déjà remplacée : `409`.

**Audit** : motif explicite de décision `constat_corrected` (`CONSTAT_CORRECTION` « Correction »). Sans motif : `400` « reason_code obligatoire » avec la liste dans `audit`. Une ligne `constat_corrected` sur l'ancienne version ; la mise à jour de la DI est tracée en cascade (`SYSTEM_CASCADE`).

## `GET /constats/{id}/improvement-ideas`

Idées d'amélioration ouvertes de la machine du constat : DI de type préconisé `PRO`, statut `nouvelle`, `en_attente` ou `acceptee`, hors la DI du constat. Champs : `id`, `code`, `description`, `statut`, `created_at`.

## `POST /constats/{id}/link`

```json
{ "request_id": "<uuid de l'idée>" }
```

Pose `linked_request_id` et rejette la DI du constat par la transition existante (ADR 0038), motif `REJECT_DUPLICATE`, auteur du jeton, notes « Doublon : rattaché à <code> ». `400` : constat déjà rattaché, DI déjà traitée (ni « nouvelle » ni « en_attente »), idée absente, d'une autre machine, non `PRO` ou fermée. `409` : constat déjà corrigé. Réponse : le constat.

**Audit** : routinier sur le constat ; le rejet de la DI porte `REJECT_DUPLICATE`.
