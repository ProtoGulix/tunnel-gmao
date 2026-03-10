import { useRef, useState, useEffect } from 'react';
import { normalizeText } from '@/lib/utils/textUtils';

/**
 * Hook pour gérer la logique de recherche et sélection.
 * @param {number} [debounceMs=0] - Si > 0, debounce `onSearchChange` pendant la frappe.
 *                                   N'affecte pas les callbacks de sélection/clear.
 */
export function useSearchableSelect({
  items,
  value,
  getDisplayText,
  getSearchableFields,
  maxSuggestions,
  onChange,
  onSearchChange,
  debounceMs = 0,
}) {
  const debounceRef = useRef(null);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Synchroniser selectedItem avec value
  useEffect(() => {
    if (value && items.length > 0) {
      const found = items.find((item) => item.id === value);
      if (found) {
        const display = getDisplayText(found);
        setSelectedItem(found);
        setSearch(display);
        if (onSearchChange) onSearchChange(display);
      }
    } else if (value === null && selectedItem) {
      // Only clear selectedItem, but keep search term for user convenience
      setSelectedItem(null);
    }
  }, [value, items, getDisplayText, selectedItem]);

  // Calculer les suggestions
  useEffect(() => {
    if (search.length >= 2) {
      const term = normalizeText(search.toLowerCase());
      const filtered = items
        .filter((item) => {
          const fields = getSearchableFields(item);
          return fields.some((field) =>
            normalizeText(String(field || '').toLowerCase()).includes(term)
          );
        })
        .slice(0, maxSuggestions);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [search, items, getSearchableFields, maxSuggestions]);

  const handleSearchChange = (e) => {
    const newSearch = e.target.value;
    if (selectedItem) {
      const currentDisplay = getDisplayText(selectedItem);
      if (newSearch !== currentDisplay) {
        setSelectedItem(null);
        onChange(null);
      }
    }
    setSearch(newSearch);
    if (!newSearch.trim()) {
      setSelectedItem(null);
      onChange(null);
    }
    if (onSearchChange) {
      if (debounceMs > 0) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => onSearchChange(newSearch), debounceMs);
      } else {
        onSearchChange(newSearch);
      }
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    const display = getDisplayText(item);
    setSearch(display);
    setSuggestions([]);
    if (onSearchChange) onSearchChange(display);
    onChange(item);
  };

  const handleClear = () => {
    setSearch('');
    setSelectedItem(null);
    setSuggestions([]);
    if (onSearchChange) onSearchChange('');
    onChange(null);
  };

  return {
    search,
    selectedItem,
    suggestions,
    handleSearchChange,
    handleSelectItem,
    handleClear,
  };
}
