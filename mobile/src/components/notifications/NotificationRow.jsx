import { X } from 'lucide-react'
import { ListRow } from '../ui/ListRow'
import { formatDateFr } from '../../utils/dateUtils'
import { colors } from '../../config/colors'

const TYPE_LABELS = {
  di_a_traiter: 'Demande à traiter',
  pointage_demande: 'Pointage demandé',
  preventif_echeance: 'Préventif',
  intervention_a_cloturer: 'À clôturer',
}

/** Une notification : le texte vient de l'API (message), non lues en gras avec liseré. */
export function NotificationRow({ notification, onOpen, onDismiss }) {
  const unread = !notification.read_at
  return (
    <div className="flex items-stretch bg-white">
    <ListRow className="flex-1"
      onClick={() => onOpen(notification)}
      chevron={false}
      accentColor={unread ? colors.primary : undefined}
      faded={!unread}
    >
      <p className="text-xs font-medium text-tunnel-secondary">
        {TYPE_LABELS[notification.type] ?? 'Notification'}
      </p>
      <p className={`text-sm text-tunnel-text ${unread ? 'font-semibold' : ''}`}>
        {notification.message}
      </p>
      <p className="text-xs text-tunnel-secondary">{formatDateFr(notification.created_at)}</p>
    </ListRow>
    <button
      type="button"
      aria-label="Supprimer la notification"
      onClick={() => onDismiss(notification.id)}
      className="shrink-0 w-11 min-h-[44px] flex items-center justify-center text-tunnel-secondary active:bg-tunnel-bg"
    >
      <X size={18} />
    </button>
    </div>
  )
}
