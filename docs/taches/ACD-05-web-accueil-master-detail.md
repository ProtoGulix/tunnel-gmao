# ACD-05. Web : accueil direction en master-detail

- Statut : faite (2026-11-27)
- Agent : frontend-dev
- Branche : feat/accueil-direction-acd05
- Dépend de : ACD-02, ACD-03 ; décision de l'utilisateur du 2026-11-27 (décider sans changer de page, comme les autres vues master-detail)
- Périmètre d'écriture : web/src/pages/home/, web/src/hooks/home/, web/src/components/home/, CHANGELOG.md, cette fiche. Exclu : backend, mobile, composants partagés (MasterDetailLayout, InterventionRequestDetail, InterventionDetailPanel, AnticipatePlanButton) réutilisés sans modification ; si une modification paraît indispensable, s'arrêter et la signaler.

## Contexte

La file « à traiter » (ACD-02, ACD-03) oblige à changer de page pour voir le détail. Le
front a déjà `components/ui/MasterDetailLayout.jsx`, utilisé avec `InterventionRequestDetail`
(components/intervention-requests/RequestsTabContent.jsx) et `InterventionDetailPanel`
(components/interventions/InterventionsTabContent.jsx). L'accueil reprend ce modèle.

## Critères d'acceptation

- [x] MasterDetailLayout : à gauche la file, lignes compactes regroupées par section (titre et compteur), défilement dans le panneau ; à droite le détail de la ligne choisie, message vide sinon
- [x] demande : InterventionRequestDetail, avec au-dessus un bouton « Accepter » (AcceptRequestDialog existant) visible seulement si `acceptee` est permis ; Rejeter reste celui du panneau
- [x] intervention : InterventionDetailPanel
- [x] échéance préventive : ouvre sa demande ou son intervention liée dans le détail ; sinon fiche courte (plan, équipement, échéance, retard) avec « Lancer en avance » (droit anticipate)
- [x] plus de boutons Accepter, Rejeter ni Ouvrir sur les lignes de la liste
- [x] après une décision (accepter, rejeter, lancer, suppression, changement depuis le panneau) : file rechargée, ligne suivante sélectionnée
- [x] sélection dans l'adresse (paramètre de requête, comme les autres vues master-detail), lien direct fonctionnel
- [x] une échéance préventive dont la demande est dans « Demandes à qualifier » n'est pas répétée dans « Préventif »
- [x] filtre de site, bouton « Demande d'inter » et message « Rien à traiter. » conservés
- [x] tests des règles pures (ligne suivante, clé de sélection, dédoublonnage préventif) ; ESLint sans erreur sur les fichiers touchés ; build Vite vert ; scripts/check.sh vert
- [x] textes sobres (CLAUDE.md 8.7) ; CHANGELOG (entrée de l'accueil direction complétée)

## Compte rendu final

Fait : accueil direction en MasterDetailLayout (`?sel=`). Clé de sélection `request:<id>`, `intervention:<id>` ou `preventive:<plan>:<machine>` (`rowKey`, `parseRowKey`). Après rechargement, `nextSelection` (suivante dans l'ordre affiché, sinon précédente, sinon rien) ; une clé jamais présente (lien direct) n'est pas touchée. `QueueDetail` : demande (Accepter au-dessus si `acceptee` permis, Rejeter celui du panneau), intervention, échéance (liée : son détail ; sinon fiche avec « Lancer en avance »). Lignes compactes (`QueueRow`), boutons Accepter, Rejeter et Ouvrir retirés ; `requestActions`, `reject` et l'erreur d'action supprimés. Dédoublonnage préventif dans `buildQueueSections`. `QueueNotices` extrait pour la complexité ESLint.
Tests : `npm test` 130 verts (clé, aplatissement, sélection suivante, dédoublonnage ; `requestActions` remplacé par `canAcceptRequest`), ESLint sans erreur sur les fichiers touchés, build Vite vert.
Non vérifié : parcours à l'écran (hauteur du panneau, accepter puis ligne suivante, lien direct) ; un rechargement déclenché par le panneau d'intervention sans disparition de la ligne garde la sélection.

Contrôle de l'agent principal : diff limité à l'accueil, au CHANGELOG et à la fiche ;
assertion `requestActions` remplacée par `canAcceptRequest` (fonction supprimée, Rejeter
passé au panneau), pas d'affaiblissement. Vérifié sur démonstration jetable : demande
choisie (Accepter, Rejeter, Supprimer dans le détail), intervention urgente choisie (panneau
complet). Capture du guide reprise (demande choisie). NON VÉRIFIÉ : clics d'écriture
(accepter, rejeter, lancer) et passage à la ligne suivante.

Revue : APPROUVÉ AVEC RÉSERVES. Traitées : clé `?sel=` validée (id limité à lettres, chiffres,
_ et -, il finit dans une URL d'API ; test ajouté) ; sélection figée quand une source de la
file échoue (ses lignes manquent sans avoir été décidées). Acceptée : eslint-disable des
dépendances du useMemo de la vue.
