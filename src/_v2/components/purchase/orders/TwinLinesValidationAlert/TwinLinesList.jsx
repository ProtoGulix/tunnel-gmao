/**
 * @fileoverview Liste comparative des lignes jumelles
 * @module components/purchase/orders/TwinLinesValidationAlert/TwinLinesList
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Table, Button, Badge } from '@radix-ui/themes';
import { ClipboardList, Check, X, MinusCircle } from 'lucide-react';
import LineDetails from './LineDetails';
import LineBadges from './LineBadges';
import OrderLink from './OrderLink';
import { extractOrderInfo } from './helpers';

/**
 * Liste comparative des lignes jumelles pour les erreurs
 * @component
 * @param {Object} props
 * @param {Object} props.currentLine - Ligne actuelle
 * @param {Array<Object>} props.twinLines - Lignes jumelles
 */
export default function TwinLinesList({ currentLine, twinLines, currentOrderId, onToggleLineSelection }) {
  if (twinLines.length === 0 && !currentLine) return null;

  const allLines = [
    ...(currentLine ? [{ ...currentLine, isCurrent: true }] : []),
    ...twinLines.map((twin) => ({ ...twin, isCurrent: false })),
  ];

  const handleToggle = (line) => {
    if (!onToggleLineSelection) return;
    const next = !(line.is_selected === true);
    onToggleLineSelection(line, next);
  };

  return (
    <Box mt="3">
      <Flex align="center" gap="2" mb="2">
        <ClipboardList size={14} />
        <Text size="1" weight="bold">
          Lignes jumelles détectées ({allLines.length} fournisseur(s) au total) :
        </Text>
      </Flex>

      <Table.Root size="1" variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Fournisseur / Cmd</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Statut panier</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Devis</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sélection</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {allLines.map((line) => {
            const info = extractOrderInfo(line.supplier_order_id);
            const price = line.quote_price ? parseFloat(line.quote_price).toFixed(2) + ' €' : '—';
            const canToggle = onToggleLineSelection && info.orderId && info.orderId === currentOrderId;

            return (
              <Table.Row key={line.id}>
                <Table.Cell>
                  <Flex align="center" gap="2" wrap="wrap">
                    <LineBadges 
                      isSelected={line.is_selected}
                      quoteReceived={line.quote_received}
                      status={info.status}
                    />
                    <Text size="1" weight="medium">{info.supplier || '—'}</Text>
                    <OrderLink orderId={info.orderId} orderNumber={info.orderNumber} />
                    {line.isCurrent && (
                      <Badge color="blue" variant="soft" size="1">Ligne courante</Badge>
                    )}
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  {info.status && info.status !== 'UNKNOWN' ? (
                    <Badge 
                      color={info.status === 'SENT' ? 'blue' : 'red'} 
                      variant="soft"
                    >
                      {info.status}
                    </Badge>
                  ) : (
                    <Text size="1" color="gray">Statut manquant</Text>
                  )}
                </Table.Cell>
                <Table.Cell>{price}</Table.Cell>
                <Table.Cell>
                  {line.is_selected ? (
                    <Flex align="center" gap="1">
                      <Check size={14} color="var(--green-9)" />
                      <Text size="1">Sélectionnée</Text>
                    </Flex>
                  ) : (
                    <Flex align="center" gap="1">
                      <MinusCircle size={14} color="var(--gray-9)" />
                      <Text size="1" color="gray">Non sélectionnée</Text>
                    </Flex>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {canToggle ? (
                    <Button size="1" variant="soft" onClick={() => handleToggle(line)}>
                      {line.is_selected ? (
                        <Flex align="center" gap="1"><X size={12} /> Désélectionner</Flex>
                      ) : (
                        <Flex align="center" gap="1"><Check size={12} /> Sélectionner</Flex>
                      )}
                    </Button>
                  ) : (
                    <Text size="1" color="gray">Ouvrir la commande</Text>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

TwinLinesList.propTypes = {
  currentLine: PropTypes.object,
  twinLines: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentOrderId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggleLineSelection: PropTypes.func,
};
