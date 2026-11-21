# 0037. Guide utilisateur en VitePress, en français, publié sur GitHub Pages

- Statut : accepté (2026-11-21, choix de l'utilisateur : français seul, GitHub Pages,
  VitePress et playwright-core acceptés, captures prises sur la démonstration)
- Date : 2026-11-21
- Affine : CLAUDE.md section 9 ; ADR 0036 (base de démonstration) ; cahier fonctionnel

## Contexte

La documentation de `docs/` s'adresse aux contributeurs (ADR, guides, fiches). Rien
n'explique Tunnel à un technicien, un acheteur ou un responsable qui découvre l'outil. Le
cahier fonctionnel (docs/cahier-fonctionnel.md) sépare ce qui est livré de ce qui ne l'est
pas ; la base de démonstration (ADR 0036) fournit des données entièrement fictives pour les
captures. Le projet Pantin du même auteur a déjà éprouvé la méthode (son ADR 0051 : site
VitePress, captures régénérées par script avec playwright-core).

## Décision

1. **Outil et emplacement** : site VitePress dans `docs/site/`, en Markdown, avec son
   propre `package.json` (npm, comme `web/` et `mobile/`) : `vitepress` 1.6.4 et
   `playwright-core` 1.64.1 en dépendances de développement (vérifié le 2026-11-21 :
   VitePress 1.6.4 est la dernière version stable, la 2.0 est en alpha ; playwright-core
   1.64.1 plutôt que la 1.65.1 pour réutiliser le Chromium déjà installé pour Pantin,
   montée de version possible plus tard). Scripts
   `docs:dev`, `docs:build`, `docs:preview`, `docs:screenshots`.
2. **Langue** : français seul. L'arborescence laisse la place à une autre langue plus tard
   sans changer d'outil.
3. **Contenu** : le guide ne décrit que ce qui est **livré** selon le cahier fonctionnel,
   vérifié dans le code de la version publiée, rangé par rôle (technicien, responsable,
   acheteur, administrateur) puis par tâche. Ce qui est à concevoir ou en vision n'y figure
   pas, ou seulement dans une page « Feuille de route » qui le dit. Les ADR et guides de
   contribution restent où ils sont ; le site y renvoie sans les recopier.
4. **Captures** : prises par script (`docs:screenshots`), jamais à la main, sur une
   instance de démonstration jetable (projet Compose `tunnel-demo-<suffixe>`, port libre,
   ADR 0036), jamais sur la base de dev ni sur la démonstration publique. Le script pilote
   le web et le mobile dans Chromium sans interface (playwright-core) et enregistre des
   images WebP dans `docs/site/public/captures/`. Il est relancé après tout changement
   d'écran montré, et le résultat est commité avec le changement. Aucune donnée réelle ne
   peut y apparaître puisque la base est fictive ; l'agent principal relit les captures.
5. **Publication** : GitHub Pages, par un workflow GitHub Actions qui construit le site
   depuis `main` (la documentation suit la version publiée) ; sous-domaine dédié choisi par
   l'utilisateur, site construit à la racine (`base: "/"`). Le workflow est d'abord écrit en
   déclenchement manuel ; l'utilisateur crée l'enregistrement DNS, règle la source Pages sur
   « GitHub Actions » et le domaine dans les réglages du dépôt, puis le déclenchement sur
   `main` est activé.
6. **Contrôles** : le site n'entre pas dans `scripts/check.sh` (aucun code testé) ; la CI
   vérifie seulement qu'il se construit (`docs:build`) quand `docs/site/` change.

## Alternatives écartées

- Anglais et français dès le départ : double travail de pages et de captures pour un public
  d'abord français.
- Héberger le guide sur la VM de dev par le tunnel Cloudflare : une charge et une surface
  de plus sur la machine qui contient la copie de la production.
- Le copier dans le dépôt privé du site vitrine : deux dépôts à synchroniser, documentation
  hors du dépôt qu'elle décrit.
- Markdown seul dans le dépôt : ni recherche, ni navigation pour un débutant.
- Starlight, Docusaurus, MkDocs : écartés pour les mêmes raisons que dans Pantin (outillage
  supplémentaire, React ou Python pour la documentation) ; VitePress reste dans Vite, déjà
  utilisé par les deux fronts.
- Captures à la main : elles vieillissent à chaque changement d'écran et risquent de
  montrer des données réelles.

## Conséquences

- Un changement de comportement visible met à jour les pages qui le décrivent ; le
  reviewer le vérifie.
- `docs/site/` a son propre `package-lock.json` (fichier lourd, jamais lu en entier).
- L'enregistrement DNS, la vérification du domaine et les réglages Pages sont des actions de
  l'utilisateur.
- Le script de captures dépend de Docker et de la base de démonstration : il casse si le
  scénario ou le chargeur cassent, ce qui les maintient en état.

## Amendement (2026-11-21) : adresse de publication

Choix de l'utilisateur : le guide est publié sur `tunnel.frezille.fr/docs/`, comme Pantin
(`pantin.frezille.fr/docs/`), plutôt que sur un sous-domaine dédié ou sur un site commun
`docs.frezille.fr/<projet>` (un dépôt par domaine avec GitHub Pages : un site commun
demanderait un dépôt de plus et une synchronisation). Le site est construit avec
`base: "/docs/"` ; la racine du sous-domaine reste libre (page d'accueil, renvoi vers le
site vitrine). Le point 5 est modifié en conséquence : l'enregistrement DNS
`tunnel.frezille.fr` vers GitHub Pages et le domaine du dépôt restent des actions de
l'utilisateur.
