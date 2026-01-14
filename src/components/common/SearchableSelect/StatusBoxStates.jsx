import PropTypes from 'prop-types';
import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import { HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * État vide - avant recherche
 */
export function EmptyState() {
  return (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px' }}>
      <HelpCircle size={20} color="var(--gray-9)" style={{ flexShrink: 0 }} />
      <Text size="2" color="gray" weight="medium" style={{ textAlign: 'center' }}>
        Tapez pour rechercher
      </Text>
    </Flex>
  );
}

/**
 * État sélectionné - affiche l'élément choisi
 */
export function SelectedState({ item, getDisplayText }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px' }}>
      <CheckCircle size={24} color="var(--green-9)" style={{ flexShrink: 0 }} />
      <Text size="2" weight="bold" color="green" style={{ textAlign: 'center', wordBreak: 'break-word' }}>
        {getDisplayText(item)}
      </Text>
    </Flex>
  );
}

SelectedState.propTypes = {
  item: PropTypes.object.isRequired,
  getDisplayText: PropTypes.func.isRequired
};

/**
 * État aucun résultat
 */
export function NoResultsState({ search }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ minHeight: '140px', padding: '16px' }}>
      <AlertCircle size={24} color="var(--orange-9)" style={{ flexShrink: 0 }} />
      <Text size="2" weight="bold" color="orange" style={{ textAlign: 'center' }}>
        Aucun résultat
      </Text>
      <Text size="1" color="gray" style={{ textAlign: 'center', wordBreak: 'break-word', padding: '0 8px' }}>
        &quot;{search}&quot;
      </Text>
    </Flex>
  );
}

NoResultsState.propTypes = {
  search: PropTypes.string.isRequired
};

/**
 * Option de demande spéciale
 */
export function SpecialRequestOption({ search, onSelect }) {
  return (
    <Box
      p="2"
      style={{
        cursor: 'pointer',
        background: 'var(--orange-2)',
        borderTop: '1px solid var(--orange-7)',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--orange-3)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--orange-2)'}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect({ id: 'special-request', name: search, isSpecialRequest: true });
      }}
    >
      <Flex align='center' gap='2'>
        <AlertCircle size={16} color='var(--orange-9)' />
        <Text size='2' weight='medium' color='orange'>Demande spéciale :</Text>
        <Text size='2' weight='bold'>{search}</Text>
      </Flex>
    </Box>
  );
}

SpecialRequestOption.propTypes = {
  search: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
};

/**
 * Option pour créer un nouveau fournisseur
 */
export function CreateNewSupplierOption({ search, onSelect }) {
  return (
    <Box
      p="2"
      style={{
        cursor: 'pointer',
        background: 'var(--blue-2)',
        borderTop: '1px solid var(--blue-7)',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-3)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--blue-2)'}
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect({ id: 'new-supplier', name: search, isNewSupplier: true });
      }}
    >
      <Flex align='center' gap='2'>
        <AlertCircle size={16} color='var(--blue-9)' />
        <Text size='2' weight='medium' color='blue'>Créer un nouveau :</Text>
        <Text size='2' weight='bold'>{search}</Text>
      </Flex>
    </Box>
  );
}

CreateNewSupplierOption.propTypes = {
  search: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired
};

/**
 * Liste de suggestions
 */
export function SuggestionsList({ suggestions, renderItem, getDisplayText, onSelect, search, showSpecialRequest, showCreateNew, onCreateNew }) {
  const defaultRender = (item) => (
    <Box>
      <Text size="2" weight="bold">{getDisplayText(item)}</Text>
    </Box>
  );

  return (
    <>
      {suggestions.map((item, idx) => (
        <Box
          key={item.id}
          p="2"
          style={{
            cursor: 'pointer',
            borderBottom: '1px solid var(--gray-3)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          {renderItem ? renderItem(item) : defaultRender(item)}
        </Box>
      ))}
      {showCreateNew && search.trim() && (
        <CreateNewSupplierOption search={search} onSelect={onCreateNew || onSelect} />
      )}
      {showSpecialRequest && search.trim() && (
        <SpecialRequestOption search={search} onSelect={onSelect} />
      )}
    </>
  );
}

SuggestionsList.propTypes = {
  suggestions: PropTypes.array.isRequired,
  renderItem: PropTypes.func,
  getDisplayText: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  search: PropTypes.string,
  showSpecialRequest: PropTypes.bool,
  showCreateNew: PropTypes.bool,
  onCreateNew: PropTypes.func,
};
