# GUIDE-05. Section « Comprendre Tunnel » : concepts, mécanique et schémas

- Statut : faite (2026-11-21)
- Agent : doc-writer (sonnet) pour les pages ; frontend-dev (sonnet) pour les schémas SVG ; agent principal (relecture, rendu)
- Branche : feat/guide-comprendre (depuis develop)
- Dépend de : ADR 0037, cahier fonctionnel ; demande de l'utilisateur du 2026-11-21
- Périmètre d'écriture : docs/site/comprendre/*.md, docs/site/public/schemas/*.svg, docs/site/.vitepress/config.mjs (barre latérale, lien vers la vitrine frezille.fr), docs/site/decouvrir/ (remplacée ou redirigée), liens des autres pages vers la nouvelle section, CHANGELOG.md, cette fiche, docs/ETAT.md

## Contexte

Le guide décrit les écrans par rôle mais pas la mécanique d'ensemble : comment demande,
intervention, tâches, actions, codes, préventif, demandes d'achat et paniers fournisseurs
s'articulent. Section de 7 pages, un schéma SVG par page (écrit à la main, sans
dépendance, couleurs compatibles avec les thèmes clair et sombre).

Pages : vue d'ensemble ; les codes (anatomie de chaque code) ; interventions et tâches
(cycles de vie) ; les actions ; le préventif (échéancier glissant) ; achats : DA et paniers
fournisseurs (statuts dérivés, répartition, mutualisation, commande, réception) ; audit et
motifs.

## Critères d'acceptation

- [x] chaque mécanisme et chaque format de code vérifié dans le code (backend : génération des codes, transitions, statuts dérivés, répartition), rien de non livré décrit comme existant
- [x] un schéma SVG par page (10 schémas), lisible en thème clair et sombre, relu à l'image par l'agent principal
- [x] « Découvrir Tunnel » remplacée par la section, liens internes à jour, lien vers la vitrine frezille.fr dans l'en-tête
- [x] docs:build vert, aucun lien mort ; reviewer APPROUVÉ ; CHANGELOG

## Compte rendu final

doc-writer (sonnet) : 7 pages, formats de code vérifiés dans les fonctions de génération
(DI, DA, intervention, commande, pièce, équipement, plan), transitions et statuts dérivés
lus dans les validators et la vue ; l'agent n'avait pas de shell (docs:build et branche
contrôlés par l'agent principal). frontend-dev (sonnet) : 10 schémas SVG à fond clair,
rendus en PNG et corrigés ; commande en échec corrigée (chemin de Chromium). Contrôles de
l'agent principal : les 10 schémas relus à l'image ; transitions du panier et libellés des
statuts dérivés comparés au code ; passage « à faire → en cours » d'une tâche par une action
vérifié ; écart signalé « statut in_progress absent » reproduit sur la démonstration et
réfuté (une demande acceptée crée une intervention « ouvert »). Écarts du code relevés par
le rédacteur, au backlog : priorités « normal »/« normale », codes de plan à tirets refusés
par le formulaire, quantité reçue modifiable par l'API sans écran. docs:build vert.

Reviewer APPROUVÉ (27 affirmations vérifiées dans le code, aucune fausse) ; réserves traitées :
ETAT, fiche, lien https, issue de la demande à la suppression d'une intervention, tâche
repassée « à faire » à la suppression de sa dernière action.

Complément du 2026-11-21 (demande de l'utilisateur) : page « Le stock et les pièces » et
schéma modele-pieces.svg écrits par l'agent principal (modèle part, références fabricant et
fournisseur, liens avec les statuts « À qualifier » et « Sans fournisseur », répartition,
quantités non suivies : vérifiés dans le schéma de base et le code), capture du Bilan sur
l'accueil du guide ; rendu des deux pages contrôlé par capture, docs:build vert.
