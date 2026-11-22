# ARCH-03. Backend : aperçu du nombre de fiches sélectionnées

- Statut : faite (2026-11-22)
- Agent : backend-dev (sonnet)
- Branche : feat/archivage-en-masse-arch03 (worktree depuis feat/archivage-en-masse)
- Dépend de : ADR 0040 ; accord de l'utilisateur du 2026-11-22 (ajout de route en lecture)
- Périmètre d'écriture : backend/api/exports/routes.py, backend/api/exports/schemas.py,
  backend/api/exports/repo.py (si besoin), backend/db/default_permissions.py (ajout du chemin
  à BULK_EXPORT_PATHS seulement), backend/tests/test_export_masse.py ou un nouveau fichier de
  tests, docs/endpoints (page du domaine exports), CHANGELOG.md. Exclus : web, mobile,
  migrations, toute écriture en base, tout redémarrage de l'API de dev.

## Contexte

Essai à l'écran de l'utilisateur (2026-11-22) : on ne voit pas combien de fiches seront
traitées avant de cliquer. Le web affichera un aperçu (ARCH-04), à partir de cette route.

## Contrat de la route (commun à ARCH-03 et ARCH-04)

`GET /exports/interventions/closed/preview?date_from=AAAA-MM-JJ&date_to=AAAA-MM-JJ[&equipement_id=<uuid>][&include_printed=true|false]`

- Même sélection que l'export et le marquage (période de fermeture, équipement, `include_printed`
  par défaut false), même validation des paramètres (période invalide ou UUID invalide : 400).
- Réponse 200, enveloppe `single` comme `mark-printed` : `{"count": n, "max": 100, "over_limit": bool}`.
  `count` est le nombre de fiches sélectionnées, borné à `max` ; `over_limit` est vrai au-delà de
  `max` (la requête lit au plus max + 1 lignes). Aucune fiche : `count` 0, pas de 404.
- Droits : ADMIN et RESP seulement (ajout à `BULK_EXPORT_PATHS`), limite 30/minute, aucun effet
  de bord, aucun audit (lecture).

## Critères d'acceptation

- [x] la route partage la sélection et la validation de `_select_closed` (pas de seconde requête divergente), sans lever 400 au-delà du plafond ni 404 à zéro
- [x] tests : comptage, zéro, au-delà de 100 (`over_limit`), période invalide (400), droit refusé à TECH et ACHETEUR (403), MCP refusé, `default_allowed` couvre le nouveau chemin
- [x] docs/endpoints à jour ; CHANGELOG (« Non publié ») à jour
- [x] scripts/check.sh vert (test-integration.sh lancé par l'agent principal)

## Compte rendu final

Route `GET /exports/interventions/closed/preview` ajoutée. `_select_closed` est scindée :
`_read_closed` (validation et requête unique, max + 1 lignes) est partagée ; `_select_closed`
y ajoute le 400 de plafond et le 404 inchangés. Chemin ajouté à `BULK_EXPORT_PATHS`.
Tests ajoutés dans test_export_masse.py (comptage, zéro, plafond, plafond exact, validation 400,
droits dont TECH, ACHETEUR, MCP, ordre des routes). Doc : docs/api/endpoints/exports.md.
Le 403 réel passe par le middleware de la matrice (couvert ici par `default_allowed`).
