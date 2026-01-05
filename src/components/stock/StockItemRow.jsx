/**
 * @fileoverview Stock Item Row Component
 * Composant de ligne pour afficher un article de stock avec ses spécifications et références fournisseurs.
 * Gère l'expansion des panneaux de détails et la gestion des données.
 *
 * @module components/stock/StockItemRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires @/components/common/ToggleDetailsButton
 * @requires @/components/stock/EditStockItemDialog
 * @requires @/components/common/ExpandableDetailsRow
 * @requires @/components/stock/StandardSpecsPanel
 * @requires @/components/stock/stockItemsTableHelpers
 * @requires @/components/stock/StockItemRowSubcomponents
 */

import { Fragment, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Table, Flex, Text, Badge } from "@radix-ui/themes";
import ToggleDetailsButton from "@/components/common/ToggleDetailsButton";
import EditStockItemDialog from "./EditStockItemDialog";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import StandardSpecsPanel from "./StandardSpecsPanel";
import { hasPreferredRef } from "./stockItemsTableHelpers";
import { SupplierRefsBadge, SpecsBadgeSection, StockQuantitySection, StockItemRowExpandedSections } from "./StockItemRowSubcomponents";

/**
 * Ligne d'un article de stock
 * Affiche les informations de base et permet d'accéder aux détails (specs, références fournisseurs).
 *
 * @component
 * @param {Object} props
 * Ligne d'un article de stock
 * Affiche les informations de base et permet d'accéder aux détails (specs, références fournisseurs).
 *
 * @component
 * @param {Object} props
 * @param {Object} props.item - Article de stock
 * @param {string} props.item.id - ID unique
 * @param {string} props.item.ref - Référence article
 * @param {string} props.item.name - Nom article
 * @param {string} props.item.family_code - Code famille
 * @param {number} [props.item.quantity] - Quantité en stock
 * @param {string} [props.item.unit] - Unité de mesure
 * @param {number} [props.item.supplierRefsCount] - Nombre de références fournisseurs
 * @param {number} props.colSpan - Nombre de colonnes pour les lignes développées
 * @param {boolean} [props.showStockCol=true] - Afficher colonne stock
 * @param {Object} [props.specsCounts={}] - Compteur de specs par article
 * @param {Object} [props.specsHasDefault={}] - Flag si article a spec par défaut
 * @param {Object} [props.supplierRefsCounts={}] - Compteur de refs par article (fallback legacy)
 * @param {Array} [props.itemRefs=[]] - Références fournisseurs de cet article
 * @param {Function} props.onEditStockItem - Callback édition article
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {Array} [props.suppliers=[]] - Liste des fournisseurs disponibles
 * @param {Array|Object} [props.refs] - Toutes les références (pour retrouver refs par item)
 * @param {Object} [props.formData={}] - État du formulaire d'ajout de ref
 * @param {Function} props.setFormData - Setter du formulaire
 * @param {Function} [props.onAdd] - Callback ajout de ref
 * @param {Function} [props.onUpdatePreferred] - Callback mise à jour préféré
 * @param {Function} [props.onDelete] - Callback suppression de ref
 * @param {Function} [props.onLoadSupplierRefs] - Callback chargement des refs pour un article
 * @param {Array} [props.allManufacturers=[]] - Liste des fabricants disponibles
 * @param {Array} [props.stockFamilies=[]] - Liste des familles de stock
 * @returns {JSX.Element} Ligne de tableau avec sections développables
 *
 * @example
 * <StockItemRow
 *   item={stockItem}
 *   colSpan={7}
 *   showStockCol={true}
 *   specsCounts={specCounts}
 *   itemRefs={refs}
 *   onEditStockItem={handleEdit}
 *   onLoadSupplierRefs={loadRefs}
 *   suppliers={suppliersList}
 * />
 */
