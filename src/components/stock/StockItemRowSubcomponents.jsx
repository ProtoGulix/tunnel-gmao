import PropTypes from "prop-types";
import { Flex, Text, Badge, Button } from "@radix-ui/themes";
import { Package, CheckCircle, FileText, AlertCircle, Star } from "lucide-react";
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
