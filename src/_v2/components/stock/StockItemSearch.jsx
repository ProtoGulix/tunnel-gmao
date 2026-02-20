/**
 * @fileoverview Stock Item Search & Link Component
 * Formulaire pour rechercher un article du stock ou en créer un nouveau et le lier à une demande.
 * Gère deux modes: recherche d'article existant et création d'article nouveau.
 *
 * @module components/stock/StockItemSearch
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires @/components/stock/StockItemSearchDropdown
 * @requires @/components/stock/StockItemSearchSubcomponents
 * @requires @/hooks/useStockFamilies
 * @requires @/lib/utils/stockReferenceGenerator
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Flex, Button } from "@radix-ui/themes";
import { Search, Plus } from "lucide-react";
import { stock } from "@/lib/api/facade";
import { useStockSubFamilies } from "@/hooks/useStockFamilies";
import { SearchTabContent } from "./StockItemSearchSubcomponents";
import { CreateTabContent } from "./StockItemCreateForm";
import { generateStockReference } from "@/lib/utils/stockReferenceGenerator";

// ===== COMPONENT =====
/**
 * Formulaire de recherche et liaison d'articles de stock
 * Permet de rechercher un article existant ou d'en créer un nouveau.
 * Les deux modes (recherche/création) sont accessibles via des onglets.
 *
 * @component
 * @param {Object} props
 * @param {string|number} props.requestId - ID de la demande
 * @param {string} [props.initialItemLabel] - Label initial pour pré-remplir la recherche
 * @param {Function} props.onLinkExisting - Callback quand on lie un article existant
 * @param {Function} props.onCreateNew - Callback quand on crée un nouvel article
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {Array<Object>} [props.stockFamilies=[]] - Liste des familles de stock disponibles
 * @param {string} props.stockFamilies[].code - Code famille
 * @param {string} props.stockFamilies[].label - Label famille
 * @returns {JSX.Element} Formulaire avec 2 onglets (recherche/création)
 *
 * @example
 * <StockItemSearch
 *   requestId="req-123"
 *   initialItemLabel="Vis"
 *   onLinkExisting={handleLinkExisting}
 *   onCreateNew={handleCreateNew}
 *   loading={isProcessing}
 *   stockFamilies={familiesList}
 * />
 */
