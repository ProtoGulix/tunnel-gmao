/**
 * @fileoverview Item de notification (dropdown de la cloche) — icône par type,
 * indicateur lu/non lu, date relative, résolution de la route de destination.
 * @module components/layout/NotificationListItem
 */

import PropTypes from 'prop-types';
import { Flex, Text, Box } from '@radix-ui/themes';
import { ClipboardList, Wrench, Info } from 'lucide-react';
import { getTimeAgo } from '@/lib/utils/actionUtils';

// Icône par type de notification. `di_a_traiter`/`intervention_a_cloturer`/
// `preventif_echeance` sont accueillis par le backend mais pas encore tous émis —
// tout type inconnu retombe sur l'icône générique plutôt que de casser le rendu.
const TYPE_ICONS = {
  di_a_traiter: ClipboardList,
  pointage_demande: Wrench,
  intervention_a_cloturer: Wrench,
  preventif_echeance: ClipboardList,
};

/**
 * Route de destination selon l'entité liée à la notification.
 * @param {Object} notification
 * @returns {string|null}
 */
export function resolveEntityPath(notification) {
  const { entity_type: entityType, entity_id: entityId } = notification;
  if (!entityId) return null;
  if (entityType === 'intervention_request') {
    return `/interventions?tab=demandes&id=${entityId}`;
  }
  if (entityType === 'intervention') {
    return `/intervention/${entityId}`;
  }
  return null;
}

export default function NotificationListItem({ notification, onOpen }) {
  const Icon = TYPE_ICONS[notification.type] ?? Info;
  const isUnread = !notification.read_at;

  return (
    <Flex
      align="start"
      gap="2"
      p="2"
      onClick={() => onOpen(notification)}
      style={{
        cursor: 'pointer',
        borderRadius: 6,
        background: isUnread ? 'var(--orange-2)' : 'transparent',
      }}
    >
      <Box
        style={{
          width: 8,
          height: 8,
          borderRadius: '999px',
          background: isUnread ? 'var(--orange-9)' : 'transparent',
          marginTop: 6,
          flexShrink: 0,
        }}
      />
      <Icon size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--gray-10)' }} />
      <Flex direction="column" gap="1" style={{ minWidth: 0, flex: 1 }}>
        <Text size="2" weight={isUnread ? 'bold' : 'regular'} style={{ wordBreak: 'break-word' }}>
          {notification.message}
        </Text>
        <Text size="1" color="gray">{getTimeAgo(notification.created_at)}</Text>
      </Flex>
    </Flex>
  );
}

NotificationListItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string,
    entity_type: PropTypes.string,
    entity_id: PropTypes.string,
    message: PropTypes.string,
    read_at: PropTypes.string,
    created_at: PropTypes.string,
  }).isRequired,
  onOpen: PropTypes.func.isRequired,
};
