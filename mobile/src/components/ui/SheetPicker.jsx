import { useState } from 'react'
import { Check, ChevronDown, Lock } from 'lucide-react'

/**
 * SheetPicker — sélecteur générique via bottom-sheet.
 *
 * Props :
 *   title        — titre affiché dans le header du sheet
 *   options      — [{ value, label, description? }] ; description : ligne courte sous le libellé
 *   value        — valeur sélectionnée (comparée en String)
 *   onChange(v)  — appelé avec la nouvelle valeur (String)
 *   placeholder  — texte affiché quand rien n'est sélectionné
 *   zIndex       — z-index de l'overlay (défaut : 50)
 *   locked       — valeur imposée : même sélecteur, grisé et cadenassé, ne s'ouvre pas
 */
export function SheetPicker({ title, options, value, onChange, placeholder = 'Sélectionner...', zIndex = 50, locked = false }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => String(o.value) === String(value))

  return (
    <>
      <button
        type="button"
        onClick={() => { if (!locked) setOpen(true) }}
        disabled={locked}
        aria-label={locked ? `${title} (verrouillé)` : undefined}
        className={`w-full flex items-center justify-between gap-2 border border-tunnel-border rounded-lg px-3 py-2.5 text-left focus:outline-none ${locked ? 'bg-tunnel-bg' : 'bg-white'}`}
      >
        <span className={`text-sm ${selected ? 'font-medium text-tunnel-text' : 'text-tunnel-muted'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {locked
          ? <Lock size={13} className="text-tunnel-muted shrink-0" />
          : <ChevronDown size={14} className="text-tunnel-muted shrink-0" />}
      </button>

      {open && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.35)', zIndex }}
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-t-2xl max-h-[72vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 pt-4 pb-3 border-b border-tunnel-border shrink-0 flex items-center justify-between">
              <p className="text-sm font-semibold text-tunnel-text">{title}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs text-tunnel-muted font-medium px-2 py-1">
                Fermer
              </button>
            </div>
            <div className="overflow-y-auto">
              {options.map(o => {
                const active = String(o.value) === String(value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { onChange(String(o.value)); setOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-tunnel-border text-left ${active ? 'bg-blue-50' : 'bg-white active:bg-tunnel-bg'}`}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm text-tunnel-text">{o.label}</span>
                      {o.description && <span className="block text-xs text-tunnel-muted mt-0.5">{o.description}</span>}
                    </span>
                    {active && <Check size={14} className="text-tunnel-accent shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
