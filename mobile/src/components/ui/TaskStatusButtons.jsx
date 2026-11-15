import { useState } from 'react'
import { Ban, RotateCcw, Loader2 } from 'lucide-react'
import { AuditReasonSheet } from './AuditReasonSheet'
import { updateTask } from '../../api/tasks'
import { usePermissions } from '../../hooks/auth/usePermissions'
import { PERM } from '../../auth/permissionCodes'

/**
 * TaskStatusButtons — boutons de transition de statut d'une tâche.
 *
 * "Ignorer" envoie status=skipped sans motif : le backend répond 400 avec les
 * motifs d'audit autorisés, on les propose dans AuditReasonSheet puis on
 * renvoie avec le motif choisi (ADR 0016). Aucun motif ni saisie maison.
 * "Remettre à faire" reste une modification routinière.
 * `done` passe par une action avec close_task=true (voir ActionForm.jsx).
 *
 * @param {{ task: Object, onChanged: (updatedTask: Object) => void }} props
 */
export function TaskStatusButtons({ task, onChanged }) {
  const { can } = usePermissions()
  const [saving, setSaving] = useState(false)
  const [reasons, setReasons] = useState(null)
  const [error, setError] = useState(null)

  const isTerminal = task.status === 'done' || task.status === 'skipped'

  async function applyStatus(status, extra = {}, audit) {
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTask(task.id, { status, ...extra }, audit)
      setReasons(null)
      onChanged(updated)
    } catch (err) {
      const asked = err?.data?.audit?.reasons
      if (err?.status === 400 && Array.isArray(asked) && asked.length > 0) {
        setReasons(asked)
      } else {
        setReasons(null)
        setError(err?.data?.detail ?? err.message ?? 'Erreur lors de la mise à jour')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!can(PERM.intervention.updateTask)) return null

  if (saving) {
    return <Loader2 size={16} className="animate-spin text-tunnel-muted shrink-0" />
  }

  if (reasons) {
    return (
      <AuditReasonSheet
        title="Pourquoi ignorer cette tâche ?"
        reasons={reasons}
        onConfirm={audit => applyStatus('skipped', {}, audit)}
        onCancel={() => setReasons(null)}
      />
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
        <button type="button" title="Ignorer" onClick={() => applyStatus('skipped')}
          className="p-1.5 rounded bg-amber-100 text-amber-700 active:bg-amber-200">
          <Ban size={13} />
        </button>
      )}
    </div>
  )
}
