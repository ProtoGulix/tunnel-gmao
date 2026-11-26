"""Accès base du référentiel des constats : questions et choix (ADR 0045, point 5).

Chaque écriture tient en une transaction : la question est verrouillée (FOR UPDATE) pour que
l'ordre d'un nouveau choix et la règle « un choix actif au moins » résistent aux requêtes
simultanées. Audit déposé ici, sous l'uuid5 de la clé (api.audits.entity_ids). Les colonnes
modifiables d'un choix viennent d'une liste blanche, jamais du client.
"""

from typing import Any, Dict, List, Optional

from api.admin.constat_validators import check_code, clean_label
from api.audits.entity_ids import entity_id_for
from api.audits.events import record_audit_event, record_field_changes
from api.db import get_connection, release_connection
from api.errors.exceptions import NotFoundError, ValidationError, raise_db_error

_CHOICE_COLS = (
    "id, question_id, code, label, sort_order, is_active, suggested_type_inter, "
    "creates_request, is_exclusive"
)
_QUESTION_COLS = "id, code, label"

# Colonnes d'un choix modifiables depuis l'administration (le code et la question sont figés).
_CHOICE_EDITABLE = (
    "label",
    "sort_order",
    "is_active",
    "suggested_type_inter",
    "creates_request",
    "is_exclusive",
)


def _row(cur) -> Optional[Dict[str, Any]]:
    row = cur.fetchone()
    if row is None:
        return None
    return dict(zip([d[0] for d in cur.description], row))


