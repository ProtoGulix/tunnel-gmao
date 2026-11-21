# DEMO-06. Chargeur déterministe et réinitialisation

- Statut : faite (2026-11-21)
- Agent : db-dev
- Branche : feat/base-demonstration (worktree créé depuis cette branche)
- Dépend de : DEMO-05, DEMO-04
- Périmètre d'écriture : deploy/demo/ (chargeur, script de réinitialisation, procédure README), backend/tests/integration/ (test du chargeur) ; jamais exécuté sur la base de dev

## Contexte

Le chargeur insère le scénario après l'installation normale, rôle propriétaire, base dédiée,
dates calées sur le jour du chargement. La réinitialisation recrée la base chaque nuit.

## Critères d'acceptation

- [x] chargement sur une base vide installée par le bootstrap : sans erreur, deux fois de suite (après recréation) avec le même contenu à décalage de dates près
- [x] comptes publics créés avec le mot de passe commun ; vue d'accueil direction technique affectée à RESP
- [x] lignes d'audit et de journal attribuées aux auteurs fictifs ; tables en ajout seul respectées pour le rôle applicatif
- [x] test d'intégration qui joue le chargeur (casse si une migration le rend invalide)
- [x] le script refuse de tourner si la base cible n'est pas nommée comme base de démonstration (garde-fou contre la base de dev)
- [x] procédure de déploiement et de tâche nocturne écrite pour l'utilisateur ; scripts/check.sh et test-integration.sh verts

## Compte rendu final

Fait (db-dev, branche feat/base-demonstration-demo06) :

- `deploy/demo/load_demo.py` : chargeur psycopg2 + bcrypt (aucune dépendance nouvelle), une
  transaction, refuse une base dont le nom ne contient pas « demo » ou qui contient déjà des
  interventions ou des demandes. Identifiants uuid5 stables (mêmes ids chaque nuit). Charge
  usine, interventions et achats.json s'il existe (sinon seules les demandes d'achat des
  techniciens sont créées). Écrit les journaux de statut (demande et intervention), les
  occurrences préventives terminées (la clôture de la demande liée donne la référence de
  l'échéancier), les liens action-tâche et action-demande d'achat, et 2 288 lignes d'audit
  (créations, statuts, clôtures en cascade du système, rejets avec motif OTHER, tâches ignorées).
- Triggers : seuls ceux qui datent ou écrivent à la place du chargeur sont désactivés par nom
  le temps de la transaction (codes DI et d'intervention, journaux, statut courant, notifications,
  clôture en cascade, numéros de commande et de demande d'achat), puis réactivés et vérifiés
  avant la validation. Les autres restent actifs (références d'articles, totaux, compteurs de
  références fournisseur, heures machine, contrôle du temps d'une action). Pas de
  session_replication_role : il exige un superuser et couperait aussi les clés étrangères.
  Les droits ne sont pas touchés : audit_log reste en ajout seul pour le rôle applicatif.
- `deploy/demo/reset-demo.sh`, `docker-compose.demo.yml`, `.env.demo.example`, `README.md`.
  Projet `tunnel-demo` seul, images et réseau propres, seul le web publié (127.0.0.1:8090).
- Test d'intégration `backend/tests/integration/test_demo_loader_integration.py`.
- Vérifié de bout en bout sur un projet Compose jetable (supprimé) : deux réinitialisations de
  suite, connexion de direction@, 28 lectures (accueil, interventions, Bilan, échéancier...)
  sans erreur 500.
