# FTL-02. Web : accepter une demande avec le formulaire standard

- Statut : fait
- Agent : frontend-dev
- Branche : fix/acceptation-titre-long
- Dépend de : FTL-01 (titre déduit par l'API), demande de l'utilisateur du 2026-11-28
- Périmètre d'écriture : web/src/components/planning/InterventionCreationPanel.jsx et ses sous-composants, web/src/pages/home/TechnicalDirectionHomeView.jsx, web/src/components/home/, web/src/hooks/home/, tests front, CHANGELOG.md, cette fiche. Exclu : backend, mobile.

## Critères d'acceptation

- [x] InterventionCreationPanel n'envoie plus la description comme titre (l'API le déduit) ; aucun autre changement de comportement pour l'accueil technicien, le Briefing, la Coordination et la fenêtre de création
- [x] priorité préremplie avec l'urgence de la demande choisie (`priorite`), modifiable
- [x] accueil direction : Accepter ouvre InterventionCreationPanel dans une fenêtre, demande déjà choisie ; après création, la demande quitte « À trancher » ; Annuler ferme sans rien écrire
- [x] AcceptRequestDialog supprimée, aucune référence restante
- [x] check.sh vert ; CHANGELOG

## Compte rendu

Panel : plus de `title` envoyé, priorité préremplie (`lib/acceptRequest.js`, testé). Accueil direction : `AcceptRequestModal` (Dialog + InterventionCreationPanel). `AcceptRequestDialog` et `accept` du hook supprimés ; `requestPriority.js` conservé (utilisé ailleurs). Non vérifié à l'écran.
