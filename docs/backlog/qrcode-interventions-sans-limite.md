**TRAITÉ (SEC-01, 2026-11-19) : la route n'était pas publique (routeur des exports authentifié) ; l'exception « /qrcode » du middleware JWT, qui la rendait inutilisable et aurait ouvert toute future route en /qrcode, est retirée. Route réservée aux utilisateurs connectés, sans limite de débit nécessaire.**

# QR code d'intervention public sans limite de débit

`GET /interventions/{id}/qrcode` (api/exports/routes.py) est ouvert sans
authentification (liste publique de api/auth/middleware.py) et sans limite de débit.
L'ancienne entrée visait `/equipements/{id}/qrcode`, une route qui n'existe plus ; le
risque s'est déplacé ici (relevé par la revue du 2026-10-10). Il faudrait appliquer le
limiteur existant (api/limiter.py) à cette route.
