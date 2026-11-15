"""Étape 4 de l'audit centralisé (AUDC-41) : référentiels, administration, utilisateurs, accueil.

Décision 9 : tout est routinier (aucun motif envoyé, le middleware injecte ROUTINE d'après la
migration 0012), sauf la suppression qui exige un motif explicite. L'auteur est celui du jeton.
Écrits en xfail(strict) avant le code (AUDC-43 socle, AUDC-44 référentiels, AUDC-45
utilisateurs, droits, clés d'API, divers), tous retirés.
Les clés entières ou texte sont cherchées sous api.audits.entity_ids.entity_id_for (voir
tests/test_audit_etape4.py pour l'API supposée).
"""

import secrets

import pytest

from tests.integration.etape2_helpers import MOTIF, lignes_audit

pytestmark = pytest.mark.integration

MOTIF_SUPPRESSION = "DELETE_CREATED_BY_MISTAKE"


def _data(resp):
    corps = resp.json()
    return corps.get("data", corps) if isinstance(corps, dict) else corps


def _types(instance, entity_id):
    return [lg[1] for lg in lignes_audit(instance, str(entity_id))]


def _valeurs(instance, entity_id):
    """[(decision_type, old_value, new_value)] d'une entité, dans l'ordre d'écriture."""
    return instance.sql(
        "SELECT decision_type, old_value, new_value FROM audit_log "
        "WHERE entity_id = %s ORDER BY logged_at, decision_type",
        (str(entity_id),),
    )


def _texte_audit(instance, entity_id):
    """Tout le contenu d'audit d'une entité en un seul texte (recherche d'un secret)."""
    rows = instance.sql(
        "SELECT COALESCE(old_value::text, '') || COALESCE(new_value::text, '') "
        "FROM audit_log WHERE entity_id = %s",
        (str(entity_id),),
    )
    return "".join(r[0] for r in rows)


def _verifie_routinier(instance, admin, entity_id, entity_type, attendu=None):
    """Lignes écrites sans motif dans le corps : ROUTINE, auteur = jeton, pas système."""
    lignes = lignes_audit(instance, str(entity_id))
    assert lignes, f"aucune ligne d'audit pour {entity_type} {entity_id}"
    for type_entite, decision, code, systeme, auteur in lignes:
        assert type_entite == entity_type
        assert (code, systeme, auteur) == (MOTIF, False, admin.id), (decision, code)
    if attendu is not None:
        assert [lg[1] for lg in lignes][: len(attendu)] == attendu


def _verifie_modifications(instance, entity_id):
    modifs = [t for t in _types(instance, entity_id) if t != "created"]
    assert modifs and all(t.endswith("_changed") for t in modifs), modifs


def _verifie_cle(instance, entity_id, champ, cle):
    """La clé d'origine (entière ou texte) figure dans chaque valeur écrite sous l'uuid5."""
    lignes = _valeurs(instance, entity_id)
    assert lignes, "aucune ligne sous l'uuid5 attendu"
    for decision, ancienne, nouvelle in lignes:
        valeur = nouvelle if decision == "created" else ancienne
        assert valeur and valeur.get(champ) == cle, (decision, valeur)


def _supprime(client, admin, chemin, existe, instance, entity_id, status=200):
    """Sans motif : 400 et rien supprimé ; avec le motif : ligne `deleted` portant l'état avant."""
    sans_motif = client.request("DELETE", chemin, headers=admin.headers)
    assert sans_motif.status_code == 400, sans_motif.text
    assert existe()
    assert "deleted" not in _types(instance, entity_id)

    resp = client.request(
        "DELETE", chemin, headers=admin.headers, json={"reason_code": MOTIF_SUPPRESSION}
    )
    assert resp.status_code == status, resp.text
    (ligne,) = instance.sql(
        "SELECT r.code, l.changed_by::text, l.old_value FROM audit_log l "
        "JOIN audit_reason_code r ON r.id = l.reason_code_id "
        "WHERE l.entity_id = %s AND l.decision_type = 'deleted'",
        (str(entity_id),),
    )
    assert ligne[:2] == (MOTIF_SUPPRESSION, admin.id)
    assert ligne[2], "l'état avant la suppression doit être conservé"


