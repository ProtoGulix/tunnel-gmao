# Pièces (`/parts`) : audit

Seule la partie traçabilité est documentée ici (ADR 0018, étape 3). Toutes les routes en écriture sont déclarées ; l'auteur est celui du jeton, la création et la modification sont routinières (motif injecté si absent), seule la suppression exige un `reason_code` explicite.

| Route | entity_type | Décision écrite |
|---|---|---|
| `POST /parts` | `part` | `created` ; chaque référence fabricant créée avec la pièce : `created` (`part_manufacturer_ref`) |
| `PATCH /parts/{part_id}` | `part` | `{champ}_changed` |
| `POST /parts/{part_id}/manufacturer-refs` | `part_manufacturer_ref` | `created` (la réponse est la pièce : l'id de la référence est dans `manufacturer_refs`) |
| `PATCH /parts/manufacturer-refs/{mfr_ref_id}` | `part_manufacturer_ref` | `{champ}_changed` |
| `POST /parts/manufacturer-refs/{mfr_ref_id}/set-preferred` | `part_manufacturer_ref` | `is_preferred_changed` |
| `DELETE /parts/manufacturer-refs/{mfr_ref_id}` | `part_manufacturer_ref` | `deleted` (motif explicite) ; une ligne `deleted` par référence fournisseur emportée |
| `POST /parts/manufacturer-refs/{mfr_ref_id}/supplier-refs` | `part_supplier_ref` | `created` |
| `PATCH /parts/supplier-refs/{supplier_ref_id}` | `part_supplier_ref` | `{champ}_changed` |
| `POST /parts/supplier-refs/{supplier_ref_id}/set-preferred` | `part_supplier_ref` | `is_preferred_changed` |
| `DELETE /parts/supplier-refs/{supplier_ref_id}` | `part_supplier_ref` | `deleted` (motif explicite) |

Quand une référence devient « préférée », chaque référence sœur qui perd le statut reçoit sa propre ligne `is_preferred_changed`. Il n'existe pas de `DELETE /parts/{part_id}`.
