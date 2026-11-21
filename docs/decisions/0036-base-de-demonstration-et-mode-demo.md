# 0036. Base de démonstration fictive et mode démo verrouillé par le .env

- Statut : accepté (2026-11-21, accord de l'utilisateur ; déploiement de la démonstration confié à l'agent principal)
- Date : 2026-11-21
- Affine : CLAUDE.md sections 2.5 et 6 ; cahier fonctionnel (docs/cahier-fonctionnel.md)

## Contexte

Une démonstration publique (demo.frezille.fr) et les captures du site vitrine et du guide
utilisateur ont besoin d'une base crédible : 12 mois d'historique, préventif en avance et en
retard, achats, bilan lisible. Aucune donnée réelle ne doit y figurer, et la base de dev est
une copie de la production. Des visiteurs anonymes partagent trois comptes publics
(technicien, acheteur, direction) : l'un d'eux pourrait changer un mot de passe ou toucher
aux comptes et casser la démo pour les autres jusqu'à la réinitialisation.

Décisions de l'utilisateur du 2026-11-21 : s'appuyer sur la production pour le réalisme ;
un agent par rôle pour produire les données ; un mode démo dans le modèle actuel, verrouillé
par le .env.

## Décision

1. **Profil statistique, pas de données.** La base de dev (copie de la production) est lue
   en lecture seule par l'agent principal, par des requêtes d'agrégats uniquement (volumes,
   répartitions, distributions, délais). Seuls des chiffres arrondis en sortent, consignés
   dans un spike ; aucun texte, nom, code d'équipement, fournisseur ou date précise.
2. **Scénario écrit par un agent par rôle**, une fois, en suivant le profil : responsable
   (usine fictive, équipements, classes, plans et gammes, équipe fictive), technicien
   (demandes, interventions, tâches, actions sur 12 mois), acheteur (catalogue, fournisseurs
   fictifs, demandes d'achat, commandes, réceptions), direction (relecture de cohérence du
   bilan). Le scénario est un ensemble de fichiers JSON versionnés dans `deploy/demo/`, aux
   dates relatives (« J-120 »).
3. **Chargeur déterministe** : un script joué avec le rôle propriétaire sur une base dédiée
   à la démonstration, après l'installation normale (migrations, bootstrap, données de
   référence). Il insère le scénario en calant les dates sur le jour du chargement : même
   contenu chaque nuit, dates glissantes, retards toujours « actuels ». Les lignes d'audit
   et de journal portent l'auteur fictif de chaque geste.
4. **Réinitialisation nocturne** : base supprimée puis recréée par l'installation et le
   chargeur, par une tâche planifiée du serveur de démonstration (hors de ce dépôt,
   déployée par l'agent principal avec l'accord de l'utilisateur ; procédure dans `deploy/demo/`).
5. **Mode démo** : `DEMO_MODE` dans `settings.py`, lu dans le .env, inactif par défaut (seule la valeur `true` du .env
   l'active ; Compose ne lui donne aucune valeur par défaut). Actif, l'API refuse en
   403 avec un code d'erreur dédié : le changement de mot de passe, la gestion des
   utilisateurs, des rôles et permissions, des clés d'API, des vues d'accueil, des règles de
   sécurité ; l'envoi de courriels est coupé quel que soit `MAIL_ENABLED`. Le contrôle vit
   dans le middleware de permissions existant (liste explicite de préfixes), pas dans les
   fronts. Toutes les autres écritures restent permises, y compris les suppressions : la
   démonstration montre l'outil réel, la réinitialisation répare.
6. **Comptes publics** : technicien@, acheteur@ et direction@ (rôles TECH, ACHETEUR, RESP),
   mot de passe commun conforme à la règle du code ; la vue d'accueil « direction
   technique » est affectée au rôle RESP (l'affectation est par rôle, pas par utilisateur).
   Le compte ADMIN de l'installation garde un mot de passe privé.
7. **Vérification par rôle** : après chargement, chaque agent de rôle parcourt la
   démonstration avec son compte, par l'API, sur une instance locale jetable ; ce parcours
   contrôle aussi les droits réels de chaque rôle.

## Alternatives écartées

- Copier puis anonymiser la production : risque de fuite (textes libres, codes, rythmes
  reconnaissables) ; contraire à CLAUDE.md section 2.5.
- Produire l'historique en appelant l'API : respecte toutes les règles mais ne sait pas
  antidater ; pas de 12 mois crédibles.
- Faire tourner les agents à chaque réinitialisation : coûteux, non reproductible.
- Mode démo dans les fronts (boutons masqués) : contournable par l'API ; une règle que le
  backend ne vérifie pas (CLAUDE.md section 4).
- Interdire toute écriture : la démonstration ne montrerait plus le travail réel.

## Conséquences

- Nouveaux fichiers sous `deploy/demo/` (scénario, chargeur, procédure) ; une variable
  `DEMO_MODE` documentée dans `deploy/.env.example` ; aucune migration.
- Prérequis : les noms réels de sites codés en dur dans le front web sont retirés
  (backlog sites-codes-en-dur), et les données de référence (`seed_reference.sql`) sont
  contrôlées sans donnée réelle.
- Le chargeur dépend du schéma : il est rejoué dans les tests d'intégration pour casser
  dès qu'une migration le rend invalide.
