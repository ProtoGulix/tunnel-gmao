"""Réglage ciblé du trigger fn_log_request_status_change (journal des statuts de demande).

Quand le code écrit lui-même une ligne de request_status_log (avec son auteur et ses
notes), le trigger de journalisation automatique doit se taire sinon il écrirait un
doublon. Le réglage est posé juste avant l'instruction concernée et remis à 'false'
juste après : sous la transaction de requête (ADR 0018), un SET LOCAL durerait jusqu'à la
fin de la requête et ferait taire le journal d'un changement de statut ultérieur.
"""

from __future__ import annotations

from contextlib import contextmanager


@contextmanager
def skip_request_status_log(cur):
    """Fait taire le trigger de journal des statuts le temps du bloc, puis le rétablit.

    En cas d'exception, la transaction est annulée par l'appelant et le réglage (local à la
    transaction) disparaît avec elle : inutile de le remettre, et une requête SQL échouerait
    sur une transaction déjà en erreur.
    """
    cur.execute("SELECT set_config('app.skip_request_status_log', 'true', true)")
    yield
    cur.execute("SELECT set_config('app.skip_request_status_log', 'false', true)")
