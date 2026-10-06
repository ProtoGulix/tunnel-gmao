import { Badge } from './Badge'
import { TASK_STATUSES } from '../../config/badges'

/**
 * TaskStatusBadge — affiche le statut d'une tâche (intervention_tasks)
 * Utilise le mapping TASK_STATUSES de badges.js — distinct de StatusBadge
 * (statuts d'intervention) : todo/in_progress/done/skipped ne recouvrent
 * pas le même vocabulaire que ouvert/attente_pieces/ferme.
 */
export function TaskStatusBadge({ status }) {
  const key = status?.toLowerCase() ?? ''
  const config = TASK_STATUSES[key] ?? { label: status ?? '—', variant: 'secondary' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
