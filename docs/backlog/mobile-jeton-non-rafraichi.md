# Mobile : jeton jamais rafraîchi, durées de jeton ignorées par Compose

Tri du 2026-11-19, vérifié par l'agent principal ; l'utilisateur confirme des déconnexions
fréquentes des techniciens. Gravité : bug (terrain first).

- Le mobile stocke le refresh token (mobile/src/auth/AuthContext.jsx:27) mais ne s'en sert
  que pour la déconnexion : aucun rafraîchissement dans mobile/src/lib/api/client.js. Le
  web le fait (web/src/lib/api/client.js:38-55).
- Jeton d'accès de 15 minutes par défaut (backend/api/settings.py:21) ;
  deploy/docker-compose.yml ne transmet ni ACCESS_TOKEN_EXPIRE_MINUTES ni
  REFRESH_TOKEN_EXPIRE_HOURS à l'API : un réglage dans deploy/.env est sans effet.
