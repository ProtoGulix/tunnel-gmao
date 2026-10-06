import { Badge } from './Badge'
import { INTERVENTION_STATUSES } from '../../config/badges'

/**
 * StatusBadge — affiche le statut d'une intervention
 * Utilise le mapping INTERVENTION_STATUSES de badges.js
 */
export function StatusBadge({ status }) {
  const key = status?.toLowerCase().replace(/\s+/g, '_') ?? ''
  const config = INTERVENTION_STATUSES[key] ?? { label: status ?? '—', variant: 'secondary' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