def _creer_utilisateur(client, admin, role="TECH"):
    suffixe = secrets.token_hex(4)
    mot_de_passe = f"Pw1-{secrets.token_hex(8)}"
    resp = client.post(
        "/admin/users",
        headers=admin.headers,
        json={
            "email": f"e4-{suffixe}@example.org",
            "password": mot_de_passe,
            "first_name": "Étape",
            "initial": suffixe[:3].upper(),
            "role_code": role,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"], mot_de_passe


def _empreinte(instance, table, ligne_id, colonne):
    return instance.sql(f"SELECT {colonne} FROM {table} WHERE id = %s", (ligne_id,))[0][0]


def _role_id(instance, code):
    return instance.sql("SELECT id::text FROM tunnel_role WHERE code = %s", (code,))[0][0]


# ── Secrets : jamais d'empreinte lisible dans audit_log (AUDC-43, AUDC-45) ──


def test_creation_d_utilisateur_ne_laisse_pas_l_empreinte_du_mot_de_passe(instance, client, admin):
    user_id, mot_de_passe = _creer_utilisateur(client, admin)
    empreinte = _empreinte(instance, "tunnel_user", user_id, "password_hash")

    lignes = [lg for lg in _valeurs(instance, user_id) if lg[0] == "created"]
    assert len(lignes) == 1, "la ligne de décision doit exister"
    assert lignes[0][2]["password_hash"] != empreinte, "valeur masquée, clé conservée"
    texte = _texte_audit(instance, user_id)
    assert empreinte not in texte and mot_de_passe not in texte


def test_reinitialisation_de_mot_de_passe_trace_sans_empreinte_ni_mot_de_passe(
    instance, client, admin
):
    user_id, _ = _creer_utilisateur(client, admin)
    avant = _empreinte(instance, "tunnel_user", user_id, "password_hash")

    resp = client.post(f"/admin/users/{user_id}/reset-password", headers=admin.headers)
    assert resp.status_code == 200, resp.text
    provisoire = resp.json()["temporary_password"]
    apres = _empreinte(instance, "tunnel_user", user_id, "password_hash")
    assert avant != apres

    assert "password_hash_changed" in _types(instance, user_id), "la décision reste visible"
    texte = _texte_audit(instance, user_id)
    assert avant not in texte and apres not in texte and provisoire not in texte
    _verifie_routinier(instance, admin, user_id, "user")


def test_suppression_d_utilisateur_ne_laisse_pas_l_empreinte(instance, client, admin):
    user_id, _ = _creer_utilisateur(client, admin)
    empreinte = _empreinte(instance, "tunnel_user", user_id, "password_hash")

    _supprime(
        client,
        admin,
        f"/admin/users/{user_id}",
        # Suppression logique : la ligne reste, désactivée.
        lambda: instance.sql("SELECT 1 FROM tunnel_user WHERE id = %s AND is_active", (user_id,)),
        instance,
        user_id,
    )
    assert empreinte not in _texte_audit(instance, user_id)


def test_changement_de_son_mot_de_passe_trace_par_l_utilisateur_sans_empreinte(
    instance, client, make_user
):
    tech = make_user("TECH")
    avant = _empreinte(instance, "tunnel_user", tech.id, "password_hash")
    nouveau = f"Nouveau1-{secrets.token_hex(6)}"

    resp = client.post(
        "/users/me/password",
        headers=tech.headers,
        json={"current_password": tech.password, "new_password": nouveau},
    )
    assert resp.status_code == 200, resp.text
    apres = _empreinte(instance, "tunnel_user", tech.id, "password_hash")

    lignes = [lg for lg in lignes_audit(instance, tech.id) if lg[1] == "password_hash_changed"]
    assert len(lignes) == 1
    assert (lignes[0][2], lignes[0][4]) == (MOTIF, tech.id), "auteur = jeton, motif routinier"
    texte = _texte_audit(instance, tech.id)
    assert avant not in texte and apres not in texte and nouveau not in texte


def test_cle_d_api_creee_puis_supprimee_sans_empreinte_ni_secret(instance, client, admin):
    resp = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"E4-{secrets.token_hex(3)}"}
    )
    assert resp.status_code == 201, resp.text
    cle = resp.json()
    empreinte = _empreinte(instance, "api_key", cle["id"], "key_hash")

    (creation,) = [lg for lg in _valeurs(instance, cle["id"]) if lg[0] == "created"]
    assert creation[2]["key_hash"] != empreinte, "valeur masquée, clé conservée"
    _verifie_routinier(instance, admin, cle["id"], "api_key", ["created"])

    _supprime(
        client,
        admin,
        f"/api-keys/{cle['id']}",
        lambda: instance.sql("SELECT 1 FROM api_key WHERE id = %s", (cle["id"],)),
        instance,
        cle["id"],
        status=204,
    )
    texte = _texte_audit(instance, cle["id"])
    assert empreinte not in texte and cle["secret"] not in texte


