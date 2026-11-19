# Tableau de bord web : routes « amelioration » inexistantes

Réserve de l'étape 3d, toujours vraie au tri du 2026-11-19 (vérifiée par l'agent principal).
Gravité : bug.

web/src/api/intervention-requests.js:33,42 appelle `/intervention-requests/amelioration-categories`
et `/amelioration-sous-statuts`, absentes du backend. Le hook
hooks/home/useTechnicalDirectionRequests.js:38-39 les réunit dans un `Promise.all` : un échec
affiche « Erreur » sur le bloc. Décider : retirer l'appel (fonctionnalité abandonnée) ou
créer le référentiel.
