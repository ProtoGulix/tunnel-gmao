/**
 * @fileoverview Détail complet d'une demande d'achat (panel inline)
 * @module components/purchase/PurchaseRequestDetail
 */

/* eslint-disable max-lines */
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Table, Text, Separator } from '@radix-ui/themes';
import { ExternalLink, Package, Wrench, ShoppingCart, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRIORITY_CONFIG } from '@/config/interventionTypes';
import { PURCHASE_URGENCY, INTERVENTION_STATUS_COLORS } from '@/config/purchaseConfig';
import HexBadge from '@/components/ui/HexBadge';

function DetailRow({ label, children }) {
  return (
    <Flex align="start" gap="2" py="1">
      <Text size="1" color="gray" style={{ minWidth: 90, flexShrink: 0 }}>{label}</Text>
      <Box style={{ flex: 1 }}>{children}</Box>
    </Flex>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function CardHeader({ icon: Icon, title, color = 'var(--gray-9)' }) {
  return (
    <Flex
      align="center" gap="2" px="3" py="2"
      style={{
        borderBottom: '1px solid var(--gray-4)',
        background: 'var(--gray-2)',
        borderRadius: 'var(--radius-2) var(--radius-2) 0 0',
        margin: 'calc(var(--card-padding) * -1)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <Icon size={14} color={color} />
      <Text size="2" weight="medium" color="gray">{title}</Text>
    </Flex>
  );
}

CardHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
};

function DaInfoCard({ item, urgency, statusColor, statusLabel }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <CardHeader icon={ShoppingCart} title="Demande d'achat" color="var(--blue-9)" />
      <Flex direction="column" gap="1">
        <Flex gap="1" wrap="wrap" mb="1">
          <Badge size="1" style={statusColor ? { background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` } : {}}>
            {statusLabel}
          </Badge>
          <Badge color={urgency.color} variant="soft" size="1">{urgency.label}</Badge>
          {item.urgent && <Badge color="red" variant="solid" size="1"><AlertTriangle size={10} /> Urgent</Badge>}
        </Flex>
        <DetailRow label="Quantité"><Text size="2" weight="medium">{item.quantity} {item.unit || 'pcs'}</Text></DetailRow>
        <DetailRow label="Demandeur"><Text size="2">{item.requester_name || item.requested_by || '—'}</Text></DetailRow>
        {item.workshop && <DetailRow label="Atelier"><Text size="2">{item.workshop}</Text></DetailRow>}
        {item.reason && <DetailRow label="Motif"><Text size="2" color="gray">{item.reason}</Text></DetailRow>}
        {item.notes && <DetailRow label="Notes"><Text size="2" color="gray">{item.notes}</Text></DetailRow>}
        <DetailRow label="Créée le">
          <Text size="2" color="gray">
            {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
          </Text>
        </DetailRow>
      </Flex>
    </Card>
  );
}

DaInfoCard.propTypes = {
  item: PropTypes.object.isRequired,
  urgency: PropTypes.object.isRequired,
  statusColor: PropTypes.string,
  statusLabel: PropTypes.string.isRequired,
};

function InterventionDetails({ intervention }) {
  const priorityColor = PRIORITY_CONFIG[intervention.priority?.toLowerCase()]?.color || 'gray';
  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2" mb="1">
        <Badge size="1" variant="soft" color={priorityColor}>{intervention.code}</Badge>
        <Link to={`/intervention/${intervention.id}`} style={{ display: 'flex', alignItems: 'center' }}>
          <ExternalLink size={12} color="var(--blue-9)" />
        </Link>
      </Flex>
      {intervention.title && <Text size="1" color="gray" mb="1">{intervention.title}</Text>}
      {intervention.status_actual && (
        <DetailRow label="Statut">
          <Badge size="1" variant="soft" color={INTERVENTION_STATUS_COLORS[intervention.status_actual] || 'gray'}>
            {intervention.status_actual.replace(/_/g, ' ')}
          </Badge>
        </DetailRow>
      )}
      {intervention.priority && (
        <DetailRow label="Priorité">
          <Badge size="1" variant="soft" color={priorityColor}>{intervention.priority}</Badge>
        </DetailRow>
      )}
      {intervention.equipement && (
        <DetailRow label="Équipement">
          <Flex direction="column">
            <Text size="2" weight="medium">{intervention.equipement.code}</Text>
            <Text size="1" color="gray">{intervention.equipement.name}</Text>
          </Flex>
        </DetailRow>
      )}
    </Flex>
  );
}

InterventionDetails.propTypes = { intervention: PropTypes.object.isRequired };

function InterventionCard({ intervention }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <CardHeader icon={Wrench} title="Intervention liée" />
      {intervention ? (
        <InterventionDetails intervention={intervention} />
      ) : (
        <Flex direction="column" align="center" justify="center" gap="1" py="4">
          <Wrench size={22} color="var(--gray-5)" />
          <Text size="1" color="gray">Aucune intervention liée</Text>
        </Flex>
      )}
    </Card>
  );
}

InterventionCard.propTypes = { intervention: PropTypes.object };

function NoPieceLinked() {
  return (
    <Flex direction="column" align="center" justify="center" gap="2" py="4">
      <Package size={22} color="var(--amber-7)" />
      <Text size="1" color="gray" align="center">
        Cette demande n&apos;est pas liée à une pièce du catalogue.
      </Text>
    </Flex>
  );
}

function PartCard({ part, unit }) {
  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2" mb="1">
        <Link to={`/stock?q=${encodeURIComponent(part.internal_ref)}`} style={{ display: 'contents' }}>
          <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer', fontFamily: 'monospace' }}>
            {part.internal_ref}
          </Badge>
        </Link>
        <Link to={`/stock?q=${encodeURIComponent(part.internal_ref)}`} style={{ display: 'flex', alignItems: 'center' }}>
          <ExternalLink size={12} color="var(--blue-9)" />
        </Link>
      </Flex>
      <Text size="2" weight="medium" mb="1">{part.display_name}</Text>
      {part.family_code && (
        <DetailRow label="Famille">
          <Text size="2">{part.family_code}{part.sub_family_code ? ` / ${part.sub_family_code}` : ''}</Text>
        </DetailRow>
      )}
      {part.location && <DetailRow label="Emplacement"><Text size="2">{part.location}</Text></DetailRow>}
      <DetailRow label="Stock">
        <Text size="2">{part.qty_in_stock ?? '—'} {part.unit || unit || 'pcs'}</Text>
      </DetailRow>
      {part.supplier_refs_count != null && (
        <DetailRow label="Fournisseurs">
          <Text size="2">{part.supplier_refs_count} référencé{part.supplier_refs_count > 1 ? 's' : ''}</Text>
        </DetailRow>
      )}
    </Flex>
  );
}
PartCard.propTypes = { part: PropTypes.object.isRequired, unit: PropTypes.string };

function LegacyStockItemCard({ stockItem, unit }) {
  return (
    <Flex direction="column" gap="1">
      <Flex align="center" gap="2" mb="1">
        <Badge color="gray" variant="soft" size="1">{stockItem.ref}</Badge>
        <Text size="1" color="gray">(legacy)</Text>
      </Flex>
      <Text size="2" weight="medium" mb="1">{stockItem.name}</Text>
      {stockItem.family_code && (
        <DetailRow label="Famille">
          <Text size="2">{stockItem.family_code}{stockItem.sub_family_code ? ` / ${stockItem.sub_family_code}` : ''}</Text>
        </DetailRow>
      )}
      <DetailRow label="Stock">
        <Text size="2">{stockItem.quantity ?? '—'} {stockItem.unit || unit || 'pcs'}</Text>
      </DetailRow>
    </Flex>
  );
}
LegacyStockItemCard.propTypes = { stockItem: PropTypes.object.isRequired, unit: PropTypes.string };

function StockItemCard({ part, stockItem, unit }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <CardHeader icon={Package} title="Pièce catalogue" />
      {part ? (
        <PartCard part={part} unit={unit} />
      ) : stockItem ? (
        <LegacyStockItemCard stockItem={stockItem} unit={unit} />
      ) : (
        <NoPieceLinked />
      )}
    </Card>
  );
}

StockItemCard.propTypes = { part: PropTypes.object, stockItem: PropTypes.object, unit: PropTypes.string };

function LineStateBadge({ line }) {
  if (line.is_selected) return <Badge variant="solid" size="1" color="green">Sélectionné</Badge>;
  if (line.quote_received) return <Badge variant="soft" size="1" color="orange">Devis reçu</Badge>;
  return <Text size="1" color="gray">En attente</Text>;
}

LineStateBadge.propTypes = { line: PropTypes.object.isRequired };

function OrderNumberCell({ number }) {
  if (number) return <Badge variant="outline" size="1" color="blue">{number}</Badge>;
  return <Text size="1" color="gray">—</Text>;
}

OrderNumberCell.propTypes = { number: PropTypes.string };

function SupplierCell({ supplier }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="2" weight="medium">{supplier?.name || '—'}</Text>
      {supplier?.code && <Text size="1" color="gray">{supplier.code}</Text>}
    </Flex>
  );
}

SupplierCell.propTypes = { supplier: PropTypes.object };

function ManufacturerCell({ manufacturer, catalogRef }) {
  if (!manufacturer?.ref && !catalogRef) return <Text size="1" color="gray">—</Text>;
  return (
    <Flex direction="column" gap="1">
      {catalogRef && <Badge color="violet" variant="soft" size="1" style={{ width: 'fit-content' }}>{catalogRef}</Badge>}
      {manufacturer?.ref && manufacturer.ref !== catalogRef && (
        <Text size="1" weight="medium">{manufacturer.ref}</Text>
      )}
      {manufacturer?.name && <Text size="1" color="gray">{manufacturer.name}</Text>}
    </Flex>
  );
}

ManufacturerCell.propTypes = { manufacturer: PropTypes.object, catalogRef: PropTypes.string };

function ReceivedCell({ received, total }) {
  if (received > 0) return <Badge size="1" variant="soft" color="teal">{received} / {total}</Badge>;
  return <Text size="1" color="gray">0</Text>;
}

ReceivedCell.propTypes = { received: PropTypes.number, total: PropTypes.number };

function PriceCell({ value, bold }) {
  if (value == null) return <Text size="1" color="gray">—</Text>;
  return <Text size="2" weight={bold ? 'medium' : undefined}>{Number(value).toFixed(2)} €</Text>;
}

PriceCell.propTypes = { value: PropTypes.number, bold: PropTypes.bool };

function OrderStatusBadge({ statusObj }) {
  if (!statusObj) return <Text size="1" color="gray">—</Text>;
  return (
    <Flex direction="column" gap="1">
      <HexBadge color={statusObj.color} label={statusObj.label || statusObj.code} />
      {statusObj.description && (
        <Text size="1" color="gray" style={{ maxWidth: 180 }}>{statusObj.description}</Text>
      )}
    </Flex>
  );
}

OrderStatusBadge.propTypes = { statusObj: PropTypes.object };

function OrderLineRow({ line, itemQuantity, itemUnit }) {
  const price = line.unit_price ?? line.quote_price;
  const qty = line.quantity_allocated ?? itemQuantity;
  const total = line.total_price ?? (price != null ? price * qty : null);
  return (
    <Table.Row style={line.is_selected ? { background: 'var(--green-2)' } : undefined}>
      <Table.Cell><OrderNumberCell number={line.supplier_order_number} /></Table.Cell>
      <Table.Cell><SupplierCell supplier={line.supplier} /></Table.Cell>
      <Table.Cell><OrderStatusBadge statusObj={line.supplier_order_status} /></Table.Cell>
      <Table.Cell><ManufacturerCell manufacturer={line.manufacturer} catalogRef={line.catalog_ref} /></Table.Cell>
      <Table.Cell align="center"><Text size="2">{qty} {itemUnit || 'pcs'}</Text></Table.Cell>
      <Table.Cell align="right"><PriceCell value={price} /></Table.Cell>
      <Table.Cell align="right"><PriceCell value={total} bold /></Table.Cell>
      <Table.Cell align="center">
        <Text size="1" color="gray">{line.lead_time_days != null ? `${line.lead_time_days}j` : '—'}</Text>
      </Table.Cell>
      <Table.Cell align="center"><ReceivedCell received={line.quantity_received} total={qty} /></Table.Cell>
      <Table.Cell><LineStateBadge line={line} /></Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = {
  line: PropTypes.object.isRequired,
  itemQuantity: PropTypes.number,
  itemUnit: PropTypes.string,
};

function OrderLinesSection({ orderLines, itemQuantity, itemUnit }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="2">
        <ShoppingCart size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">
          Paniers fournisseurs {orderLines.length > 0 && `(${orderLines.length})`}
        </Text>
      </Flex>
      {orderLines.length === 0 ? (
        <Card size="2" variant="surface">
          <Flex direction="column" align="center" justify="center" gap="2" py="5">
            <ShoppingCart size={28} color="var(--gray-5)" />
            <Text size="2" weight="medium" color="gray">Cette DA n&apos;est dans aucun panier fournisseur</Text>
            <Text size="1" color="gray">Le responsable achats devra dispatcher cette demande.</Text>
          </Flex>
        </Card>
      ) : (
        <Card size="1" variant="surface" style={{ overflow: 'auto' }}>
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>N° panier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Réf. catalogue / fab.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Qté allouée</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Prix u.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Délai</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Reçu</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>État</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orderLines.map((line, i) => (
                <OrderLineRow
                  key={line.id || i}
                  line={line}
                  itemQuantity={itemQuantity}
                  itemUnit={itemUnit}
                />
              ))}
            </Table.Body>
          </Table.Root>
        </Card>
      )}
    </Box>
  );
}

OrderLinesSection.propTypes = {
  orderLines: PropTypes.array.isRequired,
  itemQuantity: PropTypes.number,
  itemUnit: PropTypes.string,
};

function DetailHeader({ item, onEdit, onDelete }) {
  const isLocked = !item.is_editable;
  const isToQualify = !item.part && !item.stock_item;

  return (
    <Flex align="center" justify="between" gap="2">
      <Flex align="center" gap="2">
        <ShoppingCart size={16} color="var(--blue-9)" />
        <Text size="3" weight="bold">{item.item_label}</Text>
        {item.urgent && <Badge color="red" variant="solid" size="1"><AlertTriangle size={10} /> Urgent</Badge>}
      </Flex>
      <Flex gap="2">
        {onEdit && (
          <Button
            size="1"
            variant="soft"
            color={isToQualify ? 'amber' : undefined}
            onClick={onEdit}
            disabled={isLocked}
            title={isLocked ? 'Non modifiable : DA dans un panier fournisseur actif' : undefined}
          >
            {isToQualify ? <><Package size={12} /> Qualifier</> : <><Edit2 size={12} /> Modifier</>}
          </Button>
        )}
        {onDelete && <Button size="1" variant="soft" color="red" onClick={onDelete}><Trash2 size={12} /> Supprimer</Button>}
      </Flex>
    </Flex>
  );
}

DetailHeader.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default function PurchaseRequestDetail({ item, onEdit, onDelete }) {
  if (!item) return null;
  const urgency = PURCHASE_URGENCY[item.urgency] || PURCHASE_URGENCY.normal;
  const statusColor = item.derived_status?.color;
  const statusLabel = item.derived_status?.label || item.derived_status?.code || '—';


  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        <DetailHeader item={item} onEdit={onEdit} onDelete={onDelete} />
        <Separator size="4" />
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', alignItems: 'stretch' }}>
          <DaInfoCard item={item} urgency={urgency} statusColor={statusColor} statusLabel={statusLabel} />
          <InterventionCard intervention={item.intervention} />
          <StockItemCard part={item.part} stockItem={item.stock_item} unit={item.unit} />
        </Box>
        <Separator size="4" />
        <OrderLinesSection
          orderLines={item.order_lines || []}
          itemQuantity={item.quantity}
          itemUnit={item.unit}
        />
      </Flex>
    </Box>
  );
}

PurchaseRequestDetail.propTypes = {
  item: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
