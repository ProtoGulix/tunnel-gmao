"""API de l'arbre des équipements (ADR 0011, décisions 2.3 et 2.4) : ancêtres, sous-arbre,
include_descendants sur le détail, la santé, les interventions, les demandes et le préventif."""

import pytest

pytestmark = pytest.mark.integration


def _data(r):
    assert r.status_code in (200, 201), r.text
    body = r.json()
    return body.get("data", body)


def _creer(client, admin, name, parent_id=None):
    body = {"name": name}
    if parent_id:
        body["parent_id"] = parent_id
    return _data(client.post("/equipements", json=body, headers=admin.headers))


def _raison(instance):
    return instance.sql("SELECT code FROM audit_reason_code WHERE is_active LIMIT 1")[0][0]


def _demande(client, admin, instance, machine_id):
    return _data(
        client.post(
            "/intervention-requests",
            json={
                "machine_id": machine_id,
                "demandeur_nom": "Atelier",
                "description": "Panne",
                "reason_code": _raison(instance),
            },
            headers=admin.headers,
        )
    )


def _intervention(client, admin, instance, machine_id, priority="normale"):
    demande = _demande(client, admin, instance, machine_id)
    return _data(
        client.post(
            "/interventions",
            json={
                "machine_id": machine_id,
                "type_inter": "CUR",
                "tech_id": admin.id,
                "title": "Dépannage",
                "priority": priority,
                "request_id": demande["id"],
                "reason_code": _raison(instance),
            },
            headers=admin.headers,
        )
    )


@pytest.fixture
def arbre(client, admin, instance):
    """ligne > presse > organe, ligne > four, et un équipement sans lien. Activité :
    une intervention urgente sur l'organe, une demande sur le four, une occurrence sur la presse."""
    ligne = _creer(client, admin, "Ligne A")
    presse = _creer(client, admin, "Presse A", ligne["id"])
    organe = _creer(client, admin, "Organe A", presse["id"])
    four = _creer(client, admin, "Four A", ligne["id"])
    seul = _creer(client, admin, "Seul A")
    inter = _intervention(client, admin, instance, organe["id"], "urgent")
    demande = _demande(client, admin, instance, four["id"])
    plan = instance.sql(
        "INSERT INTO preventive_plan (code, label, trigger_type, periodicity_days) "
        "VALUES (%s, 'Plan arbre', 'periodicity', 30) RETURNING id::text",
        (f"PLAN-{ligne['code']}",),
    )[0][0]
    instance.sql(
        "INSERT INTO preventive_occurrence (plan_id, machine_id, scheduled_date) "
        "VALUES (%s, %s, CURRENT_DATE)",
        (plan, presse["id"]),
    )
    return {
        "ligne": ligne,
        "presse": presse,
        "organe": organe,
        "four": four,
        "seul": seul,
        "inter": inter,
        "demande": demande,
    }


def _detail(client, admin, id_, **params):
    return _data(client.get(f"/equipements/{id_}", params=params, headers=admin.headers))


def test_detail_ancetres_et_descendants_count(client, admin, arbre):
    organe = _detail(client, admin, arbre["organe"]["id"])
    assert [a["id"] for a in organe["ancestors"]] == [arbre["ligne"]["id"], arbre["presse"]["id"]]
    assert set(organe["ancestors"][0]) == {"id", "code", "name"}
    assert organe["descendants_count"] == 0
    ligne = _detail(client, admin, arbre["ligne"]["id"])
    assert ligne["ancestors"] == []
    assert ligne["children_count"] == 2
    assert ligne["descendants_count"] == 3


def test_include_descendants_defaut_mere_et_force_false(client, admin, arbre):
    ligne_id = arbre["ligne"]["id"]
    defaut = _detail(client, admin, ligne_id)
    assert defaut["include_descendants"] is True
    assert defaut["interventions"]["total"] == 1
    # La demande du four et celle de l'intervention sur l'organe.
    assert arbre["demande"]["id"] in {r["id"] for r in defaut["open_requests"]}
    assert len(defaut["open_requests"]) == 2
    assert defaut["preventive_occurrences_summary"]["pending_count"] == 1

    force = _detail(client, admin, ligne_id, include_descendants="false")
    assert force["include_descendants"] is False
    assert force["interventions"]["total"] == 0
    assert force["open_requests"] is None
    assert force["preventive_occurrences_summary"]["pending_count"] == 0


