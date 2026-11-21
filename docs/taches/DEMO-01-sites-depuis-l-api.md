# DEMO-01. Sites lus depuis l'API au lieu d'être codés en dur

- Statut : faite (2026-11-21)
- Agent : frontend-dev (backend-dev si une route manque, après accord de l'utilisateur)
- Branche : feat/base-demonstration
- Dépend de : ADR 0036 (prérequis)
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/ (hook partagé), web/src/api/intervention-requests.js, tests web associés, backend/config/templates/fiche_semaine_exemple.html (maquette inutilisée : valeurs remplacées par des valeurs fictives), backend/api/exports/planning_repo.py (commentaire seulement), docs/api/endpoints/interventions.md (exemples), docs/backlog/ (TRAITÉ + nouvelle fiche filtre-site-demandes-achat), CHANGELOG.md ; aucune modification d'API (décision de l'agent principal du 2026-11-21, option B)

## Contexte

Les filtres de site des accueils direction technique et acheteur listent en dur les deux
sites réels de l'usine (backlog sites-codes-en-dur). Donnée réelle dans un dépôt public, et
visible sur la démonstration. Constat de l'agent (2026-11-21) : le paramètre `site` envoyé par
les deux accueils est ignoré par le backend, le filtre n'a jamais eu d'effet. Option B retenue :
filtre réel sur l'accueil direction technique (`machine_id` + `include_descendants`, déjà
supportés), filtre retiré de l'accueil acheteur (la route des demandes d'achat ne filtre pas
par équipement ; extension d'API au backlog). L'ADR 0011 (accepté) cite aussi les sites :
hors périmètre, soumis à l'utilisateur.

## Critères d'acceptation

- [x] plus aucun nom ni code de site réel dans web/, mobile/, backend/ (grep des deux codes et des deux noms : vide, hors docs/decisions/0011)
- [x] direction technique : la liste des sites vient des équipements racines (route existante) et le filtre réduit réellement la liste ; masqué s'il y a 0 ou 1 site
- [x] acheteur : filtre de site retiré ; fiche backlog filtre-site-demandes-achat créée
- [x] comportement inchangé sur la base de dev (essai à l'écran par l'utilisateur)
- [x] scripts/check.sh vert ; CHANGELOG (« Non publié ») à jour ; backlog sites-codes-en-dur marqué TRAITÉ

## Compte rendu final

frontend-dev (sonnet), arrêté une première fois sur un constat : le paramètre `site` était
ignoré par le backend, le filtre n'a jamais filtré. Option B décidée par l'agent principal :
hook `useSiteOptions` (équipements racines), filtre réel sur l'accueil direction technique
(`machineId` + `includeDescendants`), filtre retiré de l'accueil acheteur (backlog
filtre-site-demandes-achat), exemples neutralisés (maquette de fiche semaine, commentaire,
doc d'API), ADR 0011 neutralisé avec l'accord de l'utilisateur. 83 tests web dont 2
nouveaux, build et check.sh verts, aucune commande en échec. Contrôle de l'agent principal :
diff conforme au périmètre élargi, aucune assertion retirée, grep des noms réels vide sur
tout le dépôt. NON VÉRIFIÉ : rendu à l'écran (essai de l'utilisateur).
