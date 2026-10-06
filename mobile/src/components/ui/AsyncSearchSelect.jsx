/**
 * AsyncSearchSelect — version mobile (Tailwind)
 * Port fidèle du composant desktop AsyncSearchSelect.
 *
 * Gère : debounce, spinner, liste résultats, états idle/hint/busy/results/empty.
 * Ne gère PAS : état de sélection persistante → délégué au parent.
 *
 * Le parent affiche/masque ce composant selon si un item est déjà sélectionné.
 * Utiliser <SelectionChip> pour afficher l'item sélectionné.
 */

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2, HelpCircle, Info, SearchX, Plus, X, Lock } from 'lucide-react'
import { useDebounce } from '../../hooks/shared/useDebounce'

// ─── Boîte d'état fixe (évite le layout shift) ────────────────────────────────
function StateBox({ children }) {
  return (
    <div className="mt-1.5 rounded-lg border border-tunnel-border bg-tunnel-bg flex flex-col items-center justify-center gap-2 py-8">
      {children}
    </div>
  )
}

// ─── Chip de sélection (remplace le champ après sélection) ────────────────────
export function SelectionChip({ badge, label, onClear, locked = false }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${
      locked
        ? 'border-amber-300 bg-amber-50'
        : 'border-tunnel-accent/30 bg-blue-50'
    }`}>
      {badge && (
        <span className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
          locked
            ? 'text-amber-700 bg-white border-amber-300'
            : 'text-tunnel-accent bg-white border-tunnel-accent/20'
        }`}>
          {badge}
        </span>
      )}
      <span className="flex-1 text-sm font-medium text-tunnel-text truncate">{label}</span>
      {locked ? (
        <Lock size={13} className="shrink-0 text-amber-500" />
      ) : (
        <button type="button" onClick={onClear} className="shrink-0 text-tunnel-muted p-0.5">
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────────
/**
 * @param {Function} fetchFn        - async (search: string) => item[]. Arrow inline ok (ref stabilisée).
 * @param {Function} onSelect       - (item) => void. Appelé immédiatement au tap.
 * @param {Function} renderItem     - (item) => ReactNode. Rendu d'un résultat.
 * @param {string}   [placeholder]  - Défaut: "Rechercher…"
 * @param {number}   [debounceMs]   - Défaut: 350ms.
 * @param {number}   [minChars]     - Défaut: 2.
 * @param {Function} [onCreateClick]- (search) => void. Affiche bouton créer dans l'empty state.
 * @param {string}   [createLabel]  - Défaut: "Créer".
 */
export function AsyncSearchSelect({
  fetchFn,
  onSelect,
  renderItem,
  placeholder = 'Rechercher…',
  debounceMs = 350,
  minChars = 2,
  onCreateClick,
  createLabel = 'Créer',
}) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [fetching, setFetching] = useState(false)

  const debouncedSearch = useDebounce(search, debounceMs)
  const isTyping = search !== debouncedSearch
  const busy = isTyping || fetching

  // Stabilise fetchFn — l'appelant n'a pas besoin de mémoriser
  const fetchFnRef = useRef(fetchFn)
  useEffect(() => { fetchFnRef.current = fetchFn })

  useEffect(() => {
    if (debouncedSearch.length < minChars) { setResults([]); return }
    let cancelled = false
    setFetching(true)
    fetchFnRef.current(debouncedSearch)
      .then(items => { if (!cancelled) setResults(Array.isArray(items) ? items : []) })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [debouncedSearch, minChars])

  function handleSelect(item) {
    setSearch('')
    setResults([])
    onSelect(item)
  }

  // Machine d'état — priorité : busy > results > empty > hint > idle
  let state = 'idle'
  if (busy) state = 'busy'
  else if (results.length > 0) state = 'results'
  else if (debouncedSearch.length >= minChars) state = 'empty'
  else if (search.length > 0 && search.length < minChars) state = 'hint'

  return (
    <div>
      {/* Champ de recherche */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {busy
            ? <Loader2 size={14} className="animate-spin text-tunnel-accent" />
            : <Search size={14} className={search.length > 0 ? 'text-tunnel-accent' : 'text-tunnel-muted'} />
          }
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          inputMode="search"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-tunnel-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-tunnel-accent/30 focus:border-tunnel-accent"
        />
      </div>

      {/* Zone d'état */}
      {state === 'idle' && (
        <StateBox>
          <HelpCircle size={20} className="text-tunnel-muted" strokeWidth={1.5} />
          <span className="text-xs font-medium text-tunnel-muted">Tapez pour rechercher</span>
        </StateBox>
      )}

      {state === 'hint' && (
        <StateBox>
          <Info size={20} className="text-tunnel-muted" strokeWidth={1.5} />
          <span className="text-xs font-medium text-tunnel-muted">
            Encore {minChars - search.length} caractère{minChars - search.length > 1 ? 's' : ''}…
          </span>
        </StateBox>
      )}

      {state === 'busy' && (
        <StateBox>
          <Loader2 size={20} className="animate-spin text-tunnel-accent" strokeWidth={1.5} />
          <span className="text-xs font-medium text-tunnel-muted">Recherche en cours…</span>
        </StateBox>
      )}

      {state === 'results' && (
        <div
          className="mt-1.5 rounded-lg border border-tunnel-border bg-white overflow-y-auto"
          style={{ maxHeight: 216 }}
        >
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-tunnel-border text-left active:bg-tunnel-bg last:border-b-0"
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}

      {state === 'empty' && (
        <StateBox>
          <SearchX size={20} className="text-tunnel-muted" strokeWidth={1.5} />
          <span className="text-xs font-medium text-tunnel-muted text-center">
            Aucun résultat pour «&nbsp;{debouncedSearch}&nbsp;»
          </span>
          {onCreateClick && (
            <button
              type="button"
              onClick={() => onCreateClick(debouncedSearch)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-tunnel-border text-xs font-medium text-tunnel-accent"
            >
              <Plus size={12} /> {createLabel}
            </button>
          )}
        </StateBox>
      )}
    </div>
  )
}
