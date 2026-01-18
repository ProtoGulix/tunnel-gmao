/**
 * @fileoverview Solutions pour débloquer les erreurs de validation
 * @module components/purchase/orders/TwinLinesValidationAlert/ErrorSolutions
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import { Lightbulb, RefreshCw, CheckSquare } from 'lucide-react';
import { extractOrderInfo } from './helpers';

/**
 * Section des solutions proposées pour débloquer les erreurs
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.linesWithWrongStatus - Lignes avec statut incorrect
 * @param {boolean} props.hasMultipleSelected - Si plusieurs lignes sont sélectionnées
 * @param {number} props.selectedCount - Nombre de lignes sélectionnées
 */
export default function ErrorSolutions({ linesWithWrongStatus, hasMultipleSelected, selectedCount }) {
  return (
    <Box mt="3" p="2" style={{ backgroundColor: 'var(--red-3)', borderRadius: '6px' }}>
      <Flex align="center" gap="2" mb="2">
        <Lightbulb size={16} />
        <Text weight="bold" size="2">Solutions pour débloquer :</Text>
      </Flex>
      
      {linesWithWrongStatus.length > 0 && (
        <Box mb="2">
          <Flex align="center" gap="2" mb="1">
            <RefreshCw size={14} />
            <Text size="2" weight="medium">
              Statut incorrect ({linesWithWrongStatus.length} ligne(s)) :
            </Text>
          </Flex>
          <Text size="1" as="div" color="gray" mb="1">
            → Ces lignes doivent être en statut &quot;SENT&quot; (demande de devis envoyée)
          </Text>
          {linesWithWrongStatus.map(l => {
            const { status, supplier } = extractOrderInfo(l.supplier_order_id);
            return (
              <Text key={l.id} size="1" as="div" ml="3" color="gray">
                • {supplier} : statut actuel = <Badge color="orange" size="1">{status}</Badge>
              </Text>
            );
          })}
        </Box>
      )}
      
      {hasMultipleSelected && (
        <Box mb="2">
          <Flex align="center" gap="2" mb="1">
            <CheckSquare size={14} />
            <Text size="2" weight="medium">
              Trop de lignes sélectionnées ({selectedCount}) :
            </Text>
          </Flex>
          <Text size="1" as="div" color="gray" mb="1">
            → Désélectionnez toutes les lignes sauf la meilleure offre
          </Text>
          <Text size="1" as="div" color="gray" mb="1">
            → Comparez les prix et délais avant de choisir
          </Text>
        </Box>
      )}
      
      {!hasMultipleSelected && linesWithWrongStatus.length === 0 && (
        <Text size="1" as="div" color="gray">
          → Vérifiez que toutes les lignes jumelles respectent les règles ci-dessus
        </Text>
      )}
    </Box>
  );
}

ErrorSolutions.propTypes = {
  linesWithWrongStatus: PropTypes.arrayOf(PropTypes.object).isRequired,
  hasMultipleSelected: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
};
