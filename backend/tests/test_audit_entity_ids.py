"""Identifiant d'audit déterministe d'une famille de stock (AUDC-34)."""

from uuid import UUID, uuid5

from api.audits.entity_ids import STOCK_FAMILY_NAMESPACE, stock_family_entity_id


def test_meme_code_meme_identifiant():
    assert stock_family_entity_id("ROUL") == stock_family_entity_id("ROUL")


def test_codes_differents_identifiants_differents():
    assert stock_family_entity_id("ROUL") != stock_family_entity_id("JOINT")


def test_identifiant_est_un_uuid5_de_l_espace_de_noms_constant():
    attendu = uuid5(STOCK_FAMILY_NAMESPACE, "ROUL")
    assert stock_family_entity_id("ROUL") == attendu
    assert isinstance(attendu, UUID)
    # Valeur figée : changer l'espace de noms romprait le lien avec l'historique déjà écrit.
    assert str(STOCK_FAMILY_NAMESPACE) == "668b50ce-5fb5-490c-8d99-c5e32e6f50b8"
