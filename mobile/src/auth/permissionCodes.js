/**
 * Codes d'endpoint du catalogue (ADR 0007), regroupés par écran.
 *
 * Un code est calculé par `endpoint_code()` (backend/api/endpoints_catalog.py) :
 * "{tag du routeur}:{nom de la fonction}". Pour retrouver le code d'un bouton,
 * partir de l'appel API qu'il déclenche (méthode + chemin).
 * Le backend reste la seule barrière : ces codes ne servent qu'à masquer l'inutile.
 */

export const PERM = {
  // Fiche intervention : statut, actions, tâches, demande d'achat
  intervention: {
    changeStatus: 'intervention-status-log:create_status_log',
    addAction: 'intervention-actions:add_action',
    createTask: 'intervention_tasks:create_task',
    updateTask: 'intervention_tasks:patch_task',
    createPurchaseRequest: 'purchase-requests:create_purchase_request',
  },
  // Planning et formulaire d'action
  actions: {
    add: 'intervention-actions:add_action',
    createIntervention: 'interventions:create_intervention',
    createRequest: 'intervention-requests:create_request',
  },
  // Demandes d'intervention
  requests: {
    create: 'intervention-requests:create_request',
    accept: 'intervention-requests:transition_request_status',
    createIntervention: 'interventions:create_intervention',
  },
  // Demandes d'achat (stock, achats)
  purchases: {
    create: 'purchase-requests:create_purchase_request',
  },
}
