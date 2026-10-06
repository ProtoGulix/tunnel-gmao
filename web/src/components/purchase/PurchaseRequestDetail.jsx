/**
 * @fileoverview Détail complet d'une demande d'achat (panel inline)
 * @module components/purchase/PurchaseRequestDetail
 */

/* eslint-disable max-lines */
import { useState } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Badge, Box, Button, Card, Checkbox, Flex, Heading, Table, Tabs, Text, Separator, Tooltip } from '@radix-ui/themes';
import { ExternalLink, Package, Wrench, ShoppingCart, Trash2, Edit2, AlertTriangle, Scale } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PRIORITY_CONFIG } from '@/config/interventionTypes';
import { PURCHASE_URGENCY, INTERVENTION_STATUS_COLORS } from '@/config/purchaseConfig';
import HexBadge from '@/components/ui/HexBadge';
import { isConsultationLost } from '@/components/purchase/SupplierOrderLines';
import { formatPrice } from '@/utils/formatPrice';
import PurchaseEntityHistoryTab, { PURCHASE_ENTITY_TYPES } from '@/components/purchase/PurchaseEntityHistoryTab';

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
      <Heading as="h3" size="2" weight="medium" color="gray">{title}</Heading>
    </Flex>
  );
}

CardHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
};

function formatUserRef(user) {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  return user.initial ? `${user.initial} - ${fullName}` : fullName;
}

function resolveRequester(item) {
  return formatUserRef(item.requested_by_user) || item.requester_name || item.requested_by || '—';
}

function resolveApprover(item) {
  return formatUserRef(item.approver_user) || item.approver_name;
}

function DaInfoCard({ item, urgency, statusColor, statusLabel }) {
  const requester = resolveRequester(item);
  const approver = resolveApprover(item);
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
        <DetailRow label="Demandeur"><Text size="2">{requester}</Text></DetailRow>
        {approver && <DetailRow label="Approbateur"><Text size="2">{approver}</Text></DetailRow>}
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

function PartCard({ part }) {
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
      {part.supplier_refs_count != null && (
        <DetailRow label="Fournisseurs">
          <Text size="2">{part.supplier_refs_count} référencé{part.supplier_refs_count > 1 ? 's' : ''}</Text>
        </DetailRow>
      )}
    </Flex>
  );
}
PartCard.propTypes = { part: PropTypes.object.isRequired };

function LegacyStockItemCard({ stockItem }) {
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
    </Flex>
  );
}
LegacyStockItemCard.propTypes = { stockItem: PropTypes.object.isRequired };

function StockItemCard({ part, stockItem }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <CardHeader icon={Package} title="Pièce catalogue" />
      {part ? (
        <PartCard part={part} />
      ) : stockItem ? (
        <LegacyStockItemCard stockItem={stockItem} />
      ) : (
        <NoPieceLinked />
      )}
    </Card>
  );
}

StockItemCard.propTypes = { part: PropTypes.object, stockItem: PropTypes.object };

function LineSelectedCheckbox({ line }) {
  return (
    <Box style={{ pointerEvents: 'none' }}>
      <Checkbox checked={!!line.is_selected} color={line.is_selected ? 'green' : 'gray'} />
    </Box>
  );
}

LineSelectedCheckbox.propTypes = { line: PropTypes.object.isRequired };

function OrderNumberCell({ number, orderId }) {
  if (!number) return <Text size="1" color="gray">—</Text>;
  if (!orderId) return <Badge variant="outline" size="1" color="blue">{number}</Badge>;
  return (
    <Badge variant="outline" size="1" color="blue" asChild style={{ cursor: 'pointer' }}>
      <Link to={`/achats?tab=orders&order_id=${orderId}`} title="Voir le panier fournisseur">{number}</Link>
    </Badge>
  );
}

OrderNumberCell.propTypes = { number: PropTypes.string, orderId: PropTypes.string };

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

function PriceCell({ value, bold }) {
  const isPriced = value != null;
  return (
    <Text size={isPriced ? '2' : '1'} weight={isPriced && bold ? 'medium' : undefined} color={isPriced ? undefined : 'gray'}>
      {formatPrice(value)}
    </Text>
  );
}

PriceCell.propTypes = { value: PropTypes.number, bold: PropTypes.bool };

