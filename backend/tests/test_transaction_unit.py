"""Unité de travail par requête (ADR 0018, AUDC-11) : tests sans base."""

import psycopg2
import pytest

from api import db
from api.db import RequestConnection


class FauxInfo:
    def __init__(self, status):
        self.transaction_status = status


class FausseConnexion:
    """Double minimal d'une connexion psycopg2."""

    def __init__(self, status=psycopg2.extensions.TRANSACTION_STATUS_INTRANS):
        self.info = FauxInfo(status)
        self.calls = []

    def commit(self):
        self.calls.append("commit")

    def rollback(self):
        self.calls.append("rollback")

    def cursor(self):
        return "curseur"


def test_commit_de_repo_ne_valide_rien():
    reelle = FausseConnexion()
    RequestConnection(reelle).commit()
    assert reelle.calls == []


def test_rollback_de_repo_annule_et_marque_la_requete_en_echec():
    reelle = FausseConnexion()
    conn = RequestConnection(reelle)
    assert conn.is_healthy()
    conn.rollback()
    assert reelle.calls == ["rollback"]
    assert conn.failed
    assert not conn.is_healthy()


@pytest.mark.parametrize(
    ("statut", "attendu"),
    [
        (psycopg2.extensions.TRANSACTION_STATUS_IDLE, True),
        (psycopg2.extensions.TRANSACTION_STATUS_INTRANS, True),
        (psycopg2.extensions.TRANSACTION_STATUS_INERROR, False),
        (psycopg2.extensions.TRANSACTION_STATUS_UNKNOWN, False),
        (psycopg2.extensions.TRANSACTION_STATUS_ACTIVE, False),
    ],
)
def test_transaction_en_erreur_ou_inconnue_nest_jamais_saine(statut, attendu):
    assert RequestConnection(FausseConnexion(statut)).is_healthy() is attendu


def test_delegation_a_la_vraie_connexion():
    assert RequestConnection(FausseConnexion()).cursor() == "curseur"


def test_get_connection_renvoie_la_connexion_de_requete_et_release_ne_rend_rien(monkeypatch):
    monkeypatch.setattr(db, "_borrow", lambda: pytest.fail("aucun emprunt attendu"))
    conn = RequestConnection(FausseConnexion())
    token = db.bind_request_connection(conn)
    try:
        assert db.get_connection() is conn
        db.release_connection(conn)  # sans effet, ne lève pas même sans pool
    finally:
        db.unbind_request_connection(token)


def test_hors_requete_get_connection_emprunte_au_pool(monkeypatch):
    reelle = FausseConnexion()
    monkeypatch.setattr(db, "_borrow", lambda: reelle)
    assert db.get_connection() is reelle


def test_connexion_fermee_nest_plus_rendue_aux_taches_de_fond(monkeypatch):
    """Une tâche de fond hérite du ContextVar mais la connexion fermée est ignorée."""
    propre = FausseConnexion()
    monkeypatch.setattr(db, "_borrow", lambda: propre)
    monkeypatch.setattr(db, "release_connection", lambda c: None)
    conn = RequestConnection(FausseConnexion())
    token = db.bind_request_connection(conn)
    try:
        db.close_request_connection(conn, commit=True)
        assert db.get_connection() is propre
    finally:
        db.unbind_request_connection(token)


def test_ordre_reel_des_middlewares():
    """CORS → JWT → droits → transaction → audit (le premier de la liste est l'extérieur).

    Après la transaction, l'audit doit être le SEUL BaseHTTPMiddleware : un second laisserait
    les tâches de fond partir avant la validation (api/transaction.py).
    """
    from api.app import app

    noms = [m.cls.__name__ for m in app.user_middleware]
    ordre = [
        noms.index(n)
        for n in (
            "CORSMiddleware",
            "JWTMiddleware",
            "PermissionMiddleware",
            "TransactionMiddleware",
            "AuditMiddleware",
        )
    ]
    assert ordre == sorted(ordre), noms
    apres_transaction = noms[noms.index("TransactionMiddleware") + 1 :]
    assert apres_transaction == ["AuditMiddleware"], apres_transaction
