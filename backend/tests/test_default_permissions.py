"""Matrice par défaut (ADR 0007, point 4) : un cas par règle et par rôle."""

import pytest

from db.default_permissions import Endpoint, default_allowed


def ep(method, path, module):
    return Endpoint("x:y", method, path, module)


# --- Lecture -------------------------------------------------------------------------


@pytest.mark.parametrize("role", ["RESP", "TECH", "ACHETEUR", "MCP"])
def test_tous_les_roles_lisent_le_metier(role):
    assert default_allowed(role, ep("GET", "/interventions", "interventions"))
    assert default_allowed(role, ep("GET", "/stock-items/{item_id}", "stock-items"))
    assert default_allowed(
        role, ep("GET", "/exports/interventions/{intervention_id}/pdf", "exports")
    )


@pytest.mark.parametrize("role", ["TECH", "ACHETEUR", "MCP"])
def test_admin_et_cles_api_fermes_a_la_lecture(role):
    assert not default_allowed(role, ep("GET", "/admin/users", "admin"))
    assert not default_allowed(role, ep("GET", "/admin/action-categories", "admin"))
    assert not default_allowed(role, ep("GET", "/api-keys", "api-keys"))


def test_resp_lit_les_referentiels_et_utilisateurs_d_admin():
    for path in ("/admin/users", "/admin/users/{user_id}", "/admin/action-categories"):
        assert default_allowed("RESP", ep("GET", path, "admin")), path
    assert default_allowed("RESP", ep("GET", "/admin/audit-rules/known-fields", "admin"))


def test_resp_ne_lit_pas_le_reste_de_admin():
    for path in (
        "/admin/roles",
        "/admin/roles/matrix",
        "/admin/endpoints",
        "/admin/security-logs",
        "/admin/ip-blocklist",
        "/admin/email-domain-rules",
        "/admin/settings/mail",
        "/admin/audit/permissions",
    ):
        assert not default_allowed("RESP", ep("GET", path, "admin")), path
    assert not default_allowed("RESP", ep("GET", "/api-keys", "api-keys"))


# --- ADMIN ---------------------------------------------------------------------------


def test_admin_a_tout():
    assert default_allowed("ADMIN", ep("DELETE", "/admin/users/{user_id}", "admin"))
    assert default_allowed("ADMIN", ep("POST", "/api-keys", "api-keys"))


# --- RESP ----------------------------------------------------------------------------


def test_resp_ecrit_tout_le_metier():
    assert default_allowed("RESP", ep("POST", "/interventions", "interventions"))
    assert default_allowed("RESP", ep("DELETE", "/equipements/{equipement_id}", "equipements"))
    assert default_allowed("RESP", ep("POST", "/preventive-plans", "Preventive Plans"))
    assert default_allowed("RESP", ep("POST", "/services", "services"))
    assert default_allowed("RESP", ep("POST", "/supplier-orders", "supplier-orders"))


def test_resp_ecrit_les_referentiels_d_admin_ouverts_dans_le_code():
    assert default_allowed("RESP", ep("POST", "/admin/intervention-types", "admin"))
    assert default_allowed("RESP", ep("PATCH", "/admin/action-categories/{category_id}", "admin"))


def test_resp_ne_peut_pas_ecrire_users_roles_securite_cles():
    for method, path, module in (
        ("POST", "/admin/users", "admin"),
        ("PUT", "/admin/users/{user_id}", "admin"),
        ("PATCH", "/admin/users/{user_id}/role", "admin"),
        ("DELETE", "/admin/users/{user_id}", "admin"),
        ("PATCH", "/admin/permissions/{permission_id}", "admin"),
        ("PATCH", "/admin/endpoints/{endpoint_id}", "admin"),
        ("POST", "/admin/endpoints/sync", "admin"),
        ("POST", "/admin/ip-blocklist", "admin"),
        ("DELETE", "/admin/email-domain-rules/{rule_id}", "admin"),
        ("POST", "/admin/settings/mail/test", "admin"),
        ("POST", "/api-keys", "api-keys"),
        ("DELETE", "/api-keys/{key_id}", "api-keys"),
    ):
        assert not default_allowed("RESP", ep(method, path, module)), (method, path)


# --- TECH ----------------------------------------------------------------------------


def test_tech_cree_une_demande_d_intervention_sans_la_modifier_ni_la_supprimer():
    assert default_allowed("TECH", ep("POST", "/intervention-requests", "intervention-requests"))
    for method, path in (
        ("DELETE", "/intervention-requests/{request_id}"),
        ("POST", "/intervention-requests/{request_id}/transition"),
        ("POST", "/intervention-requests/repair"),
    ):
        assert not default_allowed("TECH", ep(method, path, "intervention-requests")), path


def test_tech_modifie_une_intervention_sans_la_creer_ni_la_supprimer():
    assert default_allowed("TECH", ep("PUT", "/interventions/{intervention_id}", "interventions"))
    assert not default_allowed("TECH", ep("POST", "/interventions", "interventions"))
    assert not default_allowed(
        "TECH", ep("DELETE", "/interventions/{intervention_id}", "interventions")
    )


def test_tech_ecrit_actions_taches_et_journal_de_statut():
    for method in ("POST", "PATCH", "DELETE"):
        assert default_allowed("TECH", ep(method, "/intervention-actions", "intervention-actions"))
        assert default_allowed("TECH", ep(method, "/intervention-tasks", "Intervention Tasks"))
    assert default_allowed(
        "TECH", ep("POST", "/intervention-status-log", "intervention-status-log")
    )


