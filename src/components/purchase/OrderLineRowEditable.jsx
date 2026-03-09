/**
 * Ligne de commande éditable (mode négociation : SENT, ACK).
 * Le total est fourni par le backend après sauvegarde — pas de calcul côté front.
 * @module components/purchase/OrderLineRowEditable
 */

import PropTypes from 'prop-types';
import { Badge, Button, Checkbox, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { Save } from 'lucide-react';
import { LineBadges } from '@/components/purchase/SupplierOrderLines';

function hasDraft(draft, line) {
  return (
    draft.is_selected !== !!line.is_selected ||
    String(draft.quantity) !== String(line.quantity) ||
    String(draft.unit_price ?? '') !== String(line.unit_price ?? '')
  );
}

export default function OrderLineRowEditable({ line, draft, onChange, onSave, saving }) {
  const dirty = hasDraft(draft, line);

  return (
    <Table.Row style={draft.is_selected ? { background: 'var(--blue-2)' } : {}}>
      <Table.Cell style={{ verticalAlign: 'middle' }}>
        <Flex align="center" gap="2">
          <Checkbox
            checked={!!draft.is_selected}
            onCheckedChange={(checked) => onChange({ is_selected: !!checked })}
          />
          <Flex direction="column" gap="1">
            <Text size="2" weight="medium">{line.stock_item_name || '—'}</Text>
            {line.stock_item_ref && (
              <Badge color="blue" variant="soft" size="1" style={{ width: 'fit-content' }}>
                {line.stock_item_ref}
              </Badge>
            )}
          </Flex>
        </Flex>
      </Table.Cell>

      <Table.Cell style={{ verticalAlign: 'middle' }}>
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
          <Text size="1" color="gray">{line.unit || 'pcs'}</Text>
        </Flex>
      </Table.Cell>

      <Table.Cell style={{ verticalAlign: 'middle' }}>
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
      <Table.Cell style={{ verticalAlign: 'middle' }}>
        {line.total_price != null
          ? <Text size="2" weight="medium" color="gray">{Number(line.total_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>

      <Table.Cell style={{ verticalAlign: 'middle' }}>
        <LineBadges line={line} />
      </Table.Cell>

      <Table.Cell style={{ verticalAlign: 'middle' }}>
        <Flex align="center" gap="2">
          <Text size="1" color="gray">{line.purchase_request_count ?? 0} DA</Text>
          {dirty && (
            <Button size="1" variant="soft" color="blue" loading={saving} onClick={onSave}>
              <Save size={11} />
            </Button>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRowEditable.propTypes = {
  line: PropTypes.object.isRequired,
  draft: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
