/**
 * @fileoverview Lien vers une commande fournisseur
 * @module components/purchase/orders/TwinLinesValidationAlert/OrderLink
 */

import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Lien vers une commande fournisseur
 * @component
 * @param {Object} props
 * @param {string} props.orderId - ID de la commande
 * @param {string} props.orderNumber - Numéro de commande
 */
export default function OrderLink({ orderId, orderNumber }) {
  return (
    <Link 
      to={`/purchase/orders/${orderId}`}
      style={{ textDecoration: 'none' }}
    >
      <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer' }}>
        {orderNumber} <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '2px' }} />
      </Badge>
    </Link>
  );
}

OrderLink.propTypes = {
  orderId: PropTypes.string.isRequired,
  orderNumber: PropTypes.string.isRequired,
};
