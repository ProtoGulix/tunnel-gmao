# SEC-01. QR code et messages bruts de la base

- Statut : faite (2026-11-19)
- Agent : principal
- Branche : fix/securite-qrcode-et-messages-sql (depuis develop)
- Dépend de : ADR 0017 (erreurs d'audit visibles)
- Périmètre d'écriture : backend/api/auth/middleware.py, backend/api/errors/exceptions.py,
  backend/api/exports/routes.py (docstring), tests backend, docs/api/endpoints/exports.md,
  docs/backlog (quatre fiches), CHANGELOG, ETAT, cette fiche.

## Contexte

Lot « sécurité et erreurs » du backlog, choisi par l'utilisateur le 2026-11-19. Sur les
quatre fiches, deux étaient déjà corrigées (erreur 500 d'un model_validator, ADR 0017 ;
erreurs avalées de fn_audit_log_decision, migration 0006). Plan validé par l'utilisateur :
limite de débit sur le QR code public et liste blanche des messages P0001.

Constat en cours de tâche : la route du QR code n'était pas publique. L'exception
« /qrcode » du middleware JWT sautait la lecture du jeton, puis le routeur des exports
(require_authenticated) refusait : 401 pour tous, même connecté. Correction retenue à la
place de la limite de débit : retrait de l'exception.

## Critères d'acceptation

- [x] QR code : 401 sans jeton, 200 (PNG) avec, 404 pour une intervention inconnue (test
      d'intégration, en échec avant le correctif pour le cas connecté)
- [x] P0001 : message connu renvoyé tel quel, message interne ou inconnu remplacé par un
      texte générique (tests unitaires) ; chaque RAISE EXCEPTION du schéma et des
      migrations est classé (test qui échoue sur un nouveau message non rangé)
- [x] check.sh et test-integration.sh verts
- [x] Fiches du backlog mises à jour, CHANGELOG, doc d'endpoint

## Compte rendu final

Middleware JWT sans exception « /qrcode » ; liste blanche `_USER_FACING_DB_MESSAGES` et
`user_facing_db_message` dans api/errors/exceptions.py, utilisées par `raise_db_error`.
Messages masqués : changed_by absent, motif non système (défauts du serveur) ;
GAMME_INCOMPLETE reste traduit par la route des statuts. check.sh vert, 428 tests
d'intégration verts. À reporter par l'utilisateur dans le bilan de sécurité interne (hors
dépôt).
