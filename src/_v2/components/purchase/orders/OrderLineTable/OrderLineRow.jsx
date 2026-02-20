/**
 * @fileoverview Ligne du tableau des détails de commande
 * @module components/purchase/orders/OrderLineTable/OrderLineRow
 */

/* eslint-disable complexity */
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';
import { Table, Flex, Checkbox } from '@radix-ui/themes';
import { Ban, Lock } from 'lucide-react';
import { useTwinLinesValidation } from '@/hooks/useTwinLinesValidation';
import {
  getStock,
  getPurchaseRequests,
  getMaxUrgency,
  getInterventionInfo,
  countPurchaseRequests,
  detectTwinLines,
  getRequesterName,
} from './helpers';
import { UrgencyBadge, RequestersList } from './BadgeRenderers';
import { ArticleCell, QuantityCell, PurchaseRequestsCell, InterventionCell } from './CellComponents';

/**
 * Ligne du tableau avec validation des lignes jumelles
 * @component
 * @internal Sous-composant non exporté
 */
export function OrderLineRowWithValidation({
  line,
  onToggleSelected,
  disabled,
  isPooling,
  onValidationUpdate,
}) {
  const stock = getStock(line);
  const prs = getPurchaseRequests(line);
  const interventionInfo = getInterventionInfo(line);
  const isSelected = line.is_selected ?? line.isSelected ?? false;
  const urgency = getMaxUrgency(line) || 'normal';
  const prCount = countPurchaseRequests(line);
  const twinInfo = detectTwinLines(line);
  
  const {
    twinLines,
    validationErrors,
    validationWarnings,
    isValid,
  } = useTwinLinesValidation(line);
  
  const lastValidationRef = useRef(null);
  
  useEffect(() => {
    const currentValidation = {
      twinLinesCount: twinLines.length,
      errorsCount: validationErrors.length,
      warningsCount: validationWarnings.length,
      isValid,
    };
    
    if (lastValidationRef.current === null ||
        JSON.stringify(lastValidationRef.current) !== JSON.stringify(currentValidation)) {
      lastValidationRef.current = currentValidation;
      onValidationUpdate?.(line.id, {
        twinLines,
        validationErrors,
        validationWarnings,
        isValid,
      });
    }
  }, [line.id, isValid, onValidationUpdate, twinLines, validationErrors, validationWarnings]);
  
  const handleCheckboxChange = useCallback(
    (checked) => {
      onToggleSelected(line.id, checked);
    },
    [line.id, onToggleSelected]
  );
  
  const requesterNames = prs.map((pr) => getRequesterName(pr));
  
  return (
    <Table.Row key={line.id} style={{
      opacity: !isSelected && disabled ? 0.5 : 1,
      backgroundColor: !isSelected && disabled ? 'var(--gray-2)' : 'transparent',
    }}>
      <Table.Cell>
        <Flex align="center" gap="2">
          <Checkbox
            checked={isSelected || isPooling}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled || isPooling}
            aria-label="Sélectionner cette ligne pour commande"
          />
          {disabled && !isPooling && (
            <Ban size={14} color="var(--red-9)" style={{ opacity: 0.6 }} title="Élément désélectionné" />
          )}
          {isPooling && (
            <Lock size={14} color="var(--blue-9)" style={{ opacity: 0.6 }} title="Mutualisation en cours" />
          )}
        </Flex>
      </Table.Cell>
      
      <ArticleCell stock={stock} line={line} />
      <QuantityCell quantity={line.quantity} />
      <PurchaseRequestsCell prCount={prCount} twinInfo={twinInfo} />
      <Table.Cell>
        <UrgencyBadge urgency={urgency} />
      </Table.Cell>
      <InterventionCell interventionInfo={interventionInfo} />
      <Table.Cell>
        <RequestersList requesters={requesterNames} />
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRowWithValidation.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quantity: PropTypes.number,
    supplierRefSnapshot: PropTypes.string,
    supplier_ref_snapshot: PropTypes.string,
    is_selected: PropTypes.bool,
    isSelected: PropTypes.bool,
    stockItem: PropTypes.object,
    stock_item_id: PropTypes.object,
    purchaseRequests: PropTypes.array,
    purchase_requests: PropTypes.array,
  }).isRequired,
  onToggleSelected: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isPooling: PropTypes.bool,
  onValidationUpdate: PropTypes.func,
};
