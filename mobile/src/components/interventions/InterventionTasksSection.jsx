import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, AlertTriangle } from 'lucide-react'
import { getAllTasksByIntervention, getTasksProgress, createTask } from '../../api/tasks'
import { TaskStatusBadge } from '../ui/TaskStatusBadge'
import { TaskStatusButtons } from '../ui/TaskStatusButtons'
import { TASK_ORIGINS } from '../../config/badges'

const inputCls = 'w-full border border-tunnel-border rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent'

function OriginBadge({ origin }) {
  const cfg = TASK_ORIGINS[origin] ?? { label: origin ?? '—' }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: (cfg.color ?? '#6b7280') + '22', color: cfg.color ?? '#6b7280' }}>
      {cfg.label}
    </span>
  )
}

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
      <div className="h-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
    </div>
  )
}

function TaskRow({ task, onChanged }) {
  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'
  const isTerminal = isDone || isSkipped

  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-tunnel-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-sm ${isTerminal ? 'text-tunnel-muted line-through' : 'text-tunnel-text'} ${task.optional ? 'italic' : ''}`}
          >
            {task.label}
          </span>
          <OriginBadge origin={task.origin} />
          {task.optional && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-tunnel-border text-tunnel-muted shrink-0">
              Optionnelle
            </span>
          )}
        </div>
        {task.skip_reason && (
          <p className="text-xs text-amber-700 mt-0.5">{task.skip_reason}</p>
        )}
      </div>
      <TaskStatusBadge status={task.status} />
      <TaskStatusButtons task={task} onChanged={onChanged} />
    </div>
  )
}

/**
 * InterventionTasksSection — liste unifiée des tâches (gamme + manuelles)
 * d'une intervention, avec progression et création inline. Portage du
 * TasksTab de tunnel-gmao (interventions/tabs/), adapté au périmètre mobile
 * (pas de tableau RESP, pas de suppression de tâche).
 */
export function InterventionTasksSection({ interventionId, refreshKey = 0 }) {
  const [tasks, setTasks] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getAllTasksByIntervention(interventionId),
      getTasksProgress(interventionId),
    ])
      .then(([t, p]) => { setTasks(t); setProgress(p) })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [interventionId])

  useEffect(() => { load() }, [load, refreshKey])

  function handleTaskChanged(updated) {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    // Progression recalculée côté serveur — recharger pour rester exact
    getTasksProgress(interventionId).then(setProgress).catch(() => {})
  }

  async function handleCreate() {
    if (!newLabel.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const task = await createTask({ interventionId, label: newLabel.trim() })
      setTasks(prev => [...prev, task])
      setNewLabel('')
      setShowCreate(false)
      getTasksProgress(interventionId).then(setProgress).catch(() => {})
    } catch (err) {
      setCreateError(err?.data?.detail ?? err.message ?? 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  const gammeTasks = tasks.filter(t => t.origin === 'plan').sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const manualTasks = tasks.filter(t => t.origin !== 'plan')
  const orderedTasks = [...gammeTasks, ...manualTasks]

  return (
    <div className="px-4 mt-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium uppercase tracking-wide text-tunnel-muted">
          Tâches {tasks.length > 0 && `(${tasks.length})`}
        </p>
      </div>

      {progress && progress.total > 0 && (
        <div className="mb-3 p-2.5 rounded-lg bg-white border border-tunnel-border">
          <div className="flex items-center gap-2">
            <ProgressBar done={progress.done} total={progress.total} />
            <span className="text-xs font-medium text-tunnel-text shrink-0">
              {progress.done}/{progress.total}
            </span>
          </div>
          {progress.blocking_pending > 0 && (
            <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} className="shrink-0" />
              {progress.blocking_pending} étape{progress.blocking_pending > 1 ? 's' : ''} obligatoire{progress.blocking_pending > 1 ? 's' : ''} en attente
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={18} className="animate-spin text-tunnel-muted" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-700 text-center py-4">{error}</p>
      ) : orderedTasks.length === 0 ? (
        <p className="text-sm text-tunnel-muted text-center py-6">Aucune tâche pour cette intervention</p>
      ) : (
        <div className="bg-white border border-tunnel-border rounded-lg px-3">
          {orderedTasks.map(task => (
            <TaskRow key={task.id} task={task} onChanged={handleTaskChanged} />
          ))}
        </div>
      )}

      <div className="mt-2">
        {showCreate ? (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
            {createError && <p className="text-xs text-red-700">{createError}</p>}
            <input
              className={inputCls}
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Libellé de la tâche…"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && newLabel.trim()) { e.preventDefault(); handleCreate() } }}
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowCreate(false); setNewLabel(''); setCreateError(null) }}
                className="flex-1 py-2 rounded-lg border border-tunnel-border text-xs font-medium text-tunnel-muted bg-white active:bg-tunnel-bg">
                Annuler
              </button>
              <button type="button" disabled={!newLabel.trim() || creating} onClick={handleCreate}
                className="flex-1 py-2 rounded-lg bg-tunnel-accent text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Créer
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-tunnel-accent">
            <Plus size={12} /> Nouvelle tâche
          </button>
        )}
        {tasks.some(t => t.status !== 'done' && t.status !== 'skipped') && (
          <p className="text-[11px] text-tunnel-muted mt-2">
            Pour terminer une tâche : ajoutez une action liée depuis le bouton en bas de page.
          </p>
        )}
      </div>
    </div>
  )
}
