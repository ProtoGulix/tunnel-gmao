# Outillage de tests du mobile

Le mobile n'a aucun harnais de test (relevé à la relecture de TRI-01, 2026-11-19). Le
rafraîchissement du jeton (mobile/src/lib/api/client.js : promesse partagée, une seule
relance, routes exclues, refus contre coupure réseau) mériterait des tests unitaires, comme
le web (`node --test`). Ajout d'un outil de test = dépendance, accord de l'utilisateur requis.
