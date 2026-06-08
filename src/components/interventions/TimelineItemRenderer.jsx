import PropTypes from "prop-types";
import ActionItemCard from "@/components/interventions/ActionItemCard";
import StatusBadgeRenderer from "@/components/ui/StatusBadgeRenderer";
import { STATE_COLORS } from "@/config/interventionTypes";

/**
 * Renderer pour item timeline : affiche action ou changement statut
 * 
 * Contraintes respectées :
 * - 2 props (item, interventionId)
 * - Pas de callbacks inline
 * - Complexité réduite par extraction
 */
export default function TimelineItemRenderer({ item, interventionId, onPurchaseRequestCreated, isLocked }) {
  // Early return pour changement de statut
  if (item.type === "status") {
    // Le backend renvoie déjà les clés françaises dans status_to_detail.id (ouvert, ferme, etc.)
    const statusConfig = STATE_COLORS[item.data?.status_to_detail?.id];
    
    return (
      <StatusBadgeRenderer
        item={item}
        statusConfig={statusConfig}
        variant="timeline"
        showTechnician={true}
      />
    );
  }

  // Rendu action
  return (
    <ActionItemCard
      action={item.data}
      interventionId={interventionId}
      onPurchaseRequestCreated={onPurchaseRequestCreated}
      isLocked={isLocked}
    />
  );
}

TimelineItemRenderer.displayName = "TimelineItemRenderer";

TimelineItemRenderer.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired,
  interventionId: PropTypes.string,
  onPurchaseRequestCreated: PropTypes.func,
  isLocked: PropTypes.bool,
};
