# CLO-02. Mobile : le bouton « Statut » clôt par la mise à jour

- Statut : faite, essai à l'écran validé (2026-11-20)
- Agent : principal
- Branche : fix/cloture-une-seule-porte
- Dépend de : ADR 0027, CLO-01
- Périmètre d'écriture : mobile/src/pages/interventions/InterventionDetailPage.jsx,
  mobile/src/components/interventions/CloseInterventionPrompt.jsx

## Contexte

Choisir « Fermé » dans la feuille de statut appelle le journal de statut, qui refusera
(CLO-01). Il doit ouvrir la même confirmation que la proposition de clôture après la dernière
tâche (CloseInterventionPrompt : `PUT /interventions/{id}`, fenêtre de motif si exigée,
erreur du contrôle des tâches affichée).

## Critères d'acceptation

- [x] « Fermé » dans la feuille de statut ouvre la confirmation de clôture, rien n'est clos
      sans confirmation
- [x] Les autres statuts passent toujours par le journal
- [x] Build mobile, scripts/check.sh vert ; essai à l'écran par l'utilisateur

## Compte rendu

InterventionDetailPage : choisir « Fermé » ferme la feuille de statut et ouvre
CloseInterventionPrompt (titre « Clore l'intervention »), qui envoie PUT /interventions/{id}
et ouvre AuditReasonSheet si un motif est exigé ; les autres statuts passent par le journal.
CloseInterventionPrompt reçoit un titre facultatif. Build mobile vert.
