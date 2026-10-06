"""Requêtes pour le domaine notifications"""

from typing import Any, Dict, List, Optional

from psycopg2.extras import Json

from api.db import get_connection, release_connection
from api.errors.exceptions import ForbiddenError, NotFoundError, raise_db_error

_COLUMNS = "id, user_id, type, entity_type, entity_id, message, data, read_at, created_at"


class NotificationRepository:
    """Requêtes pour le domaine notifications"""

    def _get_connection(self):
        return get_connection()

    def list_for_user(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict[str, Any]]:
        """Liste les notifications d'un utilisateur, triées par date décroissante"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""
                SELECT {_COLUMNS}
                FROM notification
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
                """,
                (user_id, limit, offset),
            )
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "récupération des notifications")
        finally:
            release_connection(conn)

    def count_for_user(self, user_id: str) -> int:
        """Compte le nombre total de notifications d'un utilisateur (toutes confondues)"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM notification WHERE user_id = %s",
                (user_id,),
            )
            return int(cur.fetchone()[0])
        except Exception as e:
            raise_db_error(e, "comptage des notifications")
        finally:
            release_connection(conn)

    def count_unread(self, user_id: str) -> int:
        """Compte le nombre de notifications non lues d'un utilisateur"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM notification WHERE user_id = %s AND read_at IS NULL",
                (user_id,),
            )
            return int(cur.fetchone()[0])
        except Exception as e:
            raise_db_error(e, "comptage des notifications non lues")
        finally:
            release_connection(conn)

    def mark_read(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """Marque une notification comme lue.

        Lève NotFoundError si la notification n'existe pas, ForbiddenError si
        elle n'appartient pas à l'utilisateur courant.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT user_id FROM notification WHERE id = %s",
                (notification_id,),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError(f"Notification {notification_id} non trouvée")
            if str(row[0]) != str(user_id):
                raise ForbiddenError("Cette notification ne vous appartient pas")

            cur.execute(
                f"""
                UPDATE notification
                SET read_at = COALESCE(read_at, now())
                WHERE id = %s
                RETURNING {_COLUMNS}
                """,
                (notification_id,),
            )
            updated = cur.fetchone()
            cols = [desc[0] for desc in cur.description]
            conn.commit()
            return dict(zip(cols, updated))
        except (NotFoundError, ForbiddenError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "marquage de la notification comme lue")
        finally:
            release_connection(conn)

    def mark_all_read(self, user_id: str) -> int:
        """Marque toutes les notifications non lues de l'utilisateur comme lues.

        Retourne le nombre de notifications mises à jour.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE notification
                SET read_at = now()
                WHERE user_id = %s AND read_at IS NULL
                """,
                (user_id,),
            )
            updated = cur.rowcount
            conn.commit()
            return updated
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "marquage global des notifications comme lues")
        finally:
            release_connection(conn)

    def create(
        self,
        user_id: str,
        type_: str,
        entity_type: str,
        entity_id: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Crée une notification (utilisé notamment par POST /interventions/{id}/request-pointage)"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                f"""
                INSERT INTO notification (user_id, type, entity_type, entity_id, message, data)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING {_COLUMNS}
                """,
                (
                    user_id,
                    type_,
                    entity_type,
                    entity_id,
                    message,
                    Json(data) if data is not None else None,
                ),
            )
            row = cur.fetchone()
            cols = [desc[0] for desc in cur.description]
            conn.commit()
            return dict(zip(cols, row))
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "création de la notification")
        finally:
            release_connection(conn)

    def list_recipients_for_entity(self, type_: str, entity_id: str) -> List[Dict[str, Any]]:
        """Récupère (user_id, email, message) des destinataires d'une notification déjà créée
        pour une entité de type `intervention_request` (inclut son code DI).

        Utilisé pour l'envoi de mail applicatif après coup (ex: fan-out DB du
        trigger `fn_notify_di_a_traiter`, puis résolution des emails ici pour
        déclencher les mails via BackgroundTasks).
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT n.user_id, n.message, tu.email, ir.code AS entity_code
                FROM notification n
                JOIN tunnel_user tu ON tu.id = n.user_id
                LEFT JOIN intervention_request ir ON ir.id = n.entity_id
                WHERE n.type = %s AND n.entity_id = %s
                """,
                (type_, entity_id),
            )
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "récupération des destinataires de notification")
        finally:
            release_connection(conn)
