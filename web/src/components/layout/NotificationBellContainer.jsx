/**
 * @fileoverview Conteneur autonome de la cloche de notifications — porte le hook
 * useNotificationCenter (compteur non lu pollé, liste chargée à la demande) et
 * rend NotificationBell. Isole le state du centre de notifications hors de Sidebar.
 * @module components/layout/NotificationBellContainer
 */

import PropTypes from 'prop-types';
import NotificationBell from '@/components/layout/NotificationBell';
import { useNotificationCenter } from '@/hooks/shared/useNotificationCenter';

export default function NotificationBellContainer({ colors, compact = false }) {
  const {
    items,
    unreadCount,
    loading,
    hasMore,
    loadFirstPage,
    loadMore,
    markRead,
    markAllRead,
    dismiss,
    dismissAll,
  } = useNotificationCenter();

  return (
    <NotificationBell
      unreadCount={unreadCount}
      items={items}
      loading={loading}
      hasMore={hasMore}
      onOpenChange={(open) => { if (open) loadFirstPage(); }}
      onLoadMore={loadMore}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
      onDismiss={dismiss}
      onDismissAll={dismissAll}
      colors={colors}
      compact={compact}
    />
  );
}

NotificationBellContainer.propTypes = {
  colors: PropTypes.shape({
    text: PropTypes.string.isRequired,
  }).isRequired,
  compact: PropTypes.bool,
};
