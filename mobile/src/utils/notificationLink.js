// Destination d'une notification dans le mobile.
// Écrans existants : /interventions/:id, /intervention-requests/:id, /preventif.
// Aucun écran mobile pour les pointages : retour sur la liste des notifications.

export const PREVENTIVE_ROUTE = '/preventif'
export const NOTIFICATIONS_ROUTE = '/notifications'

export function notificationRoute(n) {
  const data = n?.data ?? {}
  switch (n?.type) {
    case 'di_a_traiter':
      return n.entity_id ? `/intervention-requests/${n.entity_id}` : NOTIFICATIONS_ROUTE
    case 'intervention_a_cloturer':
      return n.entity_id ? `/interventions/${n.entity_id}` : NOTIFICATIONS_ROUTE
    case 'preventif_echeance':
      if (data.intervention_id) return `/interventions/${data.intervention_id}`
      if (data.di_id) return `/intervention-requests/${data.di_id}`
      return PREVENTIVE_ROUTE
    default:
      return NOTIFICATIONS_ROUTE
  }
}
