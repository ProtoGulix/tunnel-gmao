import PropTypes from "prop-types";
import ActionItemCard from "@/components/actions/ActionItemCard";
import StatusBadgeRenderer from "@/components/common/StatusBadgeRenderer";
import { getCategoryColor, sanitizeDescription } from "@/lib/utils/interventionUtils";
import { STATE_COLORS } from "@/config/interventionTypes";

/**
 * Renderer pour item timeline : affiche action ou changement statut
 * 
 * Contraintes respectées :
 * - 1 prop (item)
 * - Pas de callbacks inline
 * - Complexité réduite par extraction
 */
export default function TimelineItemRenderer({ item }) {
  const statusConfig = STATE_COLORS[item.data.to?.id];

  // Early return pour changement de statut
  if (item.type === "status") {
    return (
      <StatusBadgeRenderer
        item={item}
        statusConfig={statusConfig}
        variant="timeline"
        showTechnician={false}
      />
    );
  }

  // Rendu action
  return (
    <ActionItemCard 
      action={item.data}
      getCategoryColor={getCategoryColor}
      sanitizeDescription={sanitizeDescription}
    />
  );
}

TimelineItemRenderer.displayName = "TimelineItemRenderer";

TimelineItemRenderer.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired
};
