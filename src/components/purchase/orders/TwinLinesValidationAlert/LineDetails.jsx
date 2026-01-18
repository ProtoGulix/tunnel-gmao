/**
 * @fileoverview Détails d'une ligne de commande
 * @module components/purchase/orders/TwinLinesValidationAlert/LineDetails
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import LineBadges from './LineBadges';
import { extractOrderInfo } from './helpers';

/**
 * Affiche une ligne de commande dans la liste comparative
 * @component
 * @param {Object} props
 * @param {Object} props.line - Ligne de commande
 * @param {boolean} [props.isCurrent] - Si c'est la ligne actuelle
 */
export default function LineDetails({ line, isCurrent }) {
  const { status, supplier } = extractOrderInfo(line.supplier_order_id);
  
  const containerStyle = isCurrent ? {
    backgroundColor: 'var(--blue-3)',
    borderRadius: '4px',
    padding: '8px',
    marginBottom: '8px'
  } : {};
  
  return (
    <Box style={containerStyle}>
      {isCurrent && (
        <Text size="1" weight="bold" as="div" mb="1" color="blue">Ligne actuelle :</Text>
      )}
      <Flex align="center" gap="2" wrap="wrap">
        <LineBadges 
          isSelected={line.is_selected} 
          quoteReceived={line.quote_received}
          status={status}
        />
        <Text size="1" weight="medium">{supplier}</Text>
        {line.quote_price && (
          <Text size="1" weight="bold" color="green">
            {parseFloat(line.quote_price).toFixed(2)} €
          </Text>
        )}
      </Flex>
    </Box>
  );
}

LineDetails.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_selected: PropTypes.bool,
    quote_received: PropTypes.bool,
    quote_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_order_id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        status: PropTypes.string,
        order_number: PropTypes.string,
        supplier_id: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.object
        ])
      })
    ]).isRequired,
  }).isRequired,
  isCurrent: PropTypes.bool,
};

LineDetails.defaultProps = {
  isCurrent: false,
};
