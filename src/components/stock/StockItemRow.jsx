import { Fragment, useState } from "react";
import PropTypes from "prop-types";
import { Table, Flex, Text, Badge } from "@radix-ui/themes";
import ToggleDetailsButton from "@/components/common/ToggleDetailsButton";
import EditStockItemDialog from "./EditStockItemDialog";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import StandardSpecsPanel from "./StandardSpecsPanel";
import SupplierRefsInlinePanel from "./SupplierRefsInlinePanel";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";
import { hasPreferredRef } from "./stockItemsTableHelpers";
import { SupplierRefsBadge, SpecsBadgeSection, StockQuantitySection } from "./StockItemRowSubcomponents";

/**
 * Single stock item row component
 * Handles rendering a stock item with specs and supplier references panels
 * 
 * Props:
 * @param {Object} item - Stock item data
 * @param {number} colSpan - Number of columns for expanded rows
 * @param {boolean} showStockCol - Whether to show stock quantity column
 * @param {Object} specsCounts - Pre-calculated specs count per item
 * @param {Object} specsHasDefault - Pre-calculated default specs flag per item
 * @param {Object} supplierRefsCounts - Pre-calculated supplier refs count per item
 * @param {Array} itemRefs - Supplier references for this item
 * @param {Function} onEditStockItem - Callback when item is edited
 * @param {boolean} loading - Loading state
 * @param {Array} suppliers - Available suppliers list
 * @param {any} refs - All references data
 * @param {Object} formData - Form data for adding refs
 * @param {Function} setFormData - Setter for form data
 * @param {Function} onAdd - Callback when adding ref
 * @param {Function} onUpdatePreferred - Callback when updating preferred
 * @param {Function} onDelete - Callback when deleting ref
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
}) {
  const [expandedSpecsItemId, setExpandedSpecsItemId] = useState(null);
  const [expandedStockItemId, setExpandedStockItemId] = useState(null);

  const refCount = supplierRefsCounts[item.id] || 0;
  const specsCount = specsCounts[item.id] || 0;
  const hasDefault = specsHasDefault[item.id] || false;

  const specsExpanded = expandedSpecsItemId === item.id;
  const refsExpanded = expandedStockItemId === item.id;

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
      })}
      
      {renderExpandedSections({
        item,
        colSpan,
        specsExpanded,
        refsExpanded,
        suppliers,
        refs: itemRefs,
        formData,
        setFormData,
        onAdd,
        onUpdatePreferred,
        onDelete,
      })}
    </Fragment>
  );
}

/**
 * Render the main table row cells
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
}) {
  return (
    <Table.Row>
      <Table.Cell>
        <Text size="2" weight="bold">{item.ref}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{item.name}</Text>
        <ManufacturerBadge
          name={item?.manufacturer_item_id?.manufacturer_name}
          reference={item?.manufacturer_item_id?.manufacturer_ref}
          designation={item?.manufacturer_item_id?.designation}
        />
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
          <EditStockItemDialog item={item} onSave={onEditStockItem} loading={loading} />
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

/**
 * Render the expanded details sections
 */
function renderExpandedSections({
  item,
  colSpan,
  specsExpanded,
  refsExpanded,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
}) {
  return (
    <>
      {specsExpanded && (
        <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
          <StandardSpecsPanel stockItemId={item.id} stockItemName={item.name} />
        </ExpandableDetailsRow>
      )}
      {refsExpanded && (
        <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
          <SupplierRefsInlinePanel
            stockItem={item}
            suppliers={suppliers}
            refs={refs}
            formData={formData}
            setFormData={setFormData}
            onAdd={onAdd}
            onUpdatePreferred={onUpdatePreferred}
            onDelete={onDelete}
          />
        </ExpandableDetailsRow>
      )}
    </>
  );
}

StockItemRow.propTypes = {
  item: PropTypes.object.isRequired,
  colSpan: PropTypes.number.isRequired,
  showStockCol: PropTypes.bool,
  specsCounts: PropTypes.object,
  specsHasDefault: PropTypes.object,
  supplierRefsCounts: PropTypes.object,
  itemRefs: PropTypes.array,
  onEditStockItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  suppliers: PropTypes.array,
  refs: PropTypes.any,
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdatePreferred: PropTypes.func,
  onDelete: PropTypes.func,
};

export default StockItemRow;
