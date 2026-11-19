/**
 * @fileoverview Cloche de notifications de la sidebar — badge non-lu + dropdown paginé
 *
 * @module components/layout/NotificationBell
 * @requires react
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Popover, Flex, Text, Button, Separator, AlertDialog } from '@radix-ui/themes';
import { Bell } from 'lucide-react';
import NotificationListItem, { resolveEntityPath } from '@/components/layout/NotificationListItem';

// Durée du flash déclenché à l'arrivée d'une nouvelle notification (badge qui
// pulse brièvement pour attirer l'œil, plutôt qu'une pulsation permanente qui
// fatiguerait la lecture si l'utilisateur a déjà des non-lues en attente).
const FLASH_DURATION_MS = 2400;

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
 * @param {Function} props.onDismiss - Supprime une notification (id)
 * @param {Function} props.onDismissAll - Supprime les lues (true) ou toutes (false)
 * @param {Object} props.colors
 * @param {boolean} [props.compact=false] - Icône seule sans libellé (header mobile contraint)
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
  onDismiss,
  onDismissAll,
  colors,
  compact = false,
}) {
  const navigate = useNavigate();

  // Déclenche un flash bref sur le badge quand le compteur augmente (nouvelle
  // notification détectée par le polling) — pas au montage initial.
  const [flashing, setFlashing] = useState(false);
  const prevCountRef = useRef(unreadCount);
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), FLASH_DURATION_MS);
      prevCountRef.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  const handleItemOpen = useCallback((notification) => {
    if (!notification.read_at) {
      onMarkRead(notification.id);
    }
    const path = resolveEntityPath(notification);
    if (path) navigate(path);
  }, [navigate, onMarkRead]);

  return (
    <Popover.Root onOpenChange={onOpenChange}>
      {/* Pulse du badge à l'arrivée d'une nouvelle notification — portée locale,
          évite d'ajouter une keyframe globale pour un seul composant. */}
      <style>{`
        @keyframes notification-bell-flash {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.55); }
          50% { transform: scale(1.18); box-shadow: 0 0 0 5px rgba(249, 115, 22, 0); }
        }
      `}</style>
      <Popover.Trigger>
        <button
          aria-label="Notifications"
          style={{
            position: 'relative',
            background: unreadCount > 0 ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: 'none',
            borderRadius: '999px',
            color: unreadCount > 0 ? 'var(--orange-9)' : colors.text,
            cursor: 'pointer',
            padding: '0.375rem 0.625rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.375rem',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <Bell size={16} />
          {!compact && (
            <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.02em' }}>
              Notifications
            </span>
          )}
          {unreadCount > 0 && (
            <span
              style={{
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
                animation: flashing ? 'notification-bell-flash 0.6s ease-in-out 3' : 'none',
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
        <Flex align="center" justify="between" px="3" py="1">
          <Button
            size="1"
            variant="ghost"
            color="gray"
            disabled={!items.some((n) => n.read_at)}
            onClick={() => onDismissAll(true)}
          >
            Supprimer les lues
          </Button>
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button size="1" variant="ghost" color="red" disabled={items.length === 0}>
                Tout supprimer
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="400px">
              <AlertDialog.Title>Tout supprimer ?</AlertDialog.Title>
              <AlertDialog.Description size="2">
                Toutes vos notifications seront supprimées de la liste.
              </AlertDialog.Description>
              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">Annuler</Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button color="red" onClick={() => onDismissAll(false)}>Tout supprimer</Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>
        <Separator size="4" />
        <Flex direction="column" gap="1" p="2" style={{ maxHeight: 420, overflowY: 'auto' }}>
          {items.length === 0 && !loading && (
            <Text size="2" color="gray" style={{ padding: '1rem', textAlign: 'center' }}>
              Aucune notification
            </Text>
          )}
          {items.map((notification) => (
            <NotificationListItem key={notification.id} notification={notification} onOpen={handleItemOpen} onDismiss={onDismiss} />
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
  onDismiss: PropTypes.func.isRequired,
  onDismissAll: PropTypes.func.isRequired,
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }).isRequired,
  compact: PropTypes.bool,
};
