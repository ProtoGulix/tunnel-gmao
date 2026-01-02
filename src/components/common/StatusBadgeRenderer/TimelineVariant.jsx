import PropTypes from "prop-types";
import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { Activity } from "lucide-react";
import { 
  formatShortTime, 
  getTimelineBackground, 
  getTimelineIconColor, 
  getTimelineBadgeStyle 
} from './statusBadgeUtils';

/**
 * Variant timeline : affichage compact inline
 * Utilisé dans la timeline des actions
 */
export default function TimelineVariant({ item, statusConfig }) {
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
      <Flex align="center" gap="2">
        <Activity size={16} style={{ color: getTimelineIconColor(statusConfig) }} />
        <Badge 
          variant="solid" 
          size="2"
          style={getTimelineBadgeStyle(statusConfig)}
        >
          {statusConfig?.label || "Changement d'état"}
        </Badge>
        <Text size="1" color="gray">
          {formatShortTime(item.date)}
        </Text>
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
