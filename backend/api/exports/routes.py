import hashlib
import logging
import re
import zipfile
from datetime import date, datetime, timedelta
from io import BytesIO
from typing import List, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, Response
from fastapi.responses import StreamingResponse
from weasyprint import HTML

from api.audits.declaration import audit
from api.auth.permissions import require_authenticated
from api.errors.exceptions import NotFoundError, RenderError, ValidationError
from api.exports.pdf_generator import PDFGenerator
from api.exports.planning_repo import PlanningRepository
from api.exports.qr_generator import QRGenerator
from api.exports.repo import ExportRepository
from api.exports.schemas import MarkPrintedRequest
from api.limiter import limiter
from api.utils.response import single

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/exports", tags=["exports"], dependencies=[Depends(require_authenticated)]
)

# Plafond de fiches par export de masse : au-delà, on refuse plutôt que de tronquer.
MAX_BULK_SHEETS = 100


def _parse_period(date_from: str, date_to: str):
    """Valide la période AAAA-MM-JJ (bornes incluses, date_from <= date_to)."""
    try:
        start = date.fromisoformat(date_from)
        end = date.fromisoformat(date_to)
    except ValueError:
        raise ValidationError("Format de date invalide. Attendu AAAA-MM-JJ")
    if start > end:
        raise ValidationError("date_from doit être antérieure ou égale à date_to")
    return start, end


def _unique_pdf_names(codes: List[str]) -> List[str]:
    """Noms de fichiers PDF assainis (même règle que l'export unitaire), uniques."""
    used: dict = {}
    names = []
    for code in codes:
        base = re.sub(r'[^\w\-]', '_', str(code))
        used[base] = used.get(base, 0) + 1
        suffix = "" if used[base] == 1 else f"_{used[base]}"
        names.append(f"{base}{suffix}.pdf")
    return names


def _merge_pdf(htmls: List[str]) -> bytes:
    """Un seul PDF : rendu de chaque fiche puis concaténation des pages (WeasyPrint)."""
    try:
        docs = [HTML(string=h).render() for h in htmls]
        pages = [p for d in docs for p in d.pages]
        return docs[0].copy(pages).write_pdf()
    except Exception as e:
        logger.error("Erreur assemblage PDF : %s", e, exc_info=e)
        raise RenderError("Erreur génération PDF")


def _select_closed(
    date_from: str, date_to: str, equipement_id: Optional[str], include_printed: bool
):
    """
    Valide la demande et renvoie (début, fin, interventions fermées sélectionnées).

    Sélection commune à l'export et au marquage : une seule requête (list_closed_interventions),
    donc jamais deux sélections divergentes.
    """
    start, end = _parse_period(date_from, date_to)
    if equipement_id:
        try:
            UUID(equipement_id)
        except ValueError:
            raise ValidationError("Format UUID invalide pour equipement_id")

    rows = ExportRepository().list_closed_interventions(
        start, end, equipement_id, MAX_BULK_SHEETS + 1, include_printed
    )
    if len(rows) > MAX_BULK_SHEETS:
        raise ValidationError(
            f"Plus de {MAX_BULK_SHEETS} fiches sur cette période : réduisez la période "
            "ou filtrez par équipement"
        )
    if not rows:
        detail = "" if include_printed else " non imprimée"
        raise NotFoundError(f"Aucune intervention fermée{detail} sur cette période")
    return start, end, rows


# Déclarée avant /interventions/{intervention_id}/pdf : aucun conflit de chemin.
@router.get("/interventions/closed")
@limiter.limit("2/minute")
def export_closed_interventions(
    request: Request,
    date_from: str = Query(..., description="Début de période AAAA-MM-JJ (inclus)"),
    date_to: str = Query(..., description="Fin de période AAAA-MM-JJ (incluse)"),
    equipement_id: Optional[str] = Query(None, description="UUID de l'équipement (optionnel)"),
    format: Literal["zip", "pdf"] = Query(..., description="zip (un PDF par fiche) ou pdf"),
    include_printed: bool = Query(
        False, description="Inclure les fiches déjà imprimées (archivées) ; exclues par défaut"
    ),
):
    """
    Export de masse des fiches des interventions fermées sur une période.

    La date retenue est celle du dernier passage à 'ferme'. Plafond de MAX_BULK_SHEETS fiches.
    Fiches déjà imprimées exclues sauf `include_printed`. Ordre : équipement, puis date de
    fermeture ; dans le zip, les noms sont numérotés (001_, 002_...) pour garder cet ordre.
    Réservé à ADMIN et RESP (matrice des droits, db/default_permissions.py).
    """
    start, end, rows = _select_closed(date_from, date_to, equipement_id, include_printed)
    repo = ExportRepository()

    # Même chemin que l'export unitaire : mêmes données, même gabarit
    generator = PDFGenerator()
    datas = [repo.get_intervention_export_data(r["id"]) for r in rows]
    htmls = [generator.render_html(d) for d in datas]
    base_name = f"fiches-fermees_{start.isoformat()}_{end.isoformat()}"

    if format == "zip":
        names = _unique_pdf_names([d.get("code") or r["id"] for d, r in zip(datas, rows)])
        # Numérotés : l'explorateur de fichiers range par nom, l'ordre de sortie reste visible.
        names = [f"{rank:03d}_{name}" for rank, name in enumerate(names, start=1)]
        buffer = BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, html in zip(names, htmls):
                archive.writestr(name, generator.generate_pdf(html))
        content, media_type, disposition = buffer.getvalue(), "application/zip", "attachment"
        filename = f"{base_name}.zip"
    else:
        content = _merge_pdf(htmls)
        media_type, disposition, filename = "application/pdf", "inline", f"{base_name}.pdf"

    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'{disposition}; filename="{filename}"',
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


