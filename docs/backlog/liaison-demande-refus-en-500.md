# Refus de liaison d'une demande renvoyés en 500

Constat du reviewer, chantier ERR (2026-11-22). Gravité : bug.

backend/api/interventions/repo.py, liaison d'une demande à une intervention (vers les
lignes 997 à 1021) : quatre refus métier lèvent `DatabaseError`, donc une 500 générique
dont le message est masqué : demande introuvable (devrait être 404), demande déjà liée,
statut non liable, intervention déjà liée à une autre demande (400 ou 409).
Correctif : NotFoundError, ValidationError ou ConflictError selon le cas, avec un test par
refus. Change des codes de retour de l'API : accord de l'utilisateur requis.
À relire au passage : interventions/repo.py:30 et :902, intervention_requests/repo.py:878.
