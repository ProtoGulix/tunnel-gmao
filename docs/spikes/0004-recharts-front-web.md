# Spike 0004. Recharts pour le tableau de bord d'équipement (front web)

Date : 2026-11-16. Auteur : agent researcher. Statut : vérifié sauf les points
marqués NON VÉRIFIÉ. Rien n'a été installé.

## Contexte

Le front web (`web/`, React ^19.2.3, Vite ^7.2.6, @radix-ui/themes 3.2) doit
afficher courbes, histogrammes mensuels et camemberts. Candidat retenu par
l'utilisateur : Recharts.

## 1. Version, date, licence (vérifié)

Source : https://registry.npmjs.org/recharts (consulté le 2026-11-16).

- `latest` : 3.10.1, publiée le 2026-07-25. Précédente : 3.10.0 (2026-07-20).
- Licence : MIT.
- Un canal `canary` existe (3.11.0-canary.9, 2026-11-03) : à ne pas utiliser.
- `engines` : node >= 18. Champ `sideEffects` : false. Entrée ESM (`es6/index.js`).

## 2. Compatibilité (vérifié sur le manifeste npm de 3.10.1)

- peerDependencies : `react` et `react-dom` `^16.8 || ^17 || ^18 || ^19`, plus
  `react-is` avec la même plage. React ^19.2.3 est donc accepté.
- `react-is` est un peer à ajouter au projet si npm ne l'installe pas
  (npm 7+ installe les peers automatiquement) : à confirmer à l'installation.
- Vite 7 : le manifeste ne déclare aucune contrainte sur Vite. Le paquet est une
  bibliothèque ESM pure, sans plugin ni exigence d'outil de build.
  Compatibilité avec Vite 7 non testée : NON VÉRIFIÉ (un prototype d'installation
  n'a pas été fait, interdiction d'installer).

## 3. Failles connues (vérifié)

- OSV (https://api.osv.dev/v1/query, requête par paquet et version) : aucun
  résultat pour recharts 3.10.1.
- GitHub Advisory Database (https://api.github.com/advisories?affects=recharts&ecosystem=npm) :
  liste vide. Avis de sécurité du dépôt recharts/recharts : liste vide.
- OSV, dépendances directes, aux versions les plus basses admises par les
  plages (victory-vendor 37.3.6, immer 11.1.8, es-toolkit 1.39.3, react-redux 9.3.1,
  @reduxjs/toolkit 2.14.0, reselect 5.2.0, clsx 2.1.1, eventemitter3 5.0.1,
  tiny-invariant 1.3.3, decimal.js-light 2.5.1) et d3-shape 3.2.0, d3-scale 4.0.2
  (transitives via victory-vendor) : aucun résultat.
- Limite : OSV et GitHub ne couvrent que les failles publiées ; absence de
  résultat n'est pas une preuve d'absence. Les autres d3-* transitifs n'ont pas
  été interrogés un par un : NON VÉRIFIÉ.

## 4. Dépendances et poids

Dépendances directes de 3.10.1 (manifeste npm) : clsx ^2.1.1, immer ^11.1.8,
reselect 5.2.0 (version exacte), es-toolkit ^1.39.3, react-redux 8.x || 9.x,
eventemitter3 ^5.0.1, tiny-invariant ^1.3.3, victory-vendor ^37.0.2,
@reduxjs/toolkit ^1.9.0 || 2.x, decimal.js-light ^2.5.1,
use-sync-external-store ^1.2.2. Victory-vendor tire les modules d3 (d3-shape,
d3-scale, d3-array, d3-ease, d3-interpolate, d3-time, d3-timer) et leurs
`@types`. Recharts embarque donc Redux Toolkit : c'est la grosse part du poids.

Poids : Bundlephobia (https://bundlephobia.com/api/size?package=recharts@3.10.1,
consulté le 2026-11-16) : 561 606 octets minifiés, 149 877 octets gzip, pour
l'import complet du paquet. C'est un majorant : Vite/Rollup applique le
tree-shaking (`sideEffects: false`) et seuls les composants importés (LineChart,
BarChart, PieChart, axes, tooltip) sont inclus, mais la base (Redux Toolkit,
d3-scale, es-toolkit) reste. Poids réel du bundle de l'application : NON VÉRIFIÉ
(à mesurer par `vite build` après installation). Ordre de grandeur attendu :
plusieurs dizaines de Ko gzip, estimation non mesurée.
Taille décompressée du paquet npm : 7,45 Mo (`unpackedSize`), sans effet sur le
bundle.

## 5. Maintenance (vérifié)

- Dépôt recharts/recharts, non archivé, dernier push 2026-11-15.
- Versions : 3.10.0 (2026-07-20), 3.10.1 (2026-07-25), puis canaries
  3.11.0 régulières jusqu'au 2026-11-03 (une tous les 5 à 15 jours).
- 494 tickets ouverts (compteur GitHub, inclut les PR). Tickets `bug` ouverts
  notables : #7754 info-bulle qui ne s'efface pas toujours (2026-09), #6235 barres
  empilées à 0 non rendues, #6112 graphiques vides à l'impression (depuis 3.1.0),
  #6092 événements tactiles perturbés sur iOS, #6117 dépendances Redux et échecs de
  build en dev. Aucun n'est une faille ; #6092 et #7754 concernent le tactile et
  l'info-bulle, à tester si le tableau de bord est consulté sur mobile.
- Conclusion : projet activement maintenu.

## 6. Points de vigilance

- Poids : Redux Toolkit embarqué (voir section 4). Charger le tableau de bord en
  `React.lazy` (import dynamique) pour ne pas alourdir le premier affichage.
- Tree-shaking : importer par noms depuis `recharts`, jamais d'import global.
- Accessibilité : Recharts propose `accessibilityLayer` (activé par défaut en 3.x
  d'après la documentation de la 3.0, non revérifié ici : NON VÉRIFIÉ). Un
  graphique SVG reste peu lisible par lecteur d'écran : prévoir un tableau de
  données ou un résumé textuel équivalent, et ne pas coder l'information par la
  seule couleur (camemberts).
- Identifiants React 19 : Recharts 3 génère ses ids (clipPath, dégradés) en
  interne ; compatibilité avec `useId` de React 19 non testée : NON VÉRIFIÉ, à
  contrôler au prototype (ids dupliqués, avertissements d'hydratation sans objet
  ici car le front est une SPA sans SSR).
- SSR : sans objet (SPA Vite). Mesures de taille : `ResponsiveContainer` exige un
  parent de hauteur définie, sinon le graphique est vide.
- Thème Radix : les couleurs se passent en props ; utiliser les variables CSS
  Radix (`var(--accent-9)`) fonctionne dans les attributs SVG `fill`/`stroke`
  (comportement CSS général, non testé avec Recharts : NON VÉRIFIÉ).
- Canal canary : ne jamais épingler une version `canary`.

## Dépendances qu'un prototype demanderait

`recharts` (et, si npm ne l'installe pas seul, `react-is` en ^19). Aucune autre.
Le projet exige l'accord explicite de l'utilisateur (CLAUDE.md 8.6) : accordé selon
la demande de l'appelant.

## Conclusion

Version recommandée : 3.10.1, licence MIT, aucune faille connue, peers React 19
déclarés. Spécificateur pour `web/package.json` : `"recharts": "^3.10.1"`.
Réserves : compatibilité Vite 7, poids réel et rendu avec le thème Radix à
mesurer au prototype dans `web/` après installation.
