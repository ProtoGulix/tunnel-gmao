# AUDC-27b. Front mobile de l'étape 2

- Statut : faite (2026-11-14), essai à l'écran à faire
- Agent : frontend-dev
- Branche : refactor/audit-etape-2
- Dépend de : AUDC-22 à AUDC-30, ADR 0019
- Périmètre d'écriture : `mobile/src/` seulement, tests front du mobile s'il y en a,
  CHANGELOG (section « Non publié », effet visible). Exclus : backend, web, docs d'API.

## Contexte

Voir AUDC-27a pour le backend. Mobile : `mobile/src/api/tasks.js` envoie 'ROUTINE' en dur
(l. 95, 115, 124) ; la suppression de tâche (l. 124) envoie ROUTINE alors qu'une
suppression exige désormais un motif explicite choisi ; la feuille de motif commune du
mobile est AuditReasonSheet (ADR 0016). La transition de demande vers « acceptee »
(proposée par InterventionRequestsPage) ne répond plus 500 (AUDC-22).

## Critères d'acceptation

- [x] plus aucune chaîne 'ROUTINE' (ni autre code de motif) dans mobile/src : le backend
      applique la règle routinière seul
- [x] chaque suppression du mobile (recenser : tâche, action, autres) ouvre
      AuditReasonSheet filtrée sur `deleted` et envoie reason_code (reason_text pour OTHER)
- [x] si le mobile supprime ou crée des interventions : mêmes règles que le web (choix de
      l'issue de la demande, demande obligatoire) ; sinon le dire dans le compte rendu
- [x] un 400 de motif manquant ouvre la feuille de motif au lieu d'une erreur brute
- [x] check.sh vert (build mobile) ; CHANGELOG

## Compte rendu final

- `mobile/src/api/tasks.js` : plus aucun 'ROUTINE' ; `updateTask` n'envoie un motif que s'il
  est choisi ; `deleteTask(taskId, audit)` exige le motif de AuditReasonSheet.
- Recensement des suppressions du mobile : aucune écran ne supprime (seule `deleteTask`
  existait, sans appelant). Aucune feuille `deleted` à brancher, donc ; la feuille filtrée
  sur `deleted` est à ouvrir quand un bouton de suppression sera ajouté. Le 400 de motif
  manquant ouvre déjà la feuille (TaskStatusButtons).
- Créations d'interventions : seul `InterventionInlineForm` (ActionForm.jsx). Il envoyait
  `request_id: undefined` via le bouton générique « Créer l'intervention » : bouton retiré,
  la demande se choisit dans la liste, bouton de validation désactivé sans demande.
- Hors périmètre ici : aucune suppression d'intervention, de demande ni d'action sur mobile.
- check.sh vert. Non vérifié : parcours à l'écran.

Contrôle de l'agent principal (2026-11-14) : diff relu (bouton de création sans
demande retiré, motifs en dur retirés) ; check.sh vert. À vérifier à l'écran.

Essai à l'écran (2026-11-14) : impossible, le mobile de dev se recharge en boucle
(websocket HMR bloquée par le nginx de l'hôte, docs/backlog/websocket-hmr-proxy-dev.md).
Fusion décidée par l'utilisateur sans cet essai ; gestes à essayer plus tard listés
ci-dessus.
