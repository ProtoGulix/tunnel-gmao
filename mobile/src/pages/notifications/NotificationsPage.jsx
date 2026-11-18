import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { ListStatus } from '../../components/ui/ListStatus'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'
import { NotificationRow } from '../../components/notifications/NotificationRow'
import { useNotifications } from '../../hooks/notifications/useNotifications'
import { notificationRoute } from '../../utils/notificationLink'
import { CheckCheck, Trash2 } from 'lucide-react'

// Texte foncé : la variante secondaire est grisée par défaut et passait pour désactivée.
const SECONDARY_TEXT = '!text-[#2E2E2E]'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { items, unread, loading, loadingMore, hasMore, loadMore, error, markRead, markAllRead, dismiss, dismissAll } = useNotifications()

  const hasRead = items.some((n) => n.read_at)

  const open = (n) => {
    markRead(n.id)
    navigate(notificationRoute(n))
  }

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      <PageHeader
        title="Notifications"
        onBack={() => navigate('/')}
        showBell={false}
        action={unread > 0 && (
          <button
            onClick={markAllRead}
            className="min-h-[44px] -my-2 px-2 flex items-center gap-1.5 text-sm font-medium text-tunnel-accent whitespace-nowrap active:opacity-60"
          >
            <CheckCheck size={16} />
            Tout lu
          </button>
        )}
      />
      <div className="flex-1 overflow-y-auto">
        <ListStatus
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyMessage="Aucune notification"
        />
        <div className="flex flex-col gap-3 p-4">
          {items.map((n) => <NotificationRow key={n.id} notification={n} onOpen={open} onDismiss={dismiss} />)}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="min-h-[44px] rounded border border-[#E0E0E0] bg-white text-sm font-medium text-[#1F3A5F] active:opacity-60 disabled:opacity-50"
            >
              {loadingMore ? 'Chargement…' : 'Charger plus'}
            </button>
          )}
        </div>
      </div>
      {items.length > 0 && (
        <BottomBar>
          <BottomBtn
            variant="secondary"
            className={`min-h-[44px] whitespace-nowrap disabled:opacity-40 ${SECONDARY_TEXT}`}
            disabled={!hasRead}
            onClick={() => dismissAll(true)}
            icon={<Trash2 size={16} />}
          >
            Supprimer les lues
          </BottomBtn>
          <button
            className="flex-1 min-h-[44px] rounded-lg border border-red-300 bg-white text-sm font-semibold text-red-600 whitespace-nowrap flex items-center justify-center gap-2 active:bg-red-50"
            onClick={() => { if (window.confirm('Supprimer toutes les notifications ?')) dismissAll(false) }}
          >
            <Trash2 size={16} />
            Tout supprimer
          </button>
        </BottomBar>
      )}
    </div>
  )
}
