import PropTypes from "prop-types";
import { Flex, Text, Badge, Button } from "@radix-ui/themes";
import { Package, CheckCircle, FileText, AlertCircle, Star } from "lucide-react";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import StandardSpecsPanel from "@/components/stock/StandardSpecsPanel";
import SupplierRefsInlinePanel from "@/components/purchase/suppliers/SupplierRefsInlinePanel";
import {
  getRefCountBadgeColor,
  getRefCountBadgeVariant,
  getSpecCountBadgeColor,
} from "./stockItemsTableHelpers";

/**
 * Supplier references badge component
 * Shows count, preferred star if present, or empty state
 */
export function SupplierRefsBadge({ refCount, hasPreferred }) {
  if (refCount === 0) {
    return (
      <Flex align="center" gap="1" title="Aucune référence fournisseur">
        <AlertCircle size={16} color="var(--amber-9)" />
        <Badge color="amber" variant="soft">0</Badge>
      </Flex>
    );
  }

  return (
    <Flex align="center" gap="1">
      {hasPreferred && (
        <Star size={14} color="var(--amber-9)" fill="var(--amber-9)" title="Référence préférée définie" />
      )}
      <Badge color={getRefCountBadgeColor(refCount)} variant={getRefCountBadgeVariant(refCount)}>
        {refCount}
      </Badge>
    </Flex>
  );
}

SupplierRefsBadge.propTypes = {
  refCount: PropTypes.number.isRequired,
  hasPreferred: PropTypes.bool.isRequired,
};

/**
 * Specs badge section component
 * Shows button to expand and badge with spec count
 */
export function SpecsBadgeSection({ specsCount, hasDefault, isExpanded, onToggle, itemName }) {
  return (
    <Flex align="center" gap="2">
      <Button
        size="1"
        variant="soft"
        color={isExpanded ? "blue" : "gray"}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? `Masquer les spécifications de ${itemName}` : `Afficher les spécifications de ${itemName}`}
      >
        <FileText size={14} />
      </Button>
      <Badge color={getSpecCountBadgeColor(specsCount)} variant="outline" size="1">
        {specsCount}
      </Badge>
      {hasDefault && (
        <CheckCircle size={14} color="var(--green-9)" />
      )}
    </Flex>
  );
}

SpecsBadgeSection.propTypes = {
  specsCount: PropTypes.number.isRequired,
  hasDefault: PropTypes.bool.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  itemName: PropTypes.string.isRequired,
};

/**
 * Stock quantity section component
 * Shows quantity, unit badge
 */
export function StockQuantitySection({ quantity, unit }) {
  return (
    <Flex align="center" gap="2">
      <Package size={14} color="var(--gray-9)" />
      <Text weight="bold">{quantity || 0}</Text>
      <Badge color="gray" variant="soft" size="1">{unit || "pcs"}</Badge>
    </Flex>
  );
}

StockQuantitySection.propTypes = {
  quantity: PropTypes.number,
  unit: PropTypes.string,
};

/**
 * Sections développables pour specs et références fournisseurs
 * Affiche les panneaux détaillés d'un article quand ils sont ouverts.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.item - Article de stock
 * @param {string} props.item.id - ID article
 * @param {string} props.item.name - Nom article
 * @param {number} props.colSpan - Nombre de colonnes
 * @param {boolean} props.specsExpanded - Specs panel open
 * @param {boolean} props.refsExpanded - Refs panel open
 * @param {Array} props.suppliers - Liste des fournisseurs
 * @param {Array} props.refs - Références fournisseurs
 * @param {Object} props.formData - Données formulaire
 * @param {Function} props.setFormData - Setter formulaire
 * @param {Function} props.onAdd - Callback ajout ref
 * @param {Function} props.onUpdatePreferred - Callback update préféré
 * @param {Function} props.onDelete - Callback suppression ref
 * @param {Array} [props.allManufacturers=[]] - Fabricants disponibles
 * @returns {JSX.Element} Sections développables
 *
 * @example
 * <StockItemRowExpandedSections
 *   item={stockItem}
 *   colSpan={7}
 *   specsExpanded={true}
 *   refsExpanded={false}
 *   suppliers={suppliersList}
 *   refs={itemRefs}
 *   formData={formData}
 *   setFormData={setFormData}
 *   onAdd={handleAdd}
 * />
 */
export function StockItemRowExpandedSections({
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
  allManufacturers = [],
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
            allManufacturers={allManufacturers}
          />
        </ExpandableDetailsRow>
      )}
    </>
  );
}

StockItemRowExpandedSections.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  colSpan: PropTypes.number.isRequired,
  specsExpanded: PropTypes.bool.isRequired,
  refsExpanded: PropTypes.bool.isRequired,
  suppliers: PropTypes.array,
  refs: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  formData: PropTypes.object,
  setFormData: PropTypes.func,
  onAdd: PropTypes.func,
  onUpdatePreferred: PropTypes.func,
  onDelete: PropTypes.func,
  allManufacturers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
    })
  ),
};
