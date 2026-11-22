TRAITÉ (2026-11-22, CPT-01).

# Tableau de bord équipement : achats « ouverts » mal comptés

Constat du 2026-11-22 (ménage des codes de statut inexistants). Gravité : bug d'affichage.

backend/api/equipements/repo.py (`open_purchase_requests_count`, vers la ligne 1589) exclut les
statuts `closed`, `cloturee`, `cancelled`, `annulee`, qui n'existent pas dans
`purchase_request.status` (valeurs relevées en dev : open, in_progress, ordered, received).
Une demande reçue est donc comptée comme ouverte. Correctif : s'appuyer sur les statuts réels
(ou le statut dérivé de l'API), avec un test ; change un chiffre affiché.
