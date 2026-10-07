import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Tuple

import jwt

from api.errors.exceptions import UnauthorizedError
from api.settings import settings

logger = logging.getLogger(__name__)

_ALGORITHM = "HS256"


def _secret() -> str:
    key = settings.JWT_SECRET_KEY
    if not key or len(key) < 32:
        # En dev sans clé configurée : clé éphémère (invalide entre redémarrages)
        logger.warning("JWT_SECRET_KEY absent/trop court — clé éphémère utilisée")
        return "dev-ephemeral-key-not-for-production-use-000"
    return key


def create_access_token(user_id: str, role_code: str) -> str:
    """Émet un access token JWT HS256 valide ACCESS_TOKEN_EXPIRE_MINUTES minutes."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role_code,
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, _secret(), algorithm=_ALGORITHM)


def create_refresh_token() -> Tuple[str, str]:
    """
    Génère un refresh token aléatoire 32 bytes.
    Retourne (token_clair, token_hash_sha256).
    Seul le hash est stocké en BDD.
    """
    token_clair = secrets.token_hex(32)
    token_hash = hashlib.sha256(token_clair.encode()).hexdigest()
    return token_clair, token_hash


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Décode et vérifie un access token.
    Rejette explicitement alg:none.
    Lève UnauthorizedError si invalide/expiré.
    """
    try:
        payload = jwt.decode(
            token,
            _secret(),
            algorithms=[_ALGORITHM],
            options={"verify_exp": True, "require": ["sub", "role", "exp"]},
        )
        # Défense contre alg:none même si PyJWT le gère déjà
        header = jwt.get_unverified_header(token)
        if header.get("alg", "").lower() == "none":
            raise UnauthorizedError("Algorithme JWT interdit")
        return payload
    except jwt.ExpiredSignatureError as e:
        raise UnauthorizedError("Token expiré") from e
    except jwt.InvalidSignatureError as e:
        raise UnauthorizedError("Signature JWT invalide") from e
    except jwt.DecodeError as e:
        raise UnauthorizedError("Token invalide") from e
    except jwt.MissingRequiredClaimError as e:
        raise UnauthorizedError(f"Token incomplet : {e}") from e
    except jwt.InvalidTokenError as e:
        # Filet pour les autres refus de PyJWT (algorithme interdit, iat futur...)
        raise UnauthorizedError("Token invalide") from e


def extract_user_from_token(token: str) -> Dict[str, Any]:
    """
    Compatibilité avec le middleware existant.
    Retourne {user_id, role, iat, exp}.
    """
    payload = decode_access_token(token)
    return {
        "user_id": payload["sub"],
        "role": payload["role"],
        "iat": payload.get("iat"),
        "exp": payload.get("exp"),
    }
