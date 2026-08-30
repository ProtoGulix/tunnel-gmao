/**
 * Sous-composants d'affichage/édition d'une ComparatorCell chiffrée : formulaire
 * prix/délai et rendu prix/délai/total en lecture.
 * @module components/purchase/tabs/comparator/ComparatorCellDisplay
 */
import { Flex, Text } from '@radix-ui/themes';
import { Trophy } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatPrice } from '@/utils/formatPrice';

function computeLineTotal(price, quantity) {
  return !isNaN(price) && quantity ? (price * quantity) : null;
}

export function EditFields({ draft, onChange }) {
  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="1">
        <Text size="1" color="gray" style={{ width: 40 }}>Prix</Text>
        <input
          type="number" min="0" step="0.01" value={draft?.unit_price ?? ''} placeholder="0.00" autoFocus
          onChange={(e) => onChange('unit_price', e.target.value)}
          style={{ flex: 1, fontSize: 'var(--font-size-2)', padding: '3px 6px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', background: 'var(--color-background)', color: 'var(--gray-12)', textAlign: 'right' }}
        />
        <Text size="1" color="gray">€</Text>
      </Flex>
      <Flex align="center" gap="1">
        <Text size="1" color="gray" style={{ width: 40 }}>Délai</Text>
        <input
          type="number" min="0" step="1" value={draft?.lead_time_days ?? ''} placeholder="—"
          onChange={(e) => onChange('lead_time_days', e.target.value)}
          style={{ flex: 1, fontSize: 'var(--font-size-2)', padding: '3px 6px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-6)', background: 'var(--color-background)', color: 'var(--gray-12)', textAlign: 'right' }}
        />
        <Text size="1" color="gray">j</Text>
      </Flex>
    </Flex>
  );
}
EditFields.propTypes = { draft: PropTypes.object, onChange: PropTypes.func.isRequired };

function PriceDisplay({ price, isPriceWinner }) {
  return (
    <Flex align="center" gap="1">
      {isPriceWinner && <Trophy size={11} color="var(--green-9)" />}
      <Text size="4" weight="bold" color={isPriceWinner ? 'green' : undefined}>{formatPrice(price)}</Text>
    </Flex>
  );
}
PriceDisplay.propTypes = { price: PropTypes.number, isPriceWinner: PropTypes.bool };

function DelayDisplay({ delay, isDelayWinner }) {
  return (
    <Flex align="center" gap="1">
      {isDelayWinner && <Trophy size={11} color="var(--blue-9)" />}
      <Text size="2" color={isDelayWinner ? 'blue' : 'gray'}>{delay != null && delay !== '' ? `${delay} j` : '—'}</Text>
    </Flex>
  );
}
DelayDisplay.propTypes = { delay: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), isDelayWinner: PropTypes.bool };

export function PricedDisplay({ line, draft, quantity, isPriceWinner, isDelayWinner }) {
  const price = draft?.unit_price !== '' && draft?.unit_price != null ? parseFloat(draft.unit_price) : line.unit_price;
  const total = computeLineTotal(price, quantity);
  const delay = draft?.lead_time_days ?? line.lead_time_days;

  return (
    <Flex direction="column" gap="1">
      <Flex align="baseline" gap="2" justify="between">
        <PriceDisplay price={price} isPriceWinner={isPriceWinner} />
        <DelayDisplay delay={delay} isDelayWinner={isDelayWinner} />
      </Flex>
      {total != null && (
        <Text size="1" color="gray">Total : {formatPrice(total)} ({quantity} {line.stock_item_unit || 'pcs'})</Text>
      )}
    </Flex>
  );
}
PricedDisplay.propTypes = {
  line: PropTypes.object.isRequired,
  draft: PropTypes.object,
  quantity: PropTypes.number,
  isPriceWinner: PropTypes.bool,
  isDelayWinner: PropTypes.bool,
};
