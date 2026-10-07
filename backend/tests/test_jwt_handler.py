"""Émission et vérification des access tokens."""

from datetime import datetime, timedelta, timezone

import jwt
import pytest

from api.auth.jwt_handler import create_access_token, extract_user_from_token
from api.errors.exceptions import UnauthorizedError
from api.settings import settings


def test_un_token_emis_se_relit_avec_son_utilisateur_et_son_role():
    token = create_access_token("user-1", "TECH")
    user = extract_user_from_token(token)
    assert user["user_id"] == "user-1"
    assert user["role"] == "TECH"


def test_un_token_expire_est_refuse():
    payload = {
        "sub": "user-1",
        "role": "TECH",
        "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm="HS256")
    with pytest.raises(UnauthorizedError):
        extract_user_from_token(token)


def test_un_token_signe_avec_une_autre_cle_est_refuse():
    payload = {
        "sub": "user-1",
        "role": "ADMIN",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(
        payload, "une-autre-cle-de-plus-de-trente-deux-caracteres", algorithm="HS256"
    )
    with pytest.raises(UnauthorizedError):
        extract_user_from_token(token)


def test_un_token_sans_signature_alg_none_est_refuse():
    payload = {
        "sub": "user-1",
        "role": "ADMIN",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
    }
    token = jwt.encode(payload, None, algorithm="none")
    with pytest.raises(UnauthorizedError):
        extract_user_from_token(token)


def test_le_jeton_ne_transporte_pas_la_matrice_des_droits():
    """La matrice est lue en cache côté serveur (ADR 0007) et les fronts la reçoivent par
    /auth/me : l'embarquer dans le jeton le rendait trop gros pour nginx (≈ 12 Ko pour
    ADMIN, réponse 400 « Request Header Too Large »)."""
    token = create_access_token("user-1", "ADMIN")
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
    assert "permissions" not in payload
    assert len(token) < 1024
