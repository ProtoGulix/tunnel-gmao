// ===== IMPORTS =====
import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { 
  Box, 
  Flex, 
  Text, 
  Badge,
  Theme
} from '@radix-ui/themes';
import { Search, Package, AlertCircle } from 'lucide-react';
import { stock } from '@/lib/api/facade';
import { normalizeText } from '@/lib/utils/textUtils';
import { useError } from '@/contexts/ErrorContext';

// ===== COMPONENT =====
/**
 * Dropdown de recherche d'articles du stock avec suggestions
 * Réutilisable pour création de demandes et qualification
 * 
 * TODO: Améliorations futures possibles :
 * - Navigation clavier (↑↓ pour naviguer, Enter pour sélectionner, Escape pour fermer)
 * - Highlight du terme recherché dans les suggestions
 * - Debounce sur la recherche si dataset très large
 * - Virtual scrolling si beaucoup de suggestions (>100)
 * - Cache des résultats de recherche pour améliorer performances
 */
export default function StockItemSearchDropdown({
  value = '',
  onChange,
  onSelect,
  selectedItem = null,
  placeholder = 'Rechercher un article...',
  showIcon = true,
  inputStyle = {},
  containerStyle = {},
  autoFocus = false,
  maxSuggestions = 5
}) {
  // ----- State -----
  const [allStockItems, setAllStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const { showError } = useError();

  // ----- Load Stock Items -----
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const items = await stock.fetchStockItems();
        setAllStockItems(items);
      } catch (error) {
        showError(error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, [showError]);

  // ----- Update dropdown position -----
  useEffect(() => {
    if (showSuggestions && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showSuggestions]);

  // ----- Suggestions filtrées -----
  // TODO: Si dataset très large, considérer useMemo + debounce pour optimiser
  const suggestions = value.length >= 2
    ? allStockItems
        .filter(item => {
          const term = normalizeText(value.toLowerCase());
          const name = normalizeText((item.name || '').toLowerCase());
          const ref = normalizeText((item.ref || '').toLowerCase());
          return name.includes(term) || ref.includes(term);
        })
        .slice(0, maxSuggestions)
    : [];

  // ----- Handlers -----
  // TODO: Ajouter handleKeyDown pour navigation clavier
  // const handleKeyDown = useCallback((e) => {
  //   if (e.key === 'ArrowDown') { /* naviguer vers le bas */ }
  //   if (e.key === 'ArrowUp') { /* naviguer vers le haut */ }
  //   if (e.key === 'Enter') { /* sélectionner l'élément actif */ }
  //   if (e.key === 'Escape') { setShowSuggestions(false); }
  // }, []);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);
    
    // Clear selection if user types different text
    if (selectedItem && newValue !== selectedItem.name) {
      onSelect(null);
    }
  }, [onChange, onSelect, selectedItem]);

  const handleSelectItem = useCallback((item) => {
    onChange(item.name);
    onSelect(item);
    setShowSuggestions(false);
  }, [onChange, onSelect]);

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  // ----- Render -----
  return (
    <Box style={containerStyle}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--gray-7)',
            fontSize: '14px',
            fontFamily: 'inherit',
            paddingLeft: showIcon ? '36px' : '12px',
            boxSizing: 'border-box',
            ...inputStyle
          }}
        />
        {showIcon && (
          <Search size={16} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--gray-9)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && value.length >= 2 && createPortal(
        <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="95%">
          <Box 
            style={{ 
              position: 'fixed',
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              width: `${dropdownPos.width}px`,
              zIndex: 9999,
              maxHeight: '280px',
              overflowY: 'auto', // TODO: Considérer react-window pour virtual scrolling si >100 résultats
              backgroundColor: 'white',
              borderRadius: '6px',
              border: '1px solid var(--gray-6)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {loading ? (
              <Box p="4" style={{ textAlign: 'center' }}>
                <Text size="2" color="gray">Chargement...</Text>
              </Box>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, index) => (
                <Box
                  key={item.id}
                  p="3"
                  style={{ 
                    cursor: 'pointer',
                    borderBottom: index < suggestions.length - 1 ? '1px solid var(--gray-3)' : 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectItem(item);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--gray-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
                    {/* TODO: Highlight du terme recherché dans le nom */}
                    {item.name}
                  </Text>
                  <Flex gap="2" align="center" wrap="wrap">
                    <Badge color="blue" variant="soft" size="1">
                      {item.ref}
                    </Badge>
                    <Flex align="center" gap="1">
                      <Package size={12} color="var(--gray-11)" />
                      <Text size="1" color="gray">
                        {item.quantity || 0} {item.unit || 'pcs'}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              ))
            ) : (
              <Box p="4" style={{ textAlign: 'center' }}>
                <Flex direction="column" gap="2" align="center">
                  <AlertCircle size={24} color="var(--orange-9)" />
                  <Text size="2" weight="bold">
                    Aucun article trouvé
                  </Text>
                  <Text size="1" color="gray">
                    Continuez pour créer une demande spéciale
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>
        </Theme>,
        document.body
      )}
    </Box>
  );
}

StockItemSearchDropdown.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  selectedItem: PropTypes.object,
  placeholder: PropTypes.string,
  showIcon: PropTypes.bool,
  inputStyle: PropTypes.object,
  containerStyle: PropTypes.object,
  autoFocus: PropTypes.bool,
  maxSuggestions: PropTypes.number,
};
