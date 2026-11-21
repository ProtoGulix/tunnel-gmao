# DEMO-07. Parcours de vérification par rôle

- Statut : faite (2026-11-21)
- Agent : trois agents (sonnet), un par compte public, lecture et gestes courants par l'API
- Branche : feat/base-demonstration
- Dépend de : DEMO-06
- Périmètre d'écriture : aucun dans le dépôt ; instance locale jetable (Compose de test), jamais la base de dev

## Contexte

Chaque agent se connecte avec son compte, parcourt les écrans de son rôle par l'API et fait
les gestes courants (saisir une action, traiter une demande d'achat, lire le bilan), puis
tente les gestes verrouillés du mode démo.

## Critères d'acceptation

- [x] chaque rôle : écrans de son accueil non vides, aucune erreur 500, droits conformes à la matrice
- [x] gestes verrouillés refusés en 403 avec le code du mode démo
- [x] captures de contrôle des accueils (web) relues par l'agent principal : aucune donnée réelle
- [x] écarts consignés et corrigés avant la fusion

## Compte rendu final

Trois agents (sonnet) sur l'instance réelle (127.0.0.1:8090, avant publication du lien) :
aucune erreur 500, droits conformes à la matrice et au mode démo (403 DEMO_MODE_LOCKED sur
mot de passe et profil), gestes courants réussis, captures relues par l'agent principal :
aucune donnée réelle. Constats traités en DEMO-08 : écran Stock vide (chargeur sur
`stock_item` au lieu de `part`, cahier faux sur ce point), aucune notification (tâche
quotidienne passée avant le chargement), acceptation d'une demande qui exigeait un motif
sur toute nouvelle installation (seed, reproduit par l'agent principal ; production non
touchée). Écartés : taux de « dépannage évitable » d'une route BETA qu'aucun écran
n'appelle ; jours de semaine glissants. Données de test des agents effacées au rechargement.
