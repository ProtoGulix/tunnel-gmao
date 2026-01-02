import { useState, useEffect } from 'react';
import { normalizeText } from '@/lib/utils/textUtils';

/**
 * Hook pour gérer la logique de recherche et sélection
 */
export function useSearchableSelect({
  items,
  value,
  getDisplayText,
  getSearchableFields,
  maxSuggestions,
  onChange,
}) {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Synchroniser selectedItem avec value
  useEffect(() => {
    if (value && items.length > 0) {
      const found = items.find((item) => item.id === value);
      if (found) {
        setSelectedItem(found);
        setSearch(getDisplayText(found));
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items, getDisplayText]);

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
    setSearch(newSearch);
    if (!newSearch.trim()) {
      setSelectedItem(null);
      onChange(null);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearch(getDisplayText(item));
    setSuggestions([]);
    onChange(item);
  };

  const handleClear = () => {
    setSearch('');
    setSelectedItem(null);
    setSuggestions([]);
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
