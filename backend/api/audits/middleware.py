"""
Middleware d'audit log.

Interceptionne POST/PUT/PATCH/DELETE : valide le motif (reason_code) avant la route, puis,
après son succès et dans la même transaction, écrit l'audit avec fn_audit_log_decision().
Il est le seul à écrire dans audit_log (ADR 0018) :
  - routes déclarées (audit(...), api/audits/declaration.py) : `created`, `deleted`, et une
    ligne `{champ}_changed` par champ réellement modifié ;
  - routes non déclarées (étapes 2 à 4 du chantier) : comportement historique deviné depuis
    l'URL, conservé tel quel jusqu'à leur déclaration ;
  - événements déposés par les repos (api/audits/events.py).
Le corps de la requête n'est jamais réécrit : le motif validé ou injecté (règle routinière)
est posé dans request.state (REASON_CODE_ATTR).

Ordre dans la pile middleware Starlette :
  CORS → JWT → droits → transaction → AuditMiddleware → route (voir api/app.py)

Le JWT est donc déjà validé quand on arrive ici : request.state.user_id est disponible.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
from uuid import UUID

from fastapi import Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.routing import Match

from api.audits.declaration import CREATED_ID_ATTR, find_declaration
from api.audits.events import AuditUnit, bind_audit_unit, unbind_audit_unit
from api.audits.repo import AuditRepository

# Entités tracées : préfixe URL → entity_type
_ENTITY_MAP: Dict[str, str] = {
    "interventions": "intervention",
    "intervention-requests": "request",
    "purchase-requests": "purchase_request",
    "intervention-actions": "action",
    "intervention-tasks": "task",
    "supplier-orders": "supplier_order",
    "equipements": "equipement",
}

# Table de chaque entité tracée (l'API expose equipement, la table s'appelle machine).
_TABLE_MAP: Dict[str, str] = {
    "intervention": "intervention",
    "request": "intervention_request",
    "purchase_request": "purchase_request",
    "task": "intervention_task",
    "action": "intervention_action",
    "supplier_order": "supplier_order",
    "equipement": "machine",
    "preventive_plan": "preventive_plan",
    "part": "part",
    "part_manufacturer_ref": "part_manufacturer_ref",
    "part_supplier_ref": "part_supplier_ref",
    "manufacturer_item": "manufacturer_item",
    "stock_item": "stock_item",
    "stock_sub_family": "stock_sub_family",
    "stock_item_supplier": "stock_item_supplier",
    "supplier": "supplier",
    "supplier_order_line": "supplier_order_line",
    # Étape 4 : entités à clé uuid (celles à clé entière ou texte passent par des événements
    # déposés par le repo, voir api/audits/entity_ids.py).
    "user": "tunnel_user",
    "permission": "tunnel_permission",
    "endpoint": "tunnel_endpoint",
    "ip_block": "ip_blocklist",
    "email_domain_rule": "email_domain_rule",
    "api_key": "api_key",
    "equipement_class": "equipement_class",
    "service": "service",
    "role_home_view": "role_home_view",
}

# Colonnes dont la valeur ne doit jamais être écrite dans audit_log (lisible par RESP et MCP).
SENSITIVE_COLUMNS = frozenset({"password_hash", "key_hash"})
MASKED_VALUE = "***"


def mask_sensitive(state: Dict[str, Any]) -> Dict[str, Any]:
    """Copie de l'état où la valeur de chaque colonne sensible est remplacée.

    La clé reste présente : le diff `password_hash_changed` reste visible sans l'empreinte.
    """
    return {k: (MASKED_VALUE if k in SENSITIVE_COLUMNS else v) for k, v in state.items()}


# Pattern : /interventions ou /interventions/{uuid} ou /interventions/{uuid}/sous-ressource
_PATH_RE = re.compile(
    r"^/([a-z][a-z0-9\-]+)(?:/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))?",
    re.IGNORECASE,
)

# Champs ignorés dans le calcul du diff (méta-données techniques)
_DIFF_IGNORE = frozenset(
    {"id", "created_at", "updated_at", "updated_by", "reason_code", "reason_text"}
)


def _extract_entity(path: str) -> Optional[Tuple[str, Optional[str]]]:
    """Retourne (entity_type, entity_id_str_ou_None) ou None si ressource inconnue."""
    m = _PATH_RE.match(path)
    if not m:
        return None
    resource, entity_id = m.groups()
    entity_type = _ENTITY_MAP.get(resource)
    return (entity_type, entity_id) if entity_type else None


def _reason_refusal(
    reason: Optional[Dict[str, Any]],
    reason_code: str,
    reason_text: Optional[str],
    entity_type: str,
) -> Optional[str]:
    """Retourne le message de refus (français) d'un motif envoyé par un client, ou None si valide.

    Contrôles faits avant la route (ADR 0017) : motif connu et actif, applicable à l'entité
    (entity_types NULL = toutes les entités), texte libre pour OTHER, et motif de catégorie
    system réservé aux traitements automatiques (jamais envoyé par un utilisateur).
    """
    if not reason or not reason.get("is_active"):
        return f"Raison '{reason_code}' inconnue ou inactive"
    if reason.get("category") == "system":
        return f"Raison '{reason_code}' réservée aux traitements automatiques"
    entity_types = reason.get("entity_types")
    if entity_types is not None and entity_type not in entity_types:
        return f"Raison '{reason_code}' non applicable à cette entité"
    if reason_code == "OTHER" and not (isinstance(reason_text, str) and reason_text.strip()):
        return "Un texte est obligatoire avec la raison 'OTHER'"
    return None


def _compute_diff(old: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Tuple[Any, Any]]:
    """Retourne {champ: (ancienne_valeur, nouvelle_valeur)} pour les champs modifiés."""
    diff: Dict[str, Tuple[Any, Any]] = {}
    for key in set(old) | set(new):
        if key in _DIFF_IGNORE:
            continue
        if old.get(key) != new.get(key):
            diff[key] = (old.get(key), new.get(key))
    return diff


# Attributs de request.state où le middleware dépose le motif validé ou injecté : les routes,
# les repos et l'écriture des événements le lisent là, le corps de la requête n'est jamais
# réécrit (ADR 0018, point 5).
REASON_CODE_ATTR = "audit_reason_code"
REASON_TEXT_ATTR = "audit_reason_text"

_MUTATING_METHODS = ("PATCH", "POST", "PUT", "DELETE")


@dataclass
class _Target:
    """Ce que la requête audite : entité, id (chemin), table de l'état avant/après."""

    entity_type: str
    entity_id: Optional[str]
    table: Optional[str]
    declared: bool
    created: bool = False
    events_only: bool = False


