import { useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

/**
 * SearchBar — barre de recherche avec icône et bouton clear
 * autoFocus : focus automatique au montage (défaut: true)
 */
export function SearchBar({ value, onChange, placeholder = 'Rechercher…', autoFocus = true, className = '' }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  return (
    <div className={`px-3 py-2 bg-white border-b border-[#E0E0E0] shrink-0 ${className}`}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#909090]" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-8 py-2 rounded border border-[#E0E0E0] bg-[#F4F6F8] text-base focus:outline-none focus:shadow-[0_0_0_3px_rgba(31,58,95,0.10)] focus:border-[#1F3A5F] focus:bg-white"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#909090] active:opacity-60"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
