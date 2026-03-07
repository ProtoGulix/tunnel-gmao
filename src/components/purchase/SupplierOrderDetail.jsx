/**
 * @fileoverview Détail d'un panier fournisseur (panel inline)
 *
 * Affiche la commande + ses lignes enrichies depuis GET /supplier-orders/{id}
 * (les lignes sont incluses dans le détail via `lines`).
 *
 * @module components/purchase/SupplierOrderDetail
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Separator, Table, Text } from '@radix-ui/themes';
import { Building2, CheckCircle2, Clock, Download, Package, ShoppingCart, Trash2 } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';

const ORDER_STATUS_LABELS = {
  OPEN:      { label: 'Ouvert',    color: 'blue' },
  SENT:      { label: 'Envoyé',   color: 'orange' },
  ACK:       { label: 'Accusé',   color: 'indigo' },
  RECEIVED:  { label: 'Reçu',     color: 'green' },
  CLOSED:    { label: 'Clôturé',  color: 'gray' },
  CANCELLED: { label: 'Annulé',   color: 'red' },
};

const AGE_COLOR = { gray: 'gray', orange: 'orange', red: 'red' };

function DetailRow({ label, children }) {
  return (
    <Flex align="start" gap="3" py="1">
      <Text size="2" color="gray" style={{ minWidth: 160, flexShrink: 0 }}>{label}</Text>
      <Box style={{ flex: 1 }}>{children}</Box>
    </Flex>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function OrderLineRow({ line }) {
  return (
    <Table.Row>
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium">{line.stock_item_name || '—'}</Text>
          {line.stock_item_ref && (
            <Badge color="blue" variant="soft" size="1" style={{ width: 'fit-content' }}>
              {line.stock_item_ref}
            </Badge>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{line.quantity} {line.unit || 'pcs'}</Text>
      </Table.Cell>
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
      <Table.Cell>
        <Flex gap="1" wrap="wrap">
          {line.quote_received && (
            <Badge color="green" variant="soft" size="1">
              <CheckCircle2 size={10} /> Devis reçu
            </Badge>
          )}
          {line.is_selected && (
            <Badge color="blue" variant="solid" size="1">Sélectionné</Badge>
          )}
          {line.quantity_received != null && (
            <Badge color="teal" variant="soft" size="1">
              Reçu : {line.quantity_received}
            </Badge>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell>
        <Text size="1" color="gray">
          {line.purchase_request_count ?? 0} DA
        </Text>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = {
  line: PropTypes.object.isRequired,
};

export default function SupplierOrderDetail({ orderId, onDelete, onExportCsv }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    import('@/api/supplierOrders')
      .then(({ fetchSupplierOrderDetail }) => fetchSupplierOrderDetail(orderId))
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <LoadingState fullscreen={false} message="Chargement..." />;
  if (!detail) return null;

  const statusInfo = ORDER_STATUS_LABELS[detail.status] || { label: detail.status, color: 'gray' };
  const lines = detail.lines || [];

  return (
    <Box p="4">
      <Flex direction="column" gap="3">

        {/* Header */}
        <Flex align="center" justify="between" gap="2">
          <Flex align="center" gap="2">
            <ShoppingCart size={16} color="var(--blue-9)" />
            <Text size="3" weight="bold">{detail.order_number}</Text>
            <Badge color={statusInfo.color} variant="soft" size="1">{statusInfo.label}</Badge>
            {detail.is_blocking && (
              <Badge color={AGE_COLOR[detail.age_color] || 'gray'} variant="soft" size="1">
                <Clock size={10} /> {detail.age_days}j
              </Badge>
            )}
          </Flex>
          <Flex gap="2">
            {onExportCsv && (
              <Button size="1" variant="soft" onClick={() => onExportCsv(detail.id)}>
                <Download size={12} /> CSV
              </Button>
            )}
            {onDelete && (
              <Button size="1" variant="soft" color="red" onClick={onDelete}>
                <Trash2 size={12} /> Supprimer
              </Button>
            )}
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Infos fournisseur */}
        {detail.supplier && (
          <Box>
            <Flex align="center" gap="2" mb="2">
              <Building2 size={14} color="var(--gray-9)" />
              <Text size="2" weight="bold" color="gray">Fournisseur</Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="2" weight="medium">{detail.supplier.name}</Text>
              {detail.supplier.contact_name && (
                <Text size="1" color="gray">{detail.supplier.contact_name}</Text>
              )}
              {detail.supplier.email && (
                <Text size="1" color="gray">{detail.supplier.email}</Text>
              )}
            </Flex>
          </Box>
        )}

        {/* Infos commande */}
        <Box>
          {detail.total_amount != null && (
            <DetailRow label="Montant total">
              <Text size="2" weight="bold">{Number(detail.total_amount).toFixed(2)} €</Text>
            </DetailRow>
          )}
          {detail.ordered_at && (
            <DetailRow label="Commandé le">
              <Text size="2">{new Date(detail.ordered_at).toLocaleDateString('fr-FR')}</Text>
            </DetailRow>
          )}
          {detail.expected_delivery_date && (
            <DetailRow label="Livraison prévue">
              <Text size="2">{new Date(detail.expected_delivery_date).toLocaleDateString('fr-FR')}</Text>
            </DetailRow>
          )}
          <DetailRow label="Créée le">
            <Text size="2" color="gray">
              {detail.created_at ? new Date(detail.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </Text>
          </DetailRow>
        </Box>

        {/* Lignes de commande */}
        {lines.length > 0 && (
          <>
            <Separator size="4" />
            <Box>
              <Flex align="center" gap="2" mb="2">
                <Package size={14} color="var(--gray-9)" />
                <Text size="2" weight="bold" color="gray">
                  Lignes ({lines.length})
                </Text>
              </Flex>
              <Table.Root size="1" variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Prix u.</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Total</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>État</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>DA</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {lines.map((line) => (
                    <OrderLineRow key={line.id} line={line} />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </>
        )}
      </Flex>
    </Box>
  );
}

SupplierOrderDetail.propTypes = {
  orderId: PropTypes.string,
  onDelete: PropTypes.func,
  onExportCsv: PropTypes.func,
};
