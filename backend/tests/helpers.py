"""Utilitaires de tests : mini-application FastAPI sans base ni JWT réel."""

from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

from api.errors.handlers import register_error_handlers


def make_client(router, user_id="11111111-1111-1111-1111-111111111111", role="TECH"):
    """Construit un client sur une mini-app qui n'inclut que le routeur testé.

    Un petit middleware pose request.state.user_id / role / api_key_id comme le
    ferait le middleware JWT, sans jamais toucher la base.
    """
    app = FastAPI()

    @app.middleware("http")
    async def _fake_auth(request: Request, call_next):
        request.state.user_id = user_id
        request.state.role = role
        request.state.api_key_id = None
        return await call_next(request)

    register_error_handlers(app)
    app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)