function StockItemRow({
  item,
  colSpan,
  showStockCol,
  specsCounts,
  specsHasDefault,
  supplierRefsCounts,
  itemRefs,
  onEditStockItem,
  loading,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  onLoadSupplierRefs,
  allManufacturers = [],
  stockFamilies = [],
}) {
  const [expandedSpecsItemId, setExpandedSpecsItemId] = useState(null);
  const [expandedStockItemId, setExpandedStockItemId] = useState(null);

  // Préférence au champ denormalisé en base, fallback sur l'ancien calcul si présent
  const refCount = item.supplierRefsCount ?? supplierRefsCounts[item.id] ?? 0;
  
  const specsCount = specsCounts[item.id] || 0;
  const hasDefault = specsHasDefault[item.id] || false;

  const specsExpanded = expandedSpecsItemId === item.id;
  const refsExpanded = expandedStockItemId === item.id;

  // Load supplier refs when refs panel is expanded
  useEffect(() => {
    if (refsExpanded && onLoadSupplierRefs) {
      onLoadSupplierRefs(item.id);
    }
  }, [refsExpanded, item.id, onLoadSupplierRefs]);

  const toggleSpecs = () => {
    setExpandedSpecsItemId(specsExpanded ? null : item.id);
    setExpandedStockItemId(null);
  };

  const toggleRefs = () => {
    setExpandedStockItemId(refsExpanded ? null : item.id);
    setExpandedSpecsItemId(null);
  };

  return (
    <Fragment key={item.id}>
      {renderItemRowCells({
        item,
        showStockCol,
        specsCount,
        hasDefault,
        specsExpanded,
        refCount,
        itemRefs,
        refsExpanded,
        onEditStockItem,
        loading,
        toggleSpecs,
        toggleRefs,
        stockFamilies,
        allManufacturers,
      })}
      
      <StockItemRowExpandedSections
        item={item}
        colSpan={colSpan}
        specsExpanded={specsExpanded}
        refsExpanded={refsExpanded}
        suppliers={suppliers}
        refs={itemRefs}
        formData={formData}
        setFormData={setFormData}
        onAdd={onAdd}
        onUpdatePreferred={onUpdatePreferred}
        onDelete={onDelete}
        allManufacturers={allManufacturers}
      />
    </Fragment>
  );
}

/**
 * Rend les cellules de la ligne principale
 * @private
 * @param {Object} params - Paramètres
 * @param {Object} params.item - Article de stock
 * @param {boolean} params.showStockCol - Afficher colonne stock
 * @param {number} params.specsCount - Nombre de specs
 * @param {boolean} params.hasDefault - Has default spec
 * @param {boolean} params.specsExpanded - Specs panel expanded
 * @param {number} params.refCount - Nombre de refs fournisseurs
 * @param {Array} params.itemRefs - Références de cet article
 * @param {boolean} params.refsExpanded - Refs panel expanded
 * @param {Function} params.onEditStockItem - Callback édition
 * @param {boolean} params.loading - État chargement
 * @param {Function} params.toggleSpecs - Toggle specs
 * @param {Function} params.toggleRefs - Toggle refs
 * @param {Array} params.stockFamilies - Familles stock
 * @param {Array} params.allManufacturers - Fabricants
 * @returns {JSX.Element} Ligne de tableau
 */
function renderItemRowCells({
  item,
  showStockCol,
  specsCount,
  hasDefault,
  specsExpanded,
  refCount,
  itemRefs,
  refsExpanded,
  onEditStockItem,
  loading,
  toggleSpecs,
  toggleRefs,
  stockFamilies,
  allManufacturers,
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <Text size="2" weight="bold">{item.ref}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{item.name}</Text>
      </Table.Cell>
      <Table.Cell>
        <Badge variant="soft">{item.family_code}</Badge>
      </Table.Cell>
      {showStockCol && (
        <Table.Cell>
          <StockQuantitySection quantity={item.quantity} unit={item.unit} />
        </Table.Cell>
      )}
      <Table.Cell>
        <SpecsBadgeSection 
          specsCount={specsCount}
          hasDefault={hasDefault}
          isExpanded={specsExpanded}
          onToggle={toggleSpecs}
          itemName={item.name}
        />
      </Table.Cell>
      <Table.Cell>
        <Flex align="center" gap="2">
          <SupplierRefsBadge 
            refCount={refCount} 
            hasPreferred={hasPreferredRef(itemRefs)} 
          />
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Flex gap="1">
          <EditStockItemDialog item={item} onSave={onEditStockItem} loading={loading} stockFamilies={stockFamilies} allManufacturers={allManufacturers} />
          <ToggleDetailsButton
            isExpanded={refsExpanded}
            onToggle={toggleRefs}
            label={refsExpanded ? `Masquer les références fournisseurs de ${item.name}` : `Afficher les références fournisseurs de ${item.name}`}
          />
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

StockItemRow.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ref: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    family_code: PropTypes.string,
    quantity: PropTypes.number,
    unit: PropTypes.string,
    supplierRefsCount: PropTypes.number,
  }).isRequired,
  colSpan: PropTypes.number.isRequired,
  showStockCol: PropTypes.bool,
  specsCounts: PropTypes.object,
  specsHasDefault: PropTypes.object,
  supplierRefsCounts: PropTypes.object,
  itemRefs: PropTypes.array,
  onEditStockItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  suppliers: PropTypes.array,
  refs: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdatePreferred: PropTypes.func,
  onDelete: PropTypes.func,
  onLoadSupplierRefs: PropTypes.func,
  allManufacturers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  stockFamilies: PropTypes.array,
};

export default StockItemRow;
