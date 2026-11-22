import logging
import re

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class NotFoundError(HTTPException):
    """Ressource non trouvée (404)"""

    def __init__(self, detail: str = "Ressource non trouvée"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class UnauthorizedError(HTTPException):
    """Authentification échouée (401)"""

    def __init__(self, detail: str = "Non authentifié"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class ForbiddenError(HTTPException):
    """Accès refusé (403)"""

    def __init__(self, detail: str = "Accès refusé"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(HTTPException):
    """Conflit — ressource déjà existante (409)"""

    def __init__(self, detail: str = "Conflit : la ressource existe déjà"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class DatabaseError(HTTPException):
    """Erreur de base de données (500)"""

    def __init__(self, detail: str = "Erreur base de données"):
        # Le client reçoit toujours le message générique ; le détail (souvent l'erreur
        # PostgreSQL brute) n'est que journalisé, avec la trace de l'exception en cours.
        if detail != "Erreur base de données":
            logger.error("DatabaseError : %s", detail, exc_info=True)
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur base de données",
        )


class ValidationError(HTTPException):
    """Erreur de validation (400)"""

    def __init__(self, detail: str = "Erreur de validation"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class RenderError(HTTPException):
    """Erreur rendu PDF/QR (500)"""

    def __init__(self, detail: str = "Erreur lors du rendu"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors du rendu",
        )


# Messages des RAISE EXCEPTION de la base (code P0001) faits pour l'utilisateur : refus
# métier lisibles, renvoyés tels quels. Tout autre message (erreur interne, futur RAISE non
# relu) est remplacé par un texte générique ; le détail reste dans les logs (CLAUDE.md 6.4).
# Les messages internes de fn_audit_log_decision (changed_by absent, motif non système) n'y
# figurent pas : ils signalent un défaut du serveur, pas une saisie à corriger.
_USER_FACING_DB_MESSAGES = tuple(
    re.compile(p)
    for p in (
        r"type_inter est requis pour générer le code intervention",
        r"tech_initials est requis pour générer le code intervention",
        r"time_spent ou les bornes action_start/action_end sont requis",
        r"time_spent minimum est 0\.25h",
        r"time_spent doit être un multiple de 0\.25",
        r"Ambiguïté : fournir soit les bornes horaires soit time_spent, pas les deux",
        r"action_start doit être un multiple de 15 minutes",
        r"action_end doit être un multiple de 15 minutes",
        r"action_end doit être postérieur à action_start",
        r"reason_text obligatoire quand reason_code = OTHER",
        r"Raison \S+ inconnue ou inactive",
        r"Machine \S+ inconnue",
        r"L'archivage d'une intervention est irrévocable",
        r"Une intervention archivée ne peut pas être rouverte",
    )
)
GENERIC_DB_REFUSAL = "Opération refusée par la base de données"


def user_facing_db_message(message: str) -> str:
    """Message P0001 renvoyable au client : lui-même s'il est connu, sinon un texte générique."""
    if any(p.fullmatch(message.strip()) for p in _USER_FACING_DB_MESSAGES):
        return message.strip()
    return GENERIC_DB_REFUSAL


def raise_db_error(e: Exception, context: str = "opération") -> None:
    """
    Convertit une exception psycopg2 en exception HTTP appropriée.
    - Violation de contrainte unique (23505) → ConflictError 409
    - Violation de clé étrangère (23503) → ValidationError 400
    - RAISE EXCEPTION de la base (P0001) → ValidationError 400, message connu ou générique
    - Tout le reste → DatabaseError 500 (message générique)
    Le détail brut de l'erreur est toujours journalisé côté serveur, jamais renvoyé.

    Une HTTPException (erreur métier levée dans le bloc try : 404, 400, 409...) est
    relancée telle quelle : sans cela, un `except Exception` en ferait une 500.
    """
    if isinstance(e, HTTPException):
        raise e
    logger.error("Erreur base de données (%s) : %s", context, e, exc_info=e)
    pgcode = getattr(e, "pgcode", None) or (getattr(getattr(e, "orig", None), "pgcode", None))

    if pgcode == "23505":
        raise ConflictError(f"Cette ressource existe déjà ({context})")
    if pgcode == "23503":
        raise ValidationError(
            f"Référence invalide : une ressource liée est introuvable ({context})"
        )
    if pgcode == "P0001":
        msg = getattr(getattr(e, "diag", None), "message_primary", None) or str(e)
        raise ValidationError(user_facing_db_message(msg))

    raise DatabaseError(str(e))


class AuditReasonRequiredError(ValidationError):
    """Motif d'audit explicite exigé (400) : même contrat que le middleware d'audit.

    Le front (auditGuard.js) reconnaît le détail et le champ `audit`, ouvre la fenêtre
    de choix du motif puis rejoue la requête."""

    def __init__(self, audit: dict):
        super().__init__("reason_code obligatoire pour cette mutation")
        self.audit = audit
