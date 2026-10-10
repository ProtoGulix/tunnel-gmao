# Facettes des demandes d'intervention : filtres ignorés

Dans GET /intervention-requests, les compteurs de facettes ne tiennent compte ni de
`machine_id` ni de `search`. Le filtre est placé dans le `ON` du JOIN sur `service`, ce
qui laisse les compteurs globaux (constaté le 2026-10-10 pendant l'étape 2 de
l'ADR 0011, dans api/intervention_requests/repo.py). Il faut déplacer ces conditions
dans le WHERE et ajouter un test qui vérifie les valeurs des compteurs.
