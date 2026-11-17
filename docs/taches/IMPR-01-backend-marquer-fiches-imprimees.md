# IMPR-01. Backend : marquer imprimées les fiches d'un export de masse

- Statut : faite (2026-11-17)
- Agent : backend-dev (sonnet)
- Branche : feat/fiches-imprimees-archive (depuis develop, ADR 0008), worktree de la
  sous-branche feat/fiches-imprimees-archive-impr01
- Dépend de : EXPM-01 (export de masse, v5.4.0)
- Périmètre d'écriture : backend/api/exports/ (routes.py, repo.py, schéma éventuel),
  backend/db/default_permissions.py, backend/tests/ (test_export_masse.py ou nouveau
  fichier, tests d'intégration éventuels), docs/api/endpoints/exports.md, CHANGELOG.md
  (« Non publié »). Exclu : web, mobile, migrations, schéma de base.

## Contexte

L'export de masse (GET /exports/interventions/closed) produit les fiches des
interventions fermées sur une période sans rien écrire : `intervention.printed_fiche`
reste à faux, et les fiches restent « À archiver » dans le web. Décision de
l'utilisateur du 2026-11-17 : après l'export, le web propose de marquer ces fiches comme
imprimées. L'export reste sans effet de bord (un téléchargement ne modifie rien) ; le
marquage est une route d'écriture distincte, sur la même sélection. Accord de
l'utilisateur pour cet ajout à l'API publique : 2026-11-17.

## Critères d'acceptation

- [x] `POST /exports/interventions/closed/mark-printed`, corps JSON `{ date_from,
      date_to, equipement_id? }` validé comme l'export (mêmes messages : période
      invalide, UUID invalide, plafond MAX_BULK_SHEETS dépassé, aucune fiche)
- [x] Même sélection que l'export : réutilise `list_closed_interventions` (aucune
      seconde requête de sélection divergente)
- [x] Passe `printed_fiche` à vrai pour ces interventions seulement, en une requête
      paramétrée et une transaction ; réponse `single({ "marked": n, "total": m })`
      (n = fiches qui n'étaient pas encore imprimées, m = fiches sélectionnées) ;
      idempotent
- [x] Ne touche ni au statut ni au journal des statuts (le trigger de clôture n'est pas
      déclenché à tort : vérifier `trg_check_intervention_closable`)
- [x] Autorisation : ADMIN et RESP seulement ; TECH, ACHETEUR et MCP refusés (403), test
      par rôle ; le droit est déclaré dans default_permissions.py comme l'export
- [x] Tests pytest : autorisation par rôle, validation, appel du repo avec la sélection ;
      test d'intégration si le dossier tests/integration couvre déjà l'export
- [x] Marquage tracé dans audit_log, une ligne par fiche réellement marquée (entité
      intervention, `printed_fiche_changed`, auteur du jeton, même transaction) ; rien pour
      une fiche déjà imprimée (décision de l'utilisateur, 2026-11-17)
- [x] docs/endpoints à jour ; scripts/check.sh vert ; CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : route POST `/exports/interventions/closed/mark-printed`, sélection factorisée
(`_select_closed`, partagée avec l'export), `ExportRepository.mark_interventions_printed`
(un UPDATE paramétré, `printed_fiche IS NOT TRUE`, commit unique), chemin ajouté à
BULK_EXPORT_PATHS (ADMIN et RESP, MCP refusé). Le trigger de clôture sort immédiatement
(le statut ne change pas) et trg_log_status_change ne se déclenche que sur changement de
statut. Tests unitaires et un test d'intégration (rôles, idempotence, journal des statuts
inchangé). Limite de débit 10/minute choisie par le dev.

Audit (décision du 2026-11-17, remplace l'exclusion initiale de exclusions.py, retirée) :
route déclarée `audit("intervention", events_only=True)` ; le repo marque par un UPDATE ...
RETURNING (ancienne valeur verrouillée) et dépose un événement `printed_fiche_changed` par
fiche réellement marquée (`record_column_changes`). Le middleware valide le motif routinier
de l'entité, écrit via le point unique (masquage, changed_by du jeton) dans la transaction
de la requête. Aucun changement du mécanisme. Tests : unitaires (événements sur les seuls
ids marqués) et intégration (une ligne, changed_by = jeton, rien pour déjà imprimée ni hors
période).
