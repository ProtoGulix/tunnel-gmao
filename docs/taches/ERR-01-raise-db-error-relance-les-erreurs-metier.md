# ERR-01. raise_db_error relance les erreurs métier

- Statut : faite (2026-11-22)
- Agent : principal
- Branche : fix/erreurs-metier-en-500 (depuis develop, ADR 0008)
- Dépend de : docs/backlog/erreurs-metier-en-500.md
- Périmètre d'écriture : backend/api/errors/exceptions.py, backend/tests/test_error_leaks.py

## Contexte

Les repo enveloppent leurs requêtes dans `try / except Exception` puis appellent
`raise_db_error`. Une HTTPException métier (NotFoundError, ValidationError...) levée dans le
try y devenait une DatabaseError 500. Mesure du 2026-11-22 (analyse AST) : 4 cas directs et
19 cas indirects (méthode du repo appelée dans le try), 160 appels de `raise_db_error`.

## Critères d'acceptation

- [x] `raise_db_error` relance toute HTTPException reçue, sans la journaliser comme erreur de base
- [x] test `test_raise_db_error_relance_une_erreur_metier_telle_quelle` (404, 400, 409) : échoue sans le correctif, passe avec
- [x] scripts/check.sh vert

## Compte rendu final

Fait : garde `isinstance(e, HTTPException)` en tête de `raise_db_error`, avant le journal.
Le rollback éventuel, écrit dans le bloc except avant l'appel, reste joué. Test paramétré
ajouté (3 cas) : 3 échecs avant le correctif, 7/7 verts après. check.sh vert. Ne couvre pas
les 97 `raise DatabaseError` écrits directement dans les repo (ERR-02).