def test_include_descendants_defaut_faux_sans_fille(client, admin, arbre):
    organe = _detail(client, admin, arbre["organe"]["id"])
    assert organe["include_descendants"] is False
    assert organe["interventions"]["total"] == 1


def test_sante_de_la_mere_est_celle_de_la_fille_la_plus_degradee(client, admin, arbre):
    code_organe = arbre["organe"]["code"]
    ligne = _detail(client, admin, arbre["ligne"]["id"])
    assert ligne["health"]["level"] == "critical"
    assert ligne["health"]["source"]["id"] == arbre["organe"]["id"]
    assert ligne["health"]["source"]["code"] == code_organe
    assert ligne["health"]["reason"].startswith(f"{code_organe} : ")

    propre = _detail(client, admin, arbre["ligne"]["id"], include_descendants="false")
    assert propre["health"]["level"] == "ok"
    assert propre["health"]["source"] is None

    # L'équipement le plus dégradé est lui-même : pas de source.
    organe = _detail(client, admin, arbre["organe"]["id"])
    assert organe["health"]["level"] == "critical" and organe["health"]["source"] is None


def test_route_health_meme_logique(client, admin, arbre):
    url = f"/equipements/{arbre['ligne']['id']}/health"
    h = _data(client.get(url, headers=admin.headers))
    assert h["level"] == "critical"
    assert h["source"]["id"] == arbre["organe"]["id"]
    assert h["reason"].startswith(f"{arbre['organe']['code']} : ")
    h = _data(client.get(url, params={"include_descendants": "false"}, headers=admin.headers))
    assert h["level"] == "ok" and h["source"] is None
    # Un équipement sans fille garde sa propre santé.
    h = _data(client.get(f"/equipements/{arbre['seul']['id']}/health", headers=admin.headers))
    assert h["source"] is None


def test_liste_subtree_of_roots_only_et_champs(client, admin, arbre):
    ligne_id = arbre["ligne"]["id"]
    r = client.get(
        "/equipements", params={"subtree_of": ligne_id, "limit": 500}, headers=admin.headers
    )
    assert r.status_code == 200, r.text
    corps = r.json()
    ids = {i["id"] for i in corps["items"]}
    assert ids == {arbre["presse"]["id"], arbre["organe"]["id"], arbre["four"]["id"]}
    assert corps["pagination"]["total"] == 3

    par_id = {i["id"]: i for i in corps["items"]}
    presse = par_id[arbre["presse"]["id"]]
    assert presse["children_count"] == 1
    assert presse["parent_id"] == ligne_id  # régression : parent_id n'est plus écrasé
    assert presse["parent"]["id"] == ligne_id
    organe = par_id[arbre["organe"]["id"]]
    assert [a["id"] for a in organe["ancestors"]] == [ligne_id, arbre["presse"]["id"]]
    assert organe["children_count"] == 0

    # Combiné à un filtre existant (recherche).
    r = client.get(
        "/equipements", params={"subtree_of": ligne_id, "search": "Four A"}, headers=admin.headers
    )
    assert {i["id"] for i in r.json()["items"]} == {arbre["four"]["id"]}

    roots = client.get(
        "/equipements", params={"roots_only": "true", "limit": 500}, headers=admin.headers
    )
    root_ids = {i["id"] for i in roots.json()["items"]}
    assert {ligne_id, arbre["seul"]["id"]} <= root_ids
    assert not root_ids & {arbre["presse"]["id"], arbre["organe"]["id"], arbre["four"]["id"]}
    assert roots.json()["pagination"]["total"] == len(root_ids) or len(root_ids) == 500


def test_liste_parametre_subtree_of_invalide(client, admin):
    r = client.get("/equipements", params={"subtree_of": "pas-un-uuid"}, headers=admin.headers)
    assert r.status_code == 422


