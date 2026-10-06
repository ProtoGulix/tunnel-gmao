import { useState } from 'react'
import { Check, Ban, RotateCcw, Loader2 } from 'lucide-react'
import { updateTask } from '../../api/tasks'

/**
 * TaskStatusButtons — boutons de transition de statut d'une tâche.
 *
 * PATCH /intervention-tasks/{id} n'accepte que status ∈ {todo, skipped} —
 * `done` est volontairement exclu côté backend (InterventionTaskPatch) :
 * une tâche ne peut être clôturée qu'en la liant à une action avec
 * close_task=true (POST /intervention-actions, voir TaskSection dans
 * ActionForm.jsx). Ce composant ne propose donc PAS de bouton "Marquer
 * terminée" — seulement "Ignorer" (avec motif obligatoire, voir
 * InterventionTaskPatch.validate_status_rules) et "Remettre à faire" pour
 * annuler une exclusion.
 *
 * @param {{ task: Object, onChanged: (updatedTask: Object) => void }} props
 */
export function TaskStatusButtons({ task, onChanged }) {
  const [saving, setSaving] = useState(false)
  const [showSkipForm, setShowSkipForm] = useState(false)
  const [skipReason, setSkipReason] = useState('')
  const [error, setError] = useState(null)

  const isDone = task.status === 'done'
  const isSkipped = task.status === 'skipped'
  const isTerminal = isDone || isSkipped

  async function applyStatus(status, extra = {}) {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTask(task.id, { status, ...extra })
      onChanged(updated)
      setShowSkipForm(false)
      setSkipReason('')
    } catch (err) {
      setError(err?.data?.detail ?? err.message ?? 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  function handleSkipConfirm() {
    if (!skipReason.trim()) return
    applyStatus('skipped', { skip_reason: skipReason.trim() })
  }

  if (saving) {
    return <Loader2 size={16} className="animate-spin text-tunnel-muted shrink-0" />
  }

  if (showSkipForm) {
    return (
      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
        <input
          className="text-xs border border-tunnel-border rounded px-2 py-1 w-32 focus:outline-none focus:ring-1 focus:ring-tunnel-accent/30"
          value={skipReason}
          onChange={e => setSkipReason(e.target.value)}
          placeholder="Motif requis…"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && skipReason.trim()) { e.preventDefault(); handleSkipConfirm() } }}
        />
        <button type="button" disabled={!skipReason.trim()} onClick={handleSkipConfirm}
          className="shrink-0 p-1.5 rounded bg-amber-100 text-amber-700 disabled:opacity-40">
          <Check size={13} />
        </button>
        <button type="button" onClick={() => { setShowSkipForm(false); setSkipReason('') }}
          className="shrink-0 p-1.5 rounded text-tunnel-muted">
          <Ban size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
      {error && <span className="text-[10px] text-red-700">{error}</span>}
      {isTerminal ? (
        <button type="button" title="Remettre à faire" onClick={() => applyStatus('todo', { skip_reason: null })}
          className="p-1.5 rounded bg-gray-100 text-tunnel-muted active:bg-gray-200">
          <RotateCcw size={13} />
        </button>
      ) : (
        <button type="button" title="Ignorer" onClick={() => setShowSkipForm(true)}
          className="p-1.5 rounded bg-amber-100 text-amber-700 active:bg-amber-200">
          <Ban size={13} />
        </button>
      )}
    </div>
  )
}
