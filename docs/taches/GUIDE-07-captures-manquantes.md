# GUIDE-07. Captures manquantes du guide, constats dans le scénario de démonstration

- Statut : faite 2026-11-26
- Agent : frontend-dev (sonnet)
- Branche : docs/captures-guide-g07 (worktree depuis docs/captures-guide)
- Dépend de : GUIDE-02 (script de captures), ADR 0036 (démonstration), ADR 0043 à 0045 (constat)
- Périmètre d'écriture : docs/site/ (pages, scripts/captures.json, scripts/captures.mjs, public/captures/, README.md), deploy/demo/load_demo.py et deploy/demo/scenario/ (constats du scénario), deploy/demo/README.md si besoin. Rien dans backend/, web/, mobile/.

## Contexte

Demande de l'utilisateur du 2026-11-26 : le guide manque de captures. Aujourd'hui 16 captures
(docs/site/scripts/captures.json) ; sans capture : les cinq pages administrateur, la
coordination du responsable, les écrans du constat (formulaire de clôture, constat sur
l'intervention, demande issue d'un constat, onglet Constats du Bilan, Administration >
Référentiel > Constats), et sans doute d'autres pages (à inventorier). Le scénario de
démonstration ne contient aucun constat : l'onglet Constats du Bilan y est vide. Le script ne
se connecte qu'avec les comptes publics (technicien, acheteur, direction) ; le compte ADMIN
de l'instance jetable a un mot de passe aléatoire écrit dans les journaux de l'API.

## Travail

1. Inventaire : pour chaque page de docs/site (hors comprendre/, qui a des schémas), dire si un
   écran mérite une capture ; viser l'écran principal de chaque page qui décrit un écran.
2. Scénario : quelques constats fictifs et plausibles (5 à 10) sur des curatifs fermés, avec
   et sans demande, dont une demande acceptée, une rejetée, une rattachée si possible, et une
   correction ; chargés par load_demo.py comme le reste (dates recalées). Même rigueur que le
   scénario existant (deploy/demo/scenario/README.md, RELECTURE.md) : aucune donnée réelle.
3. Script : permettre un compte administrateur sur l'instance jetable seulement (mot de passe
   lu dans les journaux de son API ou fixé dans l'environnement temporaire), sans rien changer
   à la démonstration publique ; les garde-fous existants restent (projet, ports).
4. Manifeste : ajouter les captures, régénérer toutes les captures (`npm run docs:screenshots`),
   insérer chaque nouvelle capture dans sa page avec un texte alternatif descriptif.
5. Relire chaque capture : aucune erreur, aucune page de connexion, aucune donnée « test ».

## Critères d'acceptation

- [x] inventaire écrit dans le compte rendu (page → capture ajoutée, ou raison de ne pas en mettre)
- [x] scénario avec constats, chargé sans erreur ; onglet Constats du Bilan non vide sur la capture
- [x] captures administrateur prises sans toucher à la démonstration publique (projet tunnel-demo, port 8090) ni à la base de dev
- [x] `npm run docs:screenshots` complet, puis aucun conteneur, volume ni réseau de l'instance jetable
- [x] `npm run docs:build` sans lien mort ; scripts/check.sh vert
- [x] CHANGELOG « Non publié » à jour

## Compte rendu final

Fait. Captures : 16 avant, 33 après (17 ajoutées, les 16 existantes régénérées et relues à
l'image). Script : compte `admin` (instance jetable seulement, mot de passe lu dans les
journaux de son API, garde-fous de projet et de ports inchangés). Scénario : `constats.json`
(10 versions, 8 constats écrits à la main dont 2 corrigés), 7 demandes issues de constats
(`I200` à `I206` dans `interventions.json`), et un constat sans demande sur chacun des 84
autres curatifs fermés (la clôture d'un curatif l'exige ; réponses tirées de la clé, donc
stables). Chargeur (`load_demo.py`) : écrit `constat` et `constat_answer`, la demande liée
(`request_id`, `source_intervention_id`, type préconisé, texte construit comme
`ConstatValidator.build_description`), le rattachement (`linked_request_id`, rejet en doublon
`REJECT_DUPLICATE`) et l'audit de correction (`constat_corrected`, motif Correction). Il
contrôle les réponses contre le formulaire en base et refuse un constat qui ne génère pas la
demande annoncée. Demandes datées de la clôture de l'intervention source.

Inventaire page par page (capture existante, ajoutée, ou raison) :

- acheteur : accueil (existante), demandes-achat (existante), pieces-fournisseurs (existante),
  commandes-fournisseurs (existante), import-csv (ajoutée : fenêtre d'import), repartition
  (existante réutilisée ; comparateur non retenu, vide sans deux paniers choisis), index (aucun
  écran).
- administrateur : utilisateurs, roles-permissions, audit (journal), securite (logs),
  referentiels (actions et constats) : ajoutées ; index : aucun écran.
- responsable : accueil, audit-motifs, interventions-taches (existantes) ; bilan (onglet
  Constats), coordination, demandes (liste et demande issue d'un constat), equipements (liste
  à plat), preventif (plans) : ajoutées ; index : aucun écran.
- technicien : cloturer-rouvrir (4 ajoutées : formulaire de constat mobile, feuille de statut,
  fenêtre Nouveau constat web, onglet Constats de l'intervention) ; demander-une-piece,
  mes-taches, notifications, saisir-une-action, signaler-un-probleme, index (existantes).
- sans capture : decouvrir, installation (terminal), feuille-de-route, index (texte),
  comprendre/ (schémas).

Vérifié : `npm run docs:screenshots` 33/33 (deux passes ; la première a échoué sur 2 captures,
interventions fermées introuvables dans l'onglet par défaut, corrigées en ouvrant « À
archiver ») ; `npm run docs:build` sans lien mort ; plus aucun conteneur, volume ni réseau
`tunnel-demo-guide` après chaque passe. Les images `tunnel-demo-api:local` et
`tunnel-demo-web:local` ont été reconstruites par `reset-demo.sh` depuis ce worktree (étiquettes
partagées avec la démonstration publique, dont les conteneurs n'ont pas été touchés).

Reste NON VÉRIFIÉ : `scripts/test-integration.sh` (Docker, hors périmètre de la tâche) ; le test
`backend/tests/integration/test_demo_loader_integration.py` compte les éléments de
`interventions.json`, donc reste cohérent, mais il n'a pas été rejoué. Dates relatives : la
démonstration publique garde l'ancien scénario jusqu'à sa prochaine réinitialisation.

Reprise du 2026-11-26 (relecture de l'agent principal) : les demandes acceptées des constats
datent maintenant des trois derniers mois (sources I147, I150, I154 ; le constat rattaché vise
l'idée MO-02 du scénario, `rattache_a` accepte une clé de demande). L'onglet Constats du Bilan
montre « Suggestions retenues 42,9 % (3 sur 7) ». Captures régénérées (33/33) et relues ;
`scripts/test-integration.sh -k demo` : 15 passés ; instance jetable supprimée.
