TRAITÉ (2026-11-22, chantier ERR, fiches ERR-01 à ERR-03).

# Erreurs métier transformées en 500 par des `except Exception`

Réserve de l'étape 5, toujours vraie au tri du 2026-11-19. Gravité : bug.

Environ 94 blocs `except Exception` suivis de `raise DatabaseError` dans backend/api/*/repo.py
(intervention_requests 7, part_templates 6, stock_sub_families 6...). Une HTTPException
métier levée dans le bloc try devient un 500 générique ; seuls interventions/repo.py:484,864
ré-émettent les HTTPException. Ceux de stats/repo.py (lectures) sont sans risque.
Correctif : ré-émettre HTTPException avant le `except Exception`, par domaine, avec tests.
