"""Requêtes pour le domaine home_view (accueil par rôle)"""

from typing import Any, Dict, List, Optional

from api.db import get_connection, release_connection
from api.errors.exceptions import NotFoundError, ValidationError, raise_db_error

DEFAULT_VIEW_CODE = "technicien"


class HomeViewRepository:
    """Requêtes pour le domaine home_view"""

    def _get_connection(self):
        return get_connection()

    def get_referentiel(self) -> List[Dict[str, Any]]:
        """Liste les vues d'accueil disponibles, triées pour l'affichage admin."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT code, label FROM home_view_ref ORDER BY sort_order ASC")
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "récupération du référentiel des vues d'accueil")
        finally:
            release_connection(conn)

    def get_view_for_role_code(self, role_code: Optional[str]) -> Dict[str, Any]:
        """Résout la vue d'accueil du rôle donné (code, ex: 'TECH').

        Retombe sur la vue par défaut ('technicien') si le rôle n'a pas
        d'assignation explicite, ou si `role_code` est absent/inconnu (ex:
        clé API sans rôle applicatif clair) — jamais d'erreur ici, cette
        méthode alimente l'écran d'accueil qui doit toujours pouvoir résoudre
        une vue.
        """
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            if role_code:
                cur.execute(
                    """
                    SELECT hvr.code, hvr.label
                    FROM tunnel_role tr
                    JOIN role_home_view hva ON hva.role_id = tr.id
                    JOIN home_view_ref hvr ON hvr.code = hva.home_view
                    WHERE tr.code = %s
                    """,
                    (role_code,),
                )
                row = cur.fetchone()
                if row:
                    cols = [desc[0] for desc in cur.description]
                    return dict(zip(cols, row))

            cur.execute(
                "SELECT code, label FROM home_view_ref WHERE code = %s",
                (DEFAULT_VIEW_CODE,),
            )
            row = cur.fetchone()
            cols = [desc[0] for desc in cur.description]
            return dict(zip(cols, row))
        except Exception as e:
            raise_db_error(e, "résolution de la vue d'accueil")
        finally:
            release_connection(conn)

    def list_assignments(self) -> List[Dict[str, Any]]:
        """Liste les assignations rôle → vue explicitement configurées (admin)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT role_id, home_view FROM role_home_view ORDER BY updated_at ASC")
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description]
            return [dict(zip(cols, row)) for row in rows]
        except Exception as e:
            raise_db_error(e, "récupération des assignations de vues d'accueil")
        finally:
            release_connection(conn)

    def upsert_assignment(
        self, role_id: str, home_view: str, updated_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Assigne (crée ou remplace) la vue d'accueil d'un rôle."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()

            cur.execute("SELECT id FROM tunnel_role WHERE id = %s", (role_id,))
            if not cur.fetchone():
                raise NotFoundError(f"Rôle {role_id} non trouvé")

            cur.execute("SELECT code FROM home_view_ref WHERE code = %s", (home_view,))
            if not cur.fetchone():
                raise ValidationError(f"Vue d'accueil inconnue : '{home_view}'")

            cur.execute(
                """
                INSERT INTO role_home_view (role_id, home_view, updated_by)
                VALUES (%s, %s, %s)
                ON CONFLICT (role_id) DO UPDATE
                    SET home_view = EXCLUDED.home_view, updated_at = now(), updated_by = EXCLUDED.updated_by
                RETURNING role_id, home_view
                """,
                (role_id, home_view, updated_by),
            )
            row = cur.fetchone()
            cols = [desc[0] for desc in cur.description]
            conn.commit()
            return dict(zip(cols, row))
        except (NotFoundError, ValidationError):
            conn.rollback()
            raise
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "assignation de la vue d'accueil")
        finally:
            release_connection(conn)

    def delete_assignment(self, role_id: str) -> None:
        """Retire la configuration explicite d'un rôle (retombe sur la vue par défaut)."""
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("DELETE FROM role_home_view WHERE role_id = %s", (role_id,))
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise_db_error(e, "suppression de l'assignation de vue d'accueil")
        finally:
            release_connection(conn)
