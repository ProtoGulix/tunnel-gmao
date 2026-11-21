# DEMO-05. Scénario fictif écrit par un agent par rôle

- Statut : faite (2026-11-21)
- Agent : quatre agents (sonnet) : responsable, technicien, acheteur, direction ; l'agent principal fixe le format et intègre
- Branche : feat/base-demonstration
- Dépend de : DEMO-03 (profil), ADR 0036 points 2 et 6
- Périmètre d'écriture : deploy/demo/scenario/*.json et deploy/demo/scenario/README.md (format) ; chaque agent écrit seulement son fichier

## Contexte

Les agents reçoivent le profil chiffré (DEMO-03), le format JSON et le cahier fonctionnel
(ce qui est livré), jamais d'accès à la base de dev. Usine fictive : PME d'environ 30
équipements sur 3 niveaux, 4 à 5 techniciens, 12 mois.

## Critères d'acceptation

- [x] format documenté (README) : identifiants symboliques, dates relatives J-n, références aux codes du référentiel de départ
- [x] responsable : équipements, classes, plans et gammes, équipe ; technicien : demandes, interventions, tâches, actions ; acheteur : catalogue, fournisseurs, demandes d'achat, commandes ; direction : relecture de cohérence écrite dans le README
- [x] volumes et répartitions dans une marge de ±20 % du profil
- [x] aucun nom réel (personne, entreprise, site, marque de fournisseur existante) ; domaine des comptes demo.frezille.fr ; grep de contrôle des noms réels connus : vide
- [x] seules des fonctions livrées selon le cahier sont utilisées

## Compte rendu final

Six agents (sonnet), aucune commande en échec : responsable (usine.json : 3 services,
7 classes, 32 équipements sur 4 niveaux, 6 personnes, 6 plans), technicien en deux
semestres parallèles (interventions.json : 187 demandes, 173 interventions dont 58
préventives, 331 actions, 27 demandes d'achat), acheteur (achats.json : 8 familles,
65 articles, 5 fournisseurs, 52 demandes, 34 commandes), direction (RELECTURE.md : 1 bloquant,
7 souhaitables). Calendrier du préventif fixé par l'agent principal (graine fixe, 4
équipements en retard aujourd'hui). Corrections de l'agent principal : code de la racine
renommé, périodicités presses 90 j et convoyeurs 120 j, 17 curatifs requalifiés urgents
(27 % d'urgences), heures de début recalées. Contrôles de l'agent principal : références
croisées, profondeur, grep de marques réelles courantes vide. NON VÉRIFIÉ : que les noms
inventés (entreprise, marques, fournisseurs) n'existent nulle part. Écart accepté : préventif
plus présent qu'en production ; références d'articles longues (spec en phrase, nécessaire à
l'unicité de stock_item.ref).
