import PropTypes from "prop-types";
import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import { Activity } from "lucide-react";
import { formatFullDateTime, getStatusLabel, getTechnicianName } from './statusBadgeUtils';

/**
 * Variant history : affichage détaillé avec colonne
 * Utilisé dans l'historique complet
 */
export default function HistoryVariant({ item, statusConfig, showTechnician }) {
  const technicianName = getTechnicianName(item.data.technician);
  const statusLabel = getStatusLabel(statusConfig, item.data);

  return (
    <Box 
      mb="3"
      p="3"
      style={{
        backgroundColor: 'var(--amber-2)',
        borderRadius: '6px',
        borderLeft: '4px solid var(--amber-6)',
        position: 'relative'
      }}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <Activity size={14} color="white" />
            <Badge color="amber" variant="solid" size="1">
              Changement statut
            </Badge>
          </Flex>
          <Text size="1" color="gray">
            {formatFullDateTime(item.date)}
          </Text>
        </Flex>

        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Text size="2" weight="bold">
              {statusLabel}
            </Text>
          </Flex>
          {showTechnician && technicianName && (
            <Text size="1" color="gray">
              Par: {technicianName}
            </Text>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

HistoryVariant.propTypes = {
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
    label: PropTypes.string
  }),
  showTechnician: PropTypes.bool.isRequired
};
