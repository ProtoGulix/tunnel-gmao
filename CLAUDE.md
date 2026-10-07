# CLAUDE.md : Tunnel GMAO

Ce fichier est la référence du projet. Lis le en entier avant toute action. Il reste volontairement court : le détail vit dans docs/ et se charge à la demande. Une information non vérifiée est marquée NON VÉRIFIÉ : ne la traite jamais comme un fait.

## 1. Objectif

Tunnel est une GMAO (gestion de maintenance assistée par ordinateur) open source (AGPL-3.0), utilisée chaque jour en production dans une vraie usine. Public : PME industrielles de 10 à 100 machines, équipes de maintenance de 1 à 10 personnes, qui veulent structurer leur maintenance sans logiciel lourd.

Un seul dépôt (ADR 0002, 0006), installé par docker compose :

    backend/   API FastAPI + PostgreSQL, source de vérité unique
    web/       front web React + Vite (bureau, responsables, acheteurs)
    mobile/    front mobile React + Vite (techniciens terrain), servi sous /m
    deploy/    Compose, nginx, scripts d'installation
    docs/      décisions, guides, backlog, spikes, documentation de l'API
    scripts/   check.sh : vérification unique du dépôt

## 2. Philosophie (ne se négocie pas)

1. L'action est l'unité de travail réel. Temps, complexité et pièces sont tracés au niveau des actions, pas des interventions.
2. Terrain first. L'outil reflète le travail réel sans imposer de méthode. Un technicien doit pouvoir saisir en moins d'une minute.
3. Sobriété. Pas d'ERP déguisé, pas de complexité inutile. Le code ennuyeux et explicite gagne toujours sur le code astucieux.
4. Traçabilité fiable. On enregistre ce qui s'est réellement passé, et qui l'a fait. Une trace qu'on peut falsifier ne vaut rien (section 6).
5. Les données appartiennent à l'entreprise qui les produit. Aucune collecte, aucune transmission vers l'extérieur.

## 3. Priorités, dans l'ordre

1. Sécurité et intégrité des données de production.
2. Zéro entropie : le dépôt est propre à chaque commit, pas seulement à la fin.
3. Lisibilité par un humain qui découvre le projet.
4. Économie de tokens (section 5).
5. Simplicité d'installation pour une PME sans informaticien.

## 4. Architecture

Backend, dans backend/ (détail : docs/guides/conventions-backend.md) :

    api/<domaine>/routes.py      routeur FastAPI, aucune logique métier, aucun SQL
    api/<domaine>/schemas.py     modèles Pydantic v2
    api/<domaine>/repo.py        accès base (psycopg2, requêtes paramétrées)
    api/<domaine>/validators.py  règles métier, lève ValidationError
    api/auth/                    JWT souverain, refresh tokens, clés d'API, rôles
    api/audits/                  journal des décisions (reason_code obligatoire)
    alembic/                     migrations, seule source de vérité du schéma

Fronts : architecture et conventions du front web dans docs/guides/architecture-web.md et conventions-web.md, celles du mobile dans docs/guides/conventions-mobile.md. Ne les charge que pour un travail sur le front concerné. Règle commune : les fronts sont des clients de l'API, ils ne contiennent aucune règle métier que le backend ne vérifie pas lui même.

Dualité machine et équipement : la table s'appelle machine, l'API expose equipement. Ne mélange pas les deux dans un même contexte sans commentaire.

