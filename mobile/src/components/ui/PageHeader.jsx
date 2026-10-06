import { ChevronLeft, Search } from 'lucide-react'

/**
 * PageHeader — en-tête de page standardisé
 *
 * title        : titre affiché
 * onBack       : si fourni, affiche un ChevronLeft cliquable
 * onSearch     : si fourni ET !onBack, affiche le bouton loupe
 * searchActive : état actif du bouton loupe (fond coloré)
 * action       : slot libre à droite (bouton, badge…)
 * tabs         : slot sous le titre (rangée d'onglets)
 */
export function PageHeader({ title, onBack, onSearch, searchActive = false, action, tabs }) {
  return (
    <header className={`bg-white border-b border-[#E0E0E0] px-4 shrink-0 ${tabs ? 'pt-4 pb-0' : 'pt-4 pb-3'}`}>
      <div className="flex items-center gap-2 mb-3">
        {onBack && (
          <button onClick={onBack} className="p-1 -ml-1 text-[#616161] active:opacity-60">
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="flex-1 text-base font-semibold text-[#2E2E2E]">{title}</h1>
        {action && <div>{action}</div>}
        {onSearch && !onBack && (
          <button
            onClick={onSearch}
            className={`p-1.5 rounded transition-colors active:opacity-60 ${
              searchActive ? 'text-[#1F3A5F] bg-[#1F3A5F]/10' : 'text-[#616161]'
            }`}
          >
            <Search size={18} />
          </button>
        )}
      </div>
      {tabs && <div className="flex">{tabs}</div>}
    </header>
  )
}
