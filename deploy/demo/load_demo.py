"""Chargeur de la base de démonstration (ADR 0036, fiche DEMO-06).

Joué APRÈS une installation normale (migrations, bootstrap, données de référence), avec
l'URL du rôle propriétaire, sur une base dédiée dont le nom contient « demo » :

    DATABASE_URL_OWNER=... DEMO_PASSWORD=... python load_demo.py [--today AAAA-MM-JJ]

Il insère l'usine fictive du dossier scenario/ (usine.json, interventions.json et, s'il
existe, achats.json) en calant les dates relatives (J-n) sur le jour du chargement. Tout se
passe dans une seule transaction : une erreur n'écrit rien.

Choix sur les triggers : les triggers de la base fabriquent un résultat « maintenant »
(date du jour dans les codes, lignes de journal horodatées à l'instant, notifications,
clôture en cascade). Pour antidater, ceux-là seulement sont désactivés (ALTER TABLE ...
DISABLE TRIGGER, par nom, le temps de la transaction) et le chargeur écrit lui-même ce
qu'ils auraient écrit, avec les dates et les auteurs du scénario : codes DI-, codes
d'intervention, journaux de statut, statut courant, clôture de la demande et de
l'occurrence. Tous les autres restent actifs (références d'articles, totaux de commande,
compteurs de références fournisseur, heures machine, contrôle du temps d'une action) : leur
résultat est celui de l'application. Les triggers sont réactivés avant la validation et le
chargeur le vérifie. Les droits ne sont pas touchés : audit_log reste en ajout seul pour le
rôle applicatif (le chargeur écrit avec le rôle propriétaire).
"""

from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import sys
import unicodedata
import uuid
from collections import defaultdict
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any, Optional

import bcrypt
import psycopg2
from psycopg2.extras import Json, execute_values


def current_api_version() -> Optional[str]:
    """Version de l'API installée : les comptes publics ont déjà « vu » ses nouveautés.

    Sans elle, la fenêtre « Nouveautés » s'ouvrirait à chaque connexion d'un visiteur.
    Hors du conteneur de l'API (module absent), la fenêtre reste affichée : sans gravité.
    """
    try:
        from api.settings import settings
    except ImportError:
        return None
    return settings.API_VERSION


SCENARIO_DIR = Path(__file__).resolve().parent / "scenario"
NAMESPACE = uuid.UUID("5d0b6c1e-6f0e-4c53-9a43-3a5b1f6d7a10")

# Triggers qui datent ou qui écrivent à la place du chargeur (voir l'en-tête du module).
DISABLED_TRIGGERS = {
    "intervention": ("trg_init_status_log", "trg_interv_code", "trg_log_status_change"),
    "intervention_request": (
        "trg_init_request_status_log",
        "trg_log_request_status_change",
        "trg_notify_di_a_traiter",
        "trg_request_code",
    ),
    "intervention_status_log": ("trg_sync_status_log_to_intervention",),
    "request_status_log": ("trg_apply_request_status",),
    "purchase_request": ("trg_purchase_request_code",),
    "supplier_order": ("trg_generate_supplier_order_number", "trg_supplier_order_updated_at"),
}

PUBLIC_LOGINS = {
    "technicien@demo.frezille.fr",
    "acheteur@demo.frezille.fr",
    "direction@demo.frezille.fr",
}
COLLEAGUE_DOMAIN = "morvance.example"
SYSTEM_REQUESTER = "Système préventif"
SKIP_REASON = "Plus nécessaire"


class LoaderError(Exception):
    """Erreur de chargement, message destiné à l'opérateur."""


def say(message: str) -> None:
    sys.stdout.write(f"[demo] {message}\n")
    sys.stdout.flush()


def uid(kind: str, key: str) -> str:
    """Identifiant stable : une même clé du scénario donne le même id à chaque chargement."""
    return str(uuid.uuid5(NAMESPACE, f"{kind}:{key}"))


def slug(text: str) -> str:
    plain = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-")


def check_password(password: str) -> None:
    """Même règle que le changement de mot de passe de l'API (api/users/schemas.py)."""
    if len(password) < 8 or not re.search(r"[A-Z]", password) or not re.search(r"[0-9]", password):
        raise LoaderError(
            "DEMO_PASSWORD doit faire 8 caractères au moins, avec une majuscule et un chiffre"
        )


def bcrypt_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


class Clock:
    """Dates relatives du scénario (entier ≤ 0 = jours avant le jour du chargement)."""

    def __init__(self, today: date):
        self.today = today

    def day(self, n: int) -> date:
        return self.today + timedelta(days=n)

    def at(self, n: int, hhmm: str = "12:00", minutes: int = 0) -> datetime:
        hour, minute = (int(p) for p in hhmm.split(":"))
        return datetime.combine(self.day(n), time(hour, minute)) + timedelta(minutes=minutes)


def read_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


