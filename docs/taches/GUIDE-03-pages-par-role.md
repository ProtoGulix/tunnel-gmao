# GUIDE-03. Pages du guide, par rôle

- Statut : faite (2026-11-21)
- Agent : doc-writer (sonnet : chaque affirmation se vérifie dans le code), un agent par rôle
- Branche : feat/guide-utilisateur
- Dépend de : GUIDE-01, GUIDE-02 (captures), cahier fonctionnel
- Périmètre d'écriture : docs/site/<rôle>/*.md et docs/site/public/captures/manifeste (ajout d'entrées), une partie par agent ; rien dans le code. Étendu par l'agent principal (2026-11-21) : docs/site/.vitepress/config.mjs (barre latérale), docs/cahier-fonctionnel.md et docs/cahier-fonctionnel-site.md (écarts trouvés), docs/backlog/ (constats), CHANGELOG.md

## Contexte

Un guide par tâche, au ton terrain, qui ne décrit que le livré (cahier fonctionnel, version
publiée). Technicien : mobile d'abord (mes tâches, saisir une action, signaler, demande
d'achat, clore, rouvrir). Responsable : accueil direction technique, demandes,
interventions et tâches, coordination, préventif, équipements, bilan du service, audit et
motifs. Acheteur : demandes d'achat, répartition, commandes, pièces et fournisseurs.
Administrateur : utilisateurs et rôles, référentiels, règles d'audit, vues d'accueil.
Installation : Docker Compose, premier administrateur, mise à jour.

## Critères d'acceptation

- [x] chaque page cite l'écran réel et suit le parcours réel (vérifié dans web/ ou mobile/ et l'API)
- [x] aucune fonction à concevoir ou en vision décrite comme existante ; limites connues dites (pas de saisie hors ligne, catalogue sans mouvements de stock…)
- [x] chaque page d'écran a une capture quand le manifeste en a une ; captures manquantes (administration avec une session ADMIN, coordination, tâches, fenêtre de motif) reportées à GUIDE-04
- [x] relu par le reviewer contre le cahier fonctionnel
- [x] docs:build vert

## Compte rendu final

Quatre rédacteurs doc-writer (sonnet), un par rôle, sans commande en échec : technicien 7
pages, responsable 9, acheteur 7, administrateur 6 et installation 3. Barre latérale par
section (agent principal) ; docs:build vert, aucun lien mort. Affirmations sans preuve dans
le code omises par les rédacteurs. Écarts trouvés, vérifiés par l'agent principal et traités :
quantités des pièces non suivies à l'écran (cahier 1.6 et résumé du site corrigés) ;
fenêtre de clôture du web proposée à chaque action (page technicien corrigée) ; rejet d'une
demande sans motif aujourd'hui (cahier précisé, backlog motif-de-rejet) ; rôles codés en dur
dans l'administration, OPE inexistant et ACHETEUR absent (backlog roles-codes-en-dur-admin) ;
bouton Annuler du formulaire de demande mobile (backlog dette-mobile) ; constats du
responsable (backlog constats-guide-responsable). Reste : captures supplémentaires demandées
(coordination, tâches, fenêtre de motif, administration avec une session ADMIN), relecture.

Reviewer APPROUVÉ (51 affirmations vérifiées dans le code) ; réserves traitées : CHANGELOG,
fiche, réouverture d'une intervention verrouillée, libellés sans accent cités tels
qu'affichés, titre « Rejeter ». docs:build vert.
