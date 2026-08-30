/**
 * @fileoverview Composant de recherche asynchrone générique.
 *
 * Gère : input debouncé, spinner pendant la frappe et le fetch,
 * liste de résultats avec hover, empty states (frappe trop courte, aucun résultat).
 *
 * Ce composant ne gère PAS :
 *  - L'état de sélection persistante → délégué au parent
 *  - La logique de création           → délégué au parent via `onCreateClick`
 *
 * Le parent affiche/masque ce composant selon son propre état (ex: cacher quand
 * un item est déjà sélectionné).
 *
 * Stabilité de `fetchFn` : la référence est stockée dans un ref interne —
 * l'appelant n'a pas besoin de mémoiser la fonction (inline arrow ok).
 *
 * @module components/ui/AsyncSearchSelect
 *
 * @example
 * // Recherche de fabricants
 * <AsyncSearchSelect
 *   fetchFn={(q) => fetchManufacturers({ search: q, limit: 20 }).then(r => r.items)}
 *   onSelect={(item) => setSelected(item)}
 *   renderItem={(item) => <span>{item.manufacturer_name}</span>}
 *   placeholder="Rechercher un fabricant…"
 *   onCreateClick={(search) => openCreateForm(search)}
 *   createLabel="Créer ce fabricant"
 * />
 */

import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Text } from '@radix-ui/themes';
import { AlertCircle, HelpCircle, Info, Loader2, Plus, SearchX } from 'lucide-react';

import { useDebounce } from '@/hooks/useDebounce';
import { useListboxKeyboardNav } from '@/hooks/useListboxKeyboardNav';
import { StateBox, ResultsListbox, SearchField } from './AsyncSearchSelectParts';

/**
 * @param {Object}   props
 * @param {Function} props.fetchFn         - async (search: string) => item[].
 *                                           Peut être une arrow inline — la référence est stabilisée en interne.
 * @param {Function} props.onSelect        - (item) => void. Appelé immédiatement au clic sur un résultat.
 *                                           Le champ est réinitialisé automatiquement.
 * @param {Function} props.renderItem      - (item) => ReactNode. Rendu d'un résultat dans la liste déroulante.
 * @param {string}   [props.placeholder]   - Défaut : "Rechercher…"
 * @param {number}   [props.debounceMs]    - Délai avant déclenchement du fetch. Défaut : 350.
 * @param {number}   [props.minChars]      - Nb de caractères minimum. Défaut : 2.
 * @param {Function} [props.onCreateClick]  - (currentSearch: string) => void.
 *                                            Si fourni, affiche un bouton dans l'empty state.
 * @param {string}   [props.createLabel]    - Libellé du bouton de création. Défaut : "Créer".
 * @param {Function} [props.onSearchChange] - (value: string) => void. Appelé à chaque frappe
 *                                            et remis à zéro (chaîne vide) lors d'une sélection.
 */
export default function AsyncSearchSelect({
  fetchFn,
  onSelect,
  renderItem,
  placeholder = 'Rechercher…',
  debounceMs = 350,
  minChars = 2,
  onCreateClick,
  createLabel = 'Créer',
  onSearchChange,
  initialSearch = '',
}) {
  const [search, setSearch] = useState(initialSearch);
  const [results, setResults] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const listboxId = useId();
  const getOptionId = (idx) => `${listboxId}-option-${idx}`;

  const debouncedSearch = useDebounce(search, debounceMs);

  const fetchFnRef = useRef(fetchFn);
  useEffect(() => { fetchFnRef.current = fetchFn; });

  useEffect(() => {
    setIsTyping(search !== debouncedSearch);
  }, [search, debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch.length < minChars) { setResults([]); setFetchError(false); return; }
    let cancelled = false;
    setFetching(true);
    setFetchError(false);
    fetchFnRef.current(debouncedSearch)
      .then((items) => { if (!cancelled) setResults(Array.isArray(items) ? items : []); })
      .catch(() => { if (!cancelled) { setResults([]); setFetchError(true); } })
      .finally(() => { if (!cancelled) setFetching(false); });
    return () => { cancelled = true; };
  }, [debouncedSearch, minChars]);

  const handleSelect = (item) => {
    setSearch('');
    onSearchChange?.('');
    setResults([]);
    onSelect(item);
  };

  const { activeIndex, handleKeyDown } = useListboxKeyboardNav(results, handleSelect);

  const busy = isTyping || fetching;

  // ─── État courant ─────────────────────────────────────────────────────────
  // Priorité : busy > error > results > empty > hint > idle
  let state = 'idle';
  if (busy)                                                          state = 'busy';
  else if (fetchError)                                               state = 'error';
  else if (results.length > 0)                                       state = 'results';
  else if (debouncedSearch.length >= minChars && !busy)              state = 'empty';
  else if (search.length > 0 && search.length < minChars)           state = 'hint';

  return (
    <Box>
      <SearchField
        search={search}
        onChange={(e) => { setSearch(e.target.value); setFetchError(false); onSearchChange?.(e.target.value); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        busy={busy}
        ariaProps={{
          'aria-expanded': state === 'results',
          'aria-controls': state === 'results' ? listboxId : undefined,
          'aria-activedescendant': activeIndex >= 0 ? getOptionId(activeIndex) : undefined,
        }}
      />

      {/* Zone d'état — toujours présente */}
      {state === 'idle' && (
        <StateBox>
          <HelpCircle size={22} color="var(--gray-8)" strokeWidth={1.5} />
          <Text size="2" color="gray" weight="bold">Tapez pour rechercher</Text>
        </StateBox>
      )}

      {state === 'hint' && (
        <StateBox>
          <Info size={22} color="var(--gray-8)" strokeWidth={1.5} />
          <Text size="2" color="gray" weight="bold">
            {`Encore ${minChars - search.length} caractère${minChars - search.length > 1 ? 's' : ''}…`}
          </Text>
        </StateBox>
      )}

      {state === 'busy' && (
        <StateBox>
          <Loader2 size={22} color="var(--blue-9)" strokeWidth={1.5} style={{ animation: 'spin 0.6s linear infinite' }} />
          <Text size="2" color="gray" weight="bold">Recherche en cours…</Text>
        </StateBox>
      )}

      {state === 'results' && (
        <ResultsListbox
          listboxId={listboxId}
          results={results}
          activeIndex={activeIndex}
          getOptionId={getOptionId}
          renderItem={renderItem}
          onSelect={handleSelect}
        />
      )}

      {state === 'error' && (
        <StateBox>
          <AlertCircle size={22} color="var(--red-9)" strokeWidth={1.5} />
          <Text size="2" color="red" weight="bold" align="center">
            Erreur de chargement
          </Text>
          <Text size="1" color="gray" align="center">
            Vérifiez votre connexion ou réessayez
          </Text>
        </StateBox>
      )}

      {state === 'empty' && (
        <StateBox>
          <SearchX size={22} color="var(--gray-8)" strokeWidth={1.5} />
          <Text size="2" color="gray" weight="bold" align="center">
            Aucun résultat pour « {debouncedSearch} »
          </Text>
          {onCreateClick && (
            <Button size="1" variant="soft" color="blue" type="button"
              onClick={() => onCreateClick(debouncedSearch)}
            >
              <Plus size={11} /> {createLabel}
            </Button>
          )}
        </StateBox>
      )}
    </Box>
  );
}

AsyncSearchSelect.propTypes = {
  fetchFn: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
  minChars: PropTypes.number,
  onCreateClick: PropTypes.func,
  createLabel: PropTypes.string,
  onSearchChange: PropTypes.func,
};
