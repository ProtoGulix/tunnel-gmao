# Règles métier recopiées dans les fronts

Inventaire en lecture seule du 2026-11-20 (chantier ADR 0029). Les transitions des
demandes sont traitées par CASC-04. Aucune règle trouvée que le backend ne vérifie pas :
les écarts ci-dessous gênent l'affichage, ils n'ouvrent pas de faille.

Traité par REG-02 (2026-11-20, ADR 0030) : points 1, 2 et 3 sauf l'accès aux pages par rôle
(`/admin`, hors périmètre ADR 0030) ; point 4 réglé côté API (REG-01 : le backend refuse
désormais la suppression d'une tâche non « à faire », le web lit `can_delete`). Restent à
traiter : l'accès aux pages par rôle, le point 5, et les écrans sans `is_locked`
(fiche équipement du mobile, intervention imbriquée des demandes d'intervention).

À traiter, par ordre d'intérêt (liste d'origine) :

1. Statut « cancelled » traité comme une intervention fermée alors qu'il n'existe pas
   pour les interventions (intervention_status_ref : ouvert, attente_pieces, attente_prod,
   ferme) : web/src/components/interventions/deleteInterventionRules.js:9,
   InterventionDetailPanel.jsx:172, ActionForm/useActionSubmit.js:54,
   hooks/useBriefingData.js:300, hooks/interventions/useInterventionsList.js:132,
   InterventionListItem.jsx:18. Code mort, vérifié le 2026-11-20. Piste : un champ
   `is_locked` renvoyé par l'API, comme pour les commandes fournisseur.
2. Suppression d'une action masquée selon `NON_DISPATCHED_PR_STATUSES` recopié
   (web/src/lib/utils/actionUtils.js:25) : un drapeau de l'API suffirait.
3. Droits par rôle au lieu de permissions dans le web : `ELEVATED_ROLES`
   (web/src/auth/usePermissions.js:4), `canSkipTask` (components/tasks/taskUtils.js),
   page /admin (router/routes.jsx:281). Conformes au backend, à rapprocher du chantier
   des droits (CLAUDE.md section 4).
4. Écart mineur : le web n'autorise la suppression d'une tâche que si elle est « à
   faire » et sans action ; le backend vérifie seulement l'absence d'action
   (intervention_tasks/repo.py). Le front est plus strict ; règle à trancher.
5. Initiales d'utilisateur limitées à 5 caractères dans le web seulement (non retrouvé
   dans le backend, NON VÉRIFIÉ côté contraintes SQL).

Copies conformes sans action urgente : statuts terminaux des commandes fournisseur
(web/src/hooks/purchase/useSupplierOrders.js:20), statuts terminaux des tâches, routage
clôture et réouverture du mobile (imposé par le backend, 400).
