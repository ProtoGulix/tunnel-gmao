/**
 * @fileoverview Section d'erreur de validation
 * @module components/purchase/orders/TwinLinesValidationAlert/ErrorSection
 */

import PropTypes from 'prop-types';
import { Callout, Box, Flex, Text } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import ArticleInfo from './ArticleInfo';
import ErrorSolutions from './ErrorSolutions';
import TwinLinesList from './TwinLinesList';
import { extractOrderInfo, extractStockItemInfo } from './helpers';

/**
 * Section d'erreur de validation
 * @component
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 * @param {Array<string>} props.validationErrors - Erreurs de validation
 */
export default function ErrorSection({ currentLine, twinLines, validationErrors, currentOrderId, onToggleLineSelection }) {
  const allLines = currentLine ? [currentLine, ...twinLines] : twinLines;
  const linesWithWrongStatus = allLines.filter(l => {
    const { status } = extractOrderInfo(l.supplier_order_id);
    return status !== 'SENT';
  });
  const selectedCount = allLines.filter(l => l.is_selected === true).length;
  const hasMultipleSelected = selectedCount > 1;
  
  const { name: articleName, ref: articleRef } = extractStockItemInfo(currentLine);
  
  return (
    <Callout.Root color="red" size="2" mb="3">
      <Callout.Icon>
        <AlertTriangle size={18} />
      </Callout.Icon>
      <Callout.Text asChild>
        <div>
          <Flex align="center" gap="2" mb="2">
            <AlertTriangle size={18} />
            <Text as="div" weight="bold" size="2">
              Validation des jumelles échouée - Action requise
            </Text>
          </Flex>
          
          <ArticleInfo name={articleName} ref={articleRef} />
          
          {validationErrors.map((error, idx) => (
            <Text key={idx} size="2" as="div" mb="1" color="red" weight="medium">• {error}</Text>
          ))}
          
          <ErrorSolutions 
            linesWithWrongStatus={linesWithWrongStatus}
            hasMultipleSelected={hasMultipleSelected}
            selectedCount={selectedCount}
          />
          
          <TwinLinesList 
            currentLine={currentLine} 
            twinLines={twinLines}
            currentOrderId={currentOrderId}
            onToggleLineSelection={onToggleLineSelection}
          />
        </div>
      </Callout.Text>
    </Callout.Root>
  );
}

ErrorSection.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
  validationErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggleLineSelection: PropTypes.func,
};
