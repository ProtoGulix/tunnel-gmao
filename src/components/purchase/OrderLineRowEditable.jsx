/**
 * Ligne de commande éditable (mode négociation : SENT, ACK).
 * Le total est fourni par le backend après sauvegarde — pas de calcul côté front.
 * @module components/purchase/OrderLineRowEditable
 */

import PropTypes from 'prop-types';
import { Checkbox, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';
import { CompetingOrders, isConsultationLost, LinkedPurchaseRequests, LineRefs } from '@/components/purchase/SupplierOrderLines';

export default function OrderLineRowEditable({ line, draft, onChange, saving }) {
  const lost = isConsultationLost(line, draft.is_selected);
  const cellStyle = {
    verticalAlign: 'middle',
    ...(lost ? { opacity: 0.45 } : {}),
  };
  return (
    <Table.Row style={draft.is_selected ? { background: 'var(--blue-2)' } : undefined}>
      <Table.Cell style={cellStyle}>
        <Flex align="center" gap="2">
          <Checkbox
            checked={!!draft.is_selected}
            onCheckedChange={(checked) => onChange({ is_selected: !!checked })}
          />
          <Text size="2" weight="medium">{line.stock_item_name || '—'}</Text>
        </Flex>
        <LinkedPurchaseRequests line={line} />
      </Table.Cell>

      <Table.Cell style={cellStyle}>
        <LineRefs line={line} />
      </Table.Cell>

      <Table.Cell style={cellStyle}>
        <Flex align="center" gap="1">
          <TextField.Root
            size="1"
            type="number"
            min="0"
            step="1"
            value={draft.quantity}
            onChange={(e) => onChange({ quantity: e.target.value })}
            style={{ width: 70 }}
          />
          <Text size="1" color="gray">{line.stock_item_unit || 'pcs'}</Text>
        </Flex>
      </Table.Cell>

      <Table.Cell style={cellStyle}>
        <Flex align="center" gap="1">
          <TextField.Root
            size="1"
            type="number"
            min="0"
            step="0.01"
            value={draft.unit_price ?? ''}
            placeholder="0.00"
            onChange={(e) => onChange({ unit_price: e.target.value })}
            style={{ width: 90 }}
          />
          <Text size="1" color="gray">€</Text>
        </Flex>
      </Table.Cell>

      {/* Total calculé par le backend — affiché tel quel */}
      <Table.Cell style={cellStyle}>
        {line.total_price != null
          ? <Text size="2" weight="medium" color="gray">{Number(line.total_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>

      <Table.Cell style={{ verticalAlign: 'middle' }}>
        <Flex align="center" gap="2">
          <CompetingOrders line={line} />
          {saving && <Loader2 size={12} color="var(--gray-9)" style={{ animation: 'spin 0.6s linear infinite' }} />}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRowEditable.propTypes = {
  line: PropTypes.object.isRequired,
  draft: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
