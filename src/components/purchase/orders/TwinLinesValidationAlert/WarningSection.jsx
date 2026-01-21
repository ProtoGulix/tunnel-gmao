/**
 * @fileoverview Section d'avertissement de validation
 * @module components/purchase/orders/TwinLinesValidationAlert/WarningSection
 */

import PropTypes from 'prop-types';
import { Callout, Box, Flex, Text } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import ArticleInfo from './ArticleInfo';
import WarningRecommendations from './WarningRecommendations';
import OffersComparison from './OffersComparison';
import TwinLinesList from './TwinLinesList';
import { extractStockItemInfo } from './helpers';

/**
 * Section d'avertissement de validation
 * @component
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 * @param {Array<string>} props.validationWarnings - Avertissements
 */
export default function WarningSection({ currentLine, twinLines, validationWarnings, currentOrderId, onToggleLineSelection }) {
  const allLines = currentLine ? [currentLine, ...twinLines] : twinLines;
  const linesWithoutQuote = allLines.filter(l => !l.quote_received);
  const selectedCount = allLines.filter(l => l.is_selected === true).length;
  
  const { name: articleName, ref: articleRef } = extractStockItemInfo(currentLine);
  
  return (
    <Callout.Root color="amber" size="2" mb="3">
      <Callout.Icon>
        <Info size={18} />
      </Callout.Icon>
      <Callout.Text asChild>
        <div>
          <Flex align="center" gap="2" mb="2">
            <Info size={18} />
            <Text as="div" weight="bold" size="2">
              Comparaison de devis recommandée
            </Text>
          </Flex>
          
          <ArticleInfo name={articleName} ref={articleRef} />
          
          {validationWarnings.map((warning, idx) => (
            <Text key={idx} size="2" as="div" mb="1" color="orange">• {warning}</Text>
          ))}
          
          <WarningRecommendations 
            linesWithoutQuote={linesWithoutQuote}
            selectedCount={selectedCount}
          />

          <TwinLinesList 
            currentLine={currentLine}
            twinLines={twinLines}
            currentOrderId={currentOrderId}
            onToggleLineSelection={onToggleLineSelection}
          />
          
          <OffersComparison currentLine={currentLine} twinLines={twinLines} />
        </div>
      </Callout.Text>
    </Callout.Root>
  );
}

WarningSection.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
  validationWarnings: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggleLineSelection: PropTypes.func,
};
