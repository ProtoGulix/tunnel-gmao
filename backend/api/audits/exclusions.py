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
    ("PATCH", "/admin/action-categories/{category_id}/active"): Exclusion(
        EXCLUDED,
        reason="Route cassée (colonne absente en base), à réparer ou retirer : "
        "docs/backlog/routes-referentiel-cassees.md",
    ),
    ("PATCH", "/admin/action-subcategories/{subcat_id}/active"): Exclusion(
        EXCLUDED,
        reason="Route cassée (colonne absente en base), à réparer ou retirer : "
        "docs/backlog/routes-referentiel-cassees.md",
    ),
    ("PATCH", "/admin/complexity-factors/{factor_id}"): Exclusion(
        EXCLUDED,
        reason="Route cassée (colonne absente en base), à réparer ou retirer : "
        "docs/backlog/routes-referentiel-cassees.md",
    ),
    ("PATCH", "/admin/complexity-factors/{factor_id}/active"): Exclusion(
        EXCLUDED,
        reason="Route cassée (colonne absente en base), à réparer ou retirer : "
        "docs/backlog/routes-referentiel-cassees.md",
    ),
    ("POST", "/admin/endpoints/sync"): Exclusion(
        EXCLUDED,
        reason="Resynchronisation technique du catalogue d'endpoints depuis le code, sans "
        "décision humaine ; les droits qui en dépendent sont tracés par permission_audit_log",
    ),
    ("POST", "/admin/settings/mail/test"): Exclusion(
        NO_WRITE,
        reason="Envoie un courriel de test avec la configuration courante : aucune écriture en base",
    ),
    ("PATCH", "/notifications/read-all"): Exclusion(
        EXCLUDED,
        reason="Marque lue une notification personnelle : état d'usage de l'utilisateur, pas une décision",
    ),
    ("PATCH", "/notifications/{notification_id}/read"): Exclusion(
        EXCLUDED,
        reason="Marque lue une notification personnelle : état d'usage de l'utilisateur, pas une décision",
    ),
    ("PATCH", "/users/me/changelog-seen"): Exclusion(
        EXCLUDED,
        reason="Mémorise la dernière version des nouveautés vue par l'utilisateur : préférence d'affichage",
    ),
}
