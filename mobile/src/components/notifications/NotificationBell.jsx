import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotificationCount } from '../../hooks/notifications/useNotificationCount'
import { NOTIFICATIONS_ROUTE } from '../../utils/notificationLink'

const MAX_BADGE = 99

/** Cloche avec compteur des non lues ; ouvre la liste des notifications. */
export function NotificationBell({ className = '' }) {
  const navigate = useNavigate()
  const { count } = useNotificationCount()

  return (
    <button
      onClick={() => navigate(NOTIFICATIONS_ROUTE)}
      aria-label={count > 0 ? `Notifications, ${count} non lues` : 'Notifications'}
      className={`relative w-12 h-12 flex items-center justify-center active:opacity-60 ${className}`}
    >
      <Bell size={24} />
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[20px] h-5 px-1 rounded-full bg-tunnel-danger text-white text-[11px] font-bold flex items-center justify-center">
          {count > MAX_BADGE ? `${MAX_BADGE}+` : count}
        </span>
      )}
    </button>
  )
}
