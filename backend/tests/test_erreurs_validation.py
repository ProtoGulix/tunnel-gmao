"""Une ValueError levée dans un model_validator donne un 422 lisible, pas un 500 (AUD-01)."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel, model_validator

from api.errors.handlers import register_error_handlers


class _Corps(BaseModel):
    debut: int
    fin: int

    @model_validator(mode="after")
    def _coherence(self):
        if self.fin < self.debut:
            raise ValueError("fin doit être postérieure à debut")
        return self


def _client() -> TestClient:
    app = FastAPI()
    register_error_handlers(app)

    @app.post("/essai")
    def essai(corps: _Corps):
        return {"ok": True}

    return TestClient(app, raise_server_exceptions=False)


def test_value_error_de_model_validator_renvoie_422_avec_le_message():
    resp = _client().post("/essai", json={"debut": 5, "fin": 1})
    assert resp.status_code == 422, f"{resp.status_code} {resp.text}"
    assert "fin doit être postérieure à debut" in resp.text


def test_corps_valide_passe():
    assert _client().post("/essai", json={"debut": 1, "fin": 5}).status_code == 200
