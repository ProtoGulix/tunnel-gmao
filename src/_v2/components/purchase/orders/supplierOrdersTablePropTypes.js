/**
 * @fileoverview PropTypes pour SupplierOrdersTable
 *
 * @module components/purchase/orders/supplierOrdersTablePropTypes
 * @requires prop-types
 */

import PropTypes from 'prop-types';

/**
 * Shape d'un panier fournisseur (format normalisé)
 */
export const orderShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.string.isRequired,
  orderNumber: PropTypes.string,
  createdAt: PropTypes.string,
  lineCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  urgencyLevel: PropTypes.string,
  supplier: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    code: PropTypes.string,
    contact_name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
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
