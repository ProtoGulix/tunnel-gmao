# CRA-01. Rattachement d'un constat : une seule transaction

- Statut : faite (2026-11-23)
- Agent : principal
- Branche : fix/constat-rattachement-atomique (depuis develop)
- Dépend de : ADR 0018 (transaction de la requête), ADR 0043
- Périmètre d'écriture : backend/api/constats/repo.py (docstring), backend/tests/integration/,
  docs/backlog/ (fiche et README), docs/taches/CRA-01, CHANGELOG.md, docs/ETAT.md

## Contexte

Réserve de la revue CST (docs/backlog/constat-rattachement-atomique.md, supprimé) : le rejet par
`transition_status` validerait sa propre transaction avant le lien.

## Critères d'acceptation

- [x] test d'intégration : une panne après le rejet laisse la demande « nouvelle », sans lien ni ligne de journal
- [x] le test échoue quand la route est sortie du middleware de transaction (vérifié à la main par l'agent principal en ajoutant `or scope["path"].endswith("/link")` à la condition d'exclusion de TransactionMiddleware : la demande restait « rejetee » ; fichier rétabli)
- [x] check.sh et test-integration.sh verts

## Compte rendu final

Le défaut n'existe pas en requête HTTP : POST passe par TransactionMiddleware (backend/api/transaction.py),
get_connection() rend la connexion de la requête et son commit() est sans effet (backend/api/db.py,
RequestConnection). Lien et rejet sont donc déjà atomiques. Aucun code de production modifié hors la
docstring de `link_to_idea`, qui disait l'inverse. Test : test_cra01_rattachement_atomique_integration.py.
