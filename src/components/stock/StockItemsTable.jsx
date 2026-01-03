import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Table, Flex, Card } from "@radix-ui/themes";
import { ChevronUp, ChevronDown } from "lucide-react";
import StockItemRow from "./StockItemRow";
import { getColSpan, getItemRefsFromData, sortItemsByColumn } from "./stockItemsTableHelpers";

/**
 * Table d'affichage des articles du stock avec expansion inline
 * Affiche référence, nom, famille, stock, spécifications et références fournisseurs
 * 
 * ✅ Implémenté :
 * - Tri cliquable sur 4 colonnes (référence, nom, famille, stock) avec chevrons
 * - Expansion inline exclusive (specs OU refs)
 * - Mode compact optionnel
 * - Sticky header pour navigation fluide
 * 
 * TODO: Améliorations futures possibles :
 * - Virtualisation (react-window/react-virtual) si >100 items pour performances
 * - Filtres inline par famille/stock/spécs avec chips
 * - Pagination si dataset très large (>500 items)
 * - Sélection multiple avec checkboxes pour actions en batch
 * - Export CSV/Excel des données affichées
 * - Recherche globale dans la table
 * - Mémorisation du tri dans localStorage
 */
export default function StockItemsTable({
  items,
  compactRows,
  specsCounts = {},
  specsHasDefault = {},
  supplierRefsCounts = {},
  onEditStockItem,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  loading,
  showStockCol = true,
}) {
  // État pour le tri des colonnes
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });

  // Mémoïser le calcul du colspan pour éviter recalculs inutiles
  const colSpan = useMemo(() => getColSpan(showStockCol), [showStockCol]);

  // Mémoïser les références des items pour éviter recalculs inutiles
  const getItemRefs = useCallback((itemId) => {
    return getItemRefsFromData(itemId, refs);
  }, [refs]);

  // Fonction de tri des colonnes
  const handleSort = useCallback((column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // Trier les items selon la configuration de tri
  const sortedItems = useMemo(() => {
    return sortItemsByColumn(items, sortConfig.column, sortConfig.direction);
  }, [items, sortConfig]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        {renderStockTable({
          sortConfig,
          handleSort,
          showStockCol,
          sortedItems,
          colSpan,
          specsCounts,
          specsHasDefault,
          supplierRefsCounts,
          getItemRefs,
          onEditStockItem,
          loading,
          suppliers,
          refs,
          formData,
          setFormData,
          onAdd,
          onUpdatePreferred,
          onDelete,
          compactRows,
        })}
      </Flex>
    </Card>
  );
}

/**
 * Render a sortable table header cell
 */
function SortableHeaderCell({ column, label, sortConfig, handleSort }) {
  return (
    <Table.ColumnHeaderCell
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => handleSort(column)}
    >
      <Flex align="center" gap="1">
        {label}
        {sortConfig.column === column && (
          sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </Flex>
    </Table.ColumnHeaderCell>
  );
}

SortableHeaderCell.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortConfig: PropTypes.shape({
    column: PropTypes.string,
    direction: PropTypes.string,
  }).isRequired,
  handleSort: PropTypes.func.isRequired,
};

/**
 * Render the stock items table with headers and body
 */
function renderStockTable({
  sortConfig,
  handleSort,
  showStockCol,
  sortedItems,
  colSpan,
  specsCounts,
  specsHasDefault,
  supplierRefsCounts,
  getItemRefs,
  onEditStockItem,
  loading,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  compactRows,
}) {
  return (
    <Table.Root size={compactRows ? "1" : "2"}>
      <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
        <Table.Row>
          <SortableHeaderCell column="ref" label="Référence" sortConfig={sortConfig} handleSort={handleSort} />
          <SortableHeaderCell column="name" label="Nom" sortConfig={sortConfig} handleSort={handleSort} />
          <SortableHeaderCell column="family" label="Famille" sortConfig={sortConfig} handleSort={handleSort} />
          {showStockCol && (
            <SortableHeaderCell column="stock" label="Stock" sortConfig={sortConfig} handleSort={handleSort} />
          )}
          <Table.ColumnHeaderCell>Spécs</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Références</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedItems.map((item) => (
          <StockItemRow
            key={item.id}
            item={item}
            colSpan={colSpan}
            showStockCol={showStockCol}
            specsCounts={specsCounts}
            specsHasDefault={specsHasDefault}
            supplierRefsCounts={supplierRefsCounts}
            itemRefs={getItemRefs(item.id)}
            onEditStockItem={onEditStockItem}
            loading={loading}
            suppliers={suppliers}
            refs={refs}
            formData={formData}
            setFormData={setFormData}
            onAdd={onAdd}
            onUpdatePreferred={(refId, updates) => onUpdatePreferred(refId, updates, item.id)}
            onDelete={(refId) => onDelete(refId, item.id)}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}

StockItemsTable.propTypes = {
  items: PropTypes.array.isRequired,
  compactRows: PropTypes.bool,
  specsCounts: PropTypes.object,
  specsHasDefault: PropTypes.object,
  supplierRefsCounts: PropTypes.object,
  onEditStockItem: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  refs: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdatePreferred: PropTypes.func,
  onDelete: PropTypes.func,
  loading: PropTypes.bool,
  showStockCol: PropTypes.bool,
};
