# ADV-02. Web : bilan qui se replie, barres lisibles

- Statut : faite (2026-11-27)
- Agent : frontend-dev
- Branche : feat/accueil-direction-visuel
- Dépend de : ADV-01 ; maquette choisie par l'utilisateur le 2026-11-27 (« bilan qui se replie »)
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/home/, web/src/components/home/, CHANGELOG.md, cette fiche. Composants partagés réutilisés sans modification.

## Contexte

Capture de l'utilisateur sur données réelles : après un clic, liste et détail tombent sous
la ligne de flottaison ; le bloc « Où » (4 sites, 10 équipements) impose sa hauteur et laisse
du vide sous Flux et Âge ; des équipements s'affichent « 0 » (nom vide en base) ; barres en
fond gris, « 260 j · 43 » ambigu, rien ne fait ressortir « > 90 j » ; tuiles grandes pour un
chiffre ; « en hausse » pour 56 → 58.

## Critères d'acceptation

- [x] sans filtre : bilan tenant sur une hauteur d'écran de portable (1366×768 avec le bandeau), trois colonnes de hauteur comparable ; « Où » limité à 5 lignes par liste (sites, équipements) avec « Voir tout (n) » qui déplie
- [x] équipements et sites affichés « code – nom » (le nom seul s'il n'y a pas de code, le code seul si le nom est vide ou « 0 » n'est pas à deviner : afficher les deux tels quels)
- [x] barres : fond neutre léger, valeur lisible « 43 demandes · plus ancienne 260 j » (ou forme courte équivalente avec infobulle), tranche la plus ancienne en couleur d'alerte (couleur choisie par le code de la tranche renvoyé par l'API, pas par un seuil en jours dans le front)
- [x] tendance lue dans `trend_direction` (ADV-01), plus de déduction par le signe
- [x] tuiles en bandeau fin (libellé et chiffre sur une ligne), toujours cliquables
- [x] après un clic : le bilan se réduit à une ligne de rappel (stock, tranche ancienne, tuiles, filtre actif avec Effacer) et la liste et le détail occupent la hauteur restante de la fenêtre, sans défilement de page pour voir le haut du détail ; Effacer ou clic sur le rappel rouvre le bilan
- [x] règles pures testées (libellé code – nom, troncature à 5, choix du mode replié) ; ESLint sans erreur sur les fichiers touchés ; build Vite ; scripts/check.sh
- [x] textes sobres (CLAUDE.md 8.7) ; CHANGELOG

## Compte rendu final

Fait : bilan à trois colonnes, « Où » limité à 5 lignes par liste (`Voir tout (n)` / `Réduire`), libellés « code – nom » (`placeLabel`), barres à fond léger, « n · plus ancienne x j » avec infobulle, dernière tranche de l'API en rouge (`oldestBucketCode`, aucun seuil en jours), tendance lue dans `trend_direction` (`trendDirection` supprimée), tuiles en bandeau fin. Avec un filtre, `BilanRecap` remplace le bilan et `ActiveFilterBar` (supprimée) ; liste et détail en `flex: 1` sous un conteneur sans défilement (`isCollapsed`). Règles pures testées dans `bilanFilter.test.js` (144 tests verts).
Non vérifié : rendu à l'écran, tenue sur 1366x768, largeur des libellés longs dans les colonnes.

Contrôle de l'agent principal : diff dans le périmètre ; test `trendDirection` retiré avec la
fonction (tendance désormais donnée par l'API, ADV-01). Vu sur démonstration jetable en
1440×800 : bilan sur un écran, rappel en une ligne, détail entier sans défilement. Corrigé :
tranche la plus ancienne en rouge même vide (alerte seulement si elle contient une demande,
test ajouté). Guide et captures repris. NON VÉRIFIÉ : 1366×768 exact, clics d'écriture.

Revue : APPROUVÉ AVEC RÉSERVES. Traitées : lien « Toutes les demandes » remis, toujours
visible sur la ligne du filtre de site ; rappel tronqué avec points de suspension ; ordre des
imports et indentation. Captures reprises.