def _resolve_target(request: Request) -> Optional[_Target]:
    """Cible d'audit de la requête : route déclarée si elle l'est, sinon devinée depuis l'URL.

    Le middleware passe avant le routage : on retrouve la route avec route.matches, comme le
    ferait le routeur, pour lire la déclaration posée dans son décorateur.
    """
    scope = request.scope
    for route in request.app.router.routes:
        match, child_scope = route.matches(scope)
        if match != Match.FULL:
            continue
        declaration = find_declaration(route) if isinstance(route, APIRoute) else None
        if declaration is None:
            break
        entity_id = None
        if declaration.id_from_path:
            entity_id = child_scope.get("path_params", {}).get(declaration.id_from_path)
        return _Target(
            entity_type=declaration.entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            table=declaration.table or _TABLE_MAP.get(declaration.entity_type),
            declared=True,
            created=declaration.id_from_created,
            events_only=declaration.events_only,
        )
    info = _extract_entity(request.url.path)
    if not info:
        return None
    entity_type, entity_id = info
    return _Target(entity_type, entity_id, _TABLE_MAP.get(entity_type), declared=False)


async def _read_payload(request: Request) -> Dict[str, Any]:
    """Corps JSON de la requête (dict), ou {} : un corps multipart n'est même pas lu."""
    if request.headers.get("content-type", "").startswith("multipart/"):
        return {}
    raw_body = await request.body()
    if not raw_body:
        return {}
    try:
        payload = json.loads(raw_body)
    except (json.JSONDecodeError, ValueError):
        return {}
    return payload if isinstance(payload, dict) else {}


