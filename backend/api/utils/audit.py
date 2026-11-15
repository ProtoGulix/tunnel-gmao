"""Utilitaire pour charger les règles d'audit d'une entité.

Les règles routine/sensible sont administrables via /admin/audit-rules
(table audit_rule), plus en dur dans ce fichier. Voir AuditRuleRepository.
"""

from typing import Any, Dict, List, Optional

from api.audits.schemas import AuditRuleReason, AuditRules

# Entités qui exigent un reason_code sur toute mutation
_ENTITIES_WITH_REQUIRED_AUDIT = {
    "intervention",
    "request",
    "purchase_request",
    "task",
    "action",
    "supplier_order",
    "equipement",
}


def resolve_reason_code(entity_type: str, fields: List[str]) -> Optional[Dict[str, Any]]:
    """
    Détermine la règle applicable pour un entity_type et les champs présents
    dans le payload entrant (avant exécution de la route, donc avant diff réel).

    Priorité : dès qu'un champ correspond à une règle non-routine, la mutation
    exige une raison explicite (retourne None : pas d'injection automatique).
    Si tous les champs présents (ou aucun, cas création) sont routine,
    retourne la règle par défaut à auto-injecter.
    """
    # Import lazy pour éviter la circularité avec audits.repo
    from api.audits.repo import AuditRuleRepository

    repo = AuditRuleRepository()
    rules = repo.get_rules_for_fields(entity_type, fields)
    by_field = {r["field"]: r for r in rules}

    default_rule = by_field.get(None)
    applicable = [by_field[f] for f in fields if f in by_field] or (
        [default_rule] if default_rule else []
    )

    if not applicable:
        return None

    if any(not r["is_routine"] for r in applicable):
        return None

    return default_rule


def list_entity_reasons(entity_type: str) -> List[Dict[str, Any]]:
    """Motifs actifs applicables à une entité, toutes catégories confondues."""
    # Import lazy pour éviter la circularité éventuelle avec audits.repo
    from api.audits.repo import AuditRepository

    return AuditRepository().get_all_reasons(active_only=True, entity_type=entity_type)


def build_picker_reasons(raw_reasons: List[Dict[str, Any]]) -> List[AuditRuleReason]:
    """Motifs proposés à l'utilisateur : catégories manual et user seulement."""
    return [
        AuditRuleReason(
            code=r["code"],
            label=r["label"],
            color=r.get("color"),
            requires_text=(r["code"] == "OTHER"),
            decision_types=r.get("decision_types"),
        )
        for r in raw_reasons
        if r.get("category") in ("manual", "user")
    ]


def get_audit_rules(
    entity_type: str, fields: Optional[List[str]] = None, allow_silent: bool = True
) -> AuditRules:
    """Retourne les règles d'audit pour une entité (et optionnellement des champs).

    - Catégories manual + user → affichées dans le picker front
    - Catégorie auto            → envoyée silencieusement (jamais dans le picker)
    - Catégorie system          → réservée aux mutations internes

    `allow_silent=False` (suppressions) : jamais d'envoi silencieux, le motif est toujours
    demandé à l'utilisateur même si la règle de l'entité est routinière.
    """
    required = entity_type in _ENTITIES_WITH_REQUIRED_AUDIT

    routine_rule = resolve_reason_code(entity_type, fields or []) if allow_silent else None
    silent = routine_rule is not None

    reasons = build_picker_reasons(list_entity_reasons(entity_type))

    return AuditRules(
        required=required,
        silent=silent,
        default_reason_code=routine_rule["default_reason_code"] if routine_rule else None,
        silent_fields=None,
        # Les entités silencieuses n'exposent aucune raison au front :
        # il doit envoyer default_reason_code automatiquement sans afficher de sélecteur.
        reasons=[] if silent else reasons,
    )
