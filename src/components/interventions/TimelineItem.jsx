/**
 * Composant d'affichage d'un élément de timeline (action ou changement de statut)
 * Format détaillé avec cards pour la timeline des actions
 */

import { Box, Flex } from '@radix-ui/themes';
import { ArrowRight } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Rend un élément de timeline (action ou changement de statut)
 */
/* eslint-disable complexity */
export default function TimelineItem({ item }) {
  const dateObj = new Date(item.date);
  const formattedDate = dateObj.toLocaleDateString('fr-FR');
  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (item.type === 'action') {
    const action = item.data;
    return (
      <Box
        mb="3"
        p="3"
        style={{
          backgroundColor: 'var(--gray-2)',
          borderRadius: '8px',
          borderLeft: '3px solid var(--blue-9)',
        }}
      >
        <Flex direction="column" gap="2">
          <Flex
            justify="between"
            style={{ fontSize: '12px', color: 'var(--gray-11)' }}
          >
            <span>
              {formattedDate} à {formattedTime}
            </span>
            {action.technician && (
              <span>
                {action.technician.firstName} {action.technician.lastName}
              </span>
            )}
          </Flex>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {action.description}
          </div>
          <Flex gap="3" style={{ fontSize: '12px', color: 'var(--gray-11)' }}>
            {action.timeSpent > 0 && <span>{action.timeSpent}h</span>}
            {action.subcategory && (
              <span style={{ color: 'var(--blue-11)' }}>
                {action.subcategory.label}
              </span>
            )}
          </Flex>
        </Flex>
      </Box>
    );
  }

  // Status change
  const log = item.data;
  return (
    <Box
      mb="3"
      p="3"
      style={{
        backgroundColor: 'var(--amber-2)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--amber-9)',
      }}
    >
      <Flex direction="column" gap="2">
        <Flex
          justify="between"
          style={{ fontSize: '12px', color: 'var(--gray-11)' }}
        >
          <span>
            {formattedDate} à {formattedTime}
          </span>
          {log.technician && (
            <span>
              {log.technician.firstName} {log.technician.lastName}
            </span>
          )}
        </Flex>
        <Flex align="center" gap="2" style={{ fontSize: '14px' }}>
          <strong>Changement de statut:</strong>
          <span>{log.status_from_detail?.label || 'Nouveau'}</span>
          <ArrowRight size={16} />
          <span>{log.status_to_detail?.label || '?'}</span>
        </Flex>
        {log.notes && (
          <div style={{ fontSize: '12px', color: 'var(--gray-11)', fontStyle: 'italic' }}>
            {log.notes}
          </div>
        )}
      </Flex>
    </Box>
  );
}

TimelineItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.oneOf(['action', 'status']).isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired,
  }).isRequired,
};