# ── Clés entières ou texte : uuid5 par entité (AUDC-43, AUDC-44) ────────────


def test_type_d_intervention_trace_sous_son_uuid5(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    resp = client.post(
        "/admin/intervention-types",
        headers=admin.headers,
        json={"code": f"T{secrets.token_hex(3)}"[:10], "label": "Type étape 4"},
    )
    assert resp.status_code == 201, resp.text
    type_id = resp.json()["id"]
    audit_id = entity_id_for("intervention_type", type_id)

    resp = client.patch(
        f"/admin/intervention-types/{type_id}", headers=admin.headers, json={"label": "Renommé"}
    )
    assert resp.status_code == 200, resp.text
    resp = client.patch(
        f"/admin/intervention-types/{type_id}/active",
        headers=admin.headers,
        json={"is_active": False},
    )
    assert resp.status_code == 200, resp.text

    _verifie_routinier(instance, admin, audit_id, "intervention_type", ["created"])
    assert set(_types(instance, audit_id)) == {"created", "label_changed", "is_active_changed"}
    _verifie_cle(instance, audit_id, "id", type_id)


def test_categorie_d_action_modifiee_sous_son_uuid5(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    categorie = instance.sql(
        "INSERT INTO action_category (name, code) VALUES ('Catégorie étape 4', %s) RETURNING id",
        (f"C4-{secrets.token_hex(3)}",),
    )[0][0]
    resp = client.patch(
        f"/admin/action-categories/{categorie}",
        headers=admin.headers,
        json={"label": "Catégorie renommée"},
    )
    assert resp.status_code == 200, resp.text

    audit_id = entity_id_for("action_category", categorie)
    _verifie_routinier(instance, admin, audit_id, "action_category")
    _verifie_modifications(instance, audit_id)
    _verifie_cle(instance, audit_id, "id", categorie)


def test_sous_categorie_d_action_creee_et_modifiee_sous_son_uuid5(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    categorie = instance.sql(
        "INSERT INTO action_category (name, code) VALUES ('Parent étape 4', %s) RETURNING id",
        (f"P4-{secrets.token_hex(3)}",),
    )[0][0]
    resp = client.post(
        "/admin/action-subcategories",
        headers=admin.headers,
        json={
            "code": f"S4-{secrets.token_hex(3)}",
            "label": "Sous-catégorie",
            "category_id": categorie,
        },
    )
    assert resp.status_code == 201, resp.text
    sous_id = resp.json()["id"]
    resp = client.patch(
        f"/admin/action-subcategories/{sous_id}", headers=admin.headers, json={"label": "Autre"}
    )
    assert resp.status_code == 200, resp.text

    audit_id = entity_id_for("action_subcategory", sous_id)
    _verifie_routinier(instance, admin, audit_id, "action_subcategory", ["created"])
    assert len(_types(instance, audit_id)) >= 2
    _verifie_cle(instance, audit_id, "id", sous_id)


def test_statut_d_intervention_modifie_sous_l_uuid5_de_son_code(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    code = "attente_pieces"
    ancien = instance.sql("SELECT label FROM intervention_status_ref WHERE code = %s", (code,))[0][
        0
    ]
    audit_id = entity_id_for("intervention_status", code)
    avant = len(_types(instance, audit_id))

    # Le libellé de départ peut être NULL (seed) : la route refuse un label vide, le libellé
    # d'origine est donc rétabli en SQL, même si le test échoue.
    try:
        for libelle in ("Étape 4 (a)", "Étape 4 (b)"):
            resp = client.patch(
                f"/admin/intervention-statuses/{code}",
                headers=admin.headers,
                json={"label": libelle},
            )
            assert resp.status_code == 200, resp.text
    finally:
        instance.sql(
            "UPDATE intervention_status_ref SET label = %s WHERE code = %s", (ancien, code)
        )

    assert len(_types(instance, audit_id)) == avant + 2
    _verifie_routinier(instance, admin, audit_id, "intervention_status")
    _verifie_cle(instance, audit_id, "code", code)


def test_motif_d_audit_cree_et_modifie_sous_son_uuid5(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    resp = client.post(
        "/admin/audit-reasons",
        headers=admin.headers,
        json={"code": f"E4_{secrets.token_hex(3)}", "label": "Motif étape 4", "category": "manual"},
    )
    assert resp.status_code == 201, resp.text
    motif_id = resp.json()["id"]
    resp = client.patch(
        f"/admin/audit-reasons/{motif_id}", headers=admin.headers, json={"label": "Motif modifié"}
    )
    assert resp.status_code == 200, resp.text
    resp = client.patch(
        f"/admin/audit-reasons/{motif_id}/active", headers=admin.headers, json={"is_active": False}
    )
    assert resp.status_code == 200, resp.text

    audit_id = entity_id_for("audit_reason", motif_id)
    _verifie_routinier(instance, admin, audit_id, "audit_reason", ["created"])
    assert set(_types(instance, audit_id)) == {"created", "label_changed", "is_active_changed"}
    _verifie_cle(instance, audit_id, "id", motif_id)


def test_regle_d_audit_creee_et_modifiee_sous_son_uuid5(instance, client, admin):
    from api.audits.entity_ids import entity_id_for

    resp = client.post(
        "/admin/audit-rules",
        headers=admin.headers,
        json={
            "entity_type": "intervention",
            "field": f"champ_e4_{secrets.token_hex(3)}",
            "is_routine": True,
            "default_reason_code": MOTIF,
        },
    )
    assert resp.status_code == 201, resp.text
    regle_id = resp.json()["id"]
    resp = client.patch(
        f"/admin/audit-rules/{regle_id}", headers=admin.headers, json={"is_routine": False}
    )
    assert resp.status_code == 200, resp.text

    audit_id = entity_id_for("audit_rule", regle_id)
    _verifie_routinier(instance, admin, audit_id, "audit_rule", ["created"])
    assert "is_routine_changed" in _types(instance, audit_id)
    _verifie_cle(instance, audit_id, "id", regle_id)


# ── Utilisateurs (AUDC-45) ───────────────────────────────────────────────────


def test_utilisateur_cree_modifie_est_trace_par_l_admin(instance, client, admin):
    user_id, _ = _creer_utilisateur(client, admin)
    _verifie_routinier(instance, admin, user_id, "user", ["created"])

    resp = client.put(
        f"/admin/users/{user_id}", headers=admin.headers, json={"first_name": "Renommé"}
    )
    assert resp.status_code == 200, resp.text
    assert "first_name_changed" in _types(instance, user_id)
    _verifie_routinier(instance, admin, user_id, "user")


def test_changement_de_role_trace_et_conserve_security_log(instance, client, admin):
    user_id, _ = _creer_utilisateur(client, admin)
    resp = client.patch(
        f"/admin/users/{user_id}/role", headers=admin.headers, json={"role_code": "RESP"}
    )
    assert resp.status_code == 200, resp.text

    assert "role_id_changed" in _types(instance, user_id)
    _verifie_routinier(instance, admin, user_id, "user")
    assert instance.sql(
        "SELECT 1 FROM security_log WHERE event_type = 'ROLE_CHANGE' AND user_id = %s", (user_id,)
    ), "la trace de sécurité existante doit rester écrite"


def test_desactivation_trace_et_conserve_security_log(instance, client, admin):
    user_id, _ = _creer_utilisateur(client, admin)
    resp = client.patch(
        f"/admin/users/{user_id}/active", headers=admin.headers, json={"is_active": False}
    )
    assert resp.status_code == 200, resp.text

    assert "is_active_changed" in _types(instance, user_id)
    _verifie_routinier(instance, admin, user_id, "user")
    assert instance.sql(
        "SELECT 1 FROM security_log WHERE event_type = 'USER_DEACTIVATED' AND user_id = %s",
        (user_id,),
    )


def test_profil_modifie_par_son_titulaire_est_trace_sous_son_identite(instance, client, make_user):
    tech = make_user("TECH")
    resp = client.patch("/users/me/profile", headers=tech.headers, json={"first_name": "Autre"})
    assert resp.status_code == 200, resp.text

    lignes = [lg for lg in lignes_audit(instance, tech.id) if lg[1] == "first_name_changed"]
    assert len(lignes) == 1
    assert (lignes[0][0], lignes[0][2], lignes[0][4]) == ("user", MOTIF, tech.id)


# ── Droits et catalogue des endpoints (AUDC-45) ──────────────────────────────


def test_changement_de_droit_trace_et_conserve_permission_audit_log(instance, client, admin):
    permission_id, role_id, avant = instance.sql(
        "SELECT tp.id::text, tp.role_id::text, tp.allowed FROM tunnel_permission tp "
        "JOIN tunnel_role tr ON tr.id = tp.role_id "
        "JOIN tunnel_endpoint te ON te.id = tp.endpoint_id "
        "WHERE tr.code = 'ACHETEUR' AND te.method = 'GET' AND te.path = '/services'"
    )[0]
    try:
        resp = client.patch(
            f"/admin/permissions/{permission_id}",
            headers=admin.headers,
            json={"allowed": not avant},
        )
        assert resp.status_code == 200, resp.text

        assert "allowed_changed" in _types(instance, permission_id)
        _verifie_routinier(instance, admin, permission_id, "permission")
        assert instance.sql(
            "SELECT 1 FROM permission_audit_log WHERE role_id = %s AND changed_by = %s "
            "AND new_allowed = %s",
            (role_id, admin.id, not avant),
        ), "la trace de droits existante doit rester écrite"
    finally:
        client.patch(
            f"/admin/permissions/{permission_id}", headers=admin.headers, json={"allowed": avant}
        )


def test_description_d_endpoint_modifiee_est_tracee(instance, client, admin):
    endpoint_id = instance.sql(
        "SELECT id::text FROM tunnel_endpoint WHERE method = 'GET' AND path = '/services'"
    )[0][0]
    resp = client.patch(
        f"/admin/endpoints/{endpoint_id}",
        headers=admin.headers,
        json={"description": f"Étape 4 {secrets.token_hex(3)}"},
    )
    assert resp.status_code == 200, resp.text

    assert "description_changed" in _types(instance, endpoint_id)
    _verifie_routinier(instance, admin, endpoint_id, "endpoint")


# ── Clés d'API, sécurité réseau et courriel (AUDC-45) ────────────────────────


def test_cle_d_api_desactivee_est_tracee(instance, client, admin):
    resp = client.post(
        "/api-keys", headers=admin.headers, json={"name": f"E4-{secrets.token_hex(3)}"}
    )
    assert resp.status_code == 201, resp.text
    cle_id = resp.json()["id"]
    resp = client.patch(f"/api-keys/{cle_id}", headers=admin.headers, json={"is_active": False})
    assert resp.status_code == 200, resp.text

    assert "is_active_changed" in _types(instance, cle_id)
    _verifie_routinier(instance, admin, cle_id, "api_key")


@pytest.fixture
def ip_de_test(instance):
    """IP de documentation (RFC 5737) ; retirée de la liste en fin de test, même en échec."""
    ip = f"203.0.113.{secrets.randbelow(250) + 1}"
    yield ip
    instance.sql("DELETE FROM ip_blocklist WHERE ip_address = %s", (ip,))


@pytest.fixture
def domaine_de_test(instance):
    """Domaine de test retiré en fin de test, même en échec : une seule règle de domaine
    restante restreint la connexion de tous les comptes aux domaines listés."""
    domaine = f"e4-{secrets.token_hex(3)}.example.org"
    yield domaine
    instance.sql("DELETE FROM email_domain_rule WHERE domain = %s", (domaine,))


@pytest.fixture
def domaine_admin_couvert(instance):
    """Règle autorisant le domaine de l'administrateur de test, posée en SQL : depuis
    SUIT-01, une règle qui exclurait l'auteur de la connexion est refusée (409)."""
    domaine = instance.admin_email.split("@")[-1].lower()
    deja = instance.sql("SELECT 1 FROM email_domain_rule WHERE domain = %s", (domaine,))
    if not deja:
        instance.sql(
            "INSERT INTO email_domain_rule (domain, allowed) VALUES (%s, true)", (domaine,)
        )
    yield domaine
    if not deja:
        instance.sql("DELETE FROM email_domain_rule WHERE domain = %s", (domaine,))


def test_blocage_d_ip_cree_puis_remplace_ne_fausse_pas_la_creation(
    instance, client, admin, ip_de_test
):
    ip = ip_de_test
    resp = client.post("/admin/ip-blocklist", headers=admin.headers, json={"ip_address": ip})
    assert resp.status_code == 201, resp.text
    bloc_id = resp.json()["id"]
    _verifie_routinier(instance, admin, bloc_id, "ip_block", ["created"])

    # Même IP : upsert sur une ligne existante, ce n'est pas une seconde création.
    resp = client.post(
        "/admin/ip-blocklist", headers=admin.headers, json={"ip_address": ip, "reason": "Rebond"}
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["id"] == bloc_id
    assert _types(instance, bloc_id).count("created") == 1
    assert "reason_changed" in _types(instance, bloc_id)

    _supprime(
        client,
        admin,
        f"/admin/ip-blocklist/{bloc_id}",
        lambda: instance.sql("SELECT 1 FROM ip_blocklist WHERE id = %s", (bloc_id,)),
        instance,
        bloc_id,
    )


def test_regle_de_domaine_creee_puis_remplacee_ne_fausse_pas_la_creation(
    instance, client, admin, domaine_admin_couvert, domaine_de_test
):
    domaine = domaine_de_test
    resp = client.post(
        "/admin/email-domain-rules",
        headers=admin.headers,
        json={"domain": domaine, "allowed": True},
    )
    assert resp.status_code == 201, resp.text
    regle_id = resp.json()["id"]
    _verifie_routinier(instance, admin, regle_id, "email_domain_rule", ["created"])

    resp = client.post(
        "/admin/email-domain-rules",
        headers=admin.headers,
        json={"domain": domaine, "allowed": False},
    )
    assert resp.status_code == 201, resp.text
    assert _types(instance, regle_id).count("created") == 1
    assert "allowed_changed" in _types(instance, regle_id)

    _supprime(
        client,
        admin,
        f"/admin/email-domain-rules/{regle_id}",
        lambda: instance.sql("SELECT 1 FROM email_domain_rule WHERE id = %s", (regle_id,)),
        instance,
        regle_id,
    )


# ── Classes, services, accueil (AUDC-45) ─────────────────────────────────────


def test_classe_d_equipement_creee_modifiee_supprimee(instance, client, admin):
    resp = client.post(
        "/equipement-class",
        headers=admin.headers,
        json={"code": f"E4-{secrets.token_hex(3)}", "label": "Classe étape 4"},
    )
    assert resp.status_code == 201, resp.text
    classe_id = _data(resp)["id"]
    _verifie_routinier(instance, admin, classe_id, "equipement_class", ["created"])

    resp = client.patch(
        f"/equipement-class/{classe_id}", headers=admin.headers, json={"label": "Renommée"}
    )
    assert resp.status_code == 200, resp.text
    assert "label_changed" in _types(instance, classe_id)

    _supprime(
        client,
        admin,
        f"/equipement-class/{classe_id}",
        lambda: instance.sql("SELECT 1 FROM equipement_class WHERE id = %s", (classe_id,)),
        instance,
        classe_id,
        status=204,
    )


def test_service_cree_et_modifie_est_trace(instance, client, admin):
    resp = client.post(
        "/services",
        headers=admin.headers,
        json={"code": f"E4{secrets.token_hex(3)}", "label": "Service étape 4"},
    )
    assert resp.status_code == 201, resp.text
    service_id = _data(resp)["id"]
    _verifie_routinier(instance, admin, service_id, "service", ["created"])

    resp = client.patch(
        f"/services/{service_id}", headers=admin.headers, json={"label": "Service renommé"}
    )
    assert resp.status_code == 200, resp.text
    assert "label_changed" in _types(instance, service_id)
    _verifie_routinier(instance, admin, service_id, "service")


@pytest.fixture
def vue_acheteur_restauree(instance):
    """Remet la vue d'accueil d'ACHETEUR dans son état d'origine, même si le test échoue."""
    role_id = _role_id(instance, "ACHETEUR")
    avant = instance.sql("SELECT home_view FROM role_home_view WHERE role_id = %s", (role_id,))
    yield role_id
    if avant:
        instance.sql(
            "INSERT INTO role_home_view (role_id, home_view) VALUES (%s, %s) "
            "ON CONFLICT (role_id) DO UPDATE SET home_view = EXCLUDED.home_view",
            (role_id, avant[0][0]),
        )
    else:
        instance.sql("DELETE FROM role_home_view WHERE role_id = %s", (role_id,))


def test_vue_d_accueil_tracee_sous_l_id_de_la_ligne_pas_celui_du_role(
    instance, client, admin, vue_acheteur_restauree
):
    role_id = vue_acheteur_restauree
    chemin = f"/home-view/admin/assignments/{role_id}"
    # Le bootstrap donne déjà « acheteur » à ACHETEUR : la première valeur doit en différer.
    resp = client.put(chemin, headers=admin.headers, json={"home_view": "direction_technique"})
    assert resp.status_code == 200, resp.text
    ligne_id = instance.sql("SELECT id::text FROM role_home_view WHERE role_id = %s", (role_id,))[
        0
    ][0]
    assert ligne_id != role_id
    assert lignes_audit(instance, role_id) == [], "le chemin porte role_id, pas l'entité"
    assert "created" in _types(instance, ligne_id) or "home_view_changed" in _types(
        instance, ligne_id
    )

    resp = client.put(chemin, headers=admin.headers, json={"home_view": "technicien"})
    assert resp.status_code == 200, resp.text
    assert "home_view_changed" in _types(instance, ligne_id)
    _verifie_routinier(instance, admin, ligne_id, "role_home_view")

    _supprime(
        client,
        admin,
        chemin,
        lambda: instance.sql("SELECT 1 FROM role_home_view WHERE id = %s", (ligne_id,)),
        instance,
        ligne_id,
        status=204,
    )
