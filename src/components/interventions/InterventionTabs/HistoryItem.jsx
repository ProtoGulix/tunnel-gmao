import { Box, Flex, Text, Badge } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { CheckCircle, Clock, User } from "lucide-react";
import StatusBadgeRenderer from "@/components/common/StatusBadgeRenderer";
import { getCategoryColor } from "@/lib/utils/interventionUtils";

/**
 * Renderer pour action dans historique
 * Composant séparé pour réduire complexité
 */
function ActionHistoryItem({ item }) {
  return (
    <Box 
      mb="3"
      p="3"
      style={{
        backgroundColor: 'var(--gray-2)',
        borderRadius: '6px',
        borderLeft: '4px solid var(--blue-6)',
        position: 'relative'
      }}
    >
      <Flex direction="column" gap="2">
        <Flex justify="between" align="center">
          <Flex align="center" gap="2">
            <CheckCircle size={14} color="white" />
            <Badge 
              color="blue" 
              variant="solid" 
              size="1"
            >
              Action
            </Badge>
          </Flex>
          <Text size="1" color="gray">
            {new Date(item.date).toLocaleString('fr-FR')}
          </Text>
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {item.data.subcategory && (
              <Badge 
                variant="soft" 
                size="1" 
                style={{
                  backgroundColor: getCategoryColor(item.data.subcategory) || '#6b7280',
                  color: 'white'
                }}
              >
                {item.data.subcategory.code || '—'}
              </Badge>
            )}
            {item.data.description}
          </Text>
          <Flex gap="3" align="center" wrap="wrap">
            {item.data.timeSpent && (
              <Flex align="center" gap="1">
                <Clock size={12} color="var(--blue-9)" />
                <Badge color="blue" variant="soft" size="1">
                  {item.data.timeSpent}h
                </Badge>
              </Flex>
            )}
            {item.data.technician && (
              <Flex align="center" gap="1">
                <User size={12} color="var(--gray-9)" />
                <Text size="1" color="gray">
                  {item.data.technician.firstName} {item.data.technician.lastName}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}

ActionHistoryItem.propTypes = {
  item: PropTypes.shape({
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired
};

/**
 * Item d'historique : affiche action ou changement statut
 * 
 * Contrainte : 1 prop (item), complexité réduite par extraction
 */
function HistoryItem({ item }) {
  // Early return pour changement de statut
  if (item.type === "status") {
    return (
      <StatusBadgeRenderer
        item={item}
        statusConfig={null}
        variant="history"
        showTechnician={true}
      />
    );
  }

  // Rendu action
  return <ActionHistoryItem item={item} />;
}

HistoryItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired
};

export default HistoryItem;
