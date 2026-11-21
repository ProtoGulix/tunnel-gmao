# TRI-04. Web : retirer les appels aux routes « amelioration » inexistantes

- Statut : faite (2026-11-19)
- Agent : frontend-dev (sonnet), même agent que TRI-01
- Branche : fix/priorites-backlog, worktree fix/priorites-backlog-front
- Dépend de : docs/backlog/routes-amelioration-absentes.md
- Périmètre d'écriture : web/src/api/intervention-requests.js,
  web/src/hooks/home/useTechnicalDirectionRequests.js et ses usages, cette fiche.

## Contexte

Le web appelle /intervention-requests/amelioration-categories et /amelioration-sous-statuts,
qui n'ont jamais existé côté backend (héritage d'avant la 5.0.0) ; le Promise.all du hook
fait afficher « Erreur » au bloc du tableau de bord. Choix : retirer les appels (pas de
référentiel à créer).

## Critères d'acceptation

- [x] Plus aucun appel à ces deux routes ; le bloc s'affiche sans erreur avec les données
      qui existent ; code devenu mort retiré
- [x] Build web vert, lint sans nouvelle erreur, scripts/check.sh vert

## Compte rendu final

Décision de l'utilisateur (2026-11-19) : la partie « Idées d'amélioration » n'a jamais eu
de backend (ni type amelioration, ni catégorie, ni sous-statut, ni PATCH .../amelioration) ;
elle est retirée entièrement du front plutôt que réaménagée. Idée reportée dans
docs/backlog/idees-amelioration.md.

Fait : retrait des appels aux deux routes, de patchAmelioration, du bloc d'idées de la vue
Direction technique (la vue ne garde que le résumé des demandes d'intervention, comme avant),
de AmeliorationCard, AmeliorationInlineEditCell, RequestTypePicker, requestCardShared et
KanbanBoard (plus utilisés), de fetchInterventionRequestTypes (route /types absente du
backend), des filtres type/sous_statut de la liste et du champ type à la création (le schéma
backend n'a pas de champ type). Le formulaire de DI et la modale n'ont plus de choix de type.
Fichiers : web/src/api/intervention-requests.js, hooks/home/useTechnicalDirectionRequests.js,
pages/home/TechnicalDirectionHomeView.jsx, components/home/SpontaneousInterventionRequestModal.jsx,
components/intervention-requests/InterventionRequestForm.jsx et RequestFormFields.jsx, plus
les fichiers supprimés ci-dessus. Build web vert, lint web sans nouvelle erreur, check.sh
vert. Essai à l'écran non fait.
