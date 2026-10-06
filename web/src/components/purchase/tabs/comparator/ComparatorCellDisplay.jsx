/**
 * Sous-composants d'affichage/édition d'une ComparatorCell chiffrée : formulaire
 * prix/délai et rendu prix/délai/total en lecture.
 * @module components/purchase/tabs/comparator/ComparatorCellDisplay
 */
import { Flex, Spinner, Text } from '@radix-ui/themes';
import { CheckCircle2, Clock, Euro, Trophy, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatPrice } from '@/utils/formatPrice';

function computeLineTotal(price, quantity) {
  return !isNaN(price) && quantity ? (price * quantity) : null;
}

function fieldBorderColor(hasError) {
  return hasError ? 'var(--red-7)' : 'var(--gray-6)';
}

/** Icône de label d'un champ (€ ou ⏱), remplacée temporairement par un rolling
 *  circle pendant la sauvegarde de la ligne, ou par une coche/croix juste après
 *  (issue) — même emplacement, même taille, jamais de texte d'état. */
function FieldStatusIcon({ icon, saving, saved, hasError }) {
  if (saving) return <Spinner size="1" />;
  if (hasError) return <XCircle size={11} color="var(--red-9)" />;
  if (saved) return <CheckCircle2 size={11} color="var(--green-9)" />;
  return icon;
}
FieldStatusIcon.propTypes = { icon: PropTypes.node, saving: PropTypes.bool, saved: PropTypes.bool, hasError: PropTypes.bool };

export function EditFields({ draft, onChange, saving, saved, hasError }) {
  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="1">
        <Flex align="center" gap="1" style={{ width: 52, flexShrink: 0 }}>
          <FieldStatusIcon icon={<Euro size={11} color="var(--gray-9)" />} saving={saving} saved={saved} hasError={hasError} />
          <Text size="1" color="gray">Prix</Text>
        </Flex>
        <input
          type="number" min="0" step="0.01" value={draft?.unit_price ?? ''} placeholder="0.00" autoFocus
          onChange={(e) => onChange('unit_price', e.target.value)}
          style={{ flex: '1 1 0%', minWidth: 0, width: '100%', boxSizing: 'border-box', fontSize: 'var(--font-size-2)', padding: '3px 6px', borderRadius: 'var(--radius-2)', border: `1px solid ${fieldBorderColor(hasError)}`, background: 'var(--color-background)', color: 'var(--gray-12)', textAlign: 'right' }}
        />
        <Text size="1" color="gray">€</Text>
      </Flex>
      <Flex align="center" gap="1">
        <Flex align="center" gap="1" style={{ width: 52, flexShrink: 0 }}>
          <FieldStatusIcon icon={<Clock size={11} color="var(--gray-9)" />} saving={saving} saved={saved} hasError={hasError} />
          <Text size="1" color="gray">Délai</Text>
        </Flex>
        <input
          type="number" min="0" step="1" value={draft?.lead_time_days ?? ''} placeholder="—"
          onChange={(e) => onChange('lead_time_days', e.target.value)}
          style={{ flex: '1 1 0%', minWidth: 0, width: '100%', boxSizing: 'border-box', fontSize: 'var(--font-size-2)', padding: '3px 6px', borderRadius: 'var(--radius-2)', border: `1px solid ${fieldBorderColor(hasError)}`, background: 'var(--color-background)', color: 'var(--gray-12)', textAlign: 'right' }}
        />
        <Text size="1" color="gray">j</Text>
      </Flex>
    </Flex>
  );
}
EditFields.propTypes = {
  draft: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  saved: PropTypes.bool,
  hasError: PropTypes.bool,
};

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
