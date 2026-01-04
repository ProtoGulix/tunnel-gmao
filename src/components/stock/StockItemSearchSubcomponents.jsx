/**
 * @fileoverview Sous-composants pour Stock Item Search
 * Contient les composants pour l'onglet de recherche et spécifications.
 *
 * @module components/stock/StockItemSearchSubcomponents
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires @/components/stock/StockItemSearchDropdown
 */

import PropTypes from "prop-types";
import {
  Flex,
  Box,
  Button,
  Text,
  Badge,
  Card,
} from "@radix-ui/themes";
import {
  CheckCircle,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import StockItemSearchDropdown from "./StockItemSearchDropdown";

// ===== COMPONENTS =====

/**
 * Contenu de l'onglet de recherche
 * @component
 * @private
 * @param {Object} props
 * @param {string} props.searchTerm - Terme de recherche actuel
 * @param {Function} props.onSearchTermChange - Callback sur changement du terme
 * @param {Object} [props.selectedItem] - Article sélectionné
 * @param {Function} props.onSelectItem - Callback de sélection d'article
 * @param {Array} props.selectedItemSpecs - Spécifications de l'article sélectionné
 * @param {Function} props.onClearSelection - Callback pour effacer la sélection
 * @param {Function} props.onLinkItem - Callback pour lier l'article
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element} Contenu de l'onglet de recherche
 */
export function SearchTabContent({
  searchTerm,
  onSearchTermChange,
  selectedItem,
  onSelectItem,
  selectedItemSpecs,
  onClearSelection,
  onLinkItem,
  loading,
}) {
  return (
    <Flex direction="column" gap="2">
      <StockItemSearchDropdown
        value={searchTerm}
        onChange={onSearchTermChange}
        onSelect={onSelectItem}
        selectedItem={selectedItem}
        placeholder="Rechercher un article..."
        maxSuggestions={20}
      />

      {selectedItem && (
        <>
          <Card style={{ background: "var(--green-2)" }}>
            <Flex direction="column" gap="2">
              {/* Item info */}
              <Flex gap="2" align="center">
                <CheckCircle size={16} color="var(--green-9)" />
                <Box flex="1">
                  <Text weight="bold">{selectedItem.name}</Text>
                  <Badge color="blue" variant="soft" size="1" ml="2">
                    {selectedItem.ref}
                  </Badge>
                </Box>
                <Button size="1" variant="ghost" onClick={onClearSelection}>
                  ✕
                </Button>
              </Flex>

              {/* Default spec */}
              {selectedItemSpecs.length > 0 && (
                <DefaultSpecDisplay
                  defaultSpec={
                    selectedItemSpecs.find((s) => s.isDefault) ||
                    selectedItemSpecs[0]
                  }
                  totalSpecsCount={selectedItemSpecs.length}
                />
              )}
            </Flex>
          </Card>

          <Button onClick={onLinkItem} disabled={loading} size="2">
            <LinkIcon size={16} />
            {loading ? "Liaison..." : "Lier cet article"}
          </Button>
        </>
      )}
    </Flex>
  );
}

SearchTabContent.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchTermChange: PropTypes.func.isRequired,
  selectedItem: PropTypes.object,
  onSelectItem: PropTypes.func.isRequired,
  selectedItemSpecs: PropTypes.array.isRequired,
  onClearSelection: PropTypes.func.isRequired,
  onLinkItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

/**
 * Affichage de la spécification par défaut
 * @component
 * @private
 * @param {Object} props
 * @param {Object} props.defaultSpec - Spécification par défaut
 * @param {string} props.defaultSpec.title - Titre de la spec
 * @param {string} props.defaultSpec.value - Valeur de la spec
 * @param {string} [props.defaultSpec.unit] - Unité
 * @param {boolean} [props.defaultSpec.isDefault] - Est spec par défaut
 * @param {number} props.totalSpecsCount - Nombre total de specs
 * @returns {JSX.Element} Affichage de la spec
 */
export function DefaultSpecDisplay({ defaultSpec, totalSpecsCount }) {
  return (
    <Box
      p="2"
      style={{
        background: "var(--green-1)",
        borderRadius: "var(--radius-2)",
      }}
    >
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          <FileText size={14} color="var(--blue-9)" />
          <Text size="2" weight="bold">
            {defaultSpec.title}
          </Text>
          {defaultSpec.isDefault && (
            <Badge color="green" size="1" variant="soft">
              Par défaut
            </Badge>
          )}
        </Flex>
        <Text size="1" color="gray">
          {defaultSpec.value} {defaultSpec.unit || ""}
        </Text>
        {totalSpecsCount > 1 && (
          <Text size="1" color="blue">
            +{totalSpecsCount - 1} autre{totalSpecsCount > 2 ? "s" : ""}
          </Text>
        )}
      </Flex>
    </Box>
  );
}

DefaultSpecDisplay.propTypes = {
  defaultSpec: PropTypes.shape({
    title: PropTypes.string,
    value: PropTypes.string,
    unit: PropTypes.string,
    isDefault: PropTypes.bool,
  }).isRequired,
  totalSpecsCount: PropTypes.number.isRequired,
};
