# 0020. Recharts pour les graphiques du front web

- Statut : accepté
- Date : 2026-11-16
- Affine : CLAUDE.md section 8.6 (aucune dépendance sans accord)

## Contexte

Le tableau de bord d'un équipement (fiches TDB-01, TDB-02) demande un histogramme
mensuel et des camemberts. Le front web n'a aucune bibliothèque de graphiques ni aucun
composant de graphique réutilisable. Vérification de la bibliothèque : spike 0004.

## Décision

Ajouter recharts au front web seulement (web/package.json, `^3.10.1`, licence MIT, aucune
faille connue au 2026-11-16). Le composant qui l'utilise est chargé à la demande
(React.lazy) pour ne pas alourdir le premier chargement. Chaque graphique a un équivalent
lisible sans le graphique (chiffres ou libellés à côté), pour l'accessibilité et
l'impression. Le mobile n'est pas concerné. Accord de l'utilisateur du 2026-11-16.

## Alternatives écartées

- SVG fait main : aucune dépendance, mais des composants de camembert, d'axes et
  d'infobulles à écrire et à maintenir nous-mêmes, pour un résultat plus sommaire.
- Chart.js avec react-chartjs-2 : deux paquets, un rendu canvas moins simple à styler
  avec les variables de Radix et moins naturel dans des composants React.

## Conséquences

- Environ 150 ko gzip au plus pour le paquet complet (Bundlephobia, majorant avant
  tree-shaking), dont Redux Toolkit et des modules d3 embarqués. Poids réel à mesurer au
  premier vite build (NON VÉRIFIÉ).
- Compatibilité avec Vite 7 NON VÉRIFIÉE : à constater au premier build.
- Points connus à surveiller (spike 0004) : infobulle qui reste affichée, tactile sur
  iOS, graphiques vides à l'impression.
- Les futurs graphiques du front web utilisent recharts plutôt qu'une autre bibliothèque.