Rôles : ADMIN, RESP (responsable), TECH (technicien), ACHETEUR, MCP (clé d'API machine à machine). Les droits réels de chaque rôle sont un chantier ouvert (audit 2026-10-06, point 1).

## 5. Économie de tokens (obligatoire)

1. Graphify tourne en mode AST uniquement (gratuit, sans LLM). Le hook git post-commit lance graphify update . après chaque commit. Ne lance jamais d'extraction sémantique (option --backend, documents, images) sans l'accord de l'utilisateur.
2. Pour t'orienter : si tu connais un nom de symbole, utilise graphify explain "<symbole>" ou graphify path "<A>" "<B>" ; sinon grep, ou un subagent Explore. graphify query en langage courant n'est pas un premier réflexe (mesuré sur Pantin : 7 réponses fausses sur 8). Ne lis pas graphify-out/GRAPH_REPORT.md.
3. Fichiers lourds à ne jamais lire en entier : les CHANGELOG.md, les fichiers SQL de schéma et de données de départ, les package-lock.json, docs/api/. Cherche dedans avec grep.
4. Délègue toute exploration large, recherche ou revue à un subagent : seul son résumé revient dans le contexte principal.
5. Ne colle jamais de gros fichiers ni de sorties de commande complètes dans la conversation. Résume, ou renvoie vers le fichier.

## 6. Sécurité (règles de code)

Les bilans de sécurité détaillés (audit du 2026-10-06) sont tenus hors du dépôt public tant que des constats graves restent ouverts ; ils sont suivis dans la feuille de route (section 10). Une faille se signale en privé (SECURITY.md). Règles pour tout nouveau code :

1. SQL : toujours des paramètres %s. Un identifiant dynamique (colonne, tri) passe par une liste blanche explicite.
2. Identité : l'auteur réel d'une mutation vient de request.state.user_id et est tracé dans audit_log.changed_by. Un champ « au nom de » (tech_id, technician_id, approver_id, requested_by_id...) reste une donnée déclarative libre, jamais une preuve d'identité (ADR 0005).
3. Autorisation : toute route en écriture déclare son contrôle (rôle ou permission). Être authentifié ne suffit pas. La clé d'API MCP est en lecture seule.
4. Erreurs : jamais de message brut de PostgreSQL ou d'exception vers le client. Le détail va dans les logs.
5. Réseau : les services écoutent sur localhost ou sur le réseau interne Docker. Seul le proxy web est publié. /docs, /openapi.json et /redoc sont fermés en production.
6. Secrets : jamais dans le code ni dans git, même dans un script. Un secret commité est considéré comme compromis et doit être changé.
7. Base : l'application se connecte avec un rôle sans superuser. Les migrations utilisent le rôle propriétaire.
8. strip_html est de l'hygiène, pas une protection XSS : l'échappement se fait à l'affichage (fronts, Jinja autoescape).
9. Exports : un CSV neutralise les cellules qui commencent par =, +, -, @.

## 7. Subagents (délégation)

L'agent principal planifie, orchestre, tranche et intègre. Il rédige lui même les ADR et les décisions d'architecture. Il délègue l'exécution, lance en parallèle les tâches indépendantes, et donne à chaque subagent une consigne ciblée et neuve plutôt que de reprendre un agent chargé d'historique. Les petites corrections se font sans agent.

Choix du modèle : c'est l'agent principal qui décide, à chaque délégation, avec le paramètre model. Jamais plus que sonnet pour un subagent.

1. sonnet (défaut des agents du projet) : implémentation, tests, revue, migrations, recherche.
2. haiku : tâches mécaniques sans jugement, comme un renommage massif, la mise à jour d'une doc d'endpoint depuis le code, une entrée de CHANGELOG, un inventaire de fichiers, ou une recherche de motif.
3. En cas de doute, sonnet. Un travail qui touche la sécurité, l'authentification ou une migration n'est jamais confié à haiku.

Agents du projet (.claude/agents/) :

1. backend-dev : implémente dans api/ avec ses tests.
2. db-dev : migrations alembic, données de départ, rôles PostgreSQL.
3. frontend-dev : implémente dans web/ ou mobile/
4. test-writer : écrit les tests pytest (et front si besoin), ne touche pas au code de production.
5. reviewer : relit le diff d'une branche contre ce fichier avant sa fusion dans develop. N'édite jamais. Un verdict BLOQUÉ bloque la fusion.
6. researcher : vérifications externes (versions, CVE, bibliothèques) et rapports dans docs/spikes.
7. doc-writer : documentation d'endpoints, CHANGELOG, guides. Lancé en haiku par défaut.

Pour une exploration en lecture seule, utilise l'agent intégré Explore.

## 8. Qualité du code

1. Langue : échanges, commentaires, docstrings, commits et docs en français. Noms de variables, fonctions et classes en anglais (PEP 8).
2. Commits petits et atomiques, au format Conventional Commits (feat(scope): ..., fix, docs, chore, refactor, test), toujours sur une branche de travail (section 12). Le hook commit-msg vérifie le format.
3. Une décision d'architecture égale un ADR dans docs/decisions, avec l'alternative écartée.
4. Un test avec chaque comportement nouveau, en priorité sur l'autorisation et les validators. scripts/check.sh (ruff format, ruff check, pytest) doit passer avant chaque commit ; le hook pre-commit le lance (ADR 0003). Installation : .venv/bin/pip install -r requirements-dev.txt. Les tests d'intégration (vrais middlewares, vraie base) se lancent à part avec scripts/test-integration.sh, qui exige Docker et reste hors de check.sh.
5. Fonctions courtes qui font une chose, commentaires qui expliquent le pourquoi. Pas de print, pas de code commenté, pas de TODO sans fichier de backlog.
6. Aucune dépendance ajoutée sans accord explicite de l'utilisateur, avec justification et alternative.

## 9. Documentation

    docs/decisions   un ADR par décision (format dans docs/decisions/README.md)
    docs/backlog     un fichier court par idée hors périmètre
    docs/guides      conventions détaillées, chargées à la demande
    docs/spikes      rapports de vérification
    docs/endpoints   documentation par domaine de l'API

## 10. Feuille de route

Ordre validé par l'utilisateur le 2026-10-06. Ne passe à l'étape suivante que quand le critère de sortie est vérifié.

1. ✅ (2026-10-06, ADR 0004) Configuration (hors code, sur confirmation de l'utilisateur) : corriger API_ENV, changer le mot de passe de la base, limiter les ports Docker à 127.0.0.1, expirer la clé d'API Claude. Sortie : /api/docs répond 401 ou 404 depuis Internet, la base n'est plus joignable depuis le réseau local.
2. ✅ (2026-10-06, ADR 0005) Failles bloquantes du code : escalade RESP vers ADMIN, identité prise du jeton, erreurs SQL masquées, IP client fiable, export CSV neutralisé. Sortie : un test par faille, qui échoue avant le correctif et passe après.
3. ✅ (2026-10-06, réserves dans docs/backlog/suites-etape-3c.md et 3d.md) Monorepo : nouveau dépôt, Compose à trois services, installation automatique de la base (ADR 0002). Sortie : docker compose up sur une machine vierge donne une instance fonctionnelle avec un premier admin.
4. ✅ (2026-10-07, v5.0.0 publiée) Publication : gitleaks propre, anciens dépôts passés en privé et archivés (archivage : action de l'utilisateur sur GitHub).
5. Chantier RBAC : matrice de permissions remplie, contrôle appliqué globalement, MCP en lecture seule. Sortie : tests rôle par endpoint verts.

## 11. Règles de travail

1. Avant chaque étape, propose un plan court et attends la validation avant d'écrire du code.
2. Ne dépasse pas le périmètre de l'étape en cours. Toute idée hors périmètre va dans docs/backlog.
3. Signale ce qui n'a pas pu être vérifié. Ne présente jamais une supposition comme un fait.
4. La base de dev contient des données réelles de production : aucune écriture en base, aucune migration et aucune requête qui modifie des données sans accord.
5. Demande l'accord de l'utilisateur avant : d'ajouter ou changer une dépendance, de modifier un schéma de base ou une API publique, de toucher à la configuration serveur, Docker ou réseau, de lancer une extraction sémantique Graphify, ou de contredire un ADR.
6. Ajoute l'entrée au CHANGELOG à chaque correctif ; un correctif de sécurité est aussi reporté dans le bilan de sécurité interne.

## 12. Branches, intégration et versions (ADR 0008)

    main      versions livrables uniquement, taguées vX.Y.Z (jamais de commit direct)
    develop   intégration, toujours verte (jamais de commit de travail direct)
    feat/… fix/… refactor/… test/… chore/… docs/…   une branche par chantier, depuis develop
    hotfix/X.Y.Z   correctif urgent, depuis main

1. Avant tout travail : `git switch develop && git pull`, puis `git switch -c <type>/<sujet>`. Un subagent travaille dans un worktree de cette branche, jamais sur develop ni main.
2. Fusion dans develop par l'agent principal seulement, quand check.sh et test-integration.sh sont verts, que le reviewer a rendu APPROUVÉ et que CHANGELOG.md (section « Non publié ») est à jour : `git switch develop && git merge --squash <branche> && TUNNEL_INTEGRATION=1 git commit` (message Conventional Commits qui résume le chantier), puis push de develop et suppression de la branche.
3. Une version est décidée par l'utilisateur : branche chore/release-X.Y.Z (API_VERSION, versions de web/ et mobile/ via npm version, version affichée dans README.md, section « Non publié » du CHANGELOG renommée `## [X.Y.Z] — AAAA-MM-JJ` : ce fichier racine alimente aussi « Nouveautés » ; une section `### [interne]` n'y est pas affichée) intégrée dans develop, pull request develop → main en merge commit (--no-ff), tag annoté vX.Y.Z sur main, main refusionnée dans develop. Le push vers main exige TUNNEL_RELEASE=1 ; un commit après conflit sur develop ou un cherry-pick exige TUNNEL_INTEGRATION=1 (ADR 0008 point 8).
4. ADR : premier commit de la branche du chantier qu'il décide ; ADR sans code : branche docs/adr-NNNN-<sujet>.
5. Ne jamais réécrire l'historique de main ou develop (pas de force push).

## graphify

Knowledge graph in graphify-out/ (git ignored), updated after each commit, AST only. Usage rules are in section 5: `graphify explain` or `graphify path` when a symbol name is known, grep otherwise; do not start with `graphify query`, do not read GRAPH_REPORT.md.
