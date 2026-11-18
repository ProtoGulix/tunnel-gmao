import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { ListStatus } from '../../components/ui/ListStatus'
import { BottomBar, BottomBtn } from '../../components/ui/BottomBar'
import { NotificationRow } from '../../components/notifications/NotificationRow'
import { useNotifications } from '../../hooks/notifications/useNotifications'
import { notificationRoute } from '../../utils/notificationLink'
import { CheckCheck } from 'lucide-react'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { items, unread, loading, error, markRead, markAllRead } = useNotifications()

  const open = (n) => {
    markRead(n.id)
    navigate(notificationRoute(n))
  }

  return (
    <div className="flex flex-col h-full bg-tunnel-bg">
      <PageHeader title="Notifications" onBack={() => navigate('/')} />
      <div className="flex-1 overflow-y-auto">
        <ListStatus
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyMessage="Aucune notification"
        />
        <div className="flex flex-col gap-3 p-4">
          {items.map((n) => <NotificationRow key={n.id} notification={n} onOpen={open} />)}
        </div>
      </div>
      {unread > 0 && (
        <BottomBar>
          <BottomBtn variant="primary" onClick={markAllRead} icon={<CheckCheck size={14} />}>
            Tout marquer lu
          </BottomBtn>
        </BottomBar>
      )}
    </div>
  )
}
