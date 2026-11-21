# DAP-01. Demandes d'achat liées à une pièce : liste web et export PDF

- Statut : faite (2026-11-21)
- Agent : principal (web), backend-dev (export)
- Branche : fix/demandes-achat-pieces (depuis develop)
- Dépend de : backlog qualite-demande-sans-piece (accord de l'utilisateur du 2026-11-21)
- Périmètre d'écriture : web/src/components/ui/PurchaseRequestItem.jsx ; backend/api/exports/repo.py (et le gabarit de fiche s'il lit les champs), backend/tests/ ; CHANGELOG.md, docs/backlog/qualite-demande-sans-piece.md, cette fiche

## Contexte

Les demandes d'achat sont liées aux pièces par `part_id` (cahier 1.6). La liste des
demandes d'une intervention (web) calculait « à qualifier » sur `stock_item_id` seul ;
l'export PDF d'une intervention ne joignait que l'ancien `stock_item` : référence, nom,
fournisseur et fabricant vides pour une demande liée à une pièce.

## Critères d'acceptation

- [x] web : « à qualifier » vient du statut dérivé de l'API (`derived_status.code === 'TO_QUALIFY'`), plus de règle recopiée
- [x] export : pour une demande liée à une pièce, référence de la pièce, désignation, référence fabricant préférée, fournisseur et référence fournisseur préférés ; l'ancien article reste lu en repli
- [x] test d'intégration de l'export qui échoue avant ; check.sh et test-integration.sh verts ; CHANGELOG

## Compte rendu final

Export : `get_intervention_export_data` (backend/api/exports/repo.py) joint la pièce par `part_id`
(référence fabricant puis fournisseur préférés, comme l'écran des pièces), l'ancien article en repli
(COALESCE) ; colonnes lues par le gabarit v9 inchangées. Test :
test_dap01_export_demandes_pieces_integration.py, constaté en échec avant le correctif.