# events_only : la route touche plusieurs interventions ; le repo dépose un événement par fiche
# réellement marquée, avec le motif routinier de l'entité intervention (comme le PUT unitaire).
@router.post(
    "/interventions/closed/mark-printed",
    dependencies=[audit("intervention", events_only=True)],
)
@limiter.limit("10/minute")
def mark_closed_interventions_printed(request: Request, body: MarkPrintedRequest):
    """
    Marque comme imprimées les fiches d'un export de masse (même sélection que l'export).

    L'export lui-même reste sans effet de bord ; ce marquage est un acte distinct.
    Idempotent. Ne touche ni au statut ni au journal des statuts.
    Trace une ligne d'audit par fiche réellement marquée (auteur : jeton).
    Réservé à ADMIN et RESP (matrice des droits, db/default_permissions.py).
    """
    _, _, rows = _select_closed(
        body.date_from, body.date_to, body.equipement_id, body.include_printed
    )
    marked = ExportRepository().mark_interventions_printed([r["id"] for r in rows])
    return single({"marked": marked, "total": len(rows)})


@router.get("/interventions/{intervention_id}/pdf")
@limiter.limit("5/minute")
def export_intervention_pdf(intervention_id: str, request: Request):
    """
    Export PDF d'une intervention (authentification requise)

    Args:
        intervention_id: UUID de l'intervention

    Returns:
        Fichier PDF avec nom basé sur le code intervention
    """
    # Validate UUID format
    try:
        UUID(intervention_id)
    except ValueError:
        raise ValidationError("Format UUID invalide")

    # Fetch intervention data
    repo = ExportRepository()
    data = repo.get_intervention_export_data(intervention_id)

    # Generate PDF
    generator = PDFGenerator()
    html = generator.render_html(data)
    pdf_bytes = generator.generate_pdf(html)

    # Prepare response — sanitize filename to prevent header injection
    safe_code = re.sub(r'[^\w\-]', '_', str(data.get('code') or intervention_id))
    filename = f"{safe_code}.pdf"
    etag = hashlib.md5(pdf_bytes).hexdigest()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "ETag": etag,
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )


@router.get("/interventions/{intervention_id}/qrcode")
def export_intervention_qrcode(intervention_id: str):
    """
    Génère QR code pour intervention (public, pas d'authentification)

    Le QR code pointe vers la page de détail de l'intervention dans le frontend.
    Conçu pour être imprimé sur les rapports physiques.

    Args:
        intervention_id: UUID de l'intervention

    Returns:
        Image PNG du QR code
    """
    # Validate UUID format
    try:
        UUID(intervention_id)
    except ValueError:
        raise ValidationError("Format UUID invalide")

    # Get intervention code for filename
    repo = ExportRepository()
    code = repo.get_intervention_code(intervention_id)

    # Generate QR code
    generator = QRGenerator()
    qr_img = generator.generate_qr_code(intervention_id)

    # Convert to bytes
    buffer = BytesIO()
    qr_img.save(buffer, format="PNG")
    buffer.seek(0)

    safe_code = re.sub(r'[^\w\-]', '_', str(code))
    return StreamingResponse(
        buffer,
        media_type="image/png",
        headers={
            "Content-Disposition": f'inline; filename="{safe_code}.png"',
            "Cache-Control": "public, max-age=3600",
        },
    )


# ── Helpers pour le calcul des bornes de semaine ISO ──────────────────────────

_FR_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
_FR_MONTHS = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]


def _parse_iso_week(week_iso: str):
    """Retourne (monday, friday, week_number, year) depuis 'YYYY-Www'."""
    try:
        monday = datetime.strptime(f"{week_iso}-1", "%G-W%V-%u").date()
    except ValueError:
        raise ValidationError(
            f"Format de semaine invalide : '{week_iso}'. Attendu YYYY-Www (ex: 2026-W24)"
        )
    friday = monday + timedelta(days=4)
    iso_cal = monday.isocalendar()
    return monday, friday, iso_cal[1], iso_cal[0]


