"""Transaction par requête : une requête annulée rend sa connexion sans rien valider."""

import asyncio

import anyio

from api import db, transaction


def test_requete_annulee_rend_la_connexion_et_ne_valide_rien(monkeypatch):
    """Annulation anyio déterministe : la route attend indéfiniment, puis le CancelScope
    englobant est annulé à la main (ce que font une déconnexion client ou l'arrêt du serveur).
    Le nettoyage du finally doit quand même annuler la transaction et libérer la connexion."""
    appels = []
    faux_conn = object()

    monkeypatch.setattr(transaction, "open_request_connection", lambda: faux_conn)
    monkeypatch.setattr(
        transaction, "close_request_connection", lambda conn, commit: appels.append(commit)
    )

    started = []

    async def route(scope, receive, send):
        # La connexion de requête est visible pendant la route ; puis la route se bloque.
        assert db._request_connection.get() is faux_conn
        started.append(True)
        await anyio.sleep_forever()

    async def scenario():
        middleware = transaction.TransactionMiddleware(route)
        with anyio.CancelScope() as scope:

            async def lancer():
                await middleware({"type": "http", "method": "POST", "path": "/x"}, None, None)

            async with anyio.create_task_group() as tg:
                tg.start_soon(lancer)
                while not started:
                    await anyio.sleep(0)
                scope.cancel()

    asyncio.run(scenario())

    assert appels == [False]  # annulée une fois, jamais validée
