/**
 * @fileoverview Recommandations pour les avertissements
 * @module components/purchase/orders/TwinLinesValidationAlert/WarningRecommendations
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { FileText, Clock, CheckSquare, Check } from 'lucide-react';
import { extractOrderInfo } from './helpers';

/**
 * Section des recommandations pour les avertissements
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.linesWithoutQuote - Lignes sans devis
 * @param {number} props.selectedCount - Nombre de lignes sélectionnées
 */
export default function WarningRecommendations({ linesWithoutQuote, selectedCount }) {
  return (
    <Box mt="3" p="2" style={{ backgroundColor: 'var(--amber-3)', borderRadius: '6px' }}>
      <Flex align="center" gap="2" mb="2">
        <FileText size={16} />
        <Text weight="bold" size="2">Recommandations :</Text>
      </Flex>
      
      {linesWithoutQuote.length > 0 && (
        <Box mb="2">
          <Flex align="center" gap="2" mb="1">
            <Clock size={14} />
            <Text size="2" weight="medium">
              En attente de devis ({linesWithoutQuote.length} fournisseur(s)) :
            </Text>
          </Flex>
          {linesWithoutQuote.map(l => {
            const { supplier } = extractOrderInfo(l.supplier_order_id);
            return (
              <Text key={l.id} size="1" as="div" ml="3" color="gray">
                • {supplier} : en attente de réponse
              </Text>
            );
          })}
          <Text size="1" as="div" color="gray" mt="1" ml="3">
            → Relancez les fournisseurs si nécessaire
          </Text>
        </Box>
      )}
      
      {selectedCount === 0 && (
        <Box mb="2">
          <Flex align="center" gap="2" mb="1">
            <CheckSquare size={14} />
            <Text size="2" weight="medium">
              Aucune ligne sélectionnée :
            </Text>
          </Flex>
          <Text size="1" as="div" color="gray" ml="3" mb="1">
            → Comparez les prix, délais et qualité des fournisseurs
          </Text>
          <Text size="1" as="div" color="gray" ml="3">
            → Sélectionnez la meilleure offre avant de commander
          </Text>
        </Box>
      )}
      
      {selectedCount === 1 && linesWithoutQuote.length === 0 && (
        <Box>
          <Flex align="center" gap="2" mb="1">
            <Check size={14} />
            <Text size="2" weight="medium" color="green">
              Tout est prêt pour la commande
            </Text>
          </Flex>
          <Text size="1" as="div" color="gray" ml="3">
            → Vous pouvez passer au statut ORDERED
          </Text>
        </Box>
      )}
    </Box>
  );
}

WarningRecommendations.propTypes = {
  linesWithoutQuote: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedCount: PropTypes.number.isRequired,
};
