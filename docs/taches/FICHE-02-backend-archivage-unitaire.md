# FICHE-02. Backend : archivage à l'unité sous la règle de l'archivage en masse

- Statut : fait (à relire par l'agent principal : test-integration.sh non lancé)
- Agent : backend-dev (sonnet)
- Branche : fix/fiche-pdf-et-archivage-fiche02 (worktree ../tunnel-gmao-fiche02, depuis fix/fiche-pdf-et-archivage)
- Dépend de : FICHE-01 ; décision de l'utilisateur du 2026-11-27 (« en masse ou à l'unité, l'archivage suit la même règle métier » ; bouton seulement une fois l'intervention fermée ; changement d'API accepté) ; ADR 0040, 0041
- Périmètre d'écriture : backend/api/interventions/ (routes, schemas, validators, repo si besoin), backend/api/exports/repo.py (réutilisation de `mark_interventions_printed` seulement), backend/db/default_permissions.py, backend/tests/, docs/endpoints/ (interventions). Exclus : migrations, fronts, backend/api/audits/.

## Contexte

Archiver = marquer la fiche imprimée (`printed_fiche`), irrévocable (déclencheur de la
migration 0026). L'archivage en masse (`POST /exports/interventions/closed/mark-printed`) ne
touche que des interventions fermées et est réservé à ADMIN et RESP (BULK_EXPORT_PATHS). Le
`PUT /interventions/{id}` accepte `printed_fiche` sur tout statut et pour TECH : une
intervention ouverte peut être marquée imprimée (1 cas en base de dev), puis se trouve
archivée d'office à sa clôture. L'audit, lui, est déjà identique (`printed_fiche_changed`,
motif routinier, auteur du jeton) : vérifié par l'agent principal.

## Critères d'acceptation

- [x] `POST /interventions/{intervention_id}/mark-printed` : réservé à ADMIN et RESP dans default_permissions (même réserve que l'archivage en masse) ; 404 si l'intervention n'existe pas ; 400 si elle n'est pas fermée (règle dans validators.py, une seule fonction, partagée avec le chemin de masse si c'est naturel) ; passe par `ExportRepository.mark_interventions_printed` (même requête, même audit) ; idempotent ; renvoie `{"marked": 0|1}` dans l'enveloppe habituelle (`single`)
- [x] `printed_fiche` n'est plus accepté par le PUT ni par la création d'intervention : refus explicite 400 (pas d'ignorance silencieuse) ; ses autres usages (lecture, filtres) inchangés
- [x] tests : droits par rôle de la nouvelle route (TECH, ACHETEUR, MCP refusés ; ADMIN, RESP acceptés), intervention ouverte refusée, intervention fermée marquée avec une ligne d'audit `printed_fiche_changed`, second appel sans effet, PUT et création avec `printed_fiche` refusés ; un test échoue sans le correctif
- [x] tests existants qui écrivaient `printed_fiche` par le PUT : adaptés sans affaiblir d'assertion (sinon le signaler)
- [x] docs/endpoints à jour ; scripts/check.sh vert dans le worktree

## Compte rendu final

Fait : `POST /interventions/{id}/mark-printed` (404, 400 si non fermée via `validate_closed_for_archive`, `ExportRepository.mark_interventions_printed`, `{"marked": 0|1}`, audit events_only) ; chemin ajouté à BULK_EXPORT_PATHS (ADMIN et RESP). `printed_fiche` refusé en 400 au PUT et à la création (`reject_printed_fiche`, sur `model_fields_set`, y compris null) ; retiré des champs modifiables du repo, création forcée à faux.
Tests : `tests/test_archivage_unitaire.py` (droits, fermée/non fermée, idempotence, refus PUT/POST), `tests/integration/test_archivage_unitaire_integration.py` (droits, 404/400, audit, second appel). Adapté dans `test_reouverture_archivee_irrevocable_integration.py` : le refus de `printed_fiche=False` au PUT reste 400 mais le message n'est plus celui du déclencheur (assertion `IRREVOCABLE` remplacée par `mark-printed`, le déclencheur reste couvert par les tests SQL) ; `test_marquer_archivee_reste_permis` (PUT sur intervention ouverte) remplacé par un marquage via la route dédiée ; `printed_fiche=True` retiré du corps d'un PUT de titre.
check.sh vert. test-integration.sh non lancé (consigne).
Autres écritures de `printed_fiche` : aucune dans api/ hors exports/repo.py (masse) ; constats et demandes ne font que lire ; INSERT de création de l'intervention (repo.add, y compris par les plans/demandes à `False`).
Écart : docs/endpoints n'existe pas dans le dépôt, doc d'endpoint portée par les docstrings ; CHANGELOG hors périmètre, entrée à ajouter par l'agent principal.

Contrôle de l'agent principal : périmètre conforme ; assertion modifiée dans
test_reouverture_archivee_irrevocable_integration.py acceptée (le refus du déclencheur reste
couvert par le test SQL). Ajouts : statut `ferme` exigé dans la requête de
`mark_interventions_printed`, relu sous verrou (réouverture concurrente, unité et masse), avec
son test d'intégration ; docs/api/endpoints (interventions, exports) ; comptes de droits par
défaut ADMIN 278 et RESP 242. test-integration.sh : 743 passés (premier passage : 2 échecs
sur ces comptes, corrigés).
