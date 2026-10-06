import { Badge } from './Badge'
import { PRIORITIES } from '../../config/badges'

/**
 * PriorityBadge — affiche la priorité d'une intervention
 * Utilise le mapping PRIORITIES de badges.js
 */
export function PriorityBadge({ priority }) {
  const key = priority?.toLowerCase() ?? ''
  const config = PRIORITIES[key] ?? PRIORITIES.normale
  return <Badge variant={config.variant}>{config.label}</Badge>
}
