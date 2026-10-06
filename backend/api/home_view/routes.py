"""Routes API pour l'accueil par rôle (home_view)"""

from fastapi import APIRouter, Depends, Request, status

from api.auth.permissions import require_authenticated, require_role
from api.utils.response import referentiel

from .repo import HomeViewRepository
from .schemas import HomeViewAssignmentIn, HomeViewAssignmentOut, HomeViewRefOut, MyHomeViewOut

router = APIRouter(
    prefix="/home-view", tags=["home-view"], dependencies=[Depends(require_authenticated)]
)
repo = HomeViewRepository()

_admin_only = Depends(require_role("ADMIN"))


@router.get("", response_model=list[HomeViewRefOut])
def list_home_views():
    """Référentiel des vues d'accueil disponibles (voir src/pages/HomeRouter.jsx côté front)."""
    return referentiel(repo.get_referentiel())


@router.get("/me", response_model=MyHomeViewOut)
def get_my_home_view(request: Request):
    """
    Vue d'accueil assignée à l'utilisateur courant, résolue depuis son rôle.

    Retombe toujours sur 'technicien' si le rôle n'a pas de configuration
    explicite — jamais de 404 ici, l'écran d'accueil doit toujours pouvoir
    résoudre une vue (voir useHomeView.js côté front, qui a de toute façon
    son propre filet de sécurité en cas d'erreur réseau).
    """
    role_code = getattr(request.state, "role", None)
    return repo.get_view_for_role_code(role_code)


@router.get(
    "/admin/assignments", response_model=list[HomeViewAssignmentOut], dependencies=[_admin_only]
)
def list_home_view_assignments():
    """Liste les assignations rôle → vue explicitement configurées (admin)."""
    return repo.list_assignments()


@router.put(
    "/admin/assignments/{role_id}", response_model=HomeViewAssignmentOut, dependencies=[_admin_only]
)
def upsert_home_view_assignment(role_id: str, data: HomeViewAssignmentIn, request: Request):
    """Assigne (ou remplace) la vue d'accueil d'un rôle (admin)."""
    updated_by = getattr(request.state, "user_id", None)
    return repo.upsert_assignment(role_id, data.home_view, updated_by=updated_by)


@router.delete(
    "/admin/assignments/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[_admin_only],
)
def delete_home_view_assignment(role_id: str):
    """Retire la configuration explicite d'un rôle — il retombe sur la vue par défaut (admin)."""
    repo.delete_assignment(role_id)
