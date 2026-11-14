# Suites de l'étape 2 de l'audit centralisé (AUDC)

Relevés pendant l'étape 2 (2026-11-14), hors de son périmètre :

1. Création d'intervention sans demande choisie (web, useInterventionCreate) : le front
   crée une demande directe puis l'intervention, en deux appels non atomiques ; si le
   second échoue, la demande reste « nouvelle » sans intervention. Repli « Système »
   codé en dur pour le nom du demandeur. Piste : une route qui crée les deux dans la même
   transaction.
2. Préventif à la suppression d'intervention : le web grise « Supprimer aussi la
   demande » sur `request.isSystem` (heuristique) ; un champ explicite (demande liée à une
   occurrence) renvoyé par l'API serait plus fiable. Le backend reste juge.
3. Suppression en lot des demandes d'achat : une requête par demande ; un échec en cours
   de route laisse une suppression partielle. Piste : route de suppression en lot, tout
   ou rien.
4. Import CSV : une ligne en erreur fait refuser tout l'import (décision tout ou rien).
   Question ouverte : proposer d'exclure les lignes fautives en un geste avant l'import
   (`excluded_rows` existe côté API).
5. Mobile : la permission `PERM.actions.createIntervention` n'est plus vérifiée à l'écran
   (le geste qui la vérifiait est retiré) ; le backend reste le garde.
6. Migration 0004 : même forme `SELECT MAX(id)+1 FROM t WHERE NOT EXISTS` que le défaut
   corrigé dans 0008 ; sans effet aujourd'hui (jouée une fois, règle absente de la seed).
7. Docstrings et tableaux de docs/api/endpoints qui disent encore « reason_code
   obligatoire » pour des routes routinières (AUDC-26).
8. check.sh n'a pas vu un import manquant (`Button` retiré d'InterventionPanelHeaderParts,
   erreur à l'exécution vue par l'utilisateur le 2026-11-14) : le build vite ne vérifie
   pas les noms non définis. Piste : lancer dans check.sh eslint limité aux règles
   no-undef et react/jsx-no-undef (eslint complet : 338 erreurs préexistantes).
9. Deux pannes de l'étape 2 n'ont été vues qu'à l'écran (import manquant ; decision_types
   absent de GET /audit/reasons et de la liste jointe au 400) : aucun test ne relie la
   réponse de l'API à la fenêtre de motif du web. Piste : tests de contrat (forme des
   motifs attendue par le front) côté backend, ou tests de bout en bout.
10. (Étape 3) Le web appelle `DELETE /parts/{id}` (web/src/api/parts.js:65, via
    useParts) alors que le backend n'a aucune route de suppression de pièce : le bouton
    Supprimer de l'onglet Pièces échoue (405), indépendamment de l'audit. À trancher :
    retirer le bouton, ou ajouter la route (avec motif, règles de suppression à définir).
11. (Étape 3) Fonctions web sans appelant : deleteSupplier, deleteSupplierOrderLine,
    suppression d'un lien demande d'achat ↔ ligne de commande.
12. (Étape 3) Désactivation d'un plan préventif : la confirmation « Désactiver » reste
    ouverte derrière la fenêtre de motif (signalé par l'agent, à voir à l'écran).
13. (Étape 3) Hooks web sans gestion de l'annulation de la fenêtre de motif
    (isAuditCancelled) : useSupplierDetail removeLink et removeSupplier, sans appelant
    aujourd'hui ; à traiter si une interface les appelle.
14. (Étape 3) Renommage d'une famille de stock : historique rangé sous l'uuid de l'ancien
    code ; le changement de family_code des sous-familles n'est pas tracé à part.
15. (Étape 3) Lint web des fichiers touchés : max-lines (PartsTab, StockItemsTab),
    complexité (SupplierRefRow), changePageSize inutilisé ; faux positif probable de la
    règle « _or » sur auditEntity.js. Préexistant ou non : non comparé.
16. (Plans préventifs) Page Préventif et page d'administration des plans : un échec de
    désactivation, de réactivation ou d'enregistrement des étapes (403, réseau) n'affiche
    aucun message (promesse rejetée non gérée). Suppression réelle d'un plan écartée le
    2026-11-14 : possible seulement avant toute occurrence générée, donc sans utilité.
17. (Sécurité, constat du 2026-11-14) Une seule règle de domaine de courriel en base
    restreint la connexion de tous les comptes aux domaines listés (auth/routes.py,
    liste blanche dès qu'une règle existe), administrateur compris : un admin qui ajoute
    une règle pour un seul domaine peut se bloquer. Comportement voulu ou non : à décider
    (avertissement à l'écran, refus si le domaine de l'admin n'est pas couvert).
18. (Étape 4) La synchronisation du catalogue (api/endpoints_catalog.py) ajoute et met à
    jour les endpoints mais ne retire jamais ceux qui ont disparu du code : POST /audit/log,
    supprimée à l'étape 4, reste dans tunnel_endpoint et ses lignes de droits restent
    affichées dans l'écran des droits. À décider : marquer ou retirer les endpoints absents.