class Loader:
    def __init__(self, conn, clock: Clock, scenario_dir: Path, demo_password: str):
        self.conn = conn
        self.cur = conn.cursor()
        self.clock = clock
        self.dir = scenario_dir
        self.demo_password = demo_password
        self.users: dict[str, dict] = {}
        self.machines: dict[str, str] = {}
        self.classes: dict[str, str] = {}
        self.services: dict[str, str] = {}
        self.plans: dict[str, dict] = {}
        self.stock_items: dict[str, str] = {}
        self.stock_supplier_refs: dict[tuple[str, str], str] = {}
        self.suppliers: dict[str, str] = {}
        self.purchase_requests: dict[str, dict] = {}
        self.action_ids: dict[str, str] = {}
        self.reasons: dict[str, int] = {}
        self.audit_rows: list[tuple] = []
        self.counts: dict[str, int] = defaultdict(int)

    # ── Garde-fous ────────────────────────────────────────────────────────────

    def guard(self) -> None:
        self.cur.execute("SELECT current_database()")
        name = self.cur.fetchone()[0]
        if "demo" not in name.lower():
            raise LoaderError(
                f"la base « {name} » n'est pas une base de démonstration (son nom doit "
                "contenir « demo ») : chargement refusé"
            )
        self.cur.execute(
            "SELECT (SELECT count(*) FROM intervention), (SELECT count(*) FROM intervention_request)"
        )
        interventions, requests = self.cur.fetchone()
        if interventions or requests:
            raise LoaderError(
                f"la base contient déjà {interventions} intervention(s) et {requests} demande(s) : "
                "chargement refusé (recréer la base avant de recharger)"
            )
        say(f"base {name}, vide d'interventions : chargement du scénario au {self.clock.today}")

    def set_triggers(self, enabled: bool) -> None:
        verb = "ENABLE" if enabled else "DISABLE"
        for table, names in DISABLED_TRIGGERS.items():
            for trigger in names:
                self.cur.execute(f'ALTER TABLE public."{table}" {verb} TRIGGER "{trigger}"')

    def check_triggers_enabled(self) -> None:
        names = [t for ts in DISABLED_TRIGGERS.values() for t in ts]
        self.cur.execute(
            "SELECT tgname FROM pg_trigger WHERE tgname = ANY(%s) AND tgenabled <> 'O'", (names,)
        )
        left = [row[0] for row in self.cur.fetchall()]
        if left:
            raise LoaderError(f"triggers restés désactivés : {', '.join(left)}")

    def lookup(self, mapping: dict, key: Any, what: str) -> Any:
        if key not in mapping:
            raise LoaderError(f"{what} inconnu(e) dans le scénario : {key!r}")
        return mapping[key]

    # ── Audit ─────────────────────────────────────────────────────────────────

    def reason_id(self, code: str) -> int:
        if not self.reasons:
            self.cur.execute("SELECT code, id FROM audit_reason_code WHERE is_active")
            self.reasons = dict(self.cur.fetchall())
        return self.lookup(self.reasons, code, "motif d'audit")

    def audit(
        self,
        entity_type: str,
        entity_id: str,
        decision: str,
        at: datetime,
        by: Optional[str],
        reason: str,
        old: Optional[dict] = None,
        new: Optional[dict] = None,
        text: Optional[str] = None,
        system: bool = False,
    ) -> None:
        """Ligne d'audit datée, attribuée à l'auteur fictif (fn_audit_log_decision écrit
        toujours now() : le chargeur insère donc la ligne lui-même, mêmes colonnes)."""
        if not system and by is None:
            raise LoaderError(f"audit sans auteur : {entity_type} {decision}")
        self.audit_rows.append(
            (
                entity_type,
                entity_id,
                decision,
                Json(old) if old is not None else None,
                Json(new) if new is not None else None,
                self.reason_id(reason),
                text,
                by,
                system,
                at,
            )
        )

    def flush_audit(self) -> None:
        execute_values(
            self.cur,
            "INSERT INTO audit_log (entity_type, entity_id, decision_type, old_value, new_value, "
            "reason_code_id, reason_text, changed_by, is_system, logged_at) VALUES %s",
            self.audit_rows,
        )
        say(f"audit : {len(self.audit_rows)} lignes")

    # ── Référentiel de l'usine ────────────────────────────────────────────────

    def load_factory(self, factory: dict) -> None:
        cur, clock = self.cur, self.clock
        self.cur.execute("SELECT code, id FROM tunnel_role")
        roles = dict(cur.fetchall())
        cur.execute("SELECT id FROM equipement_statuts WHERE code = 'EN_SERVICE'")
        in_service = cur.fetchone()[0]

        for svc in factory["services"]:
            sid = uid("service", svc["code"])
            cur.execute(
                "INSERT INTO service (id, code, label) VALUES (%s, %s, %s)",
                (sid, svc["code"], svc["label"]),
            )
            self.services[svc["code"]] = sid

        for cls in factory["classes"]:
            cid = uid("class", cls["code"])
            cur.execute(
                "INSERT INTO equipement_class (id, code, label, description) VALUES (%s,%s,%s,%s)",
                (cid, cls["code"], cls["label"], cls.get("description")),
            )
            for type_code in cls.get("types") or []:
                cur.execute(
                    "INSERT INTO equipement_class_intervention_type "
                    "(equipement_class_id, intervention_type_code) VALUES (%s, %s)",
                    (cid, type_code),
                )
            self.classes[cls["code"]] = cid

        parents = {e["parent"] for e in factory["equipements"] if e["parent"]}
        pending = list(factory["equipements"])
        while pending:
            placed = [e for e in pending if not e["parent"] or e["parent"] in self.machines]
            if not placed:
                raise LoaderError("hiérarchie d'équipements non résoluble (parent inconnu)")
            for eq in placed:
                mid = uid("machine", eq["code"])
                cur.execute(
                    "INSERT INTO machine (id, code, name, marque, model, equipement_mere, is_mere, "
                    "date_mise_service, equipement_class_id, statut_id) "
                    "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        mid,
                        eq["code"],
                        eq["name"],
                        eq.get("marque") or None,
                        eq.get("model") or None,
                        self.machines[eq["parent"]] if eq["parent"] else None,
                        eq["code"] in parents,
                        clock.day(eq["mise_en_service"]) if eq.get("mise_en_service") else None,
                        self.classes[eq["classe"]] if eq.get("classe") else None,
                        in_service,
                    ),
                )
                self.machines[eq["code"]] = mid
            pending = [e for e in pending if e not in placed]
        say(
            f"usine : {len(self.services)} services, {len(self.classes)} classes, "
            f"{len(self.machines)} équipements"
        )

        public_hash = bcrypt_hash(self.demo_password)
        for member in factory["equipe"]:
            login = member.get("login")
            if login is not None and login not in PUBLIC_LOGINS:
                raise LoaderError(f"adresse publique inattendue : {login}")
            email = login or (
                f"{slug(member['first_name'])}.{slug(member['last_name'])}@{COLLEAGUE_DOMAIN}"
            )
            # Collègue sans connexion : mot de passe aléatoire que personne ne connaît.
            password_hash = public_hash if login else bcrypt_hash(secrets.token_urlsafe(24))
            user_id = uid("user", member["key"])
            cur.execute(
                "INSERT INTO tunnel_user (id, email, password_hash, first_name, last_name, "
                "initial, role_id, created_at, updated_at, last_seen_changelog_version) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    user_id,
                    email,
                    password_hash,
                    member["first_name"],
                    member["last_name"],
                    member["initial"],
                    self.lookup(roles, member["role"], "rôle"),
                    clock.at(-365, "07:00"),
                    clock.at(-365, "07:00"),
                    current_api_version(),
                ),
            )
            self.users[member["key"]] = {
                "id": user_id,
                "initial": member["initial"],
                "name": f"{member['first_name']} {member['last_name']}",
                "role": member["role"],
            }
        # La vue d'accueil se règle par rôle : la direction technique pour RESP.
        cur.execute(
            "INSERT INTO role_home_view (role_id, home_view) VALUES (%s, 'direction_technique') "
            "ON CONFLICT (role_id) DO UPDATE SET home_view = EXCLUDED.home_view, updated_at = now()",
            (roles["RESP"],),
        )
        say(
            f"équipe : {len(self.users)} utilisateurs ({sum(1 for m in factory['equipe'] if m.get('login'))} comptes publics)"
        )

        for plan in factory["plans"]:
            pid = uid("plan", plan["code"])
            cur.execute(
                "INSERT INTO preventive_plan (id, code, label, equipement_class_id, trigger_type, "
                "periodicity_days, auto_accept, active, created_at, updated_at) "
                "VALUES (%s,%s,%s,%s,'periodicity',%s,%s,true,%s,%s)",
                (
                    pid,
                    plan["code"],
                    plan["label"],
                    self.lookup(self.classes, plan["classe"], "classe"),
                    plan["periodicity_days"],
                    plan["auto_accept"],
                    clock.at(-365, "07:00"),
                    clock.at(-365, "07:00"),
                ),
            )
            steps = {}
            for rank, step in enumerate(plan["steps"], start=1):
                sid = uid("step", f"{plan['code']}:{rank}")
                cur.execute(
                    "INSERT INTO preventive_plan_gamme_step (id, plan_id, label, sort_order, "
                    "optional) VALUES (%s,%s,%s,%s,%s)",
                    (sid, pid, step["label"], rank, step["optional"]),
                )
                steps[rank] = sid
            self.plans[plan["code"]] = {
                "id": pid,
                "steps": steps,
                "auto_accept": plan["auto_accept"],
                "label": plan["label"],
                "periodicity_days": plan["periodicity_days"],
            }
        say(f"préventif : {len(self.plans)} plans")

    # ── Demandes, interventions, tâches, actions ─────────────────────────────

    def user(self, key: str) -> dict:
        return self.lookup(self.users, key, "membre de l'équipe")

    def first_of_role(self, role: str) -> str:
        for key, data in self.users.items():
            if data["role"] == role:
                return key
        raise LoaderError(f"aucun membre de rôle {role} dans le scénario")

    @staticmethod
    def action_end(clock: Clock, action: dict) -> datetime:
        start = clock.at(action["le"], action["debut"])
        return start + timedelta(hours=action["heures"])

    def load_interventions(self, items: list[dict]) -> None:
        resp_key = self.first_of_role("RESP")
        techs = [k for k, u in self.users.items() if u["role"] == "TECH"]
        di_seq: dict[int, int] = defaultdict(int)
        ordered = sorted(enumerate(items), key=lambda p: (p[1]["signalee_le"], p[1]["key"]))
        for index, item in ordered:
            self.load_one(item, index, di_seq, resp_key, techs)
        say(
            f"{self.counts['request']} demandes, {self.counts['intervention']} interventions "
            f"({self.counts['occurrence']} préventives), {self.counts['task']} tâches, "
            f"{self.counts['action']} actions"
        )

    def load_one(self, item, index, di_seq, resp_key, techs) -> None:
        cur, clock = self.cur, self.clock
        key = item["key"]
        iv = item["intervention"]
        is_system = item["demandeur"] == "Système"
        plan = self.plans[iv["plan"]] if iv and iv.get("plan") else None
        created_at = clock.at(item["signalee_le"], "05:00", minutes=(index * 7) % 30)
        tech_key = iv["tech"] if iv else None
        # Auteur de la saisie de la demande : le technicien qui l'a reçue (ou à défaut un tour
        # de rôle) ; le préventif est créé par le système, sans auteur.
        creator = None
        if not is_system:
            creator = self.user(tech_key or techs[index % len(techs)])["id"]
        request_id = uid("request", key)
        machine_id = self.lookup(self.machines, item["equipement"], "équipement")
        year = created_at.year
        di_seq[year] += 1
        code = f"DI-{year}-{di_seq[year]:04d}"
        directe = item["origine"] == "directe"

        intervention_id = None
        statut_logs: list[tuple] = []  # (from, to, by_user_id|None, at, notes)
        if iv:
            intervention_id = uid("intervention", key)
            self.insert_intervention(item, iv, intervention_id, machine_id, plan, creator)
            self.counts["intervention"] += 1

        mtype = iv["type"] if iv else None
        cur.execute(
            "INSERT INTO intervention_request (id, code, machine_id, demandeur_nom, description, "
            "statut, intervention_id, created_at, updated_at, service_id, is_system, "
            "suggested_type_inter, origine, created_by, deadline) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (
                request_id,
                code,
                machine_id,
                SYSTEM_REQUESTER if is_system else item["demandeur"],
                item["description"],
                item["statut_demande"],
                intervention_id,
                created_at,
                created_at,
                self.services.get(item["service"]),
                is_system,
                mtype,
                item["origine"],
                creator,
                clock.day(item["signalee_le"]) if is_system else None,
            ),
        )
        self.counts["request"] += 1
        sys_reason = "SYSTEM_SCHEDULE"
        if is_system:
            self.audit(
                "request",
                request_id,
                "created",
                created_at,
                None,
                sys_reason,
                new={"code": code, "is_system": True, "statut": "nouvelle"},
                system=True,
            )
        else:
            self.audit(
                "request",
                request_id,
                "created",
                created_at,
                creator,
                "ROUTINE",
                new={"code": code, "demandeur_nom": item["demandeur"], "statut": "nouvelle"},
            )
        statut_logs.append((None, "nouvelle", creator, created_at, "Création demande"))

        if iv:
            self.load_intervention_life(
                item,
                iv,
                index,
                intervention_id,
                request_id,
                plan,
                is_system,
                directe,
                creator,
                created_at,
                statut_logs,
                resp_key,
            )
        else:
            self.request_decision(item, request_id, created_at, creator, statut_logs, resp_key)

        for old, new, by, at, notes in statut_logs:
            cur.execute(
                "INSERT INTO request_status_log (request_id, status_from, status_to, changed_by, "
                "notes, date) VALUES (%s,%s,%s,%s,%s,%s)",
                (request_id, old, new, by, notes, at),
            )
        last = statut_logs[-1][3]
        cur.execute(
            "UPDATE intervention_request SET updated_at = %s WHERE id = %s", (last, request_id)
        )

    def request_decision(self, item, request_id, created_at, creator, logs, resp_key) -> None:
        """Demande sans intervention : en attente, rejetée (décision de la direction) ou nouvelle."""
        clock = self.clock
        status = item["statut_demande"]
        if status == "nouvelle":
            return
        at = (
            created_at + timedelta(days=1, hours=3)
            if item["signalee_le"] < 0
            else created_at + timedelta(hours=4)
        )
        at = min(at, datetime.combine(clock.today, time(23, 0)))
        if status == "en_attente":
            by = creator
            logs.append(("nouvelle", "en_attente", by, at, "Mise en attente"))
            self.audit(
                "request",
                request_id,
                "statut_changed",
                at,
                by,
                "ROUTINE",
                old={"statut": "nouvelle"},
                new={"statut": "en_attente"},
            )
        elif status == "rejetee":
            by = self.user(resp_key)["id"]
            reason = item.get("motif_rejet") or "Hors périmètre de la maintenance"
            logs.append(("nouvelle", "rejetee", by, at, reason))
            self.audit(
                "request",
                request_id,
                "statut_changed",
                at,
                by,
                "OTHER",
                old={"statut": "nouvelle"},
                new={"statut": "rejetee"},
                text=reason,
            )
        else:
            raise LoaderError(f"demande {item['key']} : statut {status} sans intervention")

    def insert_intervention(self, item, iv, intervention_id, machine_id, plan, creator) -> None:
        clock = self.clock
        tech = self.user(iv["tech"])
        opened = clock.day(iv["ouverte_le"])
        status = iv["statuts"][-1]["to"] if iv["statuts"] else "ouvert"
        last_by = self.user(iv["statuts"][-1]["par"])["id"] if iv["statuts"] else None
        machine_code = item["equipement"]
        self.cur.execute(
            "INSERT INTO intervention (id, code, title, machine_id, type_inter, priority, "
            "reported_by, tech_initials, status_actual, updated_by, printed_fiche, "
            "reported_date, plan_id, tech_id) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,false,%s,%s,%s)",
            (
                intervention_id,
                f"{machine_code}-{iv['type']}-{opened:%Y%m%d}-{tech['initial']}",
                iv["title"],
                machine_id,
                iv["type"],
                iv["priority"],
                SYSTEM_REQUESTER if item["demandeur"] == "Système" else item["demandeur"],
                tech["initial"],
                status,
                last_by,
                clock.day(item["signalee_le"]),
                plan["id"] if plan else None,
                tech["id"],
            ),
        )

    def load_intervention_life(
        self,
        item,
        iv,
        index,
        intervention_id,
        request_id,
        plan,
        is_system,
        directe,
        creator,
        created_at,
        request_logs,
        resp_key,
    ):
        """Journaux de statut, occurrence, tâches, actions et audit d'une intervention."""
        cur, clock = self.cur, self.clock
        tech = self.user(iv["tech"])
        opened_at = clock.at(iv["ouverte_le"], "05:30", minutes=(index * 11) % 30)
        auto = bool(plan and plan["auto_accept"])
        # Fin d'activité de chaque jour : un changement de statut vient après les actions du jour.
        day_end: dict[int, datetime] = {}
        for action in iv["actions"]:
            end = self.action_end(clock, action)
            day_end[action["le"]] = max(day_end.get(action["le"], end), end)

        # Journal de statut de l'intervention : création, puis chaque changement du scénario.
        log_rows = [(None, "ouvert", None, creator, opened_at, "Création intervention")]
        previous = "ouvert"
        for step_no, step in enumerate(iv["statuts"]):
            base = clock.at(step["le"], "17:00", minutes=step_no)
            at = max(base, day_end.get(step["le"], base) + timedelta(minutes=10 + step_no))
            by = self.user(step["par"])["id"]
            log_rows.append((previous, step["to"], by, by, at, None))
            previous = step["to"]
        for old, new, technician, by, at, notes in log_rows:
            cur.execute(
                "INSERT INTO intervention_status_log (id, status_from, status_to, technician_id, "
                "intervention_id, date, notes, changed_by) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (str(uuid.uuid4()), old, new, technician, intervention_id, at, notes, by),
            )
        for old, new, _technician, by, at, _notes in log_rows[1:]:
            self.audit(
                "intervention",
                intervention_id,
                "status_actual_changed",
                at,
                by,
                "ROUTINE",
                old={"status_actual": old},
                new={"status_actual": new},
            )
        closed = bool(iv["statuts"]) and iv["statuts"][-1]["to"] == "ferme"
        close_at = log_rows[-1][4] if closed else None
        closer = log_rows[-1][3] if closed else None

        # Acceptation de la demande par la création de l'intervention.
        accepted_by = None if auto else tech["id"]
        request_logs.append(
            (
                "nouvelle",
                "acceptee",
                accepted_by,
                opened_at,
                "Acceptation automatique du préventif"
                if auto
                else "Intervention créée manuellement",
            )
        )
        self.audit(
            "request",
            request_id,
            "statut_changed",
            opened_at,
            accepted_by,
            "SYSTEM_SCHEDULE" if auto else "ROUTINE",
            old={"statut": "nouvelle"},
            new={"statut": "acceptee"},
            system=auto,
        )
        self.audit(
            "intervention",
            intervention_id,
            "created",
            opened_at,
            accepted_by,
            "SYSTEM_SCHEDULE" if auto else "ROUTINE",
            new={"title": iv["title"], "type_inter": iv["type"], "status_actual": "ouvert"},
            system=auto,
        )
        if closed:
            # Ce que fn_sync_status_log_to_intervention fait à la fermeture : la demande liée
            # passe à clôturée (cascade du système, auteur = celui qui ferme).
            request_logs.append(
                (
                    "acceptee",
                    "cloturee",
                    closer,
                    close_at,
                    "Clôture automatique suite à la fermeture de l'intervention",
                )
            )
            self.audit(
                "request",
                request_id,
                "statut_changed",
                close_at,
                closer,
                "SYSTEM_CASCADE",
                old={"statut": "acceptee"},
                new={"statut": "cloturee"},
                system=True,
            )

        occurrence_id = None
        if plan:
            occurrence_id = self.insert_occurrence(
                item, plan, request_id, intervention_id, created_at, closed, close_at, closer
            )

        self.load_tasks_and_actions(
            item,
            iv,
            index,
            intervention_id,
            plan,
            occurrence_id,
            created_at,
            opened_at,
            close_at,
            resp_key,
        )
        return close_at

    def insert_occurrence(
        self, item, plan, request_id, intervention_id, created_at, closed, close_at, closer
    ) -> str:
        occurrence_id = uid("occurrence", item["key"])
        machine_id = self.machines[item["equipement"]]
        status = "completed" if closed else "in_progress"
        self.cur.execute(
            "INSERT INTO preventive_occurrence (id, plan_id, machine_id, scheduled_date, "
            "triggered_at, di_id, intervention_id, status, created_at) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (
                occurrence_id,
                plan["id"],
                machine_id,
                self.clock.day(item["signalee_le"]),
                created_at,
                request_id,
                intervention_id,
                status,
                created_at,
            ),
        )
        self.counts["occurrence"] += 1
        self.audit(
            "preventive_occurrence",
            occurrence_id,
            "created",
            created_at,
            None,
            "SYSTEM_SCHEDULE",
            new={"status": "pending"},
            system=True,
        )
        # Rattachement à l'intervention (in_progress), puis fin à la fermeture.
        self.audit(
            "preventive_occurrence",
            occurrence_id,
            "status_changed",
            created_at,
            None,
            "SYSTEM_SCHEDULE",
            old={"status": "pending"},
            new={"status": "in_progress"},
            system=True,
        )
        if closed:
            self.audit(
                "preventive_occurrence",
                occurrence_id,
                "status_changed",
                close_at,
                closer,
                "SYSTEM_CASCADE",
                old={"status": "in_progress"},
                new={"status": "completed"},
                system=True,
            )
        return occurrence_id

    def load_tasks_and_actions(
        self,
        item,
        iv,
        index,
        intervention_id,
        plan,
        occurrence_id,
        created_at,
        opened_at,
        close_at,
        resp_key,
    ) -> None:
        cur, clock = self.cur, self.clock
        key = item["key"]
        last_action: dict[str, dict] = {}
        for action in iv["actions"]:
            for task_key in action["taches"]:
                last_action[task_key] = (
                    action  # la dernière action liée l'emporte (ordre du scénario)
                )

        task_ids: dict[str, str] = {}
        for order, task in enumerate(iv["taches"], start=1):
            task_id = uid("task", f"{key}:{task['key']}")
            task_ids[task["key"]] = task_id
            origin = task["origin"]
            assigned = self.user(task["assigned_to"])["id"] if task.get("assigned_to") else None
            if origin == "plan":
                if not plan:
                    raise LoaderError(f"{key} : tâche de plan sur une intervention sans plan")
                step = self.lookup(plan["steps"], task["gamme_step"], "étape de gamme")
                creator = None
                created = created_at
            else:
                step = None
                creator = self.user(
                    resp_key if origin == "resp" else (task.get("assigned_to") or iv["tech"])
                )["id"]
                created = opened_at + timedelta(minutes=order)
            status = task["status"]
            closed_by = closed_at = None
            if status in ("done", "skipped"):
                act = last_action.get(task["key"])
                closed_by = self.user(act["tech"])["id"] if act else (assigned or creator)
                closed_at = self.action_end(clock, act) if act else (close_at or created)
            cur.execute(
                "INSERT INTO intervention_task (id, gamme_step_id, intervention_id, status, "
                "skip_reason, updated_at, closed_by, occurrence_id, label, origin, optional, "
                "assigned_to, sort_order, created_by, created_at) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    task_id,
                    step,
                    intervention_id,
                    status,
                    SKIP_REASON if status == "skipped" else None,
                    closed_at or created,
                    closed_by,
                    occurrence_id if origin == "plan" else None,
                    task["label"],
                    origin,
                    task["optional"],
                    assigned,
                    order,
                    creator,
                    created,
                ),
            )
            self.counts["task"] += 1
            self.audit_task(task_id, origin, creator, created, status, closed_by, closed_at)

        for number, action in enumerate(iv["actions"]):
            self.insert_action(key, action, intervention_id, task_ids, number)

    def audit_task(self, task_id, origin, creator, created, status, closed_by, closed_at) -> None:
        if origin == "plan":
            self.audit(
                "task",
                task_id,
                "created",
                created,
                None,
                "SYSTEM_SCHEDULE",
                new={"origin": "plan", "status": "todo"},
                system=True,
            )
        else:
            self.audit(
                "task",
                task_id,
                "created",
                created,
                creator,
                "ROUTINE",
                new={"origin": origin, "status": "todo"},
            )
        if status == "done":
            self.audit(
                "task",
                task_id,
                "status_changed",
                closed_at,
                closed_by,
                "ROUTINE",
                old={"status": "todo"},
                new={"status": "done"},
            )
        elif status == "skipped":
            self.audit(
                "task",
                task_id,
                "task_skipped",
                closed_at,
                closed_by,
                "TASK_NO_LONGER_NEEDED",
                old={"status": "todo"},
                new={"status": "skipped", "skip_reason": SKIP_REASON},
            )

    def insert_action(self, key, action, intervention_id, task_ids, number) -> None:
        cur, clock = self.cur, self.clock
        action_id = uid("action", f"{key}:{action['key']}")
        self.action_ids[f"{key}:{action['key']}"] = action_id
        tech = self.user(action["tech"])
        created = clock.at(action["le"], action["debut"])
        cur.execute(
            "SELECT id FROM action_subcategory WHERE code = %s", (action["sous_categorie"],)
        )
        row = cur.fetchone()
        if not row:
            raise LoaderError(f"sous-catégorie inconnue : {action['sous_categorie']}")
        cur.execute(
            "INSERT INTO intervention_action (id, intervention_id, description, time_spent, "
            "updated_at, action_subcategory, created_at, tech, complexity_score, "
            "complexity_factor, action_start) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (
                action_id,
                intervention_id,
                action["description"],
                action["heures"],
                created,
                row[0],
                created,
                tech["id"],
                action["complexite"],
                action.get("facteur"),
                action["debut"],
            ),
        )
        self.counts["action"] += 1
        self.audit(
            "action",
            action_id,
            "created",
            created,
            tech["id"],
            "ROUTINE",
            new={"time_spent": action["heures"], "complexity_score": action["complexite"]},
        )
        for task_key in action["taches"]:
            cur.execute(
                "INSERT INTO intervention_action_task (action_id, task_id) VALUES (%s,%s)",
                (action_id, self.lookup(task_ids, task_key, "tâche")),
            )
        for need in action.get("demandes_achat", []):
            self.purchase_need(need, action, action_id, tech)

    # ── Achats ────────────────────────────────────────────────────────────────

    def purchase_need(self, need, action, action_id, tech) -> None:
        """Besoin exprimé par un technicien : repris dans achats.json s'il existe, sinon
        la demande est créée ici avec les seules données du technicien."""
        entry = self.purchase_requests.get(need["key"])
        if entry is None:
            entry = self.purchase_requests[need["key"]] = {
                "need": {
                    "key": need["key"],
                    "article": None,
                    "item_label": need["besoin"],
                    "quantity": need["quantity"],
                    "unit": need["unit"],
                    "urgency": need["urgency"],
                    "demandeur": None,
                    "le": action["le"],
                    "reason": "",
                },
                "tech": tech,
            }
        entry.setdefault("actions", []).append(action_id)

    def load_purchases(self, shop: dict) -> None:
        cur, clock = self.cur, self.clock
        for fam in shop["familles"]:
            cur.execute(
                "INSERT INTO stock_family (code, label) VALUES (%s,%s)", (fam["code"], fam["label"])
            )
            for sub in fam["sous_familles"]:
                cur.execute(
                    "INSERT INTO stock_sub_family (family_code, code, label) VALUES (%s,%s,%s)",
                    (fam["code"], sub["code"], sub["label"]),
                )
        makers = {}
        for maker in shop["fabricants"]:
            makers[maker["key"]] = uid("maker", maker["key"])
            cur.execute(
                "INSERT INTO manufacturer_item (id, manufacturer_name, manufacturer_ref, "
                "designation) VALUES (%s,%s,%s,%s)",
                (makers[maker["key"]], maker["name"], maker["ref"], maker.get("designation")),
            )
        for sup in shop["fournisseurs"]:
            self.suppliers[sup["code"]] = uid("supplier", sup["code"])
            cur.execute(
                "INSERT INTO supplier (id, code, name, contact_name, email, phone, created_at, "
                "updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    self.suppliers[sup["code"]],
                    sup["code"],
                    sup["name"],
                    sup.get("contact_name"),
                    sup.get("email"),
                    sup.get("phone"),
                    clock.at(-365, "07:30"),
                    clock.at(-365, "07:30"),
                ),
            )
        for art in shop["articles"]:
            item_id = uid("article", art["key"])
            self.stock_items[art["key"]] = item_id
            cur.execute(
                "INSERT INTO stock_item (id, name, family_code, sub_family_code, spec, dimension, "
                "quantity, unit, location, manufacturer_item_id) "
                "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    item_id,
                    art["name"],
                    art["famille"],
                    art["sous_famille"],
                    art.get("spec") or None,
                    art.get("dimension") or "",
                    art["quantity"],
                    art["unit"],
                    art["location"],
                    makers[art["fabricant"]] if art.get("fabricant") else None,
                ),
            )
            for link in art["fournisseurs"]:
                sup_id = self.lookup(self.suppliers, link["fournisseur"], "fournisseur")
                self.stock_supplier_refs[(art["key"], link["fournisseur"])] = link["supplier_ref"]
                cur.execute(
                    "INSERT INTO stock_item_supplier (stock_item_id, supplier_id, supplier_ref, "
                    "unit_price, delivery_time_days, is_preferred, manufacturer_item_id, "
                    "created_at, updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        item_id,
                        sup_id,
                        link["supplier_ref"],
                        link["unit_price"],
                        link.get("delivery_time_days"),
                        link["is_preferred"],
                        makers[art["fabricant"]] if art.get("fabricant") else None,
                        clock.at(-365, "07:30"),
                        clock.at(-365, "07:30"),
                    ),
                )
        say(
            f"catalogue : {len(shop['articles'])} articles, {len(shop['fournisseurs'])} fournisseurs"
        )

        for need in shop["demandes"]:
            entry = self.purchase_requests.setdefault(need["key"], {"need": need, "tech": None})
            entry["need"] = need
        self.insert_purchase_requests()
        self.insert_orders(shop["commandes"])

    def finalize_needs_without_catalogue(self) -> None:
        """Sans achats.json : seules les demandes des techniciens existent (sans article)."""
        self.insert_purchase_requests()

    def insert_purchase_requests(self) -> None:
        cur, clock = self.cur, self.clock
        seq: dict[int, int] = defaultdict(int)
        for key, entry in sorted(
            self.purchase_requests.items(), key=lambda kv: (kv[1]["need"]["le"], kv[0])
        ):
            need = entry["need"]
            who = self.user(need["demandeur"]) if need.get("demandeur") else entry["tech"]
            if who is None:
                raise LoaderError(f"demande d'achat {key} sans demandeur")
            at = clock.at(need["le"], "08:00", minutes=sum(map(ord, key)) % 50)
            seq[at.year] += 1
            pr_id = uid("purchase_request", key)
            entry["id"] = pr_id
            entry["created"] = at
            entry["who"] = who
            entry["code"] = f"DA-{at.year}-{seq[at.year]:04d}"
            item = self.stock_items.get(need["article"]) if need.get("article") else None
            entry["article"] = need.get("article")
            cur.execute(
                "INSERT INTO purchase_request (id, status, stock_item_id, item_label, quantity, "
                "unit, requested_by, urgency, reason, created_at, updated_at, code, "
                "requested_by_id) VALUES (%s,'open',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    pr_id,
                    item,
                    need["item_label"],
                    need["quantity"],
                    need["unit"],
                    who["name"],
                    need["urgency"],
                    need.get("reason") or None,
                    at,
                    at,
                    entry["code"],
                    who["id"],
                ),
            )
            self.counts["purchase_request"] += 1
            self.audit(
                "purchase_request",
                pr_id,
                "created",
                at,
                who["id"],
                "ROUTINE",
                new={"code": entry["code"], "item_label": need["item_label"]},
            )
            for action_id in entry.get("actions", []):
                cur.execute(
                    "INSERT INTO intervention_action_purchase_request "
                    "(intervention_action_id, purchase_request_id) VALUES (%s,%s)",
                    (action_id, pr_id),
                )
        # Une demande d'achat liée à une action doit exister dans le scénario des achats
        # ou venir du technicien : rien à vérifier de plus ici.
        say(f"achats : {self.counts['purchase_request']} demandes d'achat")

    def insert_orders(self, orders: list[dict]) -> None:
        cur, clock = self.cur, self.clock
        buyer = self.user(self.first_of_role("ACHETEUR"))
        received_status: dict[str, str] = {}
        for order in sorted(orders, key=lambda o: (o["creee_le"], o["key"])):
            order_id = uid("order", order["key"])
            created = clock.at(order["creee_le"], "08:30")
            ordered = (
                clock.at(order["commandee_le"], "09:00")
                if order.get("commandee_le") is not None
                else None
            )
            received = (
                clock.at(order["recue_le"], "10:00") if order.get("recue_le") is not None else None
            )
            cur.execute("SELECT nextval('supplier_order_seq')")
            number = f"CMD-{created:%Y%m%d}-{cur.fetchone()[0]:04d}"
            status = order["status"]
            cur.execute(
                "INSERT INTO supplier_order (id, order_number, supplier_id, status, ordered_at, "
                "received_at, created_at, updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (
                    order_id,
                    number,
                    self.lookup(self.suppliers, order["fournisseur"], "fournisseur"),
                    status,
                    ordered,
                    received,
                    created,
                    created,
                ),
            )
            self.counts["order"] += 1
            self.audit(
                "supplier_order",
                order_id,
                "created",
                created,
                buyer["id"],
                "ROUTINE",
                new={"order_number": number, "status": "OPEN"},
            )
            selected = status in ("CLOSED", "RECEIVED")
            for line in order["lignes"]:
                line_id = str(uuid.uuid4())
                art = line["article"]
                supplier_ref = self.stock_supplier_refs.get((art, order["fournisseur"]))
                cur.execute(
                    "INSERT INTO supplier_order_line (id, supplier_order_id, stock_item_id, "
                    "supplier_ref_snapshot, quantity, unit_price, quantity_received, created_at, "
                    "updated_at, is_selected) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                    (
                        line_id,
                        order_id,
                        self.lookup(self.stock_items, art, "article"),
                        supplier_ref,
                        line["quantity"],
                        line["unit_price"],
                        line["quantity_received"],
                        created,
                        received or ordered or created,
                        selected,
                    ),
                )
                for need_key in line["demandes"]:
                    entry = self.lookup(self.purchase_requests, need_key, "demande d'achat")
                    cur.execute(
                        "INSERT INTO supplier_order_line_purchase_request "
                        "(supplier_order_line_id, purchase_request_id, quantity, created_at) "
                        "VALUES (%s,%s,%s,%s)",
                        (line_id, entry["id"], entry["need"]["quantity"], created),
                    )
                    rank = {"open": 0, "ordered": 1, "received": 2}
                    new = (
                        "received"
                        if selected
                        else ("ordered" if status in ("SENT", "ACK") else "open")
                    )
                    if rank[new] > rank[received_status.get(need_key, "open")]:
                        received_status[need_key] = new
            cur.execute(
                "UPDATE supplier_order SET updated_at = %s WHERE id = %s",
                (received or ordered or created, order_id),
            )
        for need_key, status in received_status.items():
            cur.execute(
                "UPDATE purchase_request SET status = %s WHERE id = %s",
                (status, self.purchase_requests[need_key]["id"]),
            )
        say(f"commandes : {self.counts['order']}")

    # ── Orchestration ─────────────────────────────────────────────────────────

    def run(self) -> None:
        factory = read_json(self.dir / "usine.json")
        interventions = read_json(self.dir / "interventions.json")
        shop_path = self.dir / "achats.json"
        shop = read_json(shop_path) if shop_path.exists() else None
        self.guard()
        self.set_triggers(False)
        self.load_factory(factory)
        self.load_interventions(interventions)
        if shop:
            self.load_purchases(shop)
        else:
            say("achats.json absent : seules les demandes d'achat des techniciens sont chargées")
            self.finalize_needs_without_catalogue()
        self.flush_audit()
        self.set_triggers(True)
        self.check_triggers_enabled()


