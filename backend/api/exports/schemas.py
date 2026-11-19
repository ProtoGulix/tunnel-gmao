from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ExportMetadata(BaseModel):
    """Métadonnées export"""

    intervention_id: UUID
    intervention_code: Optional[str] = None
    generated_at: str
    file_size_bytes: int


class PDFExportInfo(BaseModel):
    """Info export PDF (pour docs OpenAPI)"""

    content_type: str = "application/pdf"
    requires_auth: bool = True


class QRExportInfo(BaseModel):
    """Info export QR (pour docs OpenAPI)"""

    content_type: str = "image/png"
    requires_auth: bool = False


class MarkPrintedRequest(BaseModel):
    """Sélection des fiches à marquer imprimées (mêmes champs que l'export de masse)"""

    date_from: str
    date_to: str
    equipement_id: Optional[str] = None
    include_printed: bool = False
