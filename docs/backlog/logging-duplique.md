**TRAITÉ (tri du 2026-11-19) : un seul endroit journalise DatabaseError (api/errors/exceptions.py) ; les handlers ne journalisent que les exceptions non gérées.**

# Logging dupliqué des exceptions

Les exceptions sont loggées dans leur __init__ et dans le handler. Choisir un seul endroit.
