import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { EmptyState, SuggestionsList, SpecialRequestOption } from './StatusBoxStates';

/**
 * Boîte de statut qui affiche l'état actuel de la sélection
 */
export default function StatusBox({
  search,
  selectedItem,
  suggestions,
  renderItem,
  renderSelected,
  getDisplayText,
  onSelectItem
}) {
  // Ne rien afficher si un item est sélectionné
  if (selectedItem) {
    return null;
  }

  const hasResults = suggestions.length > 0;
  const hasSearch = search.trim().length > 0;

  // Détermine le style de la bordure selon l'état
  const getBorderStyle = () => {
    if (hasSearch && !hasResults) return '2px solid var(--orange-7)';
    if (hasSearch) return '2px solid var(--blue-7)';
    return '1px dashed var(--gray-6)';
  };

  const getBackgroundStyle = () => {
    if (hasSearch && !hasResults) return 'var(--orange-2)';
    if (hasSearch) return 'var(--blue-2)';
    return 'var(--gray-2)';
  };

  return (
    <Box mt="2" style={{
      border: getBorderStyle(),
      background: getBackgroundStyle(),
      borderRadius: '8px',
      overflowY: 'auto',
      position: 'relative',
      zIndex: 1
    }}>
      {!hasSearch ? (
        <EmptyState />
      ) : hasResults ? (
        <SuggestionsList
          suggestions={suggestions}
          renderItem={renderItem}
          getDisplayText={getDisplayText}
          onSelect={onSelectItem}
          search={search}
          showSpecialRequest={true}
        />
      ) : (
        <SpecialRequestOption search={search} onSelect={onSelectItem} />
      )}
    </Box>
  );
}

StatusBox.propTypes = {
  search: PropTypes.string.isRequired,
  selectedItem: PropTypes.object,
  suggestions: PropTypes.array.isRequired,
  renderItem: PropTypes.func,
  renderSelected: PropTypes.func,
  getDisplayText: PropTypes.func.isRequired,
  onSelectItem: PropTypes.func.isRequired
};