def _refuse(detail: str, audit: Optional[Dict[str, Any]] = None) -> JSONResponse:
    content: Dict[str, Any] = {"detail": detail, "error_type": "ValidationError"}
    if audit is not None:
        content["audit"] = audit
    return JSONResponse(status_code=400, content=content)


def _validate_reason(
    request: Request, entity_type: str, payload: Dict[str, Any]
) -> Tuple[Optional[JSONResponse], Optional[str], Optional[str]]:
    """Valide le motif avant la route (bloquant : à lancer dans le threadpool).

    Retourne (refus, reason_code, reason_text). Sans motif dans le corps : règle routinière
    injectée dans l'état de la requête, sinon demande de motif standard (400). Une suppression
    n'est jamais injectée : motif explicite obligatoire.
    """
    from api.utils.audit import get_audit_rules, resolve_reason_code

    reason_code: Optional[str] = payload.get("reason_code")
    reason_text: Optional[str] = payload.get("reason_text")

    if not reason_code:
        payload_fields = [k for k in payload if k not in _DIFF_IGNORE]
        # Une suppression exige toujours un motif explicite : pas d'injection routinière.
        is_delete = request.method == "DELETE"
        routine_rule = None if is_delete else resolve_reason_code(entity_type, payload_fields)
        if routine_rule is None:
            audit_rules = get_audit_rules(entity_type, payload_fields, allow_silent=not is_delete)
            return (
                _refuse("reason_code obligatoire pour cette mutation", audit_rules.model_dump()),
                None,
                None,
            )
        reason_code = routine_rule["default_reason_code"]
    else:
        reason = AuditRepository().get_reason_by_code(reason_code)
        refusal = _reason_refusal(reason, reason_code, reason_text, entity_type)
        if refusal:
            return _refuse(refusal), None, None

    setattr(request.state, REASON_CODE_ATTR, reason_code)
    setattr(request.state, REASON_TEXT_ATTR, reason_text)
    return None, reason_code, reason_text


