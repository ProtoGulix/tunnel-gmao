import PropTypes from 'prop-types';

/**
 * PropTypes pour ActionTableRow
 * Extraits pour garder le fichier sous 200 lignes
 */
export const actionTableRowPropTypes = {
  action: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string,
    created_at: PropTypes.string,
    createdAt: PropTypes.string,
    complexity_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexityScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_id: PropTypes.object,
    intervention: PropTypes.object,
    action_subcategory: PropTypes.object,
    subcategory: PropTypes.object,
    tech: PropTypes.object,
    technician: PropTypes.object,
  }).isRequired,
};

/**
 * PropTypes pour ActionsListTable
 * Extraits pour garder le fichier sous 200 lignes
 */
export const actionsListTablePropTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  emptyState: PropTypes.shape({
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};
