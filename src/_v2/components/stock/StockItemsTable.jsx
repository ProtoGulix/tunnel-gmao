import { Fragment, useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Table, Flex, Card, Badge } from "@radix-ui/themes";
import { ChevronUp, ChevronDown, Package } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import ToggleDetailsButton from "@/components/common/ToggleDetailsButton";
import EditStockItemDialog from "./EditStockItemDialog";
import {
  StockItemRowExpandedSections,
  SupplierRefsBadge,
  SpecsBadgeSection,
  StockQuantitySection,
} from "./StockItemRowSubcomponents";
import { getColSpan, getItemRefsFromData, sortItemsByColumn, hasPreferredRef } from "./stockItemsTableHelpers";

function SortableHeader({ column, label, sortConfig, onSort }) {
  const isActive = sortConfig.column === column;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <Flex
      align="center"
      gap="1"
      onClick={() => onSort(column)}
      style={{ cursor: "pointer", userSelect: "none" }}
      role="button"
      aria-pressed={isActive}
    >
      {label}
      {isActive && (direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
    </Flex>
  );
}

SortableHeader.propTypes = {
  column: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  sortConfig: PropTypes.shape({
    column: PropTypes.string,
    direction: PropTypes.string,
  }).isRequired,
  onSort: PropTypes.func.isRequired,
};

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
  onLoadSupplierRefs,
  loading,
  showStockCol = true,
  allManufacturers = [],
  stockFamilies = [],
}) {
  const [sortConfig, setSortConfig] = useState({ column: null, direction: "asc" });
  const [expandedSpecsId, setExpandedSpecsId] = useState(null);
  const [expandedRefsId, setExpandedRefsId] = useState(null);

  const handleSort = useCallback((column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const getItemRefs = useCallback((itemId) => getItemRefsFromData(itemId, refs), [refs]);

  const sortedItems = useMemo(
    () => sortItemsByColumn(items, sortConfig.column, sortConfig.direction),
    [items, sortConfig]
  );

  const columns = useMemo(() => {
    const headers = [
      { key: "ref", header: <SortableHeader column="ref" label="Référence" sortConfig={sortConfig} onSort={handleSort} /> },
      { key: "name", header: <SortableHeader column="name" label="Nom" sortConfig={sortConfig} onSort={handleSort} /> },
      { key: "family", header: <SortableHeader column="family" label="Famille" sortConfig={sortConfig} onSort={handleSort} /> },
    ];

    if (showStockCol) {
      headers.push({ key: "stock", header: <SortableHeader column="stock" label="Stock" sortConfig={sortConfig} onSort={handleSort} /> });
    }

    headers.push(
      { key: "specs", header: "Spécs" },
      { key: "refs", header: "Références" },
      { key: "actions", header: "" }
    );

    return headers;
  }, [handleSort, showStockCol, sortConfig]);

  const colSpan = useMemo(() => getColSpan(showStockCol), [showStockCol]);

  const rowRenderer = useCallback(
    (item) => {
      const specsCount = specsCounts[item.id] || 0;
      const hasDefault = specsHasDefault[item.id] || false;
      const refCount = item.supplierRefsCount ?? supplierRefsCounts[item.id] ?? 0;
      const itemRefs = getItemRefs(item.id);
      const specsExpanded = expandedSpecsId === item.id;
      const refsExpanded = expandedRefsId === item.id;

      return (
        <Fragment key={item.id}>
          <Table.Row>
            <Table.Cell>
              <Badge size="2" color="gray" variant="soft">{item.ref}</Badge>
            </Table.Cell>
            <Table.Cell>
              <span>{item.name}</span>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="soft" size="1">{item.family_code}</Badge>
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
                onToggle={() => {
                  setExpandedSpecsId(specsExpanded ? null : item.id);
                  setExpandedRefsId(null);
                }}
                itemName={item.name}
              />
            </Table.Cell>
            <Table.Cell>
              <SupplierRefsBadge refCount={refCount} hasPreferred={hasPreferredRef(itemRefs)} />
            </Table.Cell>
            <Table.Cell>
              <Flex gap="1">
                <EditStockItemDialog
                  item={item}
                  onSave={onEditStockItem}
                  loading={loading}
                  stockFamilies={stockFamilies}
                  allManufacturers={allManufacturers}
                />
                <ToggleDetailsButton
                  isExpanded={refsExpanded}
                  onToggle={() => {
                    const next = refsExpanded ? null : item.id;
                    setExpandedRefsId(next);
                    setExpandedSpecsId(null);
                    if (next && onLoadSupplierRefs) {
                      onLoadSupplierRefs(item.id);
                    }
                  }}
                  label={refsExpanded ? `Masquer les références fournisseurs de ${item.name}` : `Afficher les références fournisseurs de ${item.name}`}
                />
              </Flex>
            </Table.Cell>
          </Table.Row>

          {(specsExpanded || refsExpanded) && (
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
              onUpdatePreferred={(refId, updates) => onUpdatePreferred?.(refId, updates, item.id)}
              onDelete={(refId) => onDelete?.(refId, item.id)}
              allManufacturers={allManufacturers}
            />
          )}
        </Fragment>
      );
    },
    [allManufacturers, colSpan, expandedRefsId, expandedSpecsId, formData, getItemRefs, loading, onAdd, onDelete, onEditStockItem, onLoadSupplierRefs, onUpdatePreferred, setFormData, showStockCol, specsCounts, specsHasDefault, supplierRefsCounts, suppliers]
  );

  return (
      <Flex direction="column" gap="3">
        <DataTable
          columns={columns}
          data={sortedItems}
          rowRenderer={rowRenderer}
          size={compactRows ? "1" : "2"}
          loading={loading}
          emptyState={{
            icon: Package,
            title: "Aucun article de stock",
            description: "Ajoutez un article ou ajustez vos filtres pour afficher des résultats.",
          }}
        />
      </Flex>
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
  onLoadSupplierRefs: PropTypes.func,
  loading: PropTypes.bool,
  showStockCol: PropTypes.bool,
  allManufacturers: PropTypes.array,
  stockFamilies: PropTypes.array,
};
