/**
 * Construit le lien de navigation vers la fiche concernée par une anomalie qualité-données.
 * Retourne null si l'entité n'a pas de route de détail accessible directement par URL —
 * dans ce cas le bouton "Corriger" ne doit pas s'afficher (voir ProblemCard).
 */
export function getEntityLink(problem) {
  switch (problem.entity) {
    case 'intervention':
    case 'intervention_action':
      return problem.context?.interventionId
        ? `/interventions?tab=interventions&id=${problem.context.interventionId}`
        : null;
    case 'purchase_request':
      return problem.entityId
        ? `/achats?requestId=${problem.entityId}`
        : null;
    default:
      return null;
  }
}
