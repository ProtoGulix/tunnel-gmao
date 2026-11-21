TRAITÉ (2026-11-21) : onglet Qualité (QUAL-01), liste web « à qualifier » et export PDF
(DAP-01). Reste à vérifier (NON VÉRIFIÉ) :
- lignes de commande (supplier_order_lines, supplier_orders) : repli sur `part_id` à vérifier.

# Qualité des données : « demande d'achat sans article » teste l'ancien modèle

Relevé le 2026-11-21 (relecture des captures GUIDE-02), reproduit par l'agent principal.

Le détecteur `_qd_demande_sans_stock_item` (backend/api/stats/repo.py, onglet « Qualité »
du Bilan) signale toute demande d'achat dont `stock_item_id` est vide. Or les demandes
sont liées aux pièces par `part_id` (cahier fonctionnel 1.6) : en base de dev, copie de la
production, 529 demandes sont signalées alors que 32 seulement n'ont ni pièce ni article
(lecture seule, 2026-11-21). Sur la démonstration, les 52 demandes sont signalées.

Piste : signaler une demande sans `part_id` ni `stock_item_id` ; libellé « sans pièce
liée ». Test d'intégration qui échoue avant. Correction de code, à décider par
l'utilisateur (hors du chantier du guide).
