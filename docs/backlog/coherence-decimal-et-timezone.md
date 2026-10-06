# Cohérence Decimal et fuseaux horaires

- supplier_orders/repo.py convertit Decimal en float, purchase_requests/repo.py non. Uniformiser.
- Certains repos utilisent datetime.now() sans fuseau. Standardiser sur UTC.
