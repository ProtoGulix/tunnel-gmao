**TRAITÉ (constaté le 2026-11-19, SEC-01) : déjà corrigé avec l'ADR 0017 (`ctx` converti en texte dans pydantic_validation_error_handler, test tests/test_erreurs_validation.py).**

# Erreur 500 au lieu de 422 sur un model_validator Pydantic

Reproduit le 2026-11-13 (CLO-01) : une ValueError levée dans un `model_validator`
(par exemple PATCH d'une tâche en `skipped` sans `skip_reason`) répond 500. Le
gestionnaire `pydantic_validation_error_handler` (backend/api/errors/handlers.py) retire
le champ `input` mais garde `ctx`, qui contient l'exception : `json.dumps` échoue.
Aucune fuite (message générique), mais le client ne reçoit pas le motif du refus.
Correctif probable : retirer ou convertir en texte `ctx` comme `input`, avec un test.
Touche toutes les routes, d'où une tâche à part.
