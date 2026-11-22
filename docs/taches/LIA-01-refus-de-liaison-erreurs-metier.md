# LIA-01. Refus de liaison d'une demande : erreurs métier, pas des 500

- Statut : faite (2026-11-22)
- Agent : principal
- Branche : fix/liaison-demande-refus (depuis develop, ADR 0008)
- Dépend de : chantier ERR ; docs/backlog/liaison-demande-refus-en-500.md ; accord de l'utilisateur du 2026-11-22 (codes de retour)
- Périmètre d'écriture : backend/api/interventions/repo.py (`_link_request`), backend/tests/test_liaison_demande_refus.py, CHANGELOG.md, docs/backlog, docs/ETAT.md

## Contexte

Constat du reviewer du chantier ERR : à la création d'une intervention liée à une demande,
quatre refus métier levaient `DatabaseError`, donc une 500 au message masqué. L'appelant
relance déjà les HTTPException. Les autres `raise DatabaseError` restants
(interventions/repo.py:30 et :903, intervention_requests/repo.py:878) signalent une donnée de
référence manquante : vraie panne serveur, ils restent des 500.

## Critères d'acceptation

- [x] demande introuvable 404 ; demande déjà liée 409 ; statut non liable 400 ; intervention déjà liée à une autre demande 409
- [x] un test par refus, qui échoue avant le correctif ; aucun UPDATE après un refus
- [x] scripts/check.sh vert ; test-integration.sh vert
- [x] CHANGELOG (« Non publié ») à jour

## Compte rendu final

Fait : quatre `raise` remplacés (NotFoundError, ConflictError, ValidationError, ConflictError) ;
message du statut non liable sans représentation Python du tuple. Tests :
backend/tests/test_liaison_demande_refus.py, 5 tests, 5 échecs avant le correctif, 5 verts
après. Les messages, masqués jusqu'ici, sont désormais renvoyés : ils ne contiennent que des
identifiants et le statut, aucun détail PostgreSQL.
