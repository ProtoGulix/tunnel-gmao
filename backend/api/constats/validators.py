"""Règles métier du constat après intervention (ADR 0043), sans accès base."""

from typing import Any, Dict, Iterable, List, Optional

from api.audits.schemas import AuditRules
from api.errors.exceptions import AuditReasonRequiredError, ForbiddenError, ValidationError
from api.utils.audit import build_picker_reasons

# Décision d'audit (decision_types) de la correction d'un constat
CORRECTION_DECISION = "constat_corrected"

# Rôles qui corrigent un constat dont ils ne sont pas l'auteur (le référent, ADR 0043 point 6)
REFERENT_ROLES = ("RESP", "ADMIN")

# Statut de la demande issue du constat tant qu'une correction reste permise
EDITABLE_REQUEST_STATUS = "nouvelle"


class ConstatValidator:
    """Valide les choix d'un constat contre le formulaire en base."""

    @staticmethod
    def validate_and_prepare(
        choice_codes: Iterable[str], form: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Contrôle les choix et renvoie `selected` et `suggested_type_inter`.

        `form` : questions (code, label, is_multiple, is_active, parent_choice_code,
        sort_order) portant chacune leurs `choices` (code, label, is_active, sort_order,
        suggested_type_inter, creates_request, is_exclusive). Règles : choix connu et actif,
        un seul choix pour une question unique, question racine obligatoire, sous-question
        exigée si et seulement si son choix parent est coché, un choix exclusif ne se combine
        avec aucun autre de sa question. `selected` : paires (question, choix) dans l'ordre de
        l'écran. Le type préconisé est celui du premier choix coché qui en porte un ;
        `creates_request` est vrai si au moins un choix coché génère une demande.
        """
        by_code = {c["code"]: (q, c) for q in form for c in q["choices"]}
        codes = set(choice_codes)
        for code in sorted(codes):
            if code not in by_code:
                raise ValidationError(f"Choix inconnu : {code}")
            question, choice = by_code[code]
            if not (question["is_active"] and choice["is_active"]):
                raise ValidationError(f"Choix inactif : {choice['label']}")

        questions = sorted(form, key=lambda q: q["sort_order"])
        questions_by_choice = {c["code"]: q for q in form for c in q["choices"]}
        expected: Dict[str, bool] = {}

        def is_expected(question: Dict[str, Any]) -> bool:
            # Racine : toujours. Sous-question : si son choix parent est coché et attendu.
            code = question["code"]
            if code not in expected:
                parent = question.get("parent_choice_code")
                expected[code] = parent is None or (
                    parent in codes and is_expected(questions_by_choice[parent])
                )
            return expected[code]

        selected: List[Dict[str, Any]] = []
        for question in questions:
            if not question["is_active"]:
                continue
            chosen = sorted(
                (c for c in question["choices"] if c["code"] in codes),
                key=lambda c: c["sort_order"],
            )
            if not is_expected(question):
                if chosen:
                    raise ValidationError(f"Réponse non attendue : {question['label']}")
                continue
            if not chosen:
                raise ValidationError(f"Réponse obligatoire : {question['label']}")
            exclusive = next((c for c in chosen if c.get("is_exclusive")), None)
            if exclusive and len(chosen) > 1:
                raise ValidationError(f"Choix exclusif : {exclusive['label']}")
            if not question["is_multiple"] and len(chosen) > 1:
                raise ValidationError(f"Un seul choix permis : {question['label']}")
            selected.extend({"question": question, "choice": c} for c in chosen)

        suggested = next(
            (
                s["choice"]["suggested_type_inter"]
                for s in selected
                if s["choice"]["suggested_type_inter"]
            ),
            None,
        )
        creates_request = any(s["choice"].get("creates_request") for s in selected)
        return {
            "selected": selected,
            "suggested_type_inter": suggested,
            "creates_request": creates_request,
        }

    @staticmethod
    def build_description(intervention_code: str, selected: List[Dict[str, Any]]) -> str:
        """Texte de la demande issue du constat : uniquement les libellés des choix cochés."""
        lines = [f"Constat après l'intervention {intervention_code}"]
        grouped: Dict[str, List[str]] = {}
        for item in selected:
            grouped.setdefault(item["question"]["label"], []).append(item["choice"]["label"])
        lines += [f"{label} : {', '.join(labels)}" for label, labels in grouped.items()]
        return "\n".join(lines)

    @staticmethod
    def ensure_intervention_open_to_constat(printed_fiche: Optional[bool]) -> None:
        """Une intervention archivée n'accepte plus de constat (ADR 0041)."""
        if printed_fiche:
            raise ValidationError("Intervention archivée : constat impossible")

    @staticmethod
    def ensure_can_correct(
        author_id: Any, user_id: Any, role: Optional[str], request_status: Optional[str]
    ) -> None:
        """Correction : auteur du constat ou référent.

        Avec demande, tant qu'elle est « nouvelle » ; sans demande (`request_status` None),
        sans autre condition (l'archivage de l'intervention est contrôlé à part).
        """
        if request_status is not None and request_status != EDITABLE_REQUEST_STATUS:
            raise ValidationError("Constat déjà traité : correction impossible")
        if str(author_id) != str(user_id) and role not in REFERENT_ROLES:
            raise ForbiddenError("Seul l'auteur ou un responsable peut corriger ce constat")

    @staticmethod
    def can_correct(
        author_id: Any,
        user_id: Any,
        role: Optional[str],
        request_status: Optional[str],
        archived: bool = False,
    ) -> bool:
        """Même règle que `ensure_can_correct` (et intervention non archivée), en booléen."""
        if archived or request_status not in (None, EDITABLE_REQUEST_STATUS):
            return False
        return str(author_id) == str(user_id) or role in REFERENT_ROLES


def ensure_correction_reason(
    reason_code: Optional[str],
    reason_text: Optional[str],
    reasons: List[Dict[str, Any]],
) -> None:
    """Vérifie le motif explicite d'une correction (même mécanisme que ADR 0042).

    Corriger n'est jamais routinier : sans motif choisi (ROUTINE injecté par le middleware),
    on répond la demande de motif standard avec les motifs de décision `constat_corrected`.
    """
    proposed = [r for r in reasons if CORRECTION_DECISION in (r.get("decision_types") or [])]
    reason = {r["code"]: r for r in reasons}.get(reason_code or "")
    if reason is None:
        raise ValidationError(f"Motif '{reason_code}' non applicable à un constat")
    if reason.get("category") not in ("manual", "user"):
        raise AuditReasonRequiredError(
            AuditRules(
                required=True,
                silent=False,
                default_reason_code=None,
                reasons=build_picker_reasons(proposed),
            ).model_dump()
        )
    if reason not in proposed:
        raise ValidationError(f"Motif '{reason_code}' non applicable à une correction")
    if reason_code == "OTHER" and not (reason_text or "").strip():
        raise ValidationError("reason_text obligatoire quand reason_code = OTHER")
