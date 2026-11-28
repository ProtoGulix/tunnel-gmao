"""Titre d'une intervention tiré de la description de sa demande (FTL-01)."""

import pytest

from api.errors.exceptions import ValidationError
from api.interventions.validators import (
    TITLE_MAX_LENGTH,
    InterventionValidator,
    title_from_description,
)


def test_description_courte_inchangee():
    assert title_from_description("Fuite sous la presse") == "Fuite sous la presse"


def test_exactement_la_longueur_max_inchangee():
    texte = "a" * TITLE_MAX_LENGTH
    assert title_from_description(texte) == texte


def test_un_caractere_de_trop_coupe_sur_un_mot():
    texte = "mot " * 50 + "x"  # 201 caractères
    assert len(texte) == TITLE_MAX_LENGTH + 1
    titre = title_from_description(texte)
    assert titre.endswith("mot…")
    assert len(titre) <= TITLE_MAX_LENGTH


def test_sans_espace_coupe_franche():
    titre = title_from_description("a" * 300)
    assert titre == "a" * (TITLE_MAX_LENGTH - 1) + "…"


def test_espaces_finaux_retires_avant_les_points():
    texte = "a" * 150 + " " * 60 + "b" * 20
    titre = title_from_description(texte)
    assert titre == "a" * 150 + "…"


def test_mot_qui_finit_pile_a_la_coupe_est_garde():
    texte = "a" * (TITLE_MAX_LENGTH - 1) + " suite"
    assert title_from_description(texte) == "a" * (TITLE_MAX_LENGTH - 1) + "…"


def test_vide_ou_absent():
    assert title_from_description(None) is None
    assert title_from_description("   ") is None


def test_titre_fourni_trop_long_refuse():
    with pytest.raises(ValidationError):
        InterventionValidator.validate_title("a" * (TITLE_MAX_LENGTH + 1))


def test_titre_fourni_a_la_limite_accepte():
    InterventionValidator.validate_title("a" * TITLE_MAX_LENGTH)
    InterventionValidator.validate_title(None)


def test_modification_avec_titre_trop_long_refusee():
    from api.interventions.repo import InterventionRepository

    with pytest.raises(ValidationError):
        InterventionRepository().update("x", {"title": "a" * (TITLE_MAX_LENGTH + 1)})
