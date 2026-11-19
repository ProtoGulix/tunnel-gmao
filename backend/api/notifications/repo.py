"""Requêtes pour le domaine notifications"""

from datetime import date
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
                WHERE user_id = %s AND dismissed_at IS NULL
                -- id départage les notifications d'une même transaction (même created_at) :
                -- sans lui, l'ordre change d'une page à l'autre (doublons et manques).
                ORDER BY created_at DESC, id DESC
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
        """Compte les notifications visibles d'un utilisateur (les masquées sont ignorées)"""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT COUNT(*) FROM notification WHERE user_id = %s AND dismissed_at IS NULL",
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
                "SELECT COUNT(*) FROM notification "
                "WHERE user_id = %s AND read_at IS NULL AND dismissed_at IS NULL",
                (user_id,),
            )
            return int(cur.fetchone()[0])
        except Exception as e:
            raise_db_error(e, "comptage des notifications non lues")
        finally:
            release_connection(conn)

    def mark_read(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """Marque une notification comme lue.

        Lève NotFoundError si la notification n'existe pas ou est masquée (elle n'est plus
        visible de son destinataire), ForbiddenError si elle n'appartient pas à l'utilisateur
        courant.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT user_id FROM notification WHERE id = %s AND dismissed_at IS NULL",
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

    def dismiss(self, notification_id: str, user_id: str) -> int:
        """Masque une notification de l'utilisateur (la ligne reste en base).

        Lève NotFoundError si elle n'existe pas, n'est pas la sienne ou est déjà masquée :
        le même 404 dans les trois cas, pour ne rien révéler sur les notifications d'autrui.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                UPDATE notification SET dismissed_at = now()
                WHERE id = %s AND user_id = %s AND dismissed_at IS NULL
                """,
                (notification_id, user_id),
            )
            if cur.rowcount == 0:
                raise NotFoundError(f"Notification {notification_id} non trouvée")
            conn.commit()
            return cur.rowcount
        except NotFoundError:
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "masquage de la notification")
        finally:
            release_connection(conn)

    def dismiss_all(self, user_id: str, only_read: bool = False) -> int:
        """Masque les notifications de l'utilisateur (seulement les lues si only_read)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            # Fragment fixe choisi par un booléen : aucune valeur client dans le SQL.
            read_filter = "AND read_at IS NOT NULL" if only_read else ""
            cur.execute(
                f"""
                UPDATE notification SET dismissed_at = now()
                WHERE user_id = %s AND dismissed_at IS NULL {read_filter}
                """,
                (user_id,),
            )
            dismissed = cur.rowcount
            conn.commit()
            return dismissed
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "masquage des notifications")
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

    def notify_active_users_once(
        self,
        type_: str,
        entity_type: str,
        entity_id: str,
        message: str,
        milestone: date,
        data: Optional[Dict[str, Any]] = None,
        quiet_since: Optional[date] = None,
        sent_on: Optional[date] = None,
    ) -> int:
        """Notifie chaque utilisateur actif d'un palier de relance, une seule fois.

        Le palier est rangé dans `data` (clé `milestone`, date ISO) : rien n'est émis si une
        notification de même (type, entité, palier) existe déjà, ce qui rend la tâche
        quotidienne idempotente (ADR 0023, point 5). Avec `quiet_since`, rien n'est émis non
        plus si une notification de même (type, entité) a été envoyée depuis cette date : après
        le rattrapage du stock, la relance suivante attend un intervalle entier au lieu de
        tomber au palier suivant, parfois dès le lendemain. Masquées comprises. Le jour
        d'envoi (`sent_on`, aujourd'hui par défaut) est rangé dans `data` ; les lignes plus
        anciennes, sans lui, sont datées par leur création. Retourne le
        nombre de notifications créées.
        """
        milestone_key = milestone.isoformat()
        payload = {**(data or {}), "milestone": milestone_key}
        if quiet_since is not None:
            # Jour d'envoi selon la tâche (son `today`), relu par la période sans relance.
            payload["sent_on"] = (sent_on or date.today()).isoformat()
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                INSERT INTO notification (user_id, type, entity_type, entity_id, message, data)
                SELECT u.id, %s, %s, %s::uuid, %s, %s::jsonb
                FROM tunnel_user u
                WHERE u.is_active
                  AND NOT EXISTS (
                      SELECT 1 FROM notification n
                      WHERE n.type = %s AND n.entity_id = %s::uuid
                        AND (n.data->>'milestone' = %s
                             OR (%s::date IS NOT NULL
                                 AND COALESCE((n.data->>'sent_on')::date, n.created_at::date)
                                     >= %s::date))
                  )
                """,
                (
                    type_,
                    entity_type,
                    entity_id,
                    message,
                    Json(payload),
                    type_,
                    entity_id,
                    milestone_key,
                    quiet_since,
                    quiet_since,
                ),
            )
            created = cur.rowcount
            conn.commit()
            return created
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "création des notifications de relance")
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
