# GUIDE-01. Squelette du guide VitePress et construction en CI

- Statut : faite (2026-11-21)
- Agent : frontend-dev (sonnet)
- Branche : feat/guide-utilisateur (worktree dédié)
- Dépend de : ADR 0037
- Périmètre d'écriture : docs/site/ (package.json, package-lock.json, .vitepress/config, index.md, pages vides du plan, feuille-de-route.md), .github/workflows/ci.yml (job de construction du guide quand docs/site change), .github/workflows/guide.yml (publication Pages, déclenchement manuel seulement), .gitignore (sorties de construction), CHANGELOG.md

## Contexte

Site VitePress en français (ADR 0037), rangé par rôle : technicien, responsable, acheteur,
administrateur, plus une page d'installation et une page « Feuille de route » qui reprend le
texte publiable du résumé du cahier (docs/cahier-fonctionnel-site.md, parties 2 et 3).

## Critères d'acceptation

- [x] `npm ci && npm run docs:build` dans docs/site réussit ; `docs:dev` et `docs:preview` fonctionnent
- [x] navigation : Accueil, Découvrir Tunnel, Technicien, Responsable, Acheteur, Administrateur, Installation, Feuille de route ; recherche locale ; textes de l'interface VitePress en français
- [x] page d'accueil : discours du positionnement et lien vers la démonstration (demo.frezille.fr, comptes publics) ; aucune fonction non livrée présentée comme existante
- [x] CI : construction du guide seulement quand docs/site change ; workflow Pages en déclenchement manuel
- [x] scripts/check.sh vert ; CHANGELOG « Non publié » ([interne])

## Compte rendu final

frontend-dev (sonnet) : site VitePress 1.6.4 (seule dépendance), config en français
(config.mjs), navigation par rôle, recherche locale, accueil et « Découvrir » tirés des
affirmations livrées, feuille de route sous bandeau « n'existent pas encore », pages de rôle
vides ; job CI `guide` (construit seulement si docs/site change, par git diff, sans action
tierce) ; workflow Pages en déclenchement manuel sur main. docs:build réussi, check.sh vert.
Incident signalé par l'agent, contrôlé par l'agent principal : un premier lot de commandes a
écrit trois fichiers dans le dépôt principal (cd raté), supprimés aussitôt ; git status du
dépôt principal propre. Commandes en échec : import yaml (module absent), pkill qui a tué
son propre shell. Contrôles de l'agent principal : diff conforme au périmètre, YAML des deux
workflows valide, pages d'accueil et « Découvrir » fidèles au cahier. NON VÉRIFIÉ : exécution
des workflows sur GitHub.
