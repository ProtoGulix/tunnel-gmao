# Harmoniser la création des interventions

Demande de l'utilisateur du 2026-11-15 (à partir du point 1 de suites-audc-etape-2.md) :
auditer les différents moyens de créer une intervention ; les formulaires diffèrent et
celui de l'accueil est le plus utilisé. Inventaire en lecture seule du 2026-11-15
(agent Explore, à revérifier au cadrage), résumé :

Backend, trois chemins :
- POST /interventions : une transaction, exige une DI existante (`request_id`, ADR 0019)
  et `tech_id` ; passe la DI à `acceptee`.
- POST /intervention-requests : DI seule.
- POST /intervention-requests/{id}/transition `acceptee` : crée l'intervention depuis la
  DI, une transaction. Insertion d'intervention dupliquée avec la première route (statut
  initial, titre, demandeur, priorité différents).
- Préventif (génération) : DI système + intervention + tâches, tout ou rien.

Fronts, trois implémentations web de « DI saisie puis intervention » en deux appels non
atomiques (DI orpheline si le second échoue) et une mobile :
- accueil / planning : web/src/components/planning/DayContextRightColumn.jsx (demandeur
  et description exigés, technicien vide par défaut, GET superflu après la DI) ;
- page Interventions : web/src/hooks/interventions/useInterventionCreate.js (DI créée en
  silence, demandeur « Système » codé en dur, `origine: 'directe'` ignoré par le backend) ;
- modale Coordination : web/src/components/interventions/InterventionCreateModal.jsx
  (même repli « Système », service, tâches créées une par une en boucle) ;
- mobile : mobile/src/components/actions/ActionForm.jsx (initiales « XX » en dur).
Champs, défauts et validations diffèrent d'un formulaire à l'autre ; le web n'utilise
jamais la transition d'acceptation, le mobile l'utilise pour accepter une DI.

Constat à reproduire en priorité : le formulaire inline du mobile
(ActionForm.jsx, InterventionInlineForm) envoie `tech_initials` sans `tech_id` à POST
/interventions, qui exige `tech_id` depuis la v5.0.0 : refus 422 probable (lu dans le
code, NON VÉRIFIÉ à l'exécution).

Piste : une route unique « demande + intervention (+ tâches) » dans une transaction,
un seul formulaire partagé, et une seule insertion d'intervention côté backend. ADR à
écrire (contredit ou complète l'ADR 0019 ?), plan court à valider avant tout code.

Constats de l'utilisateur à l'essai mobile du 2026-11-15 :
- Le formulaire d'action mobile ne propose de créer une intervention que si
  l'équipement n'en a aucune d'ouverte (ActionForm.jsx, `noOpenInterventions`) : avec
  une intervention déjà ouverte, on peut seulement la choisir. Besoin : pouvoir créer
  une nouvelle intervention même si l'équipement en a déjà une.
- Le mobile ne propose pas de clôturer l'intervention pendant la saisie de l'action (le
  web le fait : web/src/components/interventions/ActionForm/CloseInterventionOverlay.jsx).
  À faire avec le motif de clôture et la fenêtre de motif du mobile (CLAUDE.md 2.4,
  ADR 0016). Décision de l'utilisateur : après la version 5.3.0, dans ce chantier.
