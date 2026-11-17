# Intercepteur web : déballage de { data } selon le nombre de clés

web/src/lib/api/client.js retire l'enveloppe { data } seulement quand c'est la seule
clé. Une même route change donc de forme selon qu'elle ajoute `audit` ou non, et un
appel qui lit `response.data.data` casse sans bruit (bug de l'en-tête d'intervention
vidé après un changement de statut, corrigé le 2026-11-17 par lib/api/singleBody.js
pour interventions.js seulement). À faire : recenser les autres lectures de
`response.data.data` sur des routes `single()` sans audit, puis choisir une forme
unique (déballer toujours, ou jamais). Décision d'architecture du client : ADR.
