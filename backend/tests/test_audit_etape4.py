"""Étape 4 de l'audit centralisé (AUDC-41) : référentiels, administration, utilisateurs, accueil.

Tests unitaires (sans base) : couverture des routes, exclusions motivées, fin de POST /audit/log,
masquage des secrets, identifiants d'audit des entités à clé entière ou texte. Marqués
Écrits en xfail(strict) avant le code (AUDC-43 socle, AUDC-44 référentiels, AUDC-45 le reste),
tous retirés : l'étape 4 est complète.

API supposée pour les tests qui précèdent le code (à suivre par l'implémenteur) :
  - api.audits.entity_ids.ENTITY_NAMESPACES : {entity_type: UUID} pour les six entités à clé
    entière ou texte (espace de noms constant par entité, jamais modifié) ;
  - api.audits.entity_ids.entity_id_for(entity_type, key) -> UUID, égal à
    uuid5(ENTITY_NAMESPACES[entity_type], str(key)) ; ValueError pour une entité inconnue ;
  - api.audits.middleware.SENSITIVE_COLUMNS (frozenset) et mask_sensitive(state) -> dict : copie
    de l'état où la valeur de chaque colonne sensible est remplacée, la clé restant présente.
"""

from uuid import UUID, uuid5

import pytest
from fastapi.routing import APIRoute

from api.app import app
from api.audits.declaration import find_declaration
from api.audits.exclusions import EXCLUDED, EXCLUSIONS, NO_WRITE, TO_DO

# --- Routes déclarées : (méthode, chemin, entité d'audit attendue) ---

ROUTES_AUDC_44 = [
    ("PATCH", "/admin/action-categories/{category_id}", "action_category"),
    ("POST", "/admin/action-subcategories", "action_subcategory"),
    ("PATCH", "/admin/action-subcategories/{subcat_id}", "action_subcategory"),
    ("POST", "/admin/intervention-types", "intervention_type"),
    ("PATCH", "/admin/intervention-types/{type_id}", "intervention_type"),
    ("PATCH", "/admin/intervention-types/{type_id}/active", "intervention_type"),
    ("PATCH", "/admin/intervention-statuses/{status_code}", "intervention_status"),
    ("PATCH", "/admin/constat-questions/{question_id}", "constat_question"),
    ("POST", "/admin/constat-choices", "constat_choice"),
    ("PATCH", "/admin/constat-choices/{choice_id}", "constat_choice"),
    ("POST", "/admin/audit-reasons", "audit_reason"),
    ("PATCH", "/admin/audit-reasons/{reason_id}", "audit_reason"),
    ("PATCH", "/admin/audit-reasons/{reason_id}/active", "audit_reason"),
    ("POST", "/admin/audit-rules", "audit_rule"),
    ("PATCH", "/admin/audit-rules/{rule_id}", "audit_rule"),
]

ROUTES_AUDC_45 = [
    ("POST", "/admin/users", "user"),
    ("PUT", "/admin/users/{user_id}", "user"),
    ("DELETE", "/admin/users/{user_id}", "user"),
    ("PATCH", "/admin/users/{user_id}/role", "user"),
    ("PATCH", "/admin/users/{user_id}/active", "user"),
    ("POST", "/admin/users/{user_id}/reset-password", "user"),
    ("PATCH", "/admin/permissions/{permission_id}", "permission"),
    ("PATCH", "/admin/endpoints/{endpoint_id}", "endpoint"),
    ("POST", "/admin/ip-blocklist", "ip_block"),
    ("DELETE", "/admin/ip-blocklist/{block_id}", "ip_block"),
    ("POST", "/admin/email-domain-rules", "email_domain_rule"),
    ("DELETE", "/admin/email-domain-rules/{rule_id}", "email_domain_rule"),
    ("POST", "/api-keys", "api_key"),
    ("PATCH", "/api-keys/{key_id}", "api_key"),
    ("DELETE", "/api-keys/{key_id}", "api_key"),
    ("POST", "/equipement-class", "equipement_class"),
    ("PATCH", "/equipement-class/{class_id}", "equipement_class"),
    ("DELETE", "/equipement-class/{class_id}", "equipement_class"),
    ("PUT", "/home-view/admin/assignments/{role_id}", "role_home_view"),
    ("DELETE", "/home-view/admin/assignments/{role_id}", "role_home_view"),
    ("POST", "/services", "service"),
    ("PATCH", "/services/{service_id}", "service"),
    ("POST", "/users/me/password", "user"),
    ("PATCH", "/users/me/profile", "user"),
]

# Exclusions de la décision 9 (hors authentification, déjà excluse) : route -> catégorie.
# Les quatre routes cassées (colonnes absentes en base) ont été retirées (SUIT-01).
ROUTES_RETIREES = [
    ("PATCH", "/admin/action-categories/{category_id}/active"),
    ("PATCH", "/admin/action-subcategories/{subcat_id}/active"),
    ("PATCH", "/admin/complexity-factors/{factor_id}"),
    ("PATCH", "/admin/complexity-factors/{factor_id}/active"),
]
EXCLUSIONS_DECISION_9 = [
    ("PATCH", "/notifications/read-all"),
    ("PATCH", "/notifications/{notification_id}/read"),
    ("PATCH", "/users/me/changelog-seen"),
    ("POST", "/admin/settings/mail/test"),
    ("POST", "/admin/endpoints/sync"),
]


