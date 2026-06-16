/**
 * Tableau des lignes d'un panier fournisseur.
 * Bascule en mode éditable si isNegotiating (detail.edit_lines === true).
 * @module components/purchase/SupplierOrderLines
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Table, Text } from '@radix-ui/themes';
import { AlertCircle, CheckCircle2, Package } from 'lucide-react';
import StatusCallout from '@/components/ui/StatusCallout';
import OrderLineRowEditable from '@/components/purchase/OrderLineRowEditable';

/** Références fournisseur / fabricant communes aux deux modes */
export function LineRefs({ line }) {
  const supplierRef = line.supplier?.ref;
  const mfrRef = line.manufacturer?.ref;
  const mfrName = line.manufacturer?.name;
  if (!supplierRef && !mfrRef) return null;
  return (
    <Flex direction="column" gap="1">
      {supplierRef && (
        <Badge color="indigo" variant="soft" size="1" style={{ width: 'fit-content' }}>
          Fourn. : {supplierRef}
        </Badge>
      )}
      {mfrRef && mfrRef !== supplierRef && (
        <Badge color="gray" variant="soft" size="1" style={{ width: 'fit-content' }}>
          {mfrName ? `${mfrName} : ${mfrRef}` : mfrRef}
        </Badge>
      )}
    </Flex>
  );
}

LineRefs.propTypes = { line: PropTypes.object.isRequired };

/** Badges d'état communs aux deux modes (lecture + édition) */
export function LineBadges({ line }) {
  return (
    <Flex gap="1" wrap="wrap">
      {line.is_consultation && !line.consultation_resolved && (
        <Badge color="red" variant="soft" size="1">
          <AlertCircle size={10} /> À sélectionner
        </Badge>
      )}
      {line.is_consultation && line.consultation_resolved && (
        <Badge color="gray" variant="soft" size="1">Consultation résolue</Badge>
      )}
      {line.quote_received && (
        <Badge color="green" variant="soft" size="1"><CheckCircle2 size={10} /> Devis reçu</Badge>
      )}
      {line.is_selected && <Badge color="blue" variant="solid" size="1">Sélectionné</Badge>}
      {line.quantity_received != null && (
        <Badge color="teal" variant="soft" size="1">Reçu : {line.quantity_received}</Badge>
      )}
    </Flex>
  );
}

LineBadges.propTypes = { line: PropTypes.object.isRequired };

function OrderLineRow({ line }) {
  const isV4 = !!line.part_id;
  return (
    <Table.Row>
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">{line.stock_item_name || '—'}</Text>
          {line.stock_item_ref && (
            <Badge
              color={isV4 ? 'blue' : 'gray'}
              variant="soft" size="1"
              style={{ width: 'fit-content', fontFamily: 'monospace' }}
            >
              {line.stock_item_ref}
            </Badge>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell><LineRefs line={line} /></Table.Cell>
      <Table.Cell><Text size="2">{line.quantity} {line.stock_item_unit || 'pcs'}</Text></Table.Cell>
      <Table.Cell>
        {line.unit_price != null
          ? <Text size="2">{Number(line.unit_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell>
        {line.total_price != null
          ? <Text size="2" weight="medium">{Number(line.total_price).toFixed(2)} €</Text>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell><LineBadges line={line} /></Table.Cell>
      <Table.Cell>
        <Text size="1" color="gray">{line.purchase_request_count ?? 0} DA</Text>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = { line: PropTypes.object.isRequired };

export default function SupplierOrderLines({ lines, isNegotiating, lineDrafts, savingLines, lineErrors, onChangeDraft, onSaveLine }) {
  const pendingConsultations = lines.filter((l) => l.is_consultation && !l.consultation_resolved).length;

  return (
    <>
      <Flex align="center" gap="2" mb="2">
        <Package size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Lignes ({lines.length})</Text>
        {isNegotiating && <Badge color="orange" variant="soft" size="1">Édition activée</Badge>}
        {pendingConsultations > 0 && (
          <Badge color="red" variant="soft" size="1">
            <AlertCircle size={10} /> {pendingConsultations} consultation{pendingConsultations > 1 ? 's' : ''} à résoudre
          </Badge>
        )}
      </Flex>

      {Object.entries(lineErrors).map(([id, msg]) =>
        msg ? <StatusCallout key={id} type="error">{msg}</StatusCallout> : null
      )}

      <Table.Root size="1" variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Références</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Prix u.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>État</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>DA</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {lines.map((line) =>
            isNegotiating && lineDrafts[line.id] ? (
              <OrderLineRowEditable
                key={line.id}
                line={line}
                draft={lineDrafts[line.id]}
                onChange={(changes) => onChangeDraft(line.id, changes)}
                onSave={() => onSaveLine(line.id)}
                saving={!!savingLines[line.id]}
              />
            ) : (
              <OrderLineRow key={line.id} line={line} />
            )
          )}
        </Table.Body>
      </Table.Root>
    </>
  );
}

SupplierOrderLines.propTypes = {
  lines: PropTypes.array.isRequired,
  isNegotiating: PropTypes.bool,
  lineDrafts: PropTypes.object,
  savingLines: PropTypes.object,
  lineErrors: PropTypes.object,
  onChangeDraft: PropTypes.func,
  onSaveLine: PropTypes.func,
};
