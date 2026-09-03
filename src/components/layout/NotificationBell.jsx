/**
 * @fileoverview Cloche de notifications de la sidebar — badge non-lu + dropdown paginé
 *
 * @module components/layout/NotificationBell
 * @requires react
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Popover, Flex, Text, Button, Separator } from '@radix-ui/themes';
import { Bell } from 'lucide-react';
import NotificationListItem, { resolveEntityPath } from '@/components/layout/NotificationListItem';

/**
 * Cloche de notifications : badge orange (compteur non lu, pollé en continu) +
 * panneau dropdown listant les notifications (chargées à l'ouverture uniquement).
 *
 * @component
 * @param {Object} props
 * @param {number} props.unreadCount
 * @param {Array<Object>} props.items
 * @param {boolean} props.loading
 * @param {boolean} props.hasMore
 * @param {Function} props.onOpenChange - Appelé à l'ouverture/fermeture du popover
 * @param {Function} props.onLoadMore
 * @param {Function} props.onMarkRead
 * @param {Function} props.onMarkAllRead
 * @param {Object} props.colors
 */
export default function NotificationBell({
  unreadCount,
  items,
  loading,
  hasMore,
  onOpenChange,
  onLoadMore,
  onMarkRead,
  onMarkAllRead,
  colors,
}) {
  const navigate = useNavigate();

  const handleItemOpen = useCallback((notification) => {
    if (!notification.read_at) {
      onMarkRead(notification.id);
    }
    const path = resolveEntityPath(notification);
    if (path) navigate(path);
  }, [navigate, onMarkRead]);

  return (
    <Popover.Root onOpenChange={onOpenChange}>
      <Popover.Trigger>
        <button
          aria-label="Notifications"
          style={{
            position: 'relative',
            background: 'transparent',
            border: 'none',
            color: colors.text,
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                minWidth: 16,
                height: 16,
                borderRadius: '999px',
                background: 'var(--orange-9)',
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content style={{ width: 360, padding: 0 }}>
        <Flex align="center" justify="between" p="3">
          <Text size="2" weight="bold">Notifications</Text>
          <Button
            size="1"
            variant="ghost"
            disabled={unreadCount === 0}
            onClick={onMarkAllRead}
          >
            Tout marquer comme lu
          </Button>
        </Flex>
        <Separator size="4" />
        <Flex direction="column" gap="1" p="2" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.length === 0 && !loading && (
            <Text size="2" color="gray" style={{ padding: '1rem', textAlign: 'center' }}>
              Aucune notification
            </Text>
          )}
          {items.map((notification) => (
            <NotificationListItem key={notification.id} notification={notification} onOpen={handleItemOpen} />
          ))}
          {hasMore && (
            <Button variant="soft" size="1" mt="1" loading={loading} onClick={onLoadMore}>
              Charger plus
            </Button>
          )}
        </Flex>
      </Popover.Content>
    </Popover.Root>
  );
}

NotificationBell.propTypes = {
  unreadCount: PropTypes.number.isRequired,
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onLoadMore: PropTypes.func.isRequired,
  onMarkRead: PropTypes.func.isRequired,
  onMarkAllRead: PropTypes.func.isRequired,
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }).isRequired,
};
