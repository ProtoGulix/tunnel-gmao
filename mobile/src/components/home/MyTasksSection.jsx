import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { useMyTasks } from '../../hooks/interventions/useMyTasks'
import { ListStatus } from '../ui/ListStatus'
import { ListRow } from '../ui/ListRow'
import { TaskStatusBadge } from '../ui/TaskStatusBadge'

/**
 * MyTasksSection — tâches assignées au technicien connecté (todo + in_progress),
 * affichées sur l'accueil. Chaque ligne renvoie vers le détail de l'intervention
 * porteuse de la tâche (les tâches n'ont pas d'écran de détail dédié).
 */
export function MyTasksSection() {
  const navigate = useNavigate()
  const { items, loading, error } = useMyTasks()

  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-[#616161] uppercase tracking-wide mb-3">
        Mes tâches{items.length > 0 ? ` (${items.length})` : ''}
      </p>

      <ListStatus
        loading={loading}
        error={error}
        empty={!loading && !error && items.length === 0}
        emptyMessage="Aucune tâche en cours"
      />

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((task) => (
            <ListRow
              key={task.id}
              accentColor={task.status === 'in_progress' ? '#ED6C02' : '#1F3A5F'}
              onClick={() => navigate(`/interventions/${task._intervention.id}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#2E2E2E] truncate">{task.label}</span>
                <TaskStatusBadge status={task.status} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#616161]">
                <ClipboardList size={12} className="shrink-0" />
                <span className="font-mono">{task._intervention.code}</span>
                {task._intervention.equipement?.name && (
                  <span className="truncate">— {task._intervention.equipement.name}</span>
                )}
              </div>
            </ListRow>
          ))}
        </div>
      )}
    </div>
  )
}