function StockItemSearch({
  requestId,
  initialItemLabel,
  onLinkExisting,
  onCreateNew,
  loading = false,
  stockFamilies = [],
}) {
  // ----- State: Tabs -----
  const [activeTab, setActiveTab] = useState("search");

  // ----- State: Search Tab -----
  const [searchTerm, setSearchTerm] = useState(initialItemLabel || "");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemSpecs, setSelectedItemSpecs] = useState([]);

  // ----- State: Create Tab -----
  const [newItemName, setNewItemName] = useState(initialItemLabel || "");
  const [newItemFamilyCode, setNewItemFamilyCode] = useState("");
  const [newItemSubFamilyCode, setNewItemSubFamilyCode] = useState("");
  const [newItemSpec, setNewItemSpec] = useState("");
  const [newItemDimension, setNewItemDimension] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemLocation, setNewItemLocation] = useState("");

  // ----- Custom Hooks -----
  const { subFamilies } = useStockSubFamilies(newItemFamilyCode);

  // ----- Callbacks -----
  const loadSpecs = useCallback(async (stockItemId) => {
    try {
      const specs = await stock.fetchStockItemStandardSpecs(stockItemId);
      setSelectedItemSpecs(specs);
    } catch (error) {
      console.error("Erreur chargement specs:", error);
      setSelectedItemSpecs([]);
    }
  }, []);

  const handleSwitchToCreate = useCallback(() => {
    setActiveTab("create");
    if (searchTerm && !newItemName) {
      setNewItemName(searchTerm);
    }
  }, [searchTerm, newItemName]);

  const handleLinkItem = useCallback(() => {
    if (selectedItem) {
      onLinkExisting(requestId, selectedItem);
    }
  }, [selectedItem, requestId, onLinkExisting]);

  const handleCreateItem = useCallback(() => {
    if (
      newItemName.trim() &&
      newItemFamilyCode &&
      newItemSubFamilyCode &&
      newItemDimension.trim()
    ) {
      onCreateNew(requestId, {
        name: newItemName.trim(),
        family_code: newItemFamilyCode,
        sub_family_code: newItemSubFamilyCode,
        spec: newItemSpec.trim() || null,
        dimension: newItemDimension.trim(),
        unit: newItemUnit,
        location: newItemLocation.trim() || null,
      });
    }
  }, [
    newItemName,
    newItemFamilyCode,
    newItemSubFamilyCode,
    newItemSpec,
    newItemDimension,
    newItemUnit,
    newItemLocation,
    requestId,
    onCreateNew,
  ]);

  const handleClearSelection = useCallback(() => {
    setSelectedItem(null);
    setSearchTerm("");
  }, []);

  // ----- Computed Values -----
  /**
   * Vérifie si le formulaire de création est valide
   * @private
   */
  const isCreateFormValid = useCallback(
    () =>
      newItemName.trim() &&
      newItemFamilyCode &&
      newItemSubFamilyCode &&
      newItemDimension.trim(),
    [newItemName, newItemFamilyCode, newItemSubFamilyCode, newItemDimension]
  );

  const autoGeneratedRef = useMemo(
    () =>
      generateStockReference({
        family_code: newItemFamilyCode,
        sub_family_code: newItemSubFamilyCode,
        spec: newItemSpec,
        dimension: newItemDimension,
      }),
    [newItemFamilyCode, newItemSubFamilyCode, newItemSpec, newItemDimension]
  );

  // ----- Effects -----
  useEffect(() => {
    if (selectedItem) {
      loadSpecs(selectedItem.id);
    } else {
      setSelectedItemSpecs([]);
    }
  }, [selectedItem, loadSpecs]);

  // ----- Render -----
  return (
    <Card>
      <Flex direction="column" gap="3">
        {/* Tabs */}
        <Flex gap="2">
          <Button
            variant={activeTab === "search" ? "solid" : "soft"}
            size="2"
            onClick={() => setActiveTab("search")}
          >
            <Search size={14} /> Rechercher
          </Button>
          <Button
            variant={activeTab === "create" ? "solid" : "soft"}
            size="2"
            onClick={handleSwitchToCreate}
          >
            <Plus size={14} /> Créer
          </Button>
        </Flex>

        {/* Search Tab */}
        {activeTab === "search" && (
          <SearchTabContent
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            selectedItemSpecs={selectedItemSpecs}
            onClearSelection={handleClearSelection}
            onLinkItem={handleLinkItem}
            loading={loading}
          />
        )}

        {/* Create Tab */}
        {activeTab === "create" && (
          <CreateTabContent
            newItemName={newItemName}
            onNewItemNameChange={setNewItemName}
            newItemFamilyCode={newItemFamilyCode}
            onNewItemFamilyCodeChange={(code) => {
              setNewItemFamilyCode(code);
              setNewItemSubFamilyCode("");
            }}
            newItemSubFamilyCode={newItemSubFamilyCode}
            onNewItemSubFamilyCodeChange={setNewItemSubFamilyCode}
            newItemSpec={newItemSpec}
            onNewItemSpecChange={setNewItemSpec}
            newItemDimension={newItemDimension}
            onNewItemDimensionChange={setNewItemDimension}
            newItemUnit={newItemUnit}
            onNewItemUnitChange={setNewItemUnit}
            newItemLocation={newItemLocation}
            onNewItemLocationChange={setNewItemLocation}
            subFamilies={subFamilies}
            stockFamilies={stockFamilies}
            autoGeneratedRef={autoGeneratedRef}
            onCreateItem={handleCreateItem}
            isFormValid={isCreateFormValid()}
            loading={loading}
          />
        )}
      </Flex>
    </Card>
  );
}

StockItemSearch.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialItemLabel: PropTypes.string,
  onLinkExisting: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  stockFamilies: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string,
      label: PropTypes.string,
    })
  ),
};

export default StockItemSearch;
