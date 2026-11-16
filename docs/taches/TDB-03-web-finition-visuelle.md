# TDB-03. Finition visuelle de la section « État et évolution »

- Statut : faite (2026-11-16)
- Agent : frontend-dev
- Branche : feat/equipement-tableau-de-bord (depuis develop, ADR 0008)
- Dépend de : TDB-02 (section livrée, valeurs validées à l'écran par l'utilisateur le 2026-11-16)
- Périmètre d'écriture : web/src/components/equipements/EquipementDashboard*.jsx,
  web/src/components/equipements/dashboardColors.js, web/src/hooks/equipements/
  (fonctions pures de formatage et leurs tests), CHANGELOG.md (« Non publié », ligne
  existante à ajuster si besoin). Exclu : backend/, mobile/, toute dépendance, le contrat
  de l'API, EquipementActivity.jsx et EquipementDetailPanel.jsx sauf nécessité signalée.

## Contexte

Retour de l'utilisateur après essai : les valeurs sont justes, mais la section « n'est
pas très esthétique et ne s'accorde pas avec le reste de l'application ». Constats de
l'agent principal sur les captures : histogramme et courbe des heures sur deux échelles
superposées (la ligne noire traverse les barres) ; six grandes cartes KPICard aux titres
colorés qui occupent un demi-écran ; trois grands anneaux sans libellé, puis les mêmes
valeurs répétées dans trois listes en dessous ; légende écrite dans la couleur des
séries ; axes dans la police par défaut de Recharts ; mois en « 2026-04 ».

## Attendu

S'aligner sur le style des sections voisines du panneau (Fiche, Activité : Radix Themes,
tailles 1 et 2, encres grises, bordures fines, densité de liste) plutôt que de créer un
style propre. Toutes les couleurs et polices passent par les variables CSS de Radix
(var(--gray-a6), var(--gray-11), var(--accent-9), var(--default-font-family)...), pour
le thème clair et sombre.

1. Chiffres clés : une bande compacte de six tuiles (grille 3 colonnes, 6 si la largeur
   le permet), libellé en texte gris taille 1, valeur en gras taille 4 à 5, unité en
   gris ; aucune couleur de titre ; ne plus utiliser KPICard ici. Valeur absente : « — ».
2. Deux graphiques au lieu d'un, jamais deux échelles verticales sur un même graphique :
   a. « Interventions signalées par mois » : barres empilées par type, coins arrondis
      de 2 à 4 px sur le haut de la pile seulement, 2 px d'écart entre segments ;
   b. « Heures passées par mois » : aire ou barres d'une seule teinte (accent), même
      axe des mois que le premier, hauteur plus faible (environ 140 px).
   Grille horizontale seulement, discrète (var(--gray-a4), pointillé ou fin) ; axes sans
   ligne, graduations en var(--gray-11) taille 11 à 12 px, police de l'application ;
   mois affichés « avr. 26 » (Intl.DateTimeFormat fr-FR), un sur deux si la place manque ;
   infobulle au survol aux couleurs du thème (fond var(--color-panel-solid), bordure
   var(--gray-a6), ombre légère), texte en encre, pastille colorée à côté de la valeur.
