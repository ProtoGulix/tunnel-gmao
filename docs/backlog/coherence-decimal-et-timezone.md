# Cohérence Decimal et fuseaux horaires

- supplier_orders/repo.py convertit Decimal en float, purchase_requests/repo.py non. Uniformiser.
- Certains repos utilisent datetime.now() sans fuseau. Standardiser sur UTC.

Constat du 2026-11-14 (AUDC) : la génération préventive date ses occurrences avec
`date.today()` (heure locale du processus de l'API, preventive_occurrences/repo.py:207)
alors que la base est en UTC (`CURRENT_DATE`). Juste après minuit, les deux dates
diffèrent ; un test en dépendait (corrigé pour utiliser date.today()). Fixer une seule
source de « date du jour » (fuseau de l'usine) pour l'API et la base.
