import asyncio
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from api.action_categories.routes import router as action_category_router
from api.action_subcategories.routes import router as action_subcategory_router
from api.admin.routes import router as admin_router
from api.api_keys.routes import router as api_keys_router
from api.audits.middleware import AuditMiddleware
from api.audits.routes import router as audit_router
from api.auth.middleware import JWTMiddleware
from api.auth.permissions import enforce_permission_matrix
from api.auth.routes import router as auth_router
from api.changelog.routes import router as changelog_router
from api.complexity_factors.routes import router as complexity_factor_router
from api.dashboard.routes import router as dashboard_router
from api.db import close_pool, init_pool
from api.equipement_class.routes import router as equipement_class_router
from api.equipement_statuts.routes import router as equipement_statut_router
from api.equipements.routes import router as equipement_router
from api.errors.handlers import register_error_handlers
from api.exports.routes import router as exports_router
from api.health import health_check
from api.home_view.routes import router as home_view_router
from api.intervention_actions.routes import router as intervention_action_router
from api.intervention_requests.routes import router as intervention_request_router
from api.intervention_status.routes import router as intervention_status_router
from api.intervention_status_log.routes import router as intervention_status_log_router
from api.intervention_tasks.routes import router as intervention_tasks_router
from api.interventions.routes import router as intervention_router
from api.limiter import limiter
from api.manufacturer_items.routes import router as manufacturer_item_router
from api.notifications.routes import router as notification_router
from api.part_templates.routes import router as part_template_router
from api.parts.routes import router as parts_router
from api.preventive_occurrences.routes import router as preventive_occurrences_router
from api.preventive_plans.routes import router as preventive_plans_router
from api.purchase_requests.routes import router as purchase_request_router
from api.services.routes import router as service_router
from api.settings import settings
from api.stats.routes import router as stats_router
from api.stock_families.routes import router as stock_family_router
from api.stock_item_suppliers.routes import router as stock_item_supplier_router
from api.stock_items.routes import router as stock_item_router
from api.stock_sub_families.routes import router as stock_sub_family_router
from api.supplier_order_lines.routes import router as supplier_order_line_router
from api.supplier_orders.routes import router as supplier_order_router
from api.suppliers.routes import router as supplier_router
from api.users.routes import router as user_router


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for log levels"""

    COLORS = {
        'DEBUG': '\033[36m',  # Cyan
        'INFO': '\033[32m',  # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',  # Red
        'CRITICAL': '\033[35m',  # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


# Simple logging setup
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(
    ColoredFormatter(
        fmt="%(asctime)s - %(levelname)s - %(name)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
    )
)

logging.basicConfig(
    level=logging.DEBUG if settings.API_ENV == "development" else logging.INFO, handlers=[handler]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise le pool DB, charge les permissions et synchronise le catalogue d'endpoints."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: init_pool(settings.DATABASE_URL, settings.DB_POOL_MIN, settings.DB_POOL_MAX),
    )
    # Import lazy pour éviter la circularité avec auth au niveau module
    from api.auth.permissions import permission_cache

    permission_cache.load()
    await sync_endpoints_catalog()
    yield
    close_pool()


# FastAPI Proxy Gateway
# Frontend → API → PostgreSQL (données) / Directus (auth)
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan,
    redirect_slashes=False,
    # Matrice des droits appliquée à chaque requête authentifiée (ADR 0007).
    dependencies=[Depends(enforce_permission_matrix)],
    description="API Proxy - Gateway entre frontend et données",
)

# Attache le limiter à l'app (requis par slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enregistre les handlers d'erreur (404, 401, 403, 500, etc.)
register_error_handlers(app)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Ajoute les headers de sécurité HTTP sur toutes les réponses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        if settings.API_ENV == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# Inclusion des routes métier (PostgreSQL)
app.include_router(intervention_router)
app.include_router(intervention_action_router)
app.include_router(intervention_status_router)
app.include_router(intervention_status_log_router)
app.include_router(action_category_router)
app.include_router(action_subcategory_router)
app.include_router(equipement_router)
app.include_router(equipement_class_router)
app.include_router(equipement_statut_router)
app.include_router(stats_router)
app.include_router(complexity_factor_router)
app.include_router(purchase_request_router)
app.include_router(stock_item_router)
app.include_router(parts_router)
app.include_router(stock_family_router)
app.include_router(stock_sub_family_router)
app.include_router(part_template_router)
app.include_router(supplier_order_line_router)
app.include_router(supplier_order_router)
app.include_router(supplier_router)
app.include_router(stock_item_supplier_router)
app.include_router(manufacturer_item_router)
app.include_router(exports_router)
app.include_router(user_router)
app.include_router(changelog_router)
app.include_router(intervention_request_router)
app.include_router(service_router)
app.include_router(preventive_plans_router)
app.include_router(preventive_occurrences_router)
app.include_router(intervention_tasks_router)
app.include_router(dashboard_router)
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(api_keys_router)
app.include_router(audit_router)
app.include_router(notification_router)
app.include_router(home_view_router)


@app.on_event("startup")
async def sync_endpoints_catalog():
    """
    Scanne toutes les routes FastAPI et fait un UPSERT dans tunnel_endpoint.
    Maintient le catalogue à jour après chaque déploiement.
    Les routes /admin/* sont marquées is_sensitive=True par défaut.
    Crée également les entrées tunnel_permission manquantes (allowed=False) pour chaque rôle.
    """
    from api.db import get_connection, release_connection
    from api.endpoints_catalog import sync_catalog

    conn = None
    try:
        conn = get_connection()
        upserted = sync_catalog(app.routes, conn)
        logger.info("sync_endpoints_catalog : %d endpoints synchronisés", upserted)
    except Exception as e:
        logger.error("Erreur sync_endpoints_catalog : %s", e)
    finally:
        if conn:
            release_connection(conn)


@app.get("/health")
async def health_endpoint():
    """Route publique: vérification de santé de l'API avec état des dépendances"""
    return await health_check()


@app.get("/server/ping")
async def ping_endpoint():
    """Route publique: ping rapide pour vérifier que l'API répond"""
    return "pong"


# Middleware JWT (appliqué à toutes les routes sauf exceptions publiques)
# Vérifie que le JWT Directus est valide et extrait user_id + role
app.add_middleware(JWTMiddleware)

# Middleware Audit — s'exécute après JWT (user_id disponible dans request.state)
app.add_middleware(AuditMiddleware)

# Middleware CORS — ajouté en dernier = plus externe = enveloppe tout,
# y compris les réponses d'erreur de JWTMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://192\.168\.1\.\d{1,3}(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
