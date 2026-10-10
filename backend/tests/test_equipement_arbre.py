"""Intégrité de l'arbre des équipements (ADR 0011, décisions 2.2 et 3.4), sans base."""

import pytest

from api.equipements.repo import EquipementRepository
from api.equipements.validators import (
    MAX_TREE_DEPTH,
    validate_attachment,
    validate_children_exist,
    validate_deletable,
)
from api.errors.exceptions import ValidationError


def attach(equipement_id="E", parent_id="P", **kw):
    faits = dict(parent_exists=True, parent_depth=1, subtree_ids={"E"}, subtree_height=1)
    faits.update(kw)
    validate_attachment(equipement_id, parent_id, **faits)


def test_rattachement_simple_accepte():
    attach()


def test_refuse_le_rattachement_a_soi_meme():
    with pytest.raises(ValidationError, match="lui-même"):
        attach(parent_id="E")


def test_refuse_un_parent_inexistant():
    with pytest.raises(ValidationError, match="n'existe pas"):
        attach(parent_exists=False, parent_depth=0)


def test_refuse_un_cycle_le_parent_est_un_descendant():
    with pytest.raises(ValidationError, match="boucle"):
        attach(subtree_ids={"E", "F", "P"}, subtree_height=3)


def test_accepte_un_parent_hors_du_sous_arbre():
    attach(subtree_ids={"E", "F"}, subtree_height=2)


def test_profondeur_4_acceptee_feuille_sous_un_parent_de_niveau_3():
    attach(parent_depth=3, subtree_height=1)  # 3 + 1 = 4


def test_profondeur_5_refusee_feuille_sous_un_parent_de_niveau_4():
    with pytest.raises(ValidationError, match="4 niveaux"):
        attach(parent_depth=4, subtree_height=1)


def test_la_hauteur_du_sous_arbre_deplace_compte():
    attach(parent_depth=2, subtree_height=2)  # 2 + 2 = 4
    with pytest.raises(ValidationError, match="4 niveaux"):
        attach(parent_depth=2, subtree_height=3)  # 5


def test_creation_sous_un_parent_de_niveau_3_acceptee_niveau_4_refusee():
    validate_attachment(
        None, "P", parent_exists=True, parent_depth=3, subtree_ids=set(), subtree_height=1
    )
    with pytest.raises(ValidationError):
        validate_attachment(
            None, "P", parent_exists=True, parent_depth=MAX_TREE_DEPTH,
            subtree_ids=set(), subtree_height=1,
        )  # fmt: skip


def test_suppression_refusee_avec_des_filles_acceptee_sans():
    validate_deletable(0)
    with pytest.raises(ValidationError, match="2 sous-équipement"):
        validate_deletable(2)


def test_enfants_inexistants_refuses():
    validate_children_exist([])
    with pytest.raises(ValidationError, match="inexistant"):
        validate_children_exist(["x"])


# --- Câblage du repo avec un curseur scripté (le SQL récursif lui-même relève des
# tests d'intégration) ---------------------------------------------------------------


class FakeCursor:
    """Rejoue des réponses dans l'ordre des execute et garde les requêtes écrites."""

    def __init__(self, answers):
        self.answers = list(answers)
        self.writes = []
        self._current = None

    def execute(self, query, params=None):
        if query.lstrip().upper().startswith("UPDATE"):
            self.writes.append(params)
        elif "pg_advisory_xact_lock" in query:
            self.locks = getattr(self, "locks", 0) + 1  # verrou de l'arbre, sans réponse
        else:
            self._current = self.answers.pop(0)

    def fetchone(self):
        return self._current

    def fetchall(self):
        return self._current


def test_assign_children_refuse_un_enfant_inexistant():
    cur = FakeCursor([None])
    with pytest.raises(ValidationError, match="inexistant"):
        EquipementRepository()._assign_children(cur, "P", ["c1"])
    assert cur.writes == []


def test_assign_children_ignore_un_enfant_deja_rattache():
    cur = FakeCursor([("P",)])
    EquipementRepository()._assign_children(cur, "P", ["c1"])
    assert cur.writes == []


def test_assign_children_refuse_un_cycle_sans_rien_ecrire():
    # enfant c1 (parent actuel null) ; parent P existe, niveau 1 ; sous-arbre de c1 contient P
    cur = FakeCursor([(None,), (1,), (1,), [("c1", 1), ("P", 2)]])
    with pytest.raises(ValidationError, match="boucle"):
        EquipementRepository()._assign_children(cur, "P", ["c1"])
    assert cur.writes == []


def test_assign_children_rattache_quand_tout_est_valide():
    cur = FakeCursor([(None,), (1,), (1,), [("c1", 1)]])
    EquipementRepository()._assign_children(cur, "P", ["c1"])
    assert cur.writes == [("P", "c1")]
