import PropTypes from 'prop-types';

export const orderShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  order_number: PropTypes.string,
  orderNumber: PropTypes.string,
  status: PropTypes.string.isRequired,
  created_at: PropTypes.string,
  createdAt: PropTypes.string,
  ordered_at: PropTypes.string,
  orderedAt: PropTypes.string,
  received_at: PropTypes.string,
  receivedAt: PropTypes.string,
  total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  currency: PropTypes.string,
  line_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lineCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  supplier_id: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  supplier: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
});

export const supplierOrdersTablePropTypes = {
  orders: PropTypes.arrayOf(orderShape).isRequired,
  onRefresh: PropTypes.func.isRequired,
  showHeader: PropTypes.bool,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  statusFilter: PropTypes.string,
  onStatusFilterChange: PropTypes.func,
  supplierFilter: PropTypes.string,
  onSupplierFilterChange: PropTypes.func,
  supplierOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
};
