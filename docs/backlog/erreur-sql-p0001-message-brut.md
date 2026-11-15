# Message brut d'un RAISE EXCEPTION SQL renvoyé au client

Relevé par test-writer (AUDC-21, 2026-11-14), NON VÉRIFIÉ par l'agent principal : une
exception PL/pgSQL levée avec le code par défaut (P0001) remonte en 400
`ValidationError` avec le texte du message SQL, ce qui contredit CLAUDE.md section 6.4.
À vérifier : quel gestionnaire convertit P0001 en ValidationError, et quels messages
des fonctions en base sont faits pour l'utilisateur (à garder) ou non (à masquer).
