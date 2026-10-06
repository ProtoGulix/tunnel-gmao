import PropTypes from "prop-types";
import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { Activity, User } from "lucide-react";
import { 
  getTimelineBackground, 
  getTimelineIconColor, 
  getTimelineBadgeStyle,
  getTechnicianName 
} from './statusBadgeUtils';

/**
 * Variant timeline : affichage compact inline
 * Utilisé dans la timeline des actions
 */
export default function TimelineVariant({ item, statusConfig }) {
  const technicianName = getTechnicianName(item.data.technician);
  
  return (
    <Box 
      mb="3"
      style={{
        padding: '0.75rem',
        borderRadius: '6px',
        backgroundColor: getTimelineBackground(statusConfig),
        transition: 'all 0.2s ease'
      }}
    >
      <Flex align="center" gap="2" wrap="wrap">
        <Activity size={16} style={{ color: getTimelineIconColor(statusConfig) }} />
        <Badge 
          variant="solid" 
          size="2"
          style={getTimelineBadgeStyle(statusConfig)}
        >
          {statusConfig?.label || "Changement d'état"}
        </Badge>
        {technicianName && (
          <Flex align="center" gap="1" style={{ fontSize: '12px', color: 'var(--gray-11)' }}>
            <User size={12} />
            <Text size="1">{technicianName}</Text>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

TimelineVariant.propTypes = {
  item: PropTypes.shape({
    date: PropTypes.string.isRequired
  }).isRequired,
  statusConfig: PropTypes.shape({
    label: PropTypes.string,
    activeBg: PropTypes.string
  })
};
