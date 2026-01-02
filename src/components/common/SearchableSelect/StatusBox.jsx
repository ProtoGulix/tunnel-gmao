import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { EmptyState, SelectedState, NoResultsState, SuggestionsList } from './StatusBoxStates';

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
  // Détermine le style de la bordure selon l'état
  const getBorderStyle = () => {
    if (selectedItem) return '2px solid var(--green-7)';
    if (search.trim()) return '2px solid var(--orange-7)';
    return '1px dashed var(--gray-6)';
  };

  const getBackgroundStyle = () => {
    if (selectedItem) return 'var(--green-2)';
    if (search.trim()) return 'var(--orange-2)';
    return 'var(--gray-2)';
  };

  return (
    <Box mt="2" style={{
      border: getBorderStyle(),
      background: getBackgroundStyle(),
      borderRadius: '8px',
      minHeight: '140px',
      overflowY: 'auto'
    }}>
      {!search.trim() ? (
        <EmptyState />
      ) : selectedItem ? (
        renderSelected ? renderSelected(selectedItem) : <SelectedState item={selectedItem} getDisplayText={getDisplayText} />
      ) : suggestions.length > 0 ? (
        <SuggestionsList
          suggestions={suggestions}
          renderItem={renderItem}
          getDisplayText={getDisplayText}
          onSelect={onSelectItem}
        />
      ) : (
        <NoResultsState search={search} />
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
