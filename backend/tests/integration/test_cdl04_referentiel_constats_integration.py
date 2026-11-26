"""Administration du référentiel des constats (CDL-04, ADR 0045) : droits, règles, audit."""

import secrets
import uuid

import pytest

from api.audits.entity_ids import entity_id_for

pytestmark = pytest.mark.integration


@pytest.fixture(autouse=True)
def _nettoyage_du_referentiel(instance):
    """Retire choix et questions créés par les tests (codes T + 6 hex) : base partagée."""
    yield
    instance.sql("DELETE FROM constat_choice WHERE code ~ '^T[0-9A-F]{6}$'")
    instance.sql("DELETE FROM constat_question WHERE code ~ '^T[0-9A-F]{6}$'")


def _data(r):
    body = r.json()
    return body.get("data", body) if isinstance(body, dict) else body


def _questions(client, admin):
    r = client.get("/admin/constat-questions", headers=admin.headers)
    assert r.status_code == 200, r.text
    return {q["code"]: q for q in _data(r)}


def _code():
    return f"T{secrets.token_hex(3)}".upper()


def _nouveau_choix(client, admin, question_id, **extra):
    corps = {"question_id": question_id, "code": _code(), "label": "Nouveau", **extra}
    return client.post("/admin/constat-choices", headers=admin.headers, json=corps), corps


def test_liste_des_questions_avec_tous_les_choix(client, admin):
    questions = _questions(client, admin)
    lever = questions["LEVER"]
    codes = {c["code"] for c in lever["choices"]}
    assert {"TASK", "PROJECT", "NOTHING"} <= codes
    task = next(c for c in lever["choices"] if c["code"] == "TASK")
    assert task["creates_request"] is True
    assert "is_exclusive" in task and "suggested_type_inter" in task


@pytest.mark.parametrize("role", ["RESP", "ADMIN"])
def test_resp_et_admin_ecrivent_le_referentiel(client, make_user, instance, role):
    user = make_user(role)
    question_id = instance.sql("SELECT id FROM constat_question WHERE code = 'LEVER'")[0][0]
    r, corps = _nouveau_choix(client, user, question_id)
    assert r.status_code == 201, r.text
    choice_id = r.json()["id"]
    assert (
        client.patch(
            f"/admin/constat-choices/{choice_id}", headers=user.headers, json={"label": "Autre"}
        ).status_code
        == 200
    )
    assert (
        client.patch(
            f"/admin/constat-questions/{question_id}", headers=user.headers, json={"label": "Q ?"}
        ).status_code
        == 200
    )
    instance.sql("UPDATE constat_question SET label = label WHERE id = %s", (question_id,))


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR"])
@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("PATCH", "/admin/constat-questions/1", {"label": "Non"}),
        ("POST", "/admin/constat-choices", {"question_id": 1, "code": "NOPE", "label": "Non"}),
        ("PATCH", "/admin/constat-choices/1", {"label": "Non"}),
    ],
)
def test_ecriture_refusee_hors_resp_et_admin(client, make_user, role, method, path, body):
    user = make_user(role)
    r = client.request(method, path, headers=user.headers, json=body)
    assert r.status_code in (401, 403), r.text


@pytest.mark.parametrize(
    ("method", "path", "body"),
    [
        ("PATCH", "/admin/constat-questions/1", {"label": "Non"}),
        ("POST", "/admin/constat-choices", {"question_id": 1, "code": "NOPE", "label": "Non"}),
        ("PATCH", "/admin/constat-choices/1", {"label": "Non"}),
    ],
)
def test_ecriture_refusee_a_une_cle_mcp(client, admin, method, path, body):
    cle = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"it-{secrets.token_hex(3)}"}
    )
    r = client.request(method, path, headers={"X-API-Key": cle.json()["secret"]}, json=body)
    assert r.status_code == 403, r.text


def test_lecture_refusee_a_un_technicien(client, make_user):
    tech = make_user("TECH")
    assert client.get("/admin/constat-questions", headers=tech.headers).status_code == 403


@pytest.mark.parametrize("code", ["a", "abc", "1ABC", "A", "A" * 51, "AB-C", ""])
def test_code_invalide_refuse(client, admin, instance, code):
    question_id = instance.sql("SELECT id FROM constat_question WHERE code = 'LEVER'")[0][0]
    r = client.post(
        "/admin/constat-choices",
        headers=admin.headers,
        json={"question_id": question_id, "code": code, "label": "X"},
    )
    assert r.status_code in (400, 422), r.text


def test_code_en_double_refuse_meme_sur_une_autre_question(client, admin, instance):
    questions = _questions(client, admin)
    autre = next(q for q in questions.values() if q["code"] != "LEVER")
    r = client.post(
        "/admin/constat-choices",
        headers=admin.headers,
        json={"question_id": autre["id"], "code": "TASK", "label": "Doublon"},
    )
    assert r.status_code == 400, r.text


