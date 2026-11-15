# QR code d'intervention public sans limite de débit

`GET /interventions/{id}/qrcode` (api/exports/routes.py) est ouvert sans
authentification (liste publique de api/auth/middleware.py) et sans limite de débit.
L'ancienne entrée visait `/equipements/{id}/qrcode`, une route qui n'existe plus ; le
risque s'est déplacé ici (relevé par la revue du 2026-10-10). Il faudrait appliquer le
limiteur existant (api/limiter.py) à cette route.
