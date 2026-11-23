import { useState } from 'react'
import { X, Check, ClipboardList, Wrench } from 'lucide-react'
import { BottomBar, BottomBtn } from '../ui/BottomBar'
import { AsyncSearchSelect, SelectionChip } from '../ui/AsyncSearchSelect'
import { ListStatus } from '../ui/ListStatus'
import { useFormGuard } from '../../hooks/shared/useFormGuard.jsx'
import { useConstatQuestions } from '../../hooks/interventions/useConstatQuestions'
import { createConstat } from '../../api/constats'
import { getEquipements } from '../../api/interventions'
import { getErrorMessage } from '../../lib/api/errors'
import { visibleQuestions, toggleChoice } from '../../utils/constat'

const choiceCls = 'px-3 py-2.5 min-h-[44px] rounded-lg border text-sm text-left active:opacity-90'
const choiceOn = 'bg-tunnel-accent text-white border-tunnel-accent font-medium'
const choiceOff = 'bg-white text-tunnel-text border-tunnel-border'

/**
 * ConstatForm — constat après intervention (ADR 0043) : cases seulement, questions et
 * choix lus de l'API, sous-questions affichées selon les choix. Machine = celle de
 * l'intervention, modifiable. Le backend valide ; son refus s'affiche sobrement.
 *
 * @param {{ intervention: { id: string, code?: string }, machine?: { id: string, code?: string, name?: string } | null, onDone: () => void, onClose: () => void }} props
 */
export function ConstatForm({ intervention, machine = null, onDone, onClose }) {
  const { questions, loading, error: loadError } = useConstatQuestions()
  const [selected, setSelected] = useState([])
  const [target, setTarget] = useState(machine)
  const [changing, setChanging] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const { guardedClose, ConfirmDialog } = useFormGuard({ dirty: selected.length > 0, onClose })

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError(null)
    try {
      await createConstat(intervention.id, { choices: selected, machine_id: target?.id ?? null })
      onDone()
    } catch (err) {
      setError(getErrorMessage(err))
      setStatus('idle')
    }
  }

  const shown = visibleQuestions(questions, selected)

  return (
    <div className="fixed inset-0 z-[75] flex flex-col bg-white">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-tunnel-border bg-blue-50 shrink-0">
        <div className="w-7 h-7 rounded-full bg-tunnel-accent/10 flex items-center justify-center shrink-0">
          <ClipboardList size={15} className="text-tunnel-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-tunnel-text">Constat</h2>
          {intervention.code && <p className="text-xs font-mono text-tunnel-muted truncate">{intervention.code}</p>}
        </div>
        <button type="button" onClick={guardedClose} className="p-1.5 text-tunnel-muted">
          <X size={20} />
        </button>
      </div>

      <form id="constat-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">
          {(error || loadError) && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">• {error ?? loadError}</p>
            </div>
          )}

          <ListStatus loading={loading} error={null} empty={false} />

          {shown.map((q) => (
            <div key={q.code}>
              <p className="text-xs font-bold text-tunnel-text mb-1.5">{q.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.choices.map((c) => {
                  const on = selected.includes(c.code)
                  return (
                    <button
                      key={c.code}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected((s) => toggleChoice(questions, s, q, c.code))}
                      className={`${choiceCls} ${on ? choiceOn : choiceOff}`}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {!loading && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wrench size={14} className="text-tunnel-muted" />
                <span className="text-xs font-bold text-tunnel-text">Équipement</span>
              </div>
              {target && !changing ? (
                <SelectionChip
                  badge={target.code}
                  label={target.name ?? target.code}
                  onClear={() => setChanging(true)}
                />
              ) : (
                <AsyncSearchSelect
                  fetchFn={getEquipements}
                  onSelect={(eq) => { setTarget({ id: eq.id, code: eq.code, name: eq.name }); setChanging(false) }}
                  renderItem={(eq) => <span className="text-sm font-medium text-tunnel-text truncate">{eq.name}</span>}
                  placeholder="Rechercher un équipement..."
                  minChars={1}
                />
              )}
            </div>
          )}
        </div>
      </form>

      <BottomBar safeBottom>
        <BottomBtn variant="secondary" type="button" onClick={guardedClose}>Annuler</BottomBtn>
        <BottomBtn
          variant="primary"
          type="submit"
          form="constat-form"
          disabled={status === 'loading' || loading || selected.length === 0}
          loading={status === 'loading'}
          icon={<Check size={14} />}
        >
          Envoyer
        </BottomBtn>
      </BottomBar>

      <ConfirmDialog />
    </div>
  )
}