def _routes():
    return {
        (method, route.path): route
        for route in app.routes
        if isinstance(route, APIRoute)
        for method in route.methods
    }


# --- Couverture ---


@pytest.mark.parametrize(
    "methode, chemin, entite",
    ROUTES_AUDC_44 + ROUTES_AUDC_45,
)
def test_route_de_l_etape_4_declare_son_entite(methode, chemin, entite):
    route = _routes().get((methode, chemin))
    assert route is not None, f"route absente : {methode} {chemin}"
    declaration = find_declaration(route)
    assert declaration is not None, f"{methode} {chemin} sans audit(...)"
    assert declaration.entity_type == entite


def test_plus_aucune_route_a_traiter_a_l_etape_4():
    restantes = sorted(k for k, e in EXCLUSIONS.items() if e.category == TO_DO)
    assert restantes == []


@pytest.mark.parametrize("methode, chemin", EXCLUSIONS_DECISION_9)
def test_exclusion_de_la_decision_9_est_motivee(methode, chemin):
    exclusion = EXCLUSIONS.get((methode, chemin))
    assert exclusion is not None, f"{methode} {chemin} absente des exclusions"
    assert exclusion.category in {EXCLUDED, NO_WRITE}
    assert exclusion.reason.strip()


def test_test_d_envoi_de_mail_est_classe_sans_ecriture():
    assert EXCLUSIONS[("POST", "/admin/settings/mail/test")].category == NO_WRITE


@pytest.mark.parametrize("methode, chemin", ROUTES_RETIREES)
def test_route_cassee_est_retiree(methode, chemin):
    assert (methode, chemin) not in _routes()
    assert (methode, chemin) not in EXCLUSIONS


# --- Fin de POST /audit/log ---


def test_post_audit_log_n_existe_plus():
    assert ("POST", "/audit/log") not in _routes()
    assert ("POST", "/audit/log") not in EXCLUSIONS


def test_lecture_du_journal_d_audit_reste_disponible():
    assert ("GET", "/audit/logs") in _routes()


# --- Secrets masqués avant écriture d'audit ---


def test_colonnes_sensibles_sont_listees():
    from api.audits.middleware import SENSITIVE_COLUMNS

    assert {"password_hash", "key_hash"} <= set(SENSITIVE_COLUMNS)


def test_masquage_remplace_la_valeur_sans_retirer_la_cle():
    from api.audits.middleware import mask_sensitive

    etat = {"id": "1", "email": "a@b.c", "password_hash": "$2b$12$secret", "key_hash": "f00d"}
    masque = mask_sensitive(etat)
    assert masque["password_hash"] != "$2b$12$secret"
    assert masque["key_hash"] != "f00d"
    assert masque["email"] == "a@b.c" and masque["id"] == "1"
    assert etat["password_hash"] == "$2b$12$secret", "l'état d'origine ne doit pas être modifié"


def test_masquage_laisse_intact_un_etat_sans_colonne_sensible():
    """Un état sans colonne sensible passe tel quel (aucune clé ajoutée)."""
    from api.audits.middleware import mask_sensitive

    etat = {"id": "1", "name": "Presse"}
    assert mask_sensitive(etat) == etat


# --- Identifiants d'audit des entités à clé entière ou texte ---

ENTITES_CLE_NON_UUID = [
    "intervention_type",
    "action_category",
    "action_subcategory",
    "intervention_status",
    "audit_reason",
    "audit_rule",
    "constat_question",
    "constat_choice",
]


def test_un_espace_de_noms_par_entite_a_cle_non_uuid():
    from api.audits.entity_ids import ENTITY_NAMESPACES, STOCK_FAMILY_NAMESPACE

    assert set(ENTITY_NAMESPACES) == set(ENTITES_CLE_NON_UUID)
    espaces = list(ENTITY_NAMESPACES.values())
    assert all(isinstance(e, UUID) for e in espaces)
    assert len(set(espaces)) == len(espaces), "espaces de noms distincts"
    assert STOCK_FAMILY_NAMESPACE not in espaces


@pytest.mark.parametrize("entite", ENTITES_CLE_NON_UUID)
def test_identifiant_d_audit_est_un_uuid5_stable(entite):
    from api.audits.entity_ids import ENTITY_NAMESPACES, entity_id_for

    cle = "ouvert" if entite == "intervention_status" else 3
    assert entity_id_for(entite, cle) == entity_id_for(entite, cle)
    assert entity_id_for(entite, cle) == uuid5(ENTITY_NAMESPACES[entite], str(cle))


def test_meme_cle_dans_deux_entites_donne_deux_identifiants():
    from api.audits.entity_ids import entity_id_for

    assert entity_id_for("intervention_type", 3) != entity_id_for("audit_reason", 3)
    assert entity_id_for("intervention_type", 3) != entity_id_for("intervention_type", 4)


def test_entite_inconnue_est_refusee():
    from api.audits.entity_ids import entity_id_for

    with pytest.raises(ValueError):
        entity_id_for("machine", 3)