class AuditMiddleware(BaseHTTPMiddleware):
    """Trace les mutations métier dans la transaction de la requête (ADR 0018).

    Routes déclarées (audit(...)) : création, suppression, champs réellement modifiés.
    Routes non déclarées : comportement historique deviné depuis l'URL, jusqu'à leur
    déclaration (étapes 2 à 4). Dans les deux cas, les événements déposés par les repos
    (api.audits.events) sont écrits ensuite. Toute erreur d'écriture annule la requête.
    """

    async def dispatch(self, request: Request, call_next):
        if request.method not in _MUTATING_METHODS:
            return await call_next(request)

        unit = AuditUnit()
        token = bind_audit_unit(unit)
        try:
            return await self._audit(request, call_next, unit)
        finally:
            # Un événement déposé plus tard (tâche de fond) est refusé, pas perdu en silence.
            unit.closed = True
            unbind_audit_unit(token)

    async def _audit(self, request: Request, call_next, unit: AuditUnit):
        target = _resolve_target(request)
        if target is None:
            response = await call_next(request)
            await self._write_events(request, response, unit)
            return response

        payload = await _read_payload(request)
        reason_code: Optional[str] = payload.get("reason_code")
        reason_text: Optional[str] = payload.get("reason_text")

        # Motif validé AVANT la route. Routes déclarées : toutes les méthodes (DELETE compris).
        # Routes non déclarées : comme avant, hors DELETE.
        if target.declared or request.method in ("PATCH", "POST", "PUT"):
            refusal, reason_code, reason_text = await run_in_threadpool(
                _validate_reason, request, target.entity_type, payload
            )
            if refusal is not None:
                return refusal

        if target.events_only:
            # Aucune entité propre : seuls les événements déposés par le repo sont écrits.
            response = await call_next(request)
            await self._write_events(request, response, unit)
            return response

        old_state = await self._state_before(request, target)
        response = await call_next(request)

        if 200 <= response.status_code < 300:
            if target.declared:
                await self._write_declared(request, target, old_state, reason_code, reason_text)
            else:
                await self._write_undeclared(
                    request, target, old_state, payload, reason_code, reason_text
                )
        await self._write_events(request, response, unit)
        return response

    # ── État avant / après ───────────────────────────────────────────────────

    async def _state_before(self, request: Request, target: _Target) -> Dict[str, Any]:
        """État avant la route : PATCH/PUT/DELETE (non déclarées) ; toute méthode avec id (déclarées)."""
        if not target.entity_id or target.created:
            return {}
        if target.declared or request.method in ("PATCH", "PUT", "DELETE"):
            return await run_in_threadpool(_fetch_entity_state, target.table, target.entity_id)
        return {}

    # ── Routes déclarées ─────────────────────────────────────────────────────

    async def _write_declared(
        self,
        request: Request,
        target: _Target,
        old_state: Dict[str, Any],
        reason_code: Optional[str],
        reason_text: Optional[str],
    ) -> None:
        if target.created:
            created_id = getattr(request.state, CREATED_ID_ATTR, None)
            if created_id is None:
                # Une route de création déclarée doit déposer l'id créé : sans lui, la
                # création serait validée sans trace. On annule plutôt que de l'oublier.
                raise RuntimeError(
                    f"Route de création déclarée sans declare_created_id : {request.url.path}"
                )
            new_state = await run_in_threadpool(_fetch_entity_state, target.table, str(created_id))
            await _write(
                target.entity_type,
                str(created_id),
                "created",
                None,
                _clean(new_state),
                reason_code,
                reason_text,
                request,
            )
            return

        if request.method == "DELETE":
            await _write(
                target.entity_type,
                target.entity_id,
                "deleted",
                _clean(old_state) or None,
                None,
                reason_code,
                reason_text,
                request,
            )
            return

        new_state = await run_in_threadpool(_fetch_entity_state, target.table, target.entity_id)
        await self._write_diffs(request, target, old_state, new_state, reason_code, reason_text)

    # ── Routes non déclarées (comportement historique) ───────────────────────

    async def _write_undeclared(
        self,
        request: Request,
        target: _Target,
        old_state: Dict[str, Any],
        payload: Dict[str, Any],
        reason_code: Optional[str],
        reason_text: Optional[str],
    ) -> None:
        new_state: Dict[str, Any] = {}
        if request.method != "DELETE" and target.entity_id:
            new_state = await run_in_threadpool(_fetch_entity_state, target.table, target.entity_id)

        diffs = _compute_diff(old_state, new_state)

        if not diffs and request.method in ("POST",):
            # Pour les créations, on n'a pas d'old_state ; on loggue le payload
            await _write(
                target.entity_type,
                target.entity_id,
                "created",
                None,
                {k: v for k, v in payload.items() if k not in _DIFF_IGNORE},
                reason_code,
                reason_text,
                request,
            )
        elif request.method == "DELETE":
            await _write(
                target.entity_type,
                target.entity_id,
                "deleted",
                old_state or None,
                None,
                reason_code,
                reason_text,
                request,
            )
        else:
            await self._write_diffs(request, target, old_state, new_state, reason_code, reason_text)

    async def _write_diffs(
        self,
        request: Request,
        target: _Target,
        old_state: Dict[str, Any],
        new_state: Dict[str, Any],
        reason_code: Optional[str],
        reason_text: Optional[str],
    ) -> None:
        """Une ligne `{champ}_changed` par champ réellement modifié, aucune sinon."""
        for field, (old_val, new_val) in _compute_diff(old_state, new_state).items():
            await _write(
                target.entity_type,
                target.entity_id,
                f"{field}_changed",
                {field: old_val},
                {field: new_val},
                reason_code,
                reason_text,
                request,
            )

    # ── Événements déposés par les repos ─────────────────────────────────────

    async def _write_events(self, request: Request, response, unit: AuditUnit) -> None:
        """Écrit les événements des repos, dans la même transaction, si la réponse est en succès."""
        if not (200 <= response.status_code < 300):
            return
        for event in unit.events:
            if event.is_system or event.reason_code:
                code, text = event.reason_code, None
            else:
                code = getattr(request.state, REASON_CODE_ATTR, None)
                text = getattr(request.state, REASON_TEXT_ATTR, None)
            if not code:
                raise RuntimeError(
                    "Événement d'audit sans motif de requête : "
                    f"{event.entity_type} {event.decision_type} ({request.url.path})"
                )
            await _write(
                event.entity_type,
                str(event.entity_id),
                event.decision_type,
                event.old_value,
                event.new_value,
                code,
                text,
                request,
                is_system=event.is_system,
            )


