/**
 * @fileoverview Liste comparative des lignes jumelles
 * @module components/purchase/orders/TwinLinesValidationAlert/TwinLinesList
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import LineDetails from './LineDetails';
import LineBadges from './LineBadges';
import OrderLink from './OrderLink';
import { extractOrderInfo } from './helpers';

/**
 * Liste comparative des lignes jumelles pour les erreurs
 * @component
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 */
export default function TwinLinesList({ currentLine, twinLines }) {
  if (twinLines.length === 0) return null;
  
  return (
    <Box mt="3">
      <Flex align="center" gap="2" mb="2">
        <ClipboardList size={14} />
        <Text size="1" weight="bold">
          Lignes jumelles détectées ({twinLines.length + 1} fournisseur(s) au total) :
        </Text>
      </Flex>
      
      {currentLine && <LineDetails line={currentLine} isCurrent={true} />}
      
      {twinLines.map((twin) => (
        <Flex key={twin.id} align="center" gap="2" mt="2" wrap="wrap">
          <LineBadges 
            isSelected={twin.is_selected}
            quoteReceived={twin.quote_received}
            status={extractOrderInfo(twin.supplier_order_id).status}
          />
          <Text size="1" weight="medium">{extractOrderInfo(twin.supplier_order_id).supplier}</Text>
          <OrderLink 
            orderId={extractOrderInfo(twin.supplier_order_id).orderId}
            orderNumber={extractOrderInfo(twin.supplier_order_id).orderNumber}
          />
          {twin.quote_price && (
            <Text size="1" weight="bold" color="green">
              {parseFloat(twin.quote_price).toFixed(2)} €
            </Text>
          )}
        </Flex>
      ))}
    </Box>
  );
}

TwinLinesList.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};