function OrderStatusBadge({ statusObj }) {
  if (!statusObj) return <Text size="1" color="gray">—</Text>;
  const badge = <HexBadge color={statusObj.color} label={statusObj.label || statusObj.code} />;
  if (!statusObj.description) return badge;
  return (
    <Tooltip content={statusObj.description}>
      <Box style={{ display: 'inline-block', cursor: 'help' }}>{badge}</Box>
    </Tooltip>
  );
}

OrderStatusBadge.propTypes = { statusObj: PropTypes.object };

function OrderLineRow({ line, itemQuantity, itemUnit }) {
  const price = line.unit_price ?? line.quote_price;
  const qty = line.quantity_allocated ?? itemQuantity;
  const total = line.total_price ?? (price != null ? price * qty : null);

  // Même logique que le détail du panier fournisseur : vert si cette ligne a gagné la
  // consultation, grisée si un panier concurrent a été sélectionné à sa place, neutre sinon.
  const lost = isConsultationLost(line, line.is_selected);
  const rowStyle = line.is_selected
    ? { background: 'var(--green-2)' }
    : undefined;
  const fade = lost ? { opacity: 0.45 } : undefined;

  return (
    <Table.Row style={rowStyle}>
      <Table.Cell><LineSelectedCheckbox line={line} /></Table.Cell>
      <Table.Cell style={fade}><OrderNumberCell number={line.supplier_order_number} orderId={line.supplier_order_id} /></Table.Cell>
      <Table.Cell style={fade}><SupplierCell supplier={line.supplier} /></Table.Cell>
      <Table.Cell style={fade}><OrderStatusBadge statusObj={line.supplier_order_status} /></Table.Cell>
      <Table.Cell style={fade}><ManufacturerCell manufacturer={line.manufacturer} catalogRef={line.catalog_ref} /></Table.Cell>
      <Table.Cell style={fade} align="center"><Text size="2">{qty} {itemUnit || 'pcs'}</Text></Table.Cell>
      <Table.Cell style={fade} align="right"><PriceCell value={price} /></Table.Cell>
      <Table.Cell style={fade} align="right"><PriceCell value={total} bold /></Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = {
  line: PropTypes.object.isRequired,
  itemQuantity: PropTypes.number,
  itemUnit: PropTypes.string,
};

function OrderLinesSection({ orderLines, itemQuantity, itemUnit }) {
  const navigate = useNavigate();
  const canCompare = orderLines.length >= 2;

  const handleOpenComparator = () => {
    // supplier_order_id est le FK exposé par le backend sur chaque ligne (non nullable)
    const orderIds = orderLines.map((l) => l.supplier_order_id).filter(Boolean);
    const params = new URLSearchParams({ tab: 'comparateur', orders: orderIds.join(',') });
    navigate(`/achats?${params.toString()}`);
  };

  return (
    <Box>
      <Flex align="center" justify="between" mb="2">
        <Flex align="center" gap="2">
          <ShoppingCart size={14} color="var(--gray-9)" />
          <Heading as="h3" size="2" color="gray">
            Paniers fournisseurs {orderLines.length > 0 && `(${orderLines.length})`}
          </Heading>
        </Flex>
        {canCompare && (
          <Button size="1" variant="soft" color="blue" onClick={handleOpenComparator}>
            <Scale size={11} /> Voir dans le comparateur
          </Button>
        )}
      </Flex>

      {orderLines.length === 0 ? (
        <Card size="2" variant="surface">
          <Flex direction="column" align="center" justify="center" gap="2" py="5">
            <ShoppingCart size={28} color="var(--gray-5)" />
            <Text size="2" weight="medium" color="gray">Cette demande d&apos;achat n&apos;est dans aucun panier fournisseur</Text>
            <Text size="1" color="gray">Le responsable achats devra dispatcher cette demande.</Text>
          </Flex>
        </Card>
      ) : (
        <Card size="1" variant="surface" style={{ overflow: 'auto' }}>
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell width="1" />
                <Table.ColumnHeaderCell>N° panier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Réf. catalogue / fab.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="center">Quantité</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Prix u.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
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

function describeLinkedOrderLines(orderLines) {
  const count = orderLines?.length ?? 0;
  if (count === 0) return null;
  const plural = count > 1 ? 's' : '';
  return `${count} ligne${plural} de panier fournisseur associée${plural}`;
}

function describeLinkedPart(item) {
  if (item.part?.internal_ref) return `la référence pièce liée ${item.part.internal_ref}`;
  if (item.stock_item?.ref) return `la référence stock liée ${item.stock_item.ref}`;
  return null;
}

function buildDeleteConsequences(item) {
  return [
    item.intervention?.code ? `l'intervention liée ${item.intervention.code}` : null,
    describeLinkedPart(item),
    describeLinkedOrderLines(item.order_lines),
  ].filter(Boolean);
}

function DeleteConfirmDialog({ item, open, onOpenChange, onConfirm }) {
  const consequences = buildDeleteConsequences(item);
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="480px">
        <AlertDialog.Title>Supprimer {item.code || item.item_label}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          <Text weight="bold">{item.code || item.item_label}</Text> ({item.item_label}) sera supprimée définitivement.
          {consequences.length > 0 && (
            <>
              {' '}Cette suppression n&apos;affectera pas {consequences.join(', ')}, qui resteront liés à leur propre historique.
            </>
          )}
          {' '}Cette action est irréversible.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color="red" onClick={onConfirm}>
              <Trash2 size={14} /> Supprimer définitivement
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
DeleteConfirmDialog.propTypes = {
  item: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

function DetailHeader({ item, onEdit, onDelete }) {
  const isLocked = !item.is_editable;
  const isToQualify = !item.part && !item.stock_item;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <Flex
      align="center" justify="between" gap="2"
      style={{
        position: 'sticky', top: 0, zIndex: 1,
        background: 'var(--color-background)',
        borderBottom: '1px solid var(--gray-5)',
        padding: '16px', margin: '-16px -16px 0',
      }}
    >
      <Flex align="center" gap="2">
        <ShoppingCart size={16} color="var(--blue-9)" />
        <Flex direction="column" gap="0">
          <Heading as="h2" size="3">{item.code || item.item_label}</Heading>
          {item.code && <Text size="1" color="gray">{item.item_label}</Text>}
        </Flex>
        {item.urgent && <Badge color="red" variant="solid" size="1"><AlertTriangle size={10} /> Urgent</Badge>}
      </Flex>
      <Flex gap="4" align="center">
        {onEdit && (
          <Button
            size="2"
            variant="soft"
            color={isToQualify ? 'amber' : undefined}
            onClick={onEdit}
            disabled={isLocked}
            title={isLocked ? 'Non modifiable : demande d’achat dans un panier fournisseur actif' : undefined}
          >
            {isToQualify ? <><Package size={14} /> Qualifier</> : <><Edit2 size={14} /> Modifier</>}
          </Button>
        )}
        {onDelete && (
          <>
            <Separator orientation="vertical" size="4" style={{ height: 24 }} />
            <Button size="2" variant="soft" color="red" onClick={() => setDeleteConfirmOpen(true)}>
              <Trash2 size={14} /> Supprimer
            </Button>
            <DeleteConfirmDialog
              item={item}
              open={deleteConfirmOpen}
              onOpenChange={setDeleteConfirmOpen}
              onConfirm={() => { setDeleteConfirmOpen(false); onDelete(); }}
            />
          </>
        )}
      </Flex>
    </Flex>
  );
}

DetailHeader.propTypes = {
  item: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default function PurchaseRequestDetail({ item, onEdit, onDelete, onRefresh }) {
  if (!item) return null;
  const urgency = PURCHASE_URGENCY[item.urgency] || PURCHASE_URGENCY.normal;
  const statusColor = item.derived_status?.color;
  const statusLabel = item.derived_status?.label || item.derived_status?.code || '—';

  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        <DetailHeader item={item} onEdit={onEdit} onDelete={onDelete} />
        <Tabs.Root defaultValue="detail">
          <Tabs.List>
            <Tabs.Trigger value="detail">Détail</Tabs.Trigger>
            <Tabs.Trigger value="history">Historique</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="detail">
            <Flex direction="column" gap="3" pt="3">
              <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', alignItems: 'stretch' }}>
                <DaInfoCard item={item} urgency={urgency} statusColor={statusColor} statusLabel={statusLabel} />
                <InterventionCard intervention={item.intervention} />
                <StockItemCard part={item.part} stockItem={item.stock_item} />
              </Box>
              <Separator size="4" />
              <OrderLinesSection
                orderLines={item.order_lines || []}
                itemQuantity={item.quantity}
                itemUnit={item.unit}
              />
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="history">
            <PurchaseEntityHistoryTab entityType={PURCHASE_ENTITY_TYPES.PURCHASE_REQUEST} entityId={item.id} />
          </Tabs.Content>
        </Tabs.Root>
      </Flex>
    </Box>
  );
}

PurchaseRequestDetail.propTypes = {
  item: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onRefresh: PropTypes.func,
};