def test_liste_inchangee_sans_les_nouveaux_parametres(client, admin, arbre):
    r = client.get(
        "/equipements", params={"select_mere": arbre["ligne"]["id"]}, headers=admin.headers
    )
    assert {i["id"] for i in r.json()["items"]} == {arbre["presse"]["id"], arbre["four"]["id"]}


def test_interventions_include_descendants(client, admin, arbre):
    ligne_id = arbre["ligne"]["id"]
    seul = client.get("/interventions", params={"equipement_id": ligne_id}, headers=admin.headers)
    assert seul.json()["pagination"]["total"] == 0
    avec = client.get(
        "/interventions",
        params={"equipement_id": ligne_id, "include_descendants": "true"},
        headers=admin.headers,
    )
    assert avec.status_code == 200, avec.text
    assert [i["id"] for i in avec.json()["items"]] == [arbre["inter"]["id"]]
    assert avec.json()["pagination"]["total"] == 1
    # Sans filtre équipement, le paramètre est ignoré.
    tout = client.get(
        "/interventions",
        params={"include_descendants": "true", "limit": 1000},
        headers=admin.headers,
    )
    assert tout.status_code == 200


def test_demandes_include_descendants(client, admin, arbre):
    ligne_id = arbre["ligne"]["id"]
    seul = client.get(
        "/intervention-requests", params={"machine_id": ligne_id}, headers=admin.headers
    )
    assert seul.json()["pagination"]["total"] == 0
    avec = client.get(
        "/intervention-requests",
        params={"machine_id": ligne_id, "include_descendants": "true", "limit": 500},
        headers=admin.headers,
    )
    assert avec.status_code == 200, avec.text
    corps = avec.json()
    assert {i["id"] for i in corps["items"]} == {
        arbre["demande"]["id"],
        _data_id(client, admin, arbre["inter"]),
    }
    assert corps["pagination"]["total"] == 2
    assert corps["facets"]["statut"]  # facettes présentes (elles ignorent machine_id)


def _data_id(client, admin, inter):
    """Identifiant de la demande liée à l'intervention."""
    detail = _data(client.get(f"/interventions/{inter['id']}", headers=admin.headers))
    return detail["request_id"] if "request_id" in detail else detail["request"]["id"]


def test_preventif_include_descendants(client, admin, arbre):
    ligne_id = arbre["ligne"]["id"]
    seul = client.get(
        "/preventive-occurrences", params={"machine_id": ligne_id}, headers=admin.headers
    )
    assert seul.json() == []
    avec = client.get(
        "/preventive-occurrences",
        params={"machine_id": ligne_id, "include_descendants": "true"},
        headers=admin.headers,
    )
    assert avec.status_code == 200, avec.text
    assert [o["machine_id"] for o in avec.json()] == [arbre["presse"]["id"]]


def test_sante_egalite_mere_fille_la_mere_gagne(client, admin, instance):
    mere = _creer(client, admin, "Mère égalité")
    fille = _creer(client, admin, "Fille égalité", mere["id"])
    _intervention(client, admin, instance, mere["id"], "urgent")
    _intervention(client, admin, instance, fille["id"], "urgent")
    detail = _detail(client, admin, mere["id"])
    assert detail["health"]["level"] == "critical"
    assert detail["health"]["source"] is None
    assert not detail["health"]["reason"].startswith(f"{fille['code']} : ")


def test_sante_egalite_entre_descendants_premier_code_gagne(client, admin, instance):
    mere = _creer(client, admin, "Mère deux filles")
    premiere = _creer(client, admin, "Fille 1", mere["id"])
    seconde = _creer(client, admin, "Fille 2", mere["id"])
    _intervention(client, admin, instance, seconde["id"], "urgent")
    _intervention(client, admin, instance, premiere["id"], "urgent")
    premier = min(premiere, seconde, key=lambda e: e["code"])
    health = _detail(client, admin, mere["id"])["health"]
    assert health["level"] == "critical"
    assert health["source"]["id"] == premier["id"]
    assert health["source"]["name"] == premier["name"]


