# PRIO-04. Mobile : `normal` seul, codes de statut réels, libellés uniques

- Statut : faite (2026-11-21), essai à l'écran validé (2026-11-22)
- Agent : frontend-dev
- Branche : feat/priorites-et-statuts (depuis develop, ADR 0008)
- Dépend de : ADR 0039 ; parallèle possible avec PRIO-01 à PRIO-03
- Périmètre d'écriture : mobile/src/. Exclu : backend/, web/.

## Contexte

Relevé du 2026-11-21 : le mobile écrit `normale` (InterventionCreateForm.jsx:14,42,
InterventionForm.jsx:14,43) et le compare (EquipementsPage.jsx:29-30,88,
config/colors.js:40, config/badges.js:44-45, useInterventionsList.js:13,
PriorityBadge.jsx:10). Codes de statut inexistants : useInterventionSearch.js:16
(`en_cours,en_attente` : la recherche ne trouve que les interventions ouvertes),
ActionForm.jsx:300 (`en_attente_pieces`, `en_attente_prod`).

## Critères d'acceptation

- [x] Plus aucun `normale` dans mobile/src (grep vide), une seule table de libellés de
      priorité ; valeur par défaut des formulaires `normal`.
- [x] Recherche et formulaire d'action sur les codes réels (`ouvert`, `attente_pieces`,
      `attente_prod`, `ferme`) ; grep de `en_cours` et `en_attente` vide.
- [x] Libellés : `ouvert` « Ouvert », tâche `skipped` « Annulée ».
- [x] Build du mobile sans erreur.
- [x] scripts/check.sh vert.
- [x] CHANGELOG (« Non publié ») à jour.

## Compte rendu final

Fait (frontend-dev, sonnet) : 9 fichiers de mobile/src ; `normal` seul, table PRIORITIES
unique (EquipementsPage n'a plus ses tables locales) ; recherche d'interventions et
formulaire d'action sur `ouvert,attente_pieces,attente_prod` ; tâche `skipped` « Annulée ».
`en_attente` gardé dans ActionForm : statut réel des demandes (request_status_ref), pas des
interventions. Build et check.sh verts, pas de npm test dans mobile, aucune commande en
échec.

Compléments de l'agent principal (décisions de l'utilisateur du 2026-11-21) : bouton
« Annuler » d'une tâche, tâche terminée « Terminée » (au lieu de « Validée ») ; build vert.

NON VÉRIFIÉ à l'écran : badges, libellés, recherche d'interventions en attente.

Complément du 2026-11-22 (décision de l'utilisateur) : tâche pas commencée « À faire » partout (au lieu de « En attente ») ; build vert.
