# TRI-01. Mobile : rafraîchir le jeton d'accès

- Statut : faite (2026-11-19), essai à l'écran validé
- Agent : frontend-dev (sonnet) pour le mobile ; agent principal pour Compose (fait)
- Branche : fix/priorites-backlog (depuis develop), worktree fix/priorites-backlog-front
- Dépend de : tri du backlog (docs/backlog/mobile-jeton-non-rafraichi.md)
- Périmètre d'écriture : mobile/src/lib/api/client.js, mobile/src/auth/, tests mobile
  éventuels, cette fiche. Exclu : backend, web.

## Contexte

L'utilisateur confirme (2026-11-19) que les techniciens sont déconnectés souvent : le
mobile garde le refresh token mais ne s'en sert jamais ; le jeton d'accès dure 15 minutes.
Le web le fait déjà (web/src/lib/api/client.js:38-55) : s'en inspirer. Route : POST
/auth/refresh (voir backend/api/auth/routes.py pour le corps et la réponse exacts).
Compose transmet désormais ACCESS_TOKEN_EXPIRE_MINUTES et REFRESH_TOKEN_EXPIRE_HOURS
(accord de l'utilisateur, fait par l'agent principal).

## Critères d'acceptation

- [x] Sur un 401 d'une requête authentifiée, le mobile appelle une seule fois
      /auth/refresh (requêtes simultanées : un seul rafraîchissement partagé), enregistre
      les nouveaux jetons et rejoue la requête
- [x] Échec du rafraîchissement (refresh expiré ou révoqué) : déconnexion propre vers
      l'écran de connexion, sans boucle ; /auth/login et /auth/refresh eux-mêmes ne
      déclenchent jamais de rafraîchissement
- [x] Rotation du refresh token respectée si l'API en renvoie un nouveau
- [x] Build mobile vert, scripts/check.sh vert
- [x] Essai à l'écran par l'utilisateur : rester connecté au-delà de 15 minutes (validé le 2026-11-19)

## Compte rendu final

Fait : dans mobile/src/lib/api/client.js, un 401 sur une requête authentifiée déclenche un
POST /auth/refresh (corps { refresh_token }, réponse à plat { access_token, refresh_token,
expires_in }) via une promesse partagée (un seul appel pour les requêtes simultanées), puis
rejoue la requête une seule fois. Les deux jetons sont réenregistrés (le backend fait
tourner le refresh token). /auth/login, /auth/refresh et /auth/logout n'y déclenchent
jamais de rafraîchissement. Échec : jetons effacés et évènement auth:session-expired, écouté
par AuthContext qui vide l'utilisateur (retour à l'écran de connexion). Fichiers :
mobile/src/lib/api/client.js, mobile/src/auth/AuthContext.jsx. Pas de test automatisé
(aucun harnais de test mobile) ; build mobile vert. Essai à l'écran non fait.

Après la relecture (APPROUVÉ) : seul un refus de /auth/refresh (400, 401, 403) ou l'absence de refresh token déconnecte ; une coupure réseau ou une erreur 5xx garde les jetons et laisse remonter l'erreur, la requête suivante réessaie (wifi d'atelier instable).
