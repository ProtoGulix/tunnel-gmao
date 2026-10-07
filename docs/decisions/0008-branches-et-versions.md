# 0008. Branches, intégration et versions : main ne reçoit que des versions livrables

- Statut : accepté
- Date : 2026-10-07
- Affine : CLAUDE.md sections 8 et 12, ADR 0001

## Contexte

Le dépôt est public depuis la 5.0.0. Tunnel est installé par des PME qui suivent des
versions numérotées et une procédure de mise à jour : la branche qu'elles clonent
doit toujours être une version livrée. Jusqu'ici, des commits de travail arrivaient
directement sur main.

## Décision

GitFlow simplifié :

1. main : uniquement des versions livrables, chacune taguée vX.Y.Z (SemVer) avec sa
   section dans CHANGELOG.md. Aucun commit direct ; elle ne reçoit qu'une fusion
   --no-ff depuis develop (version) ou depuis une branche hotfix/X.Y.Z (correctif
   urgent).
2. develop : intégration, toujours verte. Aucun commit direct de travail ; elle
   reçoit les branches de travail en squash merge, un commit Conventional Commits
   par chantier.
3. Branches de travail, toujours créées depuis develop : feat/<sujet>, fix/<sujet>,
   refactor/<sujet>, test/<sujet>, chore/<sujet>, docs/<sujet>. Un chantier = une
   branche. Elles sont supprimées après fusion.
4. Conditions de fusion dans develop : scripts/check.sh et
   scripts/test-integration.sh verts, verdict APPROUVÉ du reviewer, CHANGELOG mis à
   jour (section « Non publié »). Tant que l'outil gh n'est pas installé, la fusion est
   faite par l'agent principal en local (git merge --squash) puis poussée ; ensuite,
   par pull request.
5. Version, décidée par l'utilisateur : branche chore/release-X.Y.Z depuis develop
   (API_VERSION, section datée du CHANGELOG), intégrée dans develop comme tout
   chantier ; puis pull request develop → main fusionnée en merge commit (--no-ff, pas
   de squash), tag annoté vX.Y.Z sur ce commit de main, et main refusionnée dans
   develop.
6. Hotfix : branche hotfix/X.Y.Z créée depuis main, version CORRECTIF, fusionnée dans
   main (tag) puis dans develop.
7. ADR : un ADR lié à un chantier est le premier commit de sa branche et arrive dans
   develop avec le code qu'il décide ; un ADR sans code passe par une branche
   docs/adr-NNNN-<sujet>.
8. Garde-fous locaux (.githooks) : pas de commit sur main ; sur develop, seulement
   pour finaliser une intégration (TUNNEL_INTEGRATION=1) ; pas de push vers main
   hors publication d'une version (TUNNEL_RELEASE=1). Une fusion sans conflit (main →
   develop, hotfix → main) passe par pre-merge-commit et n'est pas bloquée ; en cas de
   conflit, le commit final se fait avec TUNNEL_INTEGRATION=1 sur develop ou
   TUNNEL_RELEASE=1 sur main. Un cherry-pick ou un revert sur develop demande aussi
   TUNNEL_INTEGRATION=1. Ces hooks évitent les erreurs, ils ne sont pas une sécurité :
   une variable d'environnement ou un HEAD détaché les contourne ; la vraie barrière
   est la protection des branches sur GitHub. Sur GitHub, l'utilisateur
   protège main et develop (règles de branche : pas de push direct ni de force push,
   CI verte requise).
9. CI GitHub Actions sur chaque pull request et chaque push vers develop ou main :
   check.sh, puis les tests d'intégration.

## Alternatives écartées

- GitHub Flow (main toujours déployable, tout passe par main) : contraire à la règle
  « main = versions livrables » pour un logiciel installé chez des clients.
- Trunk-based : demande une CI et des feature flags que le projet n'a pas.
- Merge commits sur develop : historique d'intégration bruyant ; le détail des
  commits reste sur la branche de travail le temps de la relecture.

## Conséquences

- Le commit « étape 4 » poussé directement sur main le 2026-10-07 est la dernière
  exception ; develop a été créée à partir de main ce jour-là.
- Une correction de documentation passe aussi par une branche et develop.