def _current_iso_week() -> str:
    iso = datetime.now().isocalendar()
    return f"{iso[0]}-W{iso[1]:02d}"


def _week_range_label(monday: date, friday: date) -> str:
    """Ex: '9 – 13 juin 2026' ou '30 mars – 3 avril 2026'."""
    if monday.month == friday.month:
        return f"{monday.day}\u2013{friday.day} {_FR_MONTHS[friday.month - 1]} {friday.year}"
    return (
        f"{monday.day} {_FR_MONTHS[monday.month - 1]}"
        f" – {friday.day} {_FR_MONTHS[friday.month - 1]} {friday.year}"
    )


def _day_label(d: date) -> str:
    """Ex: 'Lundi 9 juin'."""
    return f"{_FR_DAYS[d.weekday()]} {d.day} {_FR_MONTHS[d.month - 1]}"


# ── Route fiche de semaine ────────────────────────────────────────────────────


@router.get("/planning/semaine")
@limiter.limit("5/minute")
def export_planning_semaine(
    request: Request,
    tech_id: str = Query(..., description="UUID du technicien"),
    week: Optional[str] = Query(
        None, description="Semaine ISO YYYY-Www (défaut: semaine courante)"
    ),
):
    """
    Export PDF fiche de semaine pour un technicien.

    Args:
        tech_id: UUID du technicien
        week: Semaine ISO format YYYY-Www (ex: 2026-W24). Défaut: semaine courante.

    Returns:
        PDF binaire avec les tâches de la semaine groupées par jour.
    """
    try:
        UUID(tech_id)
    except ValueError:
        raise ValidationError("Format UUID invalide pour tech_id")

    week_iso = week or _current_iso_week()
    monday, friday, week_number, year = _parse_iso_week(week_iso)

    # Semaine suivante pour les extras
    next_monday = monday + timedelta(days=7)
    next_friday = friday + timedelta(days=7)

    repo = PlanningRepository()

    tech = repo.get_tech_info(tech_id)

    # Tâches semaine courante
    tasks_raw = repo.get_tasks_for_week(tech_id, monday, friday)

    # Grouper par jour
    tasks_by_day = []
    current_day = None
    current_tasks = []
    for task in tasks_raw:
        d = task["due_date"]
        if isinstance(d, datetime):
            d = d.date()
        label = _day_label(d)
        if label != current_day:
            if current_day is not None:
                tasks_by_day.append({"day_label": current_day, "tasks": current_tasks})
            current_day = label
            current_tasks = []
        current_tasks.append(
            {
                "equip_code": task.get("equip_code") or "",
                "inter_code": task.get("inter_code") or "",
                "type": task.get("type", "projet"),
                "label": task.get("label") or "",
            }
        )
    if current_day is not None:
        tasks_by_day.append({"day_label": current_day, "tasks": current_tasks})

    # Extras semaine suivante (max 5)
    extras_raw = repo.get_tasks_for_week(tech_id, next_monday, next_friday)
    extras = [
        {
            "equip_code": t.get("equip_code") or "",
            "inter_code": t.get("inter_code") or "",
            "type": t.get("type", "projet"),
            "label": t.get("label") or "",
            "week_label": f"S{next_monday.isocalendar()[1]}",
        }
        for t in extras_raw[:5]
    ]

    next_week_number = next_monday.isocalendar()[1]
    extras_week_label = (
        f"Semaine {next_week_number} ({_week_range_label(next_monday, next_friday)})"
    )

    data = {
        "tech": {
            "id": str(tech["id"]),
            "initial": tech.get("initial") or "",
            "first_name": tech.get("first_name") or "",
            "last_name": tech.get("last_name") or "",
        },
        "week_label": f"Semaine {week_number}",
        "week_range": _week_range_label(monday, friday),
        "week_iso": week_iso,
        "tasks_by_day": tasks_by_day,
        "extras": extras,
        "extras_week_label": extras_week_label,
        "now": datetime.now().strftime("%d/%m/%Y"),
    }

    generator = PDFGenerator()
    html = generator.render_html(data, template_file="fiche_semaine_v1.html")
    pdf_bytes = generator.generate_pdf(html)

    safe_initial = re.sub(r'[^\w]', '', tech.get("initial") or "TECH")
    safe_week = re.sub(r'[^\w\-]', '_', week_iso)
    filename = f"planning_{safe_initial}_{safe_week}.pdf"
    etag = hashlib.md5(pdf_bytes).hexdigest()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "ETag": etag,
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    )
