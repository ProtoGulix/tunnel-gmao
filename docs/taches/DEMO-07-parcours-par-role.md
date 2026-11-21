# DEMO-07. Parcours de vérification par rôle

- Statut : à faire
- Agent : trois agents (sonnet), un par compte public, lecture et gestes courants par l'API
- Branche : feat/base-demonstration
- Dépend de : DEMO-06
- Périmètre d'écriture : aucun dans le dépôt ; instance locale jetable (Compose de test), jamais la base de dev

## Contexte

Chaque agent se connecte avec son compte, parcourt les écrans de son rôle par l'API et fait
les gestes courants (saisir une action, traiter une demande d'achat, lire le bilan), puis
tente les gestes verrouillés du mode démo.

## Critères d'acceptation

- [ ] chaque rôle : écrans de son accueil non vides, aucune erreur 500, droits conformes à la matrice
- [ ] gestes verrouillés refusés en 403 avec le code du mode démo
- [ ] captures de contrôle des accueils (web) relues par l'agent principal : aucune donnée réelle
- [ ] écarts consignés et corrigés avant la fusion

## Compte rendu final

À compléter.
