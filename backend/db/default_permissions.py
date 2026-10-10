"""Matrice des droits par défaut (ADR 0007, point 4), déclarative et sans I/O.

`default_allowed(role, endpoint)` dit si un rôle a droit, par défaut, à un endpoint
du catalogue (tunnel_endpoint). Les règles sont exprimées par module (tag du routeur),
méthode HTTP et, si nécessaire, chemin exact. Le bootstrap l'applique aux seules
permissions qu'aucun admin n'a modifiées (scripts/bootstrap.py).

Principe : tout ce qui n'est pas explicitement ouvert est fermé. Un nouvel endpoint
doit donc être ajouté ici dans le même lot que la route (ADR 0007, Conséquences).

Les routes personnelles (/auth/*, /users/me*, notifications, changelog,
/home-view/me) sont ouvertes par le code, indépendamment de cette matrice : elles
suivent ici la règle générale, sans effet réel.
"""

from dataclasses import dataclass
from typing import Mapping, Optional

READ_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
WRITE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})


@dataclass(frozen=True)
class Endpoint:
    """Les champs de tunnel_endpoint utiles aux règles."""

    code: str
    method: str
    path: str
    module: Optional[str] = None


@dataclass(frozen=True)
class WriteRule:
    """Ouvre les écritures d'un module : certaines méthodes, éventuellement un chemin exact."""

    module: str
    methods: frozenset = WRITE_METHODS
    path: Optional[str] = None  # chemin exact (gabarit FastAPI) ; None = tout le module

    def matches(self, ep: Endpoint) -> bool:
        return (
            ep.module == self.module
            and ep.method.upper() in self.methods
            and (self.path is None or ep.path == self.path)
        )


def _w(module: str, *methods: str, path: Optional[str] = None) -> WriteRule:
    return WriteRule(module, frozenset(methods) if methods else WRITE_METHODS, path)


# --- Historique d'audit : pilotage (RESP) et agent d'audit (MCP) seulement ------------
# Décision du 2026-10-07 : TECH et ACHETEUR ne lisent pas qui a fait quoi ; les motifs
# (/audit/reasons) et règles (/audit/rules), nécessaires à toute saisie, restent ouverts.
AUDIT_HISTORY_PATHS = ("/audit/logs", "/audit/briefing")
AUDIT_HISTORY_READERS = ("RESP", "MCP")

# --- Zones fermées en lecture aux rôles non-ADMIN ------------------------------------
# /admin/* et /api-keys sont réservés à ADMIN, sauf les exceptions de RESP ci-dessous.
CLOSED_PREFIXES = ("/admin", "/api-keys", "/home-view/admin")

# RESP lit ces parties de /admin (require_role("RESP", "ADMIN") dans api/admin/routes.py).
RESP_ADMIN_READ_PREFIXES = (
    "/admin/users",
    "/admin/action-categories",
    "/admin/action-subcategories",
    "/admin/complexity-factors",
    "/admin/intervention-types",
    "/admin/intervention-statuses",
    "/admin/audit-rules",
    "/admin/audit-reasons",
)

# RESP écrit uniquement les référentiels d'admin ouverts à RESP dans le code.
# Exclus (ADR 0005, ADR 0007) : /admin/users, roles, permissions, endpoints, /api-keys,
# sécurité (ip-blocklist, email-domain-rules, settings/mail, security-logs), ainsi que
# audit-rules et audit-reasons (ADMIN seul dans le code), /home-view/admin.
RESP_ADMIN_WRITE_PREFIXES = (
    "/admin/action-categories",
    "/admin/action-subcategories",
    "/admin/complexity-factors",
    "/admin/intervention-types",
    "/admin/intervention-statuses",
)

# --- Écritures métier ouvertes par rôle (RESP : tout le métier, voir default_allowed) ---
TECH_WRITES = (
    _w("intervention-requests", "POST", path="/intervention-requests"),  # créer une DI
    _w("interventions", "PUT", "PATCH"),  # modifier, pas créer ni supprimer
    _w("interventions", "POST", path="/interventions/{intervention_id}/request-pointage"),
    _w("equipements", "PUT", "PATCH"),  # modifier une fiche, pas créer ni supprimer
    _w("intervention-actions"),
    _w("Intervention Tasks"),
    _w("intervention-status-log", "POST"),
    _w("purchase-requests", "POST", path="/purchase-requests"),  # créer une demande d'achat
)

ACHETEUR_WRITES = (
    _w("purchase-requests"),
    _w("supplier-orders"),
    _w("supplier-order-lines"),
    _w("suppliers"),
    _w("parts"),  # y compris références fabricant et fournisseur de /parts/*
    _w("stock-items"),
    _w("stock-families"),
    _w("stock-sub-families"),
    _w("manufacturer-items"),
    _w("stock-item-suppliers"),
    _w("part-templates"),
)

WRITE_RULES_BY_ROLE: Mapping[str, tuple] = {
    "TECH": TECH_WRITES,
    "ACHETEUR": ACHETEUR_WRITES,
}


def _under(path: str, prefixes) -> bool:
    return any(path == p or path.startswith(p + "/") for p in prefixes)


def default_allowed(role: str, endpoint: Endpoint) -> bool:
    """Droit par défaut de `role` (code de tunnel_role) sur `endpoint`."""
    if role == "ADMIN":
        return True  # le code laisse toujours passer ADMIN ; vrai pour la lisibilité de l'écran
    method = endpoint.method.upper()
    path = endpoint.path
    is_read = method in READ_METHODS

    if _under(path, CLOSED_PREFIXES):
        if role != "RESP":
            return False
        prefixes = RESP_ADMIN_READ_PREFIXES if is_read else RESP_ADMIN_WRITE_PREFIXES
        return _under(path, prefixes)

    if is_read:
        if path in AUDIT_HISTORY_PATHS:
            return role in AUDIT_HISTORY_READERS
        return role in ("RESP", "TECH", "ACHETEUR", "MCP")
    if role == "RESP":
        return True
    return any(rule.matches(endpoint) for rule in WRITE_RULES_BY_ROLE.get(role, ()))
