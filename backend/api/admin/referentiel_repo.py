"""Accès base des référentiels d'administration : actions, types et statuts d'intervention.

Ces entités ont une clé entière (ou un code texte pour les statuts) : leur trace d'audit est
déposée ici, sous l'uuid5 de la clé (api.audits.entity_ids), avec la clé d'origine dans les
valeurs. Aucun SQL dynamique hors liste blanche : les colonnes modifiables sont écrites ici.
"""

from typing import Any, Dict, List, Optional, Tuple

from api.audits.entity_ids import entity_id_for
from api.audits.events import record_audit_event, record_field_changes
from api.db import get_connection, release_connection
from api.errors.exceptions import ValidationError, raise_db_error

# Colonnes tracées par entité (états avant/après de l'audit, sérialisables en JSON).
_CATEGORY_COLS = "id, name, code, color"
_SUBCATEGORY_COLS = "id, name, code, category_id"
_TYPE_COLS = "id, code, label, color, description, is_active, constat_required"
_STATUS_COLS = "code, label, color"


class ReferentielRepository:
    """Requêtes des référentiels d'actions et d'interventions (routes /admin)."""

    # ── Lectures ─────────────────────────────────────────────────────────────

    def _list(self, query: str, params: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(query, params or [])
                cols = [d[0] for d in cur.description]
                return [dict(zip(cols, r)) for r in cur.fetchall()]
        except Exception as e:
            raise_db_error(e, "lecture d'un référentiel")
        finally:
            if conn:
                release_connection(conn)

    def list_action_categories(self) -> List[Dict[str, Any]]:
        return self._list("SELECT * FROM action_category ORDER BY name ASC")

    def list_action_subcategories(
        self, category_id: Optional[int] = None, is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        wheres, params = [], []
        if category_id is not None:
            wheres.append("category_id = %s")
            params.append(category_id)
        if is_active is not None:
            wheres.append("is_active = %s")
            params.append(is_active)
        where_sql = ("WHERE " + " AND ".join(wheres)) if wheres else ""
        return self._list(f"SELECT * FROM action_subcategory {where_sql} ORDER BY name ASC", params)

    def list_intervention_types(self) -> List[Dict[str, Any]]:
        return self._list("SELECT * FROM intervention_type ORDER BY label ASC")

    def list_intervention_statuses(self) -> List[Dict[str, Any]]:
        return self._list("SELECT * FROM intervention_status_ref ORDER BY code ASC")

    # ── Écritures ────────────────────────────────────────────────────────────

    def _create(self, entity_type: str, insert_sql: str, params: Tuple, returning_cols: str) -> int:
        """INSERT ... RETURNING id, puis événement `created` sous l'uuid5 de l'id."""
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(f"{insert_sql} RETURNING {returning_cols}", params)
                row = cur.fetchone()
                cols = [d[0] for d in cur.description]
            state = dict(zip(cols, row))
            record_audit_event(
                entity_type, entity_id_for(entity_type, state["id"]), "created", new_value=state
            )
            conn.commit()
            return state["id"]
        except Exception as e:
            raise_db_error(e, f"création {entity_type}")
        finally:
            if conn:
                release_connection(conn)

    def _update(
        self,
        entity_type: str,
        table: str,
        key_col: str,
        key: Any,
        sets: List[Tuple[str, Any]],
        cols: str,
    ) -> None:
        """UPDATE d'une ligne puis une ligne d'audit par champ modifié.

        `table`, `key_col`, les colonnes de `sets` et `cols` viennent du code appelant (liste
        blanche), jamais d'une entrée client. Une clé inconnue ne modifie rien (comportement
        historique : la réponse reste un succès) et ne trace rien.
        """
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(f"SELECT {cols} FROM {table} WHERE {key_col} = %s", (key,))
                row = cur.fetchone()
                if row is None:
                    return
                names = [d[0] for d in cur.description]
                before = dict(zip(names, row))
                assignments = ", ".join(f"{col} = %s" for col, _ in sets)
                cur.execute(
                    f"UPDATE {table} SET {assignments} WHERE {key_col} = %s RETURNING {cols}",
                    [value for _, value in sets] + [key],
                )
                after = dict(zip(names, cur.fetchone()))
            record_field_changes(entity_type, entity_id_for(entity_type, key), before, after)
            conn.commit()
        except Exception as e:
            raise_db_error(e, f"modification {entity_type}")
        finally:
            if conn:
                release_connection(conn)

    def patch_action_category(
        self, category_id: int, label: Optional[str], color: Optional[str]
    ) -> None:
        sets = []
        if label is not None:
            sets.append(("name", label))
        if color is not None:
            sets.append(("color", color))
        if not sets:
            raise ValidationError("Rien à mettre à jour")
        self._update("action_category", "action_category", "id", category_id, sets, _CATEGORY_COLS)

    def create_action_subcategory(self, code: str, label: str, category_id: int) -> int:
        return self._create(
            "action_subcategory",
            "INSERT INTO action_subcategory (code, name, category_id) VALUES (%s, %s, %s)",
            (code, label, category_id),
            _SUBCATEGORY_COLS,
        )

    def patch_action_subcategory(self, subcat_id: int, label: Optional[str]) -> None:
        if label is None:
            raise ValidationError("Rien à mettre à jour")
        self._update(
            "action_subcategory",
            "action_subcategory",
            "id",
            subcat_id,
            [("name", label)],
            _SUBCATEGORY_COLS,
        )

    def create_intervention_type(
        self,
        code: str,
        label: str,
        description: Optional[str] = None,
        color: Optional[str] = None,
    ) -> int:
        code, label = code.strip(), label.strip()
        if not code or not label:
            raise ValidationError("Le code et le libellé du type sont obligatoires")
        # La couleur absente laisse la valeur par défaut de la table.
        cols, values = (
            ["code", "label", "description"],
            [code, label, (description or "").strip() or None],
        )
        if color is not None:
            cols.append("color")
            values.append(color.strip())
        return self._create(
            "intervention_type",
            f"INSERT INTO intervention_type ({', '.join(cols)}) "
            f"VALUES ({', '.join(['%s'] * len(cols))})",
            tuple(values),
            _TYPE_COLS,
        )

    def patch_intervention_type(
        self,
        type_id: int,
        label: Optional[str],
        description: Optional[str] = None,
        color: Optional[str] = None,
        constat_required: Optional[bool] = None,
    ) -> None:
        """Libellé, description, couleur et exigence de constat ; le code n'est jamais
        modifiable (ADR 0026). Une description vide efface la description."""
        sets = []
        if label is not None:
            if not label.strip():
                raise ValidationError("Le libellé du type ne peut pas être vide")
            sets.append(("label", label.strip()))
        if description is not None:
            sets.append(("description", description.strip() or None))
        if color is not None:
            if not color.strip():
                raise ValidationError("La couleur du type ne peut pas être vide")
            sets.append(("color", color.strip()))
        if constat_required is not None:
            sets.append(("constat_required", constat_required))
        if not sets:
            raise ValidationError("Rien à mettre à jour")
        self._update("intervention_type", "intervention_type", "id", type_id, sets, _TYPE_COLS)

    def set_intervention_type_active(self, type_id: int, is_active: bool) -> None:
        self._update(
            "intervention_type",
            "intervention_type",
            "id",
            type_id,
            [("is_active", is_active)],
            _TYPE_COLS,
        )

    def patch_intervention_status(
        self, status_code: str, label: Optional[str], color: Optional[str]
    ) -> None:
        sets = []
        if label is not None:
            sets.append(("label", label))
        if color is not None:
            sets.append(("color", color))
        if not sets:
            raise ValidationError("Rien à mettre à jour")
        self._update(
            "intervention_status",
            "intervention_status_ref",
            "code",
            status_code,
            sets,
            _STATUS_COLS,
        )
