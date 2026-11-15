import { useState } from 'react'
import { Check } from 'lucide-react'

/**
 * AuditReasonSheet — choix du motif d'audit demandé par le backend.
 *
 * Les motifs viennent tels quels de `audit.reasons` (réponse 400) : aucun
 * motif codé en dur ici. Un tap sur un motif simple valide tout de suite ;
 * un motif qui exige un texte (requires_text) ouvre d'abord la saisie.
 *
 * @param {{ title: string, reasons: Array, onConfirm: (r: {reason_code: string, reason_text?: string}) => void, onCancel: () => void }} props
 */
export function AuditReasonSheet({ title, reasons, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [text, setText] = useState('')

  function pick(reason) {
    if (reason.requires_text) {
      setSelected(reason)
      return
    }
    onConfirm({ reason_code: reason.code })
  }

  return (
    <div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.35)', zIndex: 60 }}
      onClick={onCancel}
    >
      <div className="bg-white rounded-t-2xl max-h-[80vh] flex flex-col safe-bottom" onClick={e => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-3 border-b border-tunnel-border shrink-0 flex items-center justify-between">
          <p className="text-sm font-semibold text-tunnel-text">{title}</p>
          <button type="button" onClick={onCancel} className="text-xs text-tunnel-muted font-medium px-2 py-1">
            Annuler
          </button>
        </div>
        <div className="overflow-y-auto">
          {reasons.map(reason => (
            <button
              key={reason.code}
              type="button"
              onClick={() => pick(reason)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-3.5 border-b border-tunnel-border text-left ${selected?.code === reason.code ? 'bg-blue-50' : 'bg-white active:bg-tunnel-bg'}`}
            >
              <span className="min-w-0">
                <span className="block text-sm text-tunnel-text">{reason.label}</span>
                {reason.description && (
                  <span className="block text-xs text-tunnel-muted">{reason.description}</span>
                )}
              </span>
              {selected?.code === reason.code && <Check size={14} className="text-tunnel-accent shrink-0" />}
            </button>
          ))}
        </div>
        {selected && (
          <div className="p-4 flex flex-col gap-2 shrink-0">
            <textarea
              className="text-sm border border-tunnel-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-tunnel-accent/30"
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Précisez le motif…"
              autoFocus
            />
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => onConfirm({ reason_code: selected.code, reason_text: text.trim() })}
              className="w-full py-3 rounded-lg bg-tunnel-blue text-white text-sm font-medium disabled:opacity-40"
            >
              Valider
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
