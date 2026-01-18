/**
 * @fileoverview Comparatif des offres pour les avertissements
 * @module components/purchase/orders/TwinLinesValidationAlert/OffersComparison
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import { BarChart3, Check, Circle, Clock, Euro } from 'lucide-react';
import LineDetails from './LineDetails';
import OrderLink from './OrderLink';
import { extractOrderInfo, getSelectionBadgeColor, getQuoteBadgeColor } from './helpers';

/**
 * Comparatif des offres pour les avertissements
 * @component
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 */
export default function OffersComparison({ currentLine, twinLines }) {
  if (twinLines.length === 0) return null;
  
  return (
    <Box mt="3">
      <Flex align="center" gap="2" mb="2">
        <BarChart3 size={14} />
        <Text size="1" weight="bold">
          Comparatif des offres ({twinLines.length + 1} fournisseur(s)) :
        </Text>
      </Flex>
      
      {currentLine && <LineDetails line={currentLine} isCurrent={true} />}
      
      {twinLines.map((twin) => {
        const { supplier, orderId, orderNumber } = extractOrderInfo(twin.supplier_order_id);
        
        return (
          <Flex key={twin.id} align="center" gap="2" mt="2" wrap="wrap">
            <Badge 
              color={getSelectionBadgeColor(twin.is_selected)} 
              size="1"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {twin.is_selected ? <Check size={12} /> : <Circle size={12} />}
              {twin.is_selected ? 'Sélectionnée' : 'À évaluer'}
            </Badge>
            <Badge 
              color={getQuoteBadgeColor(twin.quote_received)} 
              size="1"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {twin.quote_received ? <Check size={12} /> : <Clock size={12} />}
              {twin.quote_received ? 'Devis reçu' : 'Devis en attente'}
            </Badge>
            <Text size="1" weight="medium">{supplier}</Text>
            <OrderLink orderId={orderId} orderNumber={orderNumber} />
            {twin.quote_price ? (
              <Flex align="center" gap="1">
                <Euro size={12} />
                <Text size="1" weight="bold" color="green">
                  {parseFloat(twin.quote_price).toFixed(2)} €
                </Text>
              </Flex>
            ) : (
              <Text size="1" color="gray">Prix non renseigné</Text>
            )}
          </Flex>
        );
      })}
    </Box>
  );
}

OffersComparison.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
};
