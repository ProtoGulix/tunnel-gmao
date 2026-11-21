# QUAL-01. Qualité des données : demande d'achat « sans article » sur le modèle des pièces

- Statut : faite (2026-11-21)
- Agent : principal
- Branche : fix/qualite-demande-sans-piece (depuis develop)
- Dépend de : constat de la relecture des captures GUIDE-02 ; accord de l'utilisateur du 2026-11-21
- Périmètre d'écriture : backend/api/stats/repo.py (détecteur et message), web/src/components/quality-data/config.js (libellé), backend/tests/integration/test_qualite_demande_sans_piece_integration.py, CHANGELOG.md, cette fiche, docs/ETAT.md

## Contexte

Le détecteur de l'onglet Qualité du Bilan signalait toute demande d'achat sans
`stock_item_id`, alors que les demandes sont liées aux pièces par `part_id` : en base de
dev (copie de la production, lecture seule), 529 signalées pour 32 réellement sans pièce ni
article. Le code du problème (`demande_sans_stock_item`) est gardé : il est exposé par l'API.

## Critères d'acceptation

- [x] seule une demande sans `part_id` ni `stock_item_id` est signalée ; libellé « sans pièce liée »
- [x] test d'intégration qui échoue avant le correctif (constaté) et passe après
- [x] check.sh et test-integration.sh verts ; CHANGELOG « Non publié »

## Compte rendu final

Correctif de l'agent principal, sans agent. Test constaté en échec avant (la demande liée à
une pièce était signalée), vert après. Production : les signalements passeront de ~529 à
~32 après la mise à jour (estimation sur la copie de dev, NON VÉRIFIÉ en production).
