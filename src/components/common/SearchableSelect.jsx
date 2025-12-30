// ===== IMPORTS =====
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import { Search, HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import { normalizeText } from '@/lib/utils/textUtils';

// ===== COMPONENT =====
/**
 * Composant de sélection avec recherche et suggestions réutilisable.
 * 
 * Basé sur le pattern utilisé dans PurchaseRequestFormBody.
 * Affiche une boîte de statut colorée selon l'état de la sélection.
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Array} props.items - Liste complète des éléments disponibles
 * @param {string} props.label - Étiquette du champ
 * @param {Function} props.onChange - Callback de sélection (item)
 * @param {string|null} props.value - ID de l'élément sélectionné
 * @param {Function} props.getDisplayText - Fonction pour obtenir le texte à afficher (item) => string
 * @param {Function} props.getSearchableFields - Fonction pour obtenir les champs de recherche (item) => [field1, field2, ...]
 * @param {Function} [props.renderItem] - Fonction personnalisée pour render un item dans les suggestions
 * @param {Function} [props.renderSelected] - Fonction personnalisée pour render l'item sélectionné
 * @param {boolean} [props.required=false] - Si le champ est requis
 * @param {boolean} [props.compact=true] - Mode compact (suggestions dans une boîte)
 * @param {number} [props.maxSuggestions=8] - Nombre max de suggestions
 * @param {string} [props.placeholder='Tapez pour rechercher...'] - Texte du placeholder
 * @returns {JSX.Element}
 * 
 * @example
 * // Sélection de machine
 * <SearchableSelect
 *   items={machines}
 *   label="Machine"
 *   value={machineId}
 *   onChange={(machine) => setMachineId(machine.id)}
 *   getDisplayText={(m) => m.name}
 *   getSearchableFields={(m) => [m.code, m.name, m.location]}
 *   renderItem={(m) => (
 *     <Box>
 *       <Text weight="bold">{m.name}</Text>
 *       <Text size="1" color="gray">{m.code}</Text>
 *     </Box>
 *   )}
 * />
 */
export default function SearchableSelect({
  items = [],
  label,
  onChange,
  value,
  getDisplayText,
  getSearchableFields,
  renderItem,
  renderSelected,
  required = false,
  compact = true,
  maxSuggestions = 8,
  placeholder = 'Tapez pour rechercher...'
}) {
  // ----- State -----
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Synchroniser selectedItem avec la prop value
  useEffect(() => {
    if (value && items.length > 0) {
      const found = items.find(item => item.id === value);
      if (found) {
        setSelectedItem(found);
        setSearch(getDisplayText(found));
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items, getDisplayText]);

  // Calculer les suggestions basées sur la recherche
  useEffect(() => {
    if (search.length >= 2) {
      const term = normalizeText(search.toLowerCase());
      const filtered = items.filter(item => {
        const fields = getSearchableFields(item);
        return fields.some(field => 
          normalizeText(String(field || '').toLowerCase()).includes(term)
        );
      }).slice(0, maxSuggestions);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [search, items, getSearchableFields, maxSuggestions]);

  // ----- Handlers -----
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

  // ----- Default render functions -----
  const defaultRenderItem = (item) => (
    <Box>
      <Text size="2" weight="bold">{getDisplayText(item)}</Text>
    </Box>
  );

  const defaultRenderSelected = (item) => (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px' }}>
      <CheckCircle size={24} color="var(--green-9)" style={{ flexShrink: 0 }} />
      <Text size="2" weight="bold" color="green" style={{ textAlign: 'center', wordBreak: 'break-word' }}>
        {getDisplayText(item)}
      </Text>
    </Flex>
  );

  // ----- Main Render -----
  if (compact) {
    return (
      <Box>
        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
          {label}
        </Text>

        {/* Input avec recherche */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '6px',
              border: '1px solid var(--gray-7)',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              height: '44px'
            }}
            required={required && !selectedItem}
            aria-label={label}
          />
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-9)',
            pointerEvents: 'none'
          }} />
        </div>

        {/* Boîte de statut */}
        <Box mt="2" style={{
          border: selectedItem ? '2px solid var(--green-7)' : (search.trim() ? '2px solid var(--orange-7)' : '1px dashed var(--gray-6)'),
          background: selectedItem ? 'var(--green-2)' : (search.trim() ? 'var(--orange-2)' : 'var(--gray-2)'),
          borderRadius: '8px',
          minHeight: '140px',
          overflowY: 'auto'
        }}>
          {!search.trim() ? (
            <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px' }}>
              <HelpCircle size={20} color="var(--gray-9)" style={{ flexShrink: 0 }} />
              <Text size="2" color="gray" weight="medium" style={{ textAlign: 'center' }}>
                Tapez pour rechercher
              </Text>
            </Flex>
          ) : selectedItem ? (
            renderSelected ? renderSelected(selectedItem) : defaultRenderSelected(selectedItem)
          ) : suggestions.length > 0 ? (
            suggestions.map((item, idx) => (
              <Box
                key={item.id}
                p="2"
                style={{
                  cursor: 'pointer',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid var(--gray-3)' : 'none',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectItem(item);
                }}
              >
                {renderItem ? renderItem(item) : defaultRenderItem(item)}
              </Box>
            ))
          ) : (
            <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px', padding: '16px' }}>
              <AlertCircle size={24} color="var(--orange-9)" style={{ flexShrink: 0 }} />
              <Text size="2" weight="bold" color="orange" style={{ textAlign: 'center' }}>
                Aucun résultat
              </Text>
              <Text size="1" color="gray" style={{ textAlign: 'center', wordBreak: 'break-word', padding: '0 8px' }}>
                "{search}"
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    );
  }

  // Mode non-compact (simple dropdown)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={handleSearchChange}
        className="form-input"
        required={required && !selectedItem}
        style={{ paddingRight: selectedItem ? '2.5rem' : '0.5rem' }}
      />

      {selectedItem && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            fontSize: '1.2rem',
            padding: '0.25rem',
            lineHeight: 1,
          }}
          title="Effacer"
        >
          ×
        </button>
      )}

      {suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #d0d0d0',
            borderTop: 'none',
            borderRadius: '0 0 4px 4px',
            maxHeight: '250px',
            overflowY: 'auto',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {suggestions.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                background: selectedItem?.id === item.id ? '#f0f0f0' : 'white',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f8f8f8';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = selectedItem?.id === item.id ? '#f0f0f0' : 'white';
              }}
            >
              {renderItem ? renderItem(item) : defaultRenderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// PropTypes
SearchableSelect.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  getDisplayText: PropTypes.func.isRequired,
  getSearchableFields: PropTypes.func.isRequired,
  renderItem: PropTypes.func,
  renderSelected: PropTypes.func,
  required: PropTypes.bool,
  compact: PropTypes.bool,
  maxSuggestions: PropTypes.number,
  placeholder: PropTypes.string,
};
