import PropTypes from "prop-types";
import { Box, Text } from "@radix-ui/themes";
import { List, Search } from "lucide-react";
import { AnalysisHeader } from "@/components/common/AnalysisComponents";
import { useActionsList } from "./useActionsList";
import ActionsListFilters from "./ActionsListFilters";
import ActionsListTable from "./ActionsListTable";

/**
 * Liste complète des actions avec filtres
 * 
 * CONTRAINTES RESPECTÉES :
 * - 3 props max (actions, handlers, ui)
 * - Props groupées sémantiquement
 * - Aucune logique métier dans le JSX
 * - Aucun callback inline
 * - Niveau imbrication max : 3
 * - ~120 lignes
 * 
 * Architecture :
 * - useActionsList : état + logique
 * - actionsListUtils : fonctions pures
 * - ActionsListFilters : barre de filtres
 * - ActionsListTable : tableau des résultats
 */
export default function ActionsList({ actions, ui }) {
  // ==================== HOOK ====================
  
  const {
    filters,
    computed,
    handlers: listHandlers
  } = useActionsList(actions);

  // ==================== CONFIG ====================
  
  const emptyStateConfig = ui?.emptyState || {
    icon: Search,
    title: "Aucune action trouvée",
    description: "Ajustez vos filtres pour voir les résultats"
  };

  const headerConfig = ui?.header || {
    icon: List,
    title: "Liste des actions",
    description: "Toutes les actions enregistrées avec filtres par catégorie et recherche."
  };

  // ==================== METADATA ====================
  
  const filtersMetadata = {
    categories: computed.categories,
    categoryCounts: computed.categoryCounts,
    totalCount: computed.totalCount
  };

  const filtersHandlers = {
    onSearchChange: listHandlers.handleSearchChange,
    onCategorySelect: listHandlers.handleCategorySelect,
    onCategoryReset: listHandlers.handleCategoryReset
  };

  // ==================== RENDER ====================

  return (
    <Box p="0">
      {/* En-tête */}
      <AnalysisHeader
        icon={headerConfig.icon}
        title={headerConfig.title}
        description={headerConfig.description}
      />

      {/* Filtres */}
      <ActionsListFilters
        filters={filters}
        metadata={filtersMetadata}
        handlers={filtersHandlers}
      />

      {/* Compteur de résultats */}
      <Text size="2" color="gray" style={{ display: 'block', marginBottom: '12px' }}>
        {computed.filteredCount} action{computed.filteredCount > 1 ? 's' : ''} trouvée{computed.filteredCount > 1 ? 's' : ''}
      </Text>

      {/* Tableau ou état vide */}
      <ActionsListTable
        actions={computed.filteredActions}
        emptyState={emptyStateConfig}
      />
    </Box>
  );
}

ActionsList.displayName = "ActionsList";

ActionsList.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ),
  handlers: PropTypes.shape({
    onDateRangeChange: PropTypes.func
  }),
  ui: PropTypes.shape({
    header: PropTypes.shape({
      icon: PropTypes.elementType,
      title: PropTypes.string,
      description: PropTypes.string
    }),
    emptyState: PropTypes.shape({
      icon: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string
    })
  })
};

ActionsList.defaultProps = {
  handlers: {},
  ui: {}
};
