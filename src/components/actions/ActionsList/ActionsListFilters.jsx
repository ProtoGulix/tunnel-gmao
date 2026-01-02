import PropTypes from "prop-types";
import { Box, Flex, TextField, Button } from "@radix-ui/themes";
import { Search } from "lucide-react";

/**
 * Barre de filtres : recherche + catégories
 * 
 * Contraintes respectées :
 * - 3 props (filters, metadata, handlers)
 * - Aucun callback inline
 * - Logique externe
 */
export default function ActionsListFilters({ filters, metadata, handlers }) {
  const { searchTerm, selectedCategory } = filters;
  const { categories, categoryCounts, totalCount } = metadata;
  const { onSearchChange, onCategorySelect, onCategoryReset } = handlers;

  // ==================== EVENT ADAPTERS ====================
  
  const handleSearchInput = (e) => {
    onSearchChange(e.target.value);
  };

  const handleResetClick = () => {
    onCategoryReset();
  };

  const createCategoryClickHandler = (category) => () => {
    onCategorySelect(category);
  };

  // ==================== RENDER ====================

  return (
    <Flex gap="3" mb="3" wrap="wrap">
      {/* Champ de recherche */}
      <Box style={{ flex: 1, minWidth: '250px' }}>
        <TextField.Root
          placeholder="Rechercher une action, intervention, catégorie..."
          value={searchTerm}
          onChange={handleSearchInput}
          size="2"
        >
          <TextField.Slot>
            <Search size={16} />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Boutons de filtrage par catégorie */}
      <Flex gap="2" wrap="wrap">
        <Button
          size="1"
          variant={selectedCategory === null ? "solid" : "soft"}
          onClick={handleResetClick}
        >
          Toutes ({totalCount})
        </Button>
        
        {categories.slice(0, 5).map(cat => {
          const count = categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat;
          
          return (
            <Button
              key={cat}
              size="1"
              variant={isSelected ? "solid" : "soft"}
              onClick={createCategoryClickHandler(cat)}
            >
              {cat} ({count})
            </Button>
          );
        })}
      </Flex>
    </Flex>
  );
}

ActionsListFilters.displayName = "ActionsListFilters";

ActionsListFilters.propTypes = {
  filters: PropTypes.shape({
    searchTerm: PropTypes.string.isRequired,
    selectedCategory: PropTypes.string
  }).isRequired,
  metadata: PropTypes.shape({
    categories: PropTypes.arrayOf(PropTypes.string).isRequired,
    categoryCounts: PropTypes.object.isRequired,
    totalCount: PropTypes.number.isRequired
  }).isRequired,
  handlers: PropTypes.shape({
    onSearchChange: PropTypes.func.isRequired,
    onCategorySelect: PropTypes.func.isRequired,
    onCategoryReset: PropTypes.func.isRequired
  }).isRequired
};
