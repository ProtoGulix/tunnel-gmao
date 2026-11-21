# DEMO-04. Mode démo verrouillé par le .env

- Statut : faite (2026-11-21)
- Agent : backend-dev (tests d'autorisation par test-writer si besoin)
- Branche : feat/base-demonstration (worktree créé depuis cette branche)
- Dépend de : ADR 0036 point 5
- Périmètre d'écriture : backend/api/settings.py, backend/api/auth/permission_middleware.py (ou un module voisin appelé par lui), backend/api/notifications/mailer.py, backend/tests/, deploy/.env.example, deploy/docker-compose.yml (passage de la variable, sans valeur par défaut), CHANGELOG.md ; fronts exclus

## Contexte

Trois comptes publics partagés : un visiteur ne doit pas pouvoir verrouiller les autres
dehors ni toucher aux comptes. Le contrôle est dans l'API, liste explicite de préfixes.

## Critères d'acceptation

- [x] `DEMO_MODE` inactif sans la valeur `true` dans l'environnement (test)
- [x] actif : POST /users/me/password, les écritures sous /admin/users, /admin/roles, /api-keys, /home-view/admin et les règles de sécurité répondent 403 avec un code dédié et un message en français ; un test par préfixe
- [x] actif : les lectures de ces routes et toutes les autres écritures métier restent permises (test d'au moins une écriture métier)
- [x] actif : aucun courriel envoyé même avec MAIL_ENABLED=true (test)
- [x] la connexion et le rafraîchissement du jeton restent permis
- [x] scripts/check.sh et scripts/test-integration.sh verts ; CHANGELOG à jour

## Compte rendu final

`DEMO_MODE` (vrai seulement pour la valeur « true ») ; module `backend/api/auth/demo_mode.py`
(liste blanche `DEMO_LOCKED_PREFIXES`) appelé par PermissionMiddleware après la matrice ;
403 `{"detail": "Action désactivée sur la démonstration", "code": "DEMO_MODE_LOCKED"}`.
Courriels coupés dans `api/mail/service.py` (`send_mail`, point d'envoi unique ; hors
périmètre listé mais nécessaire : mailer.py n'y appelle que send_mail). Le profil
personnel ne modifie pas l'adresse de connexion : non verrouillé. Tests :
tests/test_demo_mode.py et tests/integration/test_demo_mode_integration.py.

Reprise de l'agent principal après la relecture (2026-11-21) : `PATCH /users/me/profile`
verrouillé à son tour (comptes publics partagés : un visiteur renommerait les autres) et
`/admin/settings/mail` (essai d'envoi qui répondait « envoyé » sans rien envoyer) ; tests
ajustés, l'écriture métier permise du test d'intégration devient une création de famille
d'articles.
