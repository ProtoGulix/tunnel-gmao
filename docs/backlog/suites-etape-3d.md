# Suites de l'étape 3d (test des fronts dans Chromium, 2026-10-06)

Constats de l'agent frontend-dev sur une installation neuve derrière le nginx de Compose.

## À rapatrier depuis web.tunnel-mobile avant la publication

FAIT le 2026-10-06 (d5afc92) : travail commité en l'état puis importé ; déconnexion
corrigée. Reste à revérifier le mobile importé dans un navigateur (tâches, actions).


Le monorepo a été construit depuis le dernier commit du mobile (2026-09-09), alors que
le dépôt contenait du travail non commité (gestion des tâches, authentification,
enveloppe { data }). Une fois ce travail commité par l'utilisateur, ré-importer
mobile/src et revérifier : stockage du jeton, déballage de { data }, ajout d'une
action avec tâches, déconnexion (POST /auth/logout exige refresh_token : le mobile
ne stocke pas encore le refresh token).

## Backend

- GET /intervention-requests/amelioration-categories et /amelioration-sous-statuts
  répondent 422 : routes absentes, capturées par /{request_id}. Le tableau de bord
  admin affiche « Erreur ».
- CORRIGÉ (a676ac0) : POST /equipements répondait 500 sur une base neuve : machine.code est NOT NULL et rien
  ne le génère (en production, les codes existent déjà). Bloquant pour une PME qui
  démarre de zéro.
- POST /intervention-actions exige des tâches (400 « tasks manquant ») : cohérent avec
  la gestion des tâches en cours côté mobile, à revérifier après ré-import.
- En-têtes de sécurité dupliqués entre nginx et l'API sur /api, Permissions-Policy
  différente : n'en garder qu'une source.

## Fronts

- Formulaire web « Nouvelle intervention » sans champ titre : création seulement depuis
  une demande d'intervention.
- Le mobile n'a pas de rafraîchissement du jeton : session coupée après 15 minutes.
- Polices Google Fonts du mobile (déjà noté en 3c).

## Non vérifié

Installation PWA réelle, mode hors ligne, scan QR, HTTPS, TRUSTED_PROXIES, pages non
parcourues.
