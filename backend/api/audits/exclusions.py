"""Routes qui modifient sans déclaration d'audit (ADR 0018, point 3).

Liste explicite, une entrée par (méthode, chemin). Catégories :
  - TO_DO     : à traiter à l'étape indiquée (2, 3 ou 4) ; la catégorie doit se vider.
  - EXCLUDED  : exclue définitivement, la raison est obligatoire.
  - NO_WRITE  : ne modifie rien malgré la méthode POST, la raison dit pourquoi (vérifié dans
                le code). Deux candidats d'AUDC-14 validés par l'utilisateur (2026-11-14) ;
                les autres restent TO_DO tant que non validés.

Le test tests/test_audit_coverage.py échoue si une route n'est ni déclarée ni listée ici.
Une route listée qui reçoit une déclaration doit être retirée de la liste.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple

TO_DO = "à traiter"
EXCLUDED = "exclue"
NO_WRITE = "ne modifie rien"


@dataclass(frozen=True)
class Exclusion:
    category: str
    step: Optional[int] = None
    reason: str = ""


# Étape du plan (docs/taches/AUDC-plan.md) selon le premier segment du chemin.
STEP_BY_PREFIX = {
    "interventions": 2,
    "intervention-requests": 2,
    "intervention-actions": 2,
    "intervention-tasks": 2,
    "intervention-status-log": 2,
    "purchase-requests": 2,
    "supplier-orders": 2,
    "equipements": 2,
    "preventive-occurrences": 2,
    "preventive-plans": 3,
    "parts": 3,
    "part-templates": 3,
    "stock-items": 3,
    "stock-item-suppliers": 3,
    "stock-families": 3,
    "stock-sub-families": 3,
    "supplier-order-lines": 3,
    "suppliers": 3,
    "manufacturer-items": 3,
}
DEFAULT_STEP = 4


def step_for_path(path: str) -> int:
    """Étape de traitement d'une route d'après son premier segment."""
    return STEP_BY_PREFIX.get(path.strip("/").split("/")[0], DEFAULT_STEP)


def _todo(step: int, reason: str = "") -> Exclusion:
    return Exclusion(TO_DO, step=step, reason=reason)


# Authentification : tracée dans security_log, pas dans audit_log (ADR 0018, point 1 quinquies).
_SECURITY_LOG = "Trace dans security_log (ADR 0018, point 1 quinquies)"
# Gabarits de pièces : fonctionnalité abandonnée, retrait prévu (décision de l'utilisateur,
# 2026-11-14) ; pas d'audit sur du code voué à disparaître.
_ABANDONED = (
    "Fonctionnalité abandonnée, retrait au backlog (docs/backlog/gabarits-de-pieces-a-retirer.md)"
)
# POST sans écriture recensés par AUDC-14 : restent « à traiter » tant que non validés.
_NO_WRITE_NOTE = "POST sans écriture (AUDC-14), à valider avec l'utilisateur"

# Étape 2 : interventions, achats, équipements, préventif (occurrences) ; étape 3 : catalogues
# et préventif (plans) ; étape 4 : le reste. Voir docs/taches/AUDC-plan.md.
EXCLUSIONS: Dict[Tuple[str, str], Exclusion] = {
    ("POST", "/auth/login"): Exclusion(EXCLUDED, reason=_SECURITY_LOG),
    ("POST", "/auth/refresh"): Exclusion(EXCLUDED, reason=_SECURITY_LOG),
    ("POST", "/auth/logout"): Exclusion(EXCLUDED, reason=_SECURITY_LOG),
    ("POST", "/purchase-requests/import/headers"): Exclusion(
        NO_WRITE,
        reason="Lit le CSV envoyé et renvoie ses colonnes : n'ouvre aucune écriture en base (AUDC-25)",
    ),
    ("POST", "/supplier-orders/{order_id}/export/email"): Exclusion(
        NO_WRITE,
        reason="Compose le courriel depuis des SELECT (get_export_data) : aucune écriture (AUDC-25)",
    ),
    ("POST", "/part-templates"): Exclusion(EXCLUDED, reason=_ABANDONED),
    ("DELETE", "/part-templates/{template_id}"): Exclusion(EXCLUDED, reason=_ABANDONED),
    ("POST", "/part-templates/{template_id}/versions"): Exclusion(EXCLUDED, reason=_ABANDONED),
    ("PATCH", "/admin/action-categories/{category_id}"): _todo(4),
    ("PATCH", "/admin/action-categories/{category_id}/active"): _todo(4),
    ("POST", "/admin/action-subcategories"): _todo(4),
    ("PATCH", "/admin/action-subcategories/{subcat_id}"): _todo(4),
    ("PATCH", "/admin/action-subcategories/{subcat_id}/active"): _todo(4),
    ("POST", "/admin/audit-reasons"): _todo(4),
    ("PATCH", "/admin/audit-reasons/{reason_id}"): _todo(4),
    ("PATCH", "/admin/audit-reasons/{reason_id}/active"): _todo(4),
    ("POST", "/admin/audit-rules"): _todo(4),
    ("PATCH", "/admin/audit-rules/{rule_id}"): _todo(4),
    ("PATCH", "/admin/complexity-factors/{factor_id}"): _todo(4),
    ("PATCH", "/admin/complexity-factors/{factor_id}/active"): _todo(4),
    ("POST", "/admin/email-domain-rules"): _todo(4),
    ("DELETE", "/admin/email-domain-rules/{rule_id}"): _todo(4),
    ("POST", "/admin/endpoints/sync"): _todo(4),
    ("PATCH", "/admin/endpoints/{endpoint_id}"): _todo(4),
    ("PATCH", "/admin/intervention-statuses/{status_code}"): _todo(4),
    ("POST", "/admin/intervention-types"): _todo(4),
    ("PATCH", "/admin/intervention-types/{type_id}"): _todo(4),
    ("PATCH", "/admin/intervention-types/{type_id}/active"): _todo(4),
    ("POST", "/admin/ip-blocklist"): _todo(4),
    ("DELETE", "/admin/ip-blocklist/{block_id}"): _todo(4),
    ("PATCH", "/admin/permissions/{permission_id}"): _todo(4),
    ("POST", "/admin/settings/mail/test"): _todo(4, _NO_WRITE_NOTE),
    ("POST", "/admin/users"): _todo(4),
    ("DELETE", "/admin/users/{user_id}"): _todo(4),
    ("PUT", "/admin/users/{user_id}"): _todo(4),
    ("PATCH", "/admin/users/{user_id}/active"): _todo(4),
    ("POST", "/admin/users/{user_id}/reset-password"): _todo(4),
    ("PATCH", "/admin/users/{user_id}/role"): _todo(4),
    ("POST", "/api-keys"): _todo(4),
    ("DELETE", "/api-keys/{key_id}"): _todo(4),
    ("PATCH", "/api-keys/{key_id}"): _todo(4),
    ("POST", "/audit/log"): _todo(4),
    ("POST", "/equipement-class"): _todo(4),
    ("DELETE", "/equipement-class/{class_id}"): _todo(4),
    ("PATCH", "/equipement-class/{class_id}"): _todo(4),
    ("DELETE", "/home-view/admin/assignments/{role_id}"): _todo(4),
    ("PUT", "/home-view/admin/assignments/{role_id}"): _todo(4),
    ("PATCH", "/notifications/read-all"): _todo(4),
    ("PATCH", "/notifications/{notification_id}/read"): _todo(4),
    ("POST", "/services"): _todo(4),
    ("PATCH", "/services/{service_id}"): _todo(4),
    ("PATCH", "/users/me/changelog-seen"): _todo(4),
    ("POST", "/users/me/password"): _todo(4),
    ("PATCH", "/users/me/profile"): _todo(4),
}