def _clean(state: Dict[str, Any]) -> Dict[str, Any]:
    """État sans les méta-données techniques (id, horodatages)."""
    return {k: v for k, v in state.items() if k not in _DIFF_IGNORE}


async def _write(*args: Any, **kwargs: Any) -> None:
    """Écriture d'audit hors de la boucle d'événements (psycopg2 est bloquant)."""
    await run_in_threadpool(_write_audit_log, *args, **kwargs)


def _write_audit_log(
    entity_type: str,
    entity_id_str: Optional[str],
    decision_type: str,
    old_value: Optional[Dict],
    new_value: Optional[Dict],
    reason_code: Optional[str],
    reason_text: Optional[str],
    request: Request,
    is_system: bool = False,
) -> None:
    """Appelle fn_audit_log_decision() dans la transaction de la requête.

    Une erreur n'est jamais avalée : elle remonte, la transaction est annulée avec la
    mutation (ADR 0018). Auteur : request.state.user_id (jeton), jamais le corps.
    Point unique d'écriture : c'est ici que les colonnes sensibles sont masquées (created,
    deleted, diffs, événements des repos), les diffs ayant été calculés sur les vraies valeurs.
    """
    if not reason_code or not entity_id_str:
        return
    changed_by: Optional[UUID] = None
    raw_user_id = getattr(request.state, "user_id", None)
    if raw_user_id:
        changed_by = UUID(str(raw_user_id))

    AuditRepository().call_fn_audit_log_decision(
        entity_type=entity_type,
        entity_id=UUID(entity_id_str),
        decision_type=decision_type,
        old_value=mask_sensitive(old_value) if old_value else old_value,
        new_value=mask_sensitive(new_value) if new_value else new_value,
        reason_code=reason_code,
        reason_text=reason_text,
        changed_by=changed_by,
        is_system=is_system,
    )


def _fetch_entity_state(table: Optional[str], entity_id_str: str) -> Dict[str, Any]:
    """État courant de la ligne (bloquant). {} si table inconnue ou id qui n'est pas un UUID.

    Le nom de table vient d'une liste blanche (déclaration de route ou _TABLE_MAP), jamais
    de la requête ; il est quand même quoté comme identifiant.
    """
    if not table:
        return {}
    try:
        entity_id = UUID(str(entity_id_str))
    except ValueError:
        return {}

    from psycopg2 import sql
    from psycopg2.extras import RealDictCursor

    from api.db import get_connection, release_connection

    conn = get_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                sql.SQL("SELECT * FROM {} WHERE id = %s").format(sql.Identifier(table)),
                (entity_id,),
            )
            row = cur.fetchone()
            return dict(row) if row else {}
    finally:
        release_connection(conn)
