import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/**
 * DetailPanel TUNNEL GMAO
 * Panneau de détail avec titre, contenu, et option repliable
 * collapsible : false par défaut — ouvert en permanence
 */
export function DetailPanel({ title, children, collapsible = false, className = '' }) {
  const [open, setOpen] = useState(true)

  return (
    <div className={`bg-tunnel-surface border border-tunnel-border rounded-card overflow-hidden ${className}`}>
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-tunnel-border ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <h3 className="text-h3 text-tunnel-text">{title}</h3>
        {collapsible && (
          open
            ? <ChevronUp size={16} className="text-tunnel-secondary" />
            : <ChevronDown size={16} className="text-tunnel-secondary" />
        )}
      </div>
      {open && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}
