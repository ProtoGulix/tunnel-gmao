"""Mode démonstration (ADR 0036, point 5) : écritures verrouillées par liste blanche.

Les comptes de l'instance de démonstration sont publics et partagés : un visiteur ne doit
pas pouvoir verrouiller les autres dehors ni toucher aux comptes, aux droits ou à la
sécurité. Le contrôle est appelé par PermissionMiddleware, après la matrice de droits.
Les lectures, /auth/* (connexion, rafraîchissement, déconnexion) et toutes les autres
écritures métier ne sont jamais concernées.
"""

from api.settings import settings

DEMO_MODE_LOCKED = "DEMO_MODE_LOCKED"
DEMO_LOCKED_MESSAGE = "Action désactivée sur la démonstration"

DEMO_WRITE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})

# Préfixes dont les écritures sont refusées en mode démo (le préfixe et tout ce qui est
# dessous). Liste blanche explicite : une nouvelle route n'est verrouillée que si on l'ajoute.
DEMO_LOCKED_PREFIXES = (
    "/users/me/password",  # changement de son mot de passe
    "/users/me/profile",  # nom et initiales : les comptes publics sont partagés
    "/admin/users",  # gestion des utilisateurs (création, rôle, activation, mot de passe)
    "/admin/permissions",  # matrice de permissions
    "/admin/endpoints",  # catalogue des endpoints (rôles et permissions)
    "/api-keys",  # clés d'API
    "/home-view/admin",  # affectation des vues d'accueil par rôle
    "/admin/ip-blocklist",  # onglet Sécurité : adresses IP bloquées
    "/admin/email-domain-rules",  # onglet Sécurité : règles de domaine de courriel
    "/admin/settings/mail",  # essai d'envoi : aucun courriel ne part en mode démo
)


def is_demo_locked(method: str, path: str) -> bool:
    """Vrai si le mode démo est actif et que cette écriture est verrouillée."""
    if not settings.DEMO_MODE or method.upper() not in DEMO_WRITE_METHODS:
        return False
    clean = path.rstrip("/")
    return any(clean == p or clean.startswith(p + "/") for p in DEMO_LOCKED_PREFIXES)
