"""Identifiants d'audit des entités qui n'ont pas d'uuid (ADR 0018, AUDC-34).

audit_log.entity_id est un uuid. Une famille de stock n'a qu'un code texte comme clé : elle
est tracée sous un uuid déterministe calculé depuis ce code (uuid5), le code étant aussi écrit
dans old_value et new_value. Le même code donne toujours le même identifiant, donc l'historique
d'une famille se relit en cherchant cet identifiant.
"""

from __future__ import annotations

from uuid import UUID, uuid5

# Espace de noms des familles de stock : valeur tirée une fois pour toutes. Ne jamais la
# changer, sinon les lignes d'audit déjà écrites ne seraient plus retrouvées.
STOCK_FAMILY_NAMESPACE = UUID("668b50ce-5fb5-490c-8d99-c5e32e6f50b8")


def stock_family_entity_id(code: str) -> UUID:
    """Identifiant d'audit de la famille de stock portant ce code."""
    return uuid5(STOCK_FAMILY_NAMESPACE, code)
