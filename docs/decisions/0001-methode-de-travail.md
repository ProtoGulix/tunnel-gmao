# 0001. Méthode de travail : ADR, Graphify AST et délégation à des subagents

- Statut : accepté
- Date : 2026-10-06
- Affine : CLAUDE.md sections 5, 7 et 9

## Contexte

Le projet a grandi (37 modules backend, deux fronts, plus de 900 commits) avec des
consignes dispersées : CLAUDE.md devenu partiellement faux (il décrivait encore
l'authentification Directus), quatre fichiers d'instructions dans .github/, des
décisions qui ne vivaient que dans le CHANGELOG. Le hook git post-commit lançait
Graphify en mode LLM (option --backend claude-cli) à chaque commit, ce qui coûtait
des tokens sans contrôle. L'utilisateur a demandé le 2026-10-06 de travailler comme
sur le projet Pantin.

## Décision

1. CLAUDE.md devient court et normatif (philosophie, priorités, règles). Le détail
   va dans docs/guides et se charge à la demande.
2. Chaque décision d'architecture est un ADR dans docs/decisions.
3. Graphify tourne en mode AST uniquement, via le hook post-commit versionné dans
   .githooks/ (git config core.hooksPath .githooks). Toute extraction sémantique
   demande l'accord de l'utilisateur.
4. L'agent principal planifie et décide ; l'exécution est déléguée à des subagents
   définis dans .claude/agents/. Aucun subagent au delà de sonnet ; l'agent
   principal choisit haiku pour les tâches mécaniques.
5. Le reviewer passe avant chaque commit significatif ; un verdict BLOQUÉ bloque.
6. Les commits suivent Conventional Commits, vérifié par le hook commit-msg.

## Alternatives écartées

- Garder un CLAUDE.md exhaustif : il se périme et coûte des tokens à chaque session.
- Subagents en opus pour l'architecture et la revue (choix de Pantin) : l'utilisateur
  préfère plafonner les subagents à sonnet ; l'architecture reste à l'agent principal.
- Graphify sémantique automatique : coût non maîtrisé, gain non mesuré sur ce dépôt.

## Conséquences

- Fichiers redondants supprimés le 2026-10-06 avec accord de l'utilisateur.
- Le gain réel de Graphify sur ce dépôt n'est pas mesuré (NON VÉRIFIÉ) ; sur Pantin,
  il n'est utile que quand un nom de symbole est connu.
- Au passage au monorepo (ADR 0002), CLAUDE.md, .claude/ et docs/ montent à sa racine.
