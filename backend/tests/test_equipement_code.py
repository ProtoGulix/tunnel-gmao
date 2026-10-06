"""Code d'équipement calculé par l'API quand le client n'en fournit pas.

Sur une installation neuve il n'existe aucune classe d'équipement : le front ne
peut pas générer le code et la création échouait (machine.code est NOT NULL).
"""

from api.equipements.validators import build_equipement_code


def test_meme_regle_que_le_front_classe_et_numero_sur_trois_chiffres():
    assert build_equipement_code("ALM", "7", existing_codes=[]) == "ALM007"


def test_sans_classe_prend_le_prochain_code_eq_libre():
    assert build_equipement_code(None, None, existing_codes=["EQ001", "EQ003", "ALM001"]) == "EQ004"


def test_sans_classe_ni_existant_commence_a_eq001():
    assert build_equipement_code(None, "12", existing_codes=[]) == "EQ001"


def test_un_numero_vide_ne_compte_pas():
    assert build_equipement_code("ALM", "  ", existing_codes=[]) == "EQ001"
