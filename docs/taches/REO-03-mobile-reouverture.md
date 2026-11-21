# REO-03. Mobile : rouvrir avec la fenêtre de motif

- Statut : faite, essai à l'écran validé (2026-11-20)
- Agent : principal
- Branche : fix/statuts-hors-travail-normal
- Dépend de : ADR 0028, REO-02
- Périmètre d'écriture : mobile/src/pages/interventions/InterventionDetailPage.jsx,
  mobile/src/api/interventions.js, composant de réouverture dans
  mobile/src/components/interventions/

## Critères d'acceptation

- [x] Sur une intervention fermée, choisir un statut dans la feuille de statut envoie la
      mise à jour ; la réponse « motif requis » ouvre AuditReasonSheet avec les motifs de
      l'API, la requête repart avec le motif ; annuler ne change rien
- [x] Les autres changements de statut passent toujours par le journal
- [x] Build mobile vert ; essai à l'écran par l'utilisateur

## Compte rendu

InterventionDetailPage : sur une intervention fermée, le statut choisi part par
reopenIntervention (PUT /interventions/{id}) ; un 400 avec audit.reasons ouvre
AuditReasonSheet (« Pourquoi rouvrir cette intervention ? »), la requête repart avec le motif ;
annuler ne change rien. Une erreur après le motif s'affiche sous l'en-tête ; une erreur sans
motif s'affiche dans la feuille de statut. Build mobile vert.

Ajout pendant l'essai : sur le web, le statut d'une intervention fermée était grisé ;
InterventionPanelHeader reçoit canChangeStatus (droit de mise à jour seul), la priorité reste verrouillée.