class ConstatReferentielRepository:
    """Requêtes des routes /admin/constat-questions et /admin/constat-choices."""

    def list_questions(self) -> List[Dict[str, Any]]:
        """Questions dans l'ordre, avec leur choix parent et tous leurs choix."""
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT q.id, q.code, q.label, q.is_multiple, q.parent_choice_id, "
                    "p.code AS parent_choice_code, q.sort_order, q.is_active "
                    "FROM constat_question q "
                    "LEFT JOIN constat_choice p ON p.id = q.parent_choice_id "
                    "ORDER BY q.sort_order, q.id"
                )
                cols = [d[0] for d in cur.description]
                questions = [dict(zip(cols, r)) for r in cur.fetchall()]
                cur.execute(f"SELECT {_CHOICE_COLS} FROM constat_choice ORDER BY sort_order, id")
                cols = [d[0] for d in cur.description]
                choices = [dict(zip(cols, r)) for r in cur.fetchall()]
            for question in questions:
                question["choices"] = [c for c in choices if c["question_id"] == question["id"]]
            return questions
        except Exception as e:
            raise_db_error(e, "lecture du référentiel des constats")
        finally:
            if conn:
                release_connection(conn)

    def patch_question(self, question_id: int, label: str) -> None:
        label = clean_label(label)
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    f"SELECT {_QUESTION_COLS} FROM constat_question WHERE id = %s FOR UPDATE",
                    (question_id,),
                )
                before = _row(cur)
                if before is None:
                    raise NotFoundError("Question introuvable")
                cur.execute(
                    f"UPDATE constat_question SET label = %s WHERE id = %s "
                    f"RETURNING {_QUESTION_COLS}",
                    (label, question_id),
                )
                after = _row(cur)
            record_field_changes(
                "constat_question", entity_id_for("constat_question", question_id), before, after
            )
            conn.commit()
        except (NotFoundError, ValidationError):
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            raise_db_error(e, "modification d'une question de constat")
        finally:
            if conn:
                release_connection(conn)

    def create_choice(
        self,
        question_id: int,
        code: str,
        label: str,
        suggested_type_inter: Optional[str],
        creates_request: bool,
        is_exclusive: bool,
    ) -> int:
        """Ajoute un choix en dernier de sa question ; le code est unique sur toute la table."""
        code, label = check_code(code), clean_label(label)
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM constat_question WHERE id = %s FOR UPDATE", (question_id,)
                )
                if cur.fetchone() is None:
                    raise NotFoundError("Question introuvable")
                cur.execute("SELECT 1 FROM constat_choice WHERE code = %s", (code,))
                if cur.fetchone() is not None:
                    raise ValidationError("Ce code est déjà utilisé")
                self._check_type(cur, suggested_type_inter)
                cur.execute(
                    "INSERT INTO constat_choice (question_id, code, label, sort_order, "
                    "suggested_type_inter, creates_request, is_exclusive) VALUES "
                    "(%s, %s, %s, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM constat_choice "
                    f"WHERE question_id = %s), %s, %s, %s) RETURNING {_CHOICE_COLS}",
                    (
                        question_id,
                        code,
                        label,
                        question_id,
                        suggested_type_inter,
                        creates_request,
                        is_exclusive,
                    ),
                )
                state = _row(cur)
            record_audit_event(
                "constat_choice",
                entity_id_for("constat_choice", state["id"]),
                "created",
                new_value=state,
            )
            conn.commit()
            return state["id"]
        except (NotFoundError, ValidationError):
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            raise_db_error(e, "création d'un choix de constat")
        finally:
            if conn:
                release_connection(conn)

    def patch_choice(self, choice_id: int, changes: Dict[str, Any]) -> None:
        """Applique les champs présents de `changes` (liste blanche) ; null efface le type."""
        unknown = set(changes) - set(_CHOICE_EDITABLE)
        if unknown:
            raise ValidationError("Champ non modifiable")
        if not changes:
            raise ValidationError("Rien à mettre à jour")
        sets = self._validated_sets(changes)
        conn = None
        try:
            conn = get_connection()
            with conn.cursor() as cur:
                cur.execute("SELECT question_id FROM constat_choice WHERE id = %s", (choice_id,))
                found = cur.fetchone()
                if found is None:
                    raise NotFoundError("Choix introuvable")
                # Verrou de la question avant de relire le choix et de compter les actifs.
                cur.execute("SELECT id FROM constat_question WHERE id = %s FOR UPDATE", (found[0],))
                cur.execute(
                    f"SELECT {_CHOICE_COLS} FROM constat_choice WHERE id = %s", (choice_id,)
                )
                before = _row(cur)
                if "suggested_type_inter" in changes:
                    self._check_type(cur, changes["suggested_type_inter"])
                if changes.get("is_active") is False and before["is_active"]:
                    self._check_other_active(cur, before["question_id"], choice_id)
                assignments = ", ".join(f"{col} = %s" for col, _ in sets)
                cur.execute(
                    f"UPDATE constat_choice SET {assignments} WHERE id = %s "
                    f"RETURNING {_CHOICE_COLS}",
                    [value for _, value in sets] + [choice_id],
                )
                after = _row(cur)
            record_field_changes(
                "constat_choice", entity_id_for("constat_choice", choice_id), before, after
            )
            conn.commit()
        except (NotFoundError, ValidationError):
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            raise_db_error(e, "modification d'un choix de constat")
        finally:
            if conn:
                release_connection(conn)

    @staticmethod
    def _validated_sets(changes: Dict[str, Any]) -> List[tuple]:
        """Colonnes à écrire, dans l'ordre de la liste blanche, valeurs contrôlées."""
        sets = []
        for col in _CHOICE_EDITABLE:
            if col not in changes:
                continue
            value = changes[col]
            if col == "label":
                value = clean_label(value)
            elif col != "suggested_type_inter" and value is None:
                raise ValidationError("Valeur obligatoire")
            sets.append((col, value))
        return sets

    @staticmethod
    def _check_type(cur, type_code: Optional[str]) -> None:
        """Le type préconisé doit exister et être actif ; null est permis."""
        if type_code is None:
            return
        cur.execute("SELECT is_active FROM intervention_type WHERE code = %s", (type_code,))
        row = cur.fetchone()
        if row is None or not row[0]:
            raise ValidationError("Type d'intervention inconnu ou inactif")

    @staticmethod
    def _check_other_active(cur, question_id: int, choice_id: int) -> None:
        cur.execute(
            "SELECT 1 FROM constat_choice WHERE question_id = %s AND is_active "
            "AND id <> %s LIMIT 1",
            (question_id, choice_id),
        )
        if cur.fetchone() is None:
            raise ValidationError("Une question garde au moins un choix actif")
