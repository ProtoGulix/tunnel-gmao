"""Identifiants d'audit des entités qui n'ont pas d'uuid (ADR 0018, AUDC-34).

audit_log.entity_id est un uuid. Une famille de stock n'a qu'un code texte comme clé : elle
est tracée sous un uuid déterministe calculé depuis ce code (uuid5), le code étant aussi écrit
dans old_value et new_value. Le même code donne toujours le même identifiant, donc l'historique
d'une famille se relit en cherchant cet identifiant.
"""

from __future__ import annotations

from typing import Dict, Union
from uuid import UUID, uuid5

# Espace de noms des familles de stock : valeur tirée une fois pour toutes. Ne jamais la
# changer, sinon les lignes d'audit déjà écrites ne seraient plus retrouvées.
STOCK_FAMILY_NAMESPACE = UUID("668b50ce-5fb5-490c-8d99-c5e32e6f50b8")


def stock_family_entity_id(code: str) -> UUID:
    """Identifiant d'audit de la famille de stock portant ce code."""
    return uuid5(STOCK_FAMILY_NAMESPACE, code)


# Espaces de noms des entités à clé entière ou texte : un par entité, valeurs tirées une fois
# pour toutes (uuid4). Ne jamais les changer ni les réutiliser, comme pour les familles.
ENTITY_NAMESPACES: Dict[str, UUID] = {
    "intervention_type": UUID("a56c67ec-3b56-435f-8456-59601141f6fa"),
    "action_category": UUID("54fb93d9-0b22-45d8-912c-a2ff63ba686c"),
    "action_subcategory": UUID("6f85dafd-aa09-4c91-965d-36fecf87e236"),
    "intervention_status": UUID("32c840d7-036a-4aec-8717-876eb5602a53"),
    "audit_reason": UUID("57947ba6-a1bb-474a-8282-d671d1d45ad7"),
    "audit_rule": UUID("77af7d2f-2acf-4adf-8484-0fd84e322c0e"),
    "constat_question": UUID("0b7c1f0e-5a43-4c52-9d0e-3f6a8e2b7d11"),
    "constat_choice": UUID("c4e9a2d6-81b7-4f3a-a5c0-6d1e9b3f2a78"),
}


def entity_id_for(entity_type: str, key: Union[int, str]) -> UUID:
    """Identifiant d'audit d'une entité à clé entière ou texte (uuid5 de str(clé)).

    Une route déclarée dont la clé n'est pas un uuid ne peut pas laisser le middleware lire
    l'id du chemin : le repo dépose un événement (api.audits.events) avec cet identifiant,
    et la clé d'origine figure dans old_value et new_value (comme les familles de stock).
    ValueError si l'entité n'a pas d'espace de noms.
    """
    namespace = ENTITY_NAMESPACES.get(entity_type)
    if namespace is None:
        raise ValueError(f"Entité sans espace de noms d'audit : {entity_type}")
    return uuid5(namespace, str(key))