def main(argv: Optional[list[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Charge le scénario de la base de démonstration")
    parser.add_argument("--today", help="jour de référence AAAA-MM-JJ (défaut : aujourd'hui)")
    parser.add_argument("--scenario", default=str(SCENARIO_DIR), help="dossier du scénario")
    args = parser.parse_args(argv)
    try:
        url = os.environ.get("DATABASE_URL_OWNER", "").strip()
        if not url:
            raise LoaderError("variable d'environnement DATABASE_URL_OWNER manquante")
        password = os.environ.get("DEMO_PASSWORD", "")
        if not password:
            raise LoaderError("variable d'environnement DEMO_PASSWORD manquante")
        check_password(password)
        today = date.fromisoformat(args.today) if args.today else date.today()
        conn = psycopg2.connect(url)
        try:
            Loader(conn, Clock(today), Path(args.scenario), password).run()
            conn.commit()
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()
    except LoaderError as exc:
        sys.stderr.write(f"[demo] ERREUR : {exc}\n")
        return 1
    except Exception as exc:  # message court pour l'opérateur, détail dans la trace
        sys.stderr.write(f"[demo] ERREUR inattendue : {type(exc).__name__}: {exc}\n")
        return 1
    say("scénario chargé")
    return 0


if __name__ == "__main__":
    sys.exit(main())
