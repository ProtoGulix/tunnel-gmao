/**
 * @fileoverview PropTypes pour SupplierOrdersTable
 *
 * @module components/purchase/orders/supplierOrdersTablePropTypes
 * @requires prop-types
 */

import PropTypes from 'prop-types';

/**
 * Shape d'un panier fournisseur
 * Support snake_case (backend) et camelCase (normalisé)
 */
export const orderShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.string.isRequired,
  order_number: PropTypes.string,
  created_at: PropTypes.string,
  line_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  urgencyLevel: PropTypes.string,
  supplier_id: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
});

/**
 * PropTypes du composant SupplierOrdersTable
 * @see {@link file://./SupplierOrdersTable.jsx}
 */
export const supplierOrdersTablePropTypes = {
  // Required
  orders: PropTypes.arrayOf(orderShape).isRequired,
  onRefresh: PropTypes.func.isRequired,

  // Callbacks
  onOrderLineUpdate: PropTypes.func,
  onToggleItemSelection: PropTypes.func,
  onTwinValidationUpdate: PropTypes.func,
  onBasketStatusChange: PropTypes.func,

  // State
  itemSelectionByBasket: PropTypes.object,
  twinValidationsByLine: PropTypes.object,

  // Flags
  showPoolingColumns: PropTypes.bool,
  canModifyItem: PropTypes.func,
};