def test_libelle_vide_et_type_inconnu_refuses(client, admin, instance):
    question_id = instance.sql("SELECT id FROM constat_question WHERE code = 'LEVER'")[0][0]
    vide, _ = _nouveau_choix(client, admin, question_id, label="  <b></b> ")
    assert vide.status_code == 400
    inconnu, _ = _nouveau_choix(client, admin, question_id, suggested_type_inter="ZZZZ")
    assert inconnu.status_code == 400


def test_ordre_en_dernier_et_null_efface_le_type(client, admin, instance):
    question_id = instance.sql("SELECT id FROM constat_question WHERE code = 'LEVER'")[0][0]
    type_code = instance.sql("SELECT code FROM intervention_type WHERE is_active LIMIT 1")[0][0]
    r, _ = _nouveau_choix(
        client, admin, question_id, suggested_type_inter=type_code, creates_request=True
    )
    choice_id = r.json()["id"]
    lever = _questions(client, admin)["LEVER"]
    cree = next(c for c in lever["choices"] if c["id"] == choice_id)
    assert cree["sort_order"] == max(c["sort_order"] for c in lever["choices"])
    assert cree["suggested_type_inter"] == type_code and cree["creates_request"] is True
    # Champ absent : le type reste ; null : il est effacé.
    client.patch(f"/admin/constat-choices/{choice_id}", headers=admin.headers, json={"label": "B"})
    assert instance.sql(
        "SELECT suggested_type_inter FROM constat_choice WHERE id = %s", (choice_id,)
    ) == [(type_code,)]
    r = client.patch(
        f"/admin/constat-choices/{choice_id}",
        headers=admin.headers,
        json={"suggested_type_inter": None},
    )
    assert r.status_code == 200, r.text
    assert instance.sql(
        "SELECT suggested_type_inter FROM constat_choice WHERE id = %s", (choice_id,)
    ) == [(None,)]


def test_type_inactif_refuse_en_modification(client, admin, instance):
    inactif = instance.sql("SELECT code FROM intervention_type WHERE NOT is_active LIMIT 1")
    if not inactif:
        pytest.skip("aucun type inactif dans la base de test")
    choice_id = instance.sql("SELECT id FROM constat_choice WHERE code = 'TASK'")[0][0]
    r = client.patch(
        f"/admin/constat-choices/{choice_id}",
        headers=admin.headers,
        json={"suggested_type_inter": inactif[0][0]},
    )
    assert r.status_code == 400


def test_dernier_choix_actif_non_desactivable(client, admin, instance):
    question_id = instance.sql(
        "INSERT INTO constat_question (code, label, sort_order) VALUES (%s, 'Q', 99) RETURNING id",
        (_code(),),
    )[0][0]
    try:
        a, _ = _nouveau_choix(client, admin, question_id)
        b, _ = _nouveau_choix(client, admin, question_id)
        id_a, id_b = a.json()["id"], b.json()["id"]
        off = {"is_active": False}
        premier = client.patch(f"/admin/constat-choices/{id_a}", headers=admin.headers, json=off)
        assert premier.status_code == 200, premier.text
        dernier = client.patch(f"/admin/constat-choices/{id_b}", headers=admin.headers, json=off)
        assert dernier.status_code == 400, dernier.text
    finally:
        # Référentiel de la base de test : ne rien laisser aux autres tests.
        instance.sql("DELETE FROM constat_choice WHERE question_id = %s", (question_id,))
        instance.sql("DELETE FROM constat_question WHERE id = %s", (question_id,))


def test_corps_vide_et_inconnus(client, admin):
    assert (
        client.patch("/admin/constat-choices/1", headers=admin.headers, json={}).status_code == 400
    )
    assert (
        client.patch(
            "/admin/constat-choices/999999", headers=admin.headers, json={"label": "X"}
        ).status_code
        == 404
    )
    assert (
        client.patch(
            "/admin/constat-questions/999999", headers=admin.headers, json={"label": "X"}
        ).status_code
        == 404
    )
    assert client.delete("/admin/constat-choices/1", headers=admin.headers).status_code in (
        404,
        405,
    )


def test_ajout_puis_modification_ecrivent_l_audit(client, admin, instance):
    question_id = instance.sql("SELECT id FROM constat_question WHERE code = 'LEVER'")[0][0]
    r, _ = _nouveau_choix(client, admin, question_id)
    choice_id = r.json()["id"]
    client.patch(
        f"/admin/constat-choices/{choice_id}",
        headers=admin.headers,
        json={"creates_request": True, "is_exclusive": True},
    )
    entity_id = entity_id_for("constat_choice", choice_id)
    lignes = instance.sql(
        "SELECT decision_type, changed_by::text FROM audit_log WHERE entity_id = %s",
        (str(entity_id),),
    )
    decisions = {d for d, _ in lignes}
    assert "created" in decisions and "creates_request_changed" in decisions
    assert {auteur for _, auteur in lignes} == {admin.id}
    assert uuid.UUID(str(entity_id))
