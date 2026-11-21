# GUIDE-02. Captures du guide prises par script sur une démonstration jetable

- Statut : faite (2026-11-21)
- Agent : frontend-dev (sonnet)
- Branche : feat/guide-utilisateur (worktree dédié)
- Dépend de : GUIDE-01, ADR 0036 et 0037
- Périmètre d'écriture : docs/site/scripts/ (script et liste des captures), docs/site/package.json (script docs:screenshots), docs/site/public/captures/, docs/site/README.md ; jamais la base de dev (port 8080) ni la démonstration publique (projet tunnel-demo, port 8090)

## Contexte

`npm run docs:screenshots` installe une démonstration jetable avec deploy/demo/reset-demo.sh
(DEMO_COMPOSE_PROJECT=tunnel-demo-<suffixe>, port libre), se connecte avec chaque compte
public, prend les captures listées dans un fichier de manifeste (page, rôle, format bureau
ou téléphone, éléments à mettre en évidence), les enregistre en WebP, puis supprime
l'instance.

## Critères d'acceptation

- [x] une commande régénère toutes les captures, de façon idempotente, et supprime tout ce qu'elle a créé (conteneurs, volumes, réseau ; les images restent, leurs étiquettes étant partagées avec la démonstration publique)
- [x] manifeste lisible : ajouter une capture = ajouter une entrée
- [x] captures web (1440×900) et mobile (390×844) ; WebP encodé dans le navigateur, sans outil d'image ajouté
- [x] refuse de tourner sur le projet tunnel-demo ou le port 8090 ou 8080
- [x] README du guide : prérequis (Docker, Chromium de Playwright), commande, durée
- [x] captures relues par l'agent principal : aucune donnée réelle, aucune donnée « test »

## Compte rendu final

Fait : `docs/site/scripts/captures.mjs` (JavaScript) et `captures.json` (manifeste de 16
captures : 4 mobile technicien, 1 web technicien, 7 direction, 4 acheteur), `playwright-core`
1.64.1 exact en devDependency, script `docs:screenshots`, `docs/site/README.md`. Le script
refuse le projet « tunnel » ou « tunnel-demo » et les ports 8080 et 8090, crée un environnement
temporaire (secrets aléatoires, port libre dès 18190), lance `reset-demo.sh` avec
`DEMO_COMPOSE_PROJECT=tunnel-demo-guide`, capture, encode en WebP dans Chromium, puis
`down -v` et suppression du fichier d'environnement, même en cas d'erreur ou d'interruption.

Vérifié : exécution complète en 1 min 57 (16/16), puis plus aucun conteneur, volume ni réseau
`guide` ; 6 captures relues (aucune page de connexion, aucune erreur). Les images
`tunnel-demo-api:local` et `tunnel-demo-web:local` (étiquettes partagées avec la démonstration
publique, fixées par docker-compose.demo.yml) restent : le script ne supprime aucune image.

Reste : relecture des captures par l'agent principal (aucune donnée réelle ou « test »).

Relecture de l'agent principal (2026-11-21) : 16 captures relues à l'image, données
fictives seulement ; une corrigée (l'échéancier montrait l'onglet Plans). Constat hors
périmètre : l'onglet Qualité signale à tort les demandes liées à une pièce (backlog
qualite-demande-sans-piece, défaut présent en production).
