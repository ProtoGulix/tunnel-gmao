# ADB-02. Web : bilan en tête de l'accueil direction, liste au clic

- Statut : faite (2026-11-27)
- Agent : frontend-dev
- Branche : feat/accueil-direction-bilan
- Dépend de : ADB-01, ADR 0046
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/home/, web/src/components/home/, web/src/api/stats* (ajout de la lecture), CHANGELOG.md, cette fiche. Composants du Bilan (web/src/components/bilan : FigureCard, Sparkline, StackedBar…) réutilisés sans modification.

## Critères d'acceptation

- [x] trois blocs en tête : flux (entrées et sorties par semaine, stock, tendance), âge (tranches), où (sites puis équipements) ; données de `GET /stats/demandes`, rien recalculé dans le front
- [x] sous le bilan, tuiles chiffrées : urgentes, en attente, sans action, préventif (sources du chantier ACD)
- [x] sans clic : pas de liste ; clic sur le stock, une tranche, un site, un équipement ou une tuile : liste filtrée à gauche, détail à droite (composants ACD), filtre actif affiché et effaçable
- [x] filtre et sélection dans l'adresse ; filtre de site commun au bilan et aux tuiles
- [x] règles pures testées (filtre par tranche, site, équipement) ; ESLint sans erreur sur les fichiers touchés ; build Vite ; scripts/check.sh
- [x] textes sobres (CLAUDE.md 8.7) ; CHANGELOG

## Compte rendu final

Fait : accueil en bilan (`DemandBilan` : flux avec trois `FigureCard` réutilisées, âge, où en `BarList`) puis tuiles (`QueueTiles`, comptes de la file dédoublonnée) ; sans filtre, pas de liste. Filtre `?f=` (`stock`, `age:<code>`, `site:<id>`, `equipment:<id>`, `tile:<id>`, validé) et `?site=` dans l'adresse ; changer de filtre efface `?sel=`, changer de site efface le filtre. Règles pures dans `bilanFilter.js` et `bilanView.js` : tranche par `from_days`/`to_days` de l'API (aucun seuil en dur), portée site (descendants) ou équipement (exact, comme les comptes de l'API), sections et libellé du filtre. Données : `api/demandeStats.js`, `useDemandeStats`, `useDirectionHome` (assemblage), `useTechnicalDirectionRequests` à portée paramétrable (liste propre chargée au clic site ou équipement). Détail ACD conservé (`FilteredQueue`).
Tests : `npm test` 140 verts (14 nouveaux), ESLint sans erreur sur les fichiers touchés, build Vite vert.
Non vérifié : rendu à l'écran (disposition des trois blocs, hauteur de la liste), données réelles, un équipement hors des dix premiers affiche le libellé « Équipement » (seul le clic depuis le bilan le produit), clics d'écriture.
