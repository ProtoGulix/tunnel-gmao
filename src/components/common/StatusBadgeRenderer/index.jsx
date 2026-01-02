import PropTypes from "prop-types";
import TimelineVariant from './TimelineVariant';
import HistoryVariant from './HistoryVariant';

/**
 * Renderer universel pour changement de statut
 * 
 * Refactorisé en modules pour réduire complexité (<10).
 * 
 * Utilisé dans :
 * - TimelineItemRenderer (timeline actions)
 * - HistoryItem (historique)
 * - Toute autre vue montrant un changement de statut
 * 
 * Props :
 * - item : {date, data: {to, technician}} - Item timeline/historique
 * - statusConfig : {label, color, activeBg} - Config couleur statut
 * - variant : 'timeline' (inline) | 'history' (détaillé)
 * - showTechnician : Afficher technicien (défaut: true)
 */
export default function StatusBadgeRenderer({
  item,
  statusConfig,
  variant = 'timeline',
  showTechnician = true
}) {
  if (variant === 'timeline') {
    return <TimelineVariant item={item} statusConfig={statusConfig} />;
  }

  return (
    <HistoryVariant 
      item={item} 
      statusConfig={statusConfig} 
      showTechnician={showTechnician} 
    />
  );
}

StatusBadgeRenderer.propTypes = {
  item: PropTypes.shape({
    date: PropTypes.string.isRequired,
    data: PropTypes.shape({
      to: PropTypes.object,
      technician: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string
      })
    }).isRequired
  }).isRequired,
  statusConfig: PropTypes.shape({
    label: PropTypes.string,
    color: PropTypes.string,
    activeBg: PropTypes.string
  }),
  variant: PropTypes.oneOf(['timeline', 'history']),
  showTechnician: PropTypes.bool
};