def test_tech_cree_une_demande_d_achat_seulement():
    assert default_allowed("TECH", ep("POST", "/purchase-requests", "purchase-requests"))
    for method, path in (
        ("PUT", "/purchase-requests/{request_id}"),
        ("DELETE", "/purchase-requests/{request_id}"),
        ("POST", "/purchase-requests/dispatch"),
        ("POST", "/purchase-requests/import"),
    ):
        assert not default_allowed("TECH", ep(method, path, "purchase-requests")), path


def test_tech_n_ecrit_ni_stock_ni_fournisseurs_ni_referentiels():
    assert not default_allowed("TECH", ep("POST", "/suppliers", "suppliers"))
    assert not default_allowed("TECH", ep("PUT", "/stock-items/{item_id}", "stock-items"))
    assert not default_allowed("TECH", ep("POST", "/equipements", "equipements"))
    assert not default_allowed("TECH", ep("POST", "/preventive-plans", "Preventive Plans"))


# --- ACHETEUR ------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path,module",
    [
        ("/purchase-requests/dispatch", "purchase-requests"),
        ("/supplier-orders", "supplier-orders"),
        ("/supplier-order-lines/{line_id}", "supplier-order-lines"),
        ("/suppliers", "suppliers"),
        ("/parts/manufacturer-refs/{mfr_ref_id}", "parts"),
        ("/stock-items", "stock-items"),
        ("/stock-families", "stock-families"),
        ("/stock-sub-families/{family_code}", "stock-sub-families"),
        ("/manufacturer-items", "manufacturer-items"),
        ("/stock-item-suppliers", "stock-item-suppliers"),
        ("/part-templates", "part-templates"),
    ],
)
def test_acheteur_ecrit_achats_stock_et_references(path, module):
    assert default_allowed("ACHETEUR", ep("POST", path, module))


def test_acheteur_n_ecrit_rien_sur_interventions_actions_taches_preventif():
    for method, path, module in (
        ("POST", "/interventions", "interventions"),
        ("PUT", "/interventions/{intervention_id}", "interventions"),
        ("POST", "/intervention-actions", "intervention-actions"),
        ("POST", "/intervention-tasks", "Intervention Tasks"),
        ("POST", "/preventive-plans", "Preventive Plans"),
        ("POST", "/preventive-occurrences/generate", "Preventive Occurrences"),
        ("POST", "/intervention-requests", "intervention-requests"),
    ):
        assert not default_allowed("ACHETEUR", ep(method, path, module)), path


# --- MCP -----------------------------------------------------------------------------


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
def test_mcp_n_ecrit_jamais(method):
    assert not default_allowed("MCP", ep(method, "/interventions", "interventions"))
    assert not default_allowed("MCP", ep(method, "/purchase-requests", "purchase-requests"))


# --- Cas ambigus (le plus restrictif est choisi) -------------------------------------


def test_ambigu_journal_d_audit_manuel_reserve_a_resp():
    """POST /audit/log : valeurs libres, déjà RESP/ADMIN dans le code."""
    audit = ep("POST", "/audit/log", "Audit")
    assert default_allowed("RESP", audit)
    assert not default_allowed("TECH", audit)
    assert not default_allowed("ACHETEUR", audit)


def test_ambigu_regles_et_motifs_d_audit_en_ecriture_admin_seul():
    """/admin/audit-rules et audit-reasons : RESP les lit, l'écriture est ADMIN seul dans le code."""
    assert default_allowed("RESP", ep("GET", "/admin/audit-rules", "admin"))
    assert not default_allowed("RESP", ep("POST", "/admin/audit-rules", "admin"))
    assert not default_allowed("RESP", ep("PATCH", "/admin/audit-reasons/{reason_id}", "admin"))


def test_ambigu_pilotage_des_interventions_et_demandes():
    """Transition de DI et clôture forcée : RESP seul ; relance de pointage : TECH aussi."""
    transition = ep(
        "POST", "/intervention-requests/{request_id}/transition", "intervention-requests"
    )
    force = ep("POST", "/interventions/{intervention_id}/force-close-request", "interventions")
    pointage = ep("POST", "/interventions/{intervention_id}/request-pointage", "interventions")
    assert default_allowed("RESP", transition) and not default_allowed("TECH", transition)
    assert default_allowed("RESP", force) and not default_allowed("TECH", force)
    assert default_allowed("TECH", pointage)


def test_ambigu_home_view_admin_ferme_a_resp():
    assignments = ep("PUT", "/home-view/admin/assignments/{role_id}", "home-view")
    assert not default_allowed("RESP", assignments)
    assert not default_allowed("TECH", assignments)


def test_chaque_module_des_regles_existe_dans_l_application():
    """Une faute de nom de module rend la règle muette (cas réel : « intervention-tasks »
    au lieu du tag « Intervention Tasks », TECH privé de ses tâches)."""
    from api.app import app
    from db import default_permissions

    tags_reels = {route.tags[0] for route in app.routes if getattr(route, "tags", None)}
    modules_des_regles = {
        regle.module
        for regles in default_permissions.WRITE_RULES_BY_ROLE.values()
        for regle in regles
    }
    assert modules_des_regles - tags_reels == set()