def test_put_et_patch_agregent_les_descendants_de_la_mere(client, admin, arbre):
    ligne = arbre["ligne"]
    r = client.patch(
        f"/equipements/{ligne['id']}", json={"affectation": "Atelier B"}, headers=admin.headers
    )
    patch = _data(r)
    assert patch["include_descendants"] is True
    assert patch["descendants_count"] == 3
    assert patch["interventions"]["total"] == 1
    assert patch["health"]["level"] == "critical"
    r = client.put(
        f"/equipements/{ligne['id']}",
        json={"name": "Ligne A bis", "code": ligne["code"], "statut_id": patch["statut"]["id"]},
        headers=admin.headers,
    )
    put = _data(r)
    assert put["include_descendants"] is True
    assert put["health"]["source"]["id"] == arbre["organe"]["id"]


@pytest.mark.parametrize(
    "route, param, expected",
    # /intervention-requests type déjà machine_id en UUID : FastAPI répond 422 avant le repo.
    [("/interventions", "equipement_id", 400), ("/intervention-requests", "machine_id", 422)],
)
def test_identifiant_non_uuid_avec_et_sans_descendants(client, admin, route, param, expected):
    sans = client.get(route, params={param: "pas-un-uuid"}, headers=admin.headers)
    avec = client.get(
        route,
        params={param: "pas-un-uuid", "include_descendants": "true"},
        headers=admin.headers,
    )
    assert avec.status_code == sans.status_code
    assert avec.status_code == expected, avec.text


def _liste(client, admin, **params):
    r = client.get("/equipements", params=params, headers=admin.headers)
    assert r.status_code == 200, r.text
    return r.json()["items"]


def test_liste_sante_agregee_de_la_mere_avec_source(client, admin, arbre):
    ligne = next(
        i
        for i in _liste(client, admin, search="Ligne A", roots_only="true")
        if i["id"] == arbre["ligne"]["id"]
    )
    assert ligne["health"]["level"] == "critical"
    assert ligne["health"]["source"]["id"] == arbre["organe"]["id"]
    assert ligne["health"]["source"]["code"] == arbre["organe"]["code"]
    assert ligne["health"]["reason"].startswith(f"{arbre['organe']['code']} : ")
    detail = _detail(client, admin, arbre["ligne"]["id"])
    assert ligne["health"] == detail["health"]
    # Une feuille garde sa propre santé, sans source
    four = _liste(client, admin, search="Four A")[0]
    assert four["health"]["level"] == "warning"
    assert four["health"]["source"] is None


def test_liste_sort_code(client, admin, arbre):
    items = _liste(client, admin, subtree_of=arbre["ligne"]["id"], sort="code")
    codes = [i["code"] for i in items]
    assert len(codes) == 3
    assert codes == sorted(codes)


def test_liste_sort_sante_defaut_et_pagination(client, admin, arbre):
    rang = {"critical": 3, "warning": 2, "maintenance": 1, "ok": 0}
    params = {"subtree_of": arbre["ligne"]["id"]}
    defaut = _liste(client, admin, **params)  # défaut = health
    attendu = sorted(defaut, key=lambda i: (-rang[i["health"]["level"]], i["code"]))
    assert [i["id"] for i in defaut] == [i["id"] for i in attendu]
    assert [i["health"]["level"] for i in defaut] == ["critical", "critical", "warning"]
    assert defaut[2]["id"] == arbre["four"]["id"]
    assert [i["id"] for i in _liste(client, admin, sort="health", **params)] == [
        i["id"] for i in defaut
    ]

    page2 = _liste(client, admin, skip=1, limit=1, **params)
    assert [i["id"] for i in page2] == [defaut[1]["id"]]
    pages = [_liste(client, admin, skip=n, limit=2, **params) for n in (0, 2)]
    assert [i["id"] for p in pages for i in p] == [i["id"] for i in defaut]
    assert _liste(client, admin, skip=3, **params) == []


def test_liste_sort_invalide(client, admin):
    r = client.get("/equipements", params={"sort": "name"}, headers=admin.headers)
    assert r.status_code == 422