3. Répartitions : trois blocs côte à côte (une colonne en largeur étroite), chacun avec
   un petit anneau (environ 96 px) et, à côté, sa légende chiffrée : pastille de
   couleur, libellé en encre, valeur et part en %, en gris. Supprimer les trois listes
   en double sous les anneaux : la légende chiffrée les remplace et reste cliquable pour
   le bloc des types (ouvre la modale comme aujourd'hui). 2 px de séparation entre les
   parts (stroke de la couleur du fond).
4. Couleurs : un type, une catégorie ou un facteur garde toujours la même couleur, quel
   que soit l'ordre ou le filtre. Les types partagent aujourd'hui « blue » (REA, PRO,
   PIL) : attribuer dans dashboardColors.js une teinte distincte par code de type, dans
   un ordre fixe, sans toucher au backend. Palette de repli des facteurs et catégories
   sans couleur : teintes Radix étape 9 dans un ordre fixe, validée avec le script
   /tmp/claude-1000/bundled-skills/2.1.321/e8d58234449d8d9719675cc27886794d/dataviz/scripts/validate_palette.js
   (mode light et dark ; noter le résultat dans le compte rendu). Le texte (légendes,
   valeurs, libellés) n'est jamais dans la couleur de la série.
5. Légende des graphiques en texte d'encre taille 1, pastilles carrées arrondies ; pas
   de légende Recharts par défaut si une légende maison est plus sobre.
6. « Valeurs par mois » reste repliable, en tableau Radix (Table, size 1).
7. Aucun changement de comportement : mêmes clics, mêmes filtres de la modale, même
   chargement à la demande, mêmes états vide, chargement et erreur.

## Critères d'acceptation

- [x] Aucun graphique à double échelle ; deux graphiques mensuels sur le même axe des mois.
- [x] Chiffres clés compacts, sans KPICard ni titres colorés.
- [x] Anneaux avec légende chiffrée à côté, listes en double supprimées, clic des types
      conservé.
- [x] Une couleur distincte et stable par type ; palette de repli validée par le script.
- [x] Couleurs et police par variables Radix (pas de couleur hexadécimale codée en dur
      hors palette de repli documentée).
- [x] npm run build vert, aucune erreur de lint ajoutée (comparaison avant et après),
      scripts/check.sh vert ; tests des fonctions de formatage (mois en fr-FR, parts en %).
- [x] Essai à l'écran par l'utilisateur.

## Compte rendu final

Fait (frontend-dev, worktree feat/equipement-tableau-de-bord-tdb03) : bande de six
tuiles compactes (3 colonnes, 6 à partir de lg) ; deux graphiques mensuels sur le même
axe (barres empilées par type 180 px, aire des heures en accent 140 px), grille
pointillée, mois « avr. 26 », infobulle et légende au thème ; trois anneaux de 96 px avec
légende chiffrée (valeur, part en %), listes en double supprimées, clic des types sur la
légende et sur la part ; « Valeurs par mois » en Table Radix repliable. Fichiers :
EquipementDashboardCharts/Figures/Section.jsx, dashboardColors.js, nouveau
hooks/equipements/dashboardFormat.js et son test.

Couleurs : une teinte fixe par code de type (CUR red, PRE green, REA blue, PRO violet,
PIL cyan, MES pink, COF plum, BAT teal), qui ignore la couleur renvoyée par l'API ;
catégories : couleur de l'API, sinon teinte de repli liée au code (deux codes peuvent
partager une teinte). Palette de repli violet, cyan, red, teal, blue, plum, green, pink
validée (clair #ffffff, sombre #18191b) : ALL CHECKS PASS, avertissement daltonisme
rose/vert ΔE 7,8 (zone tolérée avec encodage secondaire : légende chiffrée et séparation
de 2 px) ; validation de toutes les paires non tenue (rouge et vert imposés).

Résultats : build vert, chunk des graphiques 119,58 kB gzip ; npm test 37 passés ; lint
328 erreurs avant et après, aucune dans ces fichiers ; check.sh vert.

Écarts : la légende des répartitions est désormais dans le chunk chargé à la demande ;
titre de la modale d'un mois « Mois : avril 2026 » ; heures arrondies à 1 décimale ;
tableau mensuel après les anneaux ; hauteurs de tuiles légèrement inégales.

NON VÉRIFIÉ : rendu à l'écran (chevauchement des mois, coins arrondis, thème sombre,
passage à une colonne), clics sur les segments.

Essai à l'écran : validé par l'utilisateur le 2026-11-16 sur un équipement réel (BRO001).
Ajout à la demande de l'utilisateur, fait par l'agent principal : fiche sur deux colonnes, lignes de propriété moins hautes (EditableProperty), sous-équipements en grille compacte (EquipementFicheSection.jsx, EquipementDetailSections.jsx, EditableProperty.jsx), lint sans erreur sur ces fichiers.
Non confirmé explicitement par l'utilisateur : thème sombre, clic sur un segment de barre.
