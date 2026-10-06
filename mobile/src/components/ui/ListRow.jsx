import { ChevronRight } from 'lucide-react'

/**
 * ListRow — bouton de liste avec bordure gauche colorée et chevron optionnel
 * Squelette commun pour EquipementCard, StockItemCard, etc.
 *
 * accentColor : couleur hex de la bordure gauche
 * onClick     : handler de clic
 * chevron     : affiche ChevronRight à droite (défaut: true)
 * faded       : réduit l'opacité (ex: item archivé)
 */
export function ListRow({ children, accentColor, onClick, chevron = true, faded = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white flex overflow-hidden active:opacity-75 transition-opacity ${className}`}
      style={{
        opacity: faded ? 0.65 : 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
      }}
    >
      <div className="w-1 shrink-0" style={{ backgroundColor: accentColor ?? 'transparent' }} />
      <div className="flex-1 min-w-0 px-3 py-2.5 space-y-1.5">
        {children}
      </div>
      {chevron && (
        <div className="flex items-center pr-3">
          <ChevronRight size={16} className="text-[#616161] shrink-0" />
        </div>
      )}
    </button>
  )
}
