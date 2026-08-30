import { useId } from 'react';
import PropTypes from 'prop-types';
import { Box, Text } from '@radix-ui/themes';
import SearchInput from './SearchInput';
import StatusBox from './StatusBox';
import { useSearchableSelect } from './useSearchableSelect';

/**
 * Composant de sélection avec recherche et suggestions réutilisable.
 * 
 * Refactorisé en modules pour réduire complexité et nombre de lignes.
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Array} props.items - Liste complète des éléments disponibles
 * @param {string} props.label - Étiquette du champ
 * @param {Function} props.onChange - Callback de sélection (item)
 * @param {string|null} props.value - ID de l'élément sélectionné
 * @param {Function} props.getDisplayText - Fonction pour obtenir le texte à afficher
 * @param {Function} props.getSearchableFields - Fonction pour obtenir les champs de recherche
 * @param {Function} [props.renderItem] - Fonction personnalisée pour render un item
 * @param {Function} [props.renderSelected] - Fonction personnalisée pour render l'item sélectionné
 * @param {boolean} [props.required=false] - Si le champ est requis
 * @param {number} [props.maxSuggestions=8] - Nombre max de suggestions
 * @param {string} [props.placeholder='Tapez pour rechercher...'] - Texte du placeholder
 * @param {boolean} [props.allowSpecialRequest=true] - Autoriser la création de demande spéciale (non-sélectionné)
 * @param {boolean} [props.allowCreateNew=false] - Autoriser la création de nouvel élément
 */
export default function SearchableSelect(props) {
  const {
    items = [],
    label,
    onChange,
    value,
    getDisplayText,
    getSearchableFields,
    renderItem,
    renderSelected,
    required = false,
    maxSuggestions = 8,
    placeholder = 'Tapez pour rechercher...',
    onSearchChange,
    allowSpecialRequest = true,
    allowCreateNew = false,
    showEmptyState = true,
    debounceMs = 0,
  } = props;

  const {
    search,
    selectedItem,
    suggestions,
    activeIndex,
    setActiveIndex,
    moveActiveIndex,
    handleSearchChange,
    handleSelectItem
  } = useSearchableSelect({
    items,
    value,
    getDisplayText,
    getSearchableFields,
    maxSuggestions,
    onChange,
    onSearchChange,
    debounceMs,
  });

  const listboxId = useId();
  const getOptionId = (idx) => `${listboxId}-option-${idx}`;
  const isOpen = !selectedItem && search.trim().length > 0 && suggestions.length > 0;

  const handleKeyDown = (event) => {
    if (!isOpen) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveIndex(1, suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveIndex(-1, suggestions.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(suggestions.length - 1);
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        handleSelectItem(suggestions[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setActiveIndex(-1);
    }
  };

  return (
    <Box>
      <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
        {label}{required && <Text as="span" color="red"> *</Text>}
      </Text>

      <SearchInput
        value={search}
        onChange={handleSearchChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        label={label}
        listboxId={listboxId}
        expanded={isOpen}
        activeOptionId={activeIndex >= 0 ? getOptionId(activeIndex) : undefined}
      />

      <StatusBox
        search={search}
        selectedItem={selectedItem}
        suggestions={suggestions}
        renderItem={renderItem}
        renderSelected={renderSelected}
        getDisplayText={getDisplayText}
        onSelectItem={handleSelectItem}
        allowSpecialRequest={allowSpecialRequest}
        allowCreateNew={allowCreateNew}
        showEmptyState={showEmptyState}
        activeIndex={activeIndex}
        listboxId={listboxId}
        getOptionId={getOptionId}
      />
    </Box>
  );
}

SearchableSelect.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  })).isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  getDisplayText: PropTypes.func.isRequired,
  getSearchableFields: PropTypes.func.isRequired,
  renderItem: PropTypes.func,
  renderSelected: PropTypes.func,
  required: PropTypes.bool,
  maxSuggestions: PropTypes.number,
  placeholder: PropTypes.string,
  onSearchChange: PropTypes.func,
  allowSpecialRequest: PropTypes.bool,
  allowCreateNew: PropTypes.bool,
  showEmptyState: PropTypes.bool,
  debounceMs: PropTypes.number,
};
