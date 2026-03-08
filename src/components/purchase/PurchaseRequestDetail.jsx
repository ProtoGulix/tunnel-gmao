/**
 * @fileoverview Détail complet d'une demande d'achat (panel inline)
 * @module components/purchase/PurchaseRequestDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Table, Text, Separator } from '@radix-ui/themes';
import { ExternalLink, Package, Wrench, ShoppingCart, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PRIORITY_CONFIG } from '@/config/interventionTypes';
import { hexBadgeStyle, PURCHASE_URGENCY, INTERVENTION_STATUS_COLORS } from '@/config/purchaseConfig';
import { useSupplierOrderStatuses } from '@/hooks/purchase/useSupplierOrders';

function DetailRow({ label, children }) {
  return (
    <Flex align="start" gap="2" py="1">
      <Text size="1" color="gray" style={{ minWidth: 90, flexShrink: 0 }}>{label}</Text>
      <Box style={{ flex: 1 }}>{children}</Box>
    </Flex>
  );
}

function CardHeader({ icon: Icon, title, color = 'var(--gray-9)' }) {
  return (
    <Flex
      align="center"
      gap="2"
      px="3"
      py="2"
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

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

CardHeader.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  color: PropTypes.string,
};

export default function PurchaseRequestDetail({ item, onEdit, onDelete }) {
  const { map: orderStatuses } = useSupplierOrderStatuses();

  if (!item) return null;
  const urgency = PURCHASE_URGENCY[item.urgency] || PURCHASE_URGENCY.normal;
  const statusColor = item.derived_status?.color;
  const statusLabel = item.derived_status?.label || item.derived_status?.code || '—';

  return (
    <Box p="4">
      <Flex direction="column" gap="3">

        {/* Header */}
        <Flex align="center" justify="between" gap="2">
          <Flex align="center" gap="2">
            <ShoppingCart size={16} color="var(--blue-9)" />
            <Text size="3" weight="bold">{item.item_label}</Text>
            {item.urgent && (
              <Badge color="red" variant="solid" size="1">
                <AlertTriangle size={10} /> Urgent
              </Badge>
            )}
          </Flex>
          <Flex gap="2">
            {onEdit && (
              <Button size="1" variant="soft" onClick={onEdit}>
                <Edit2 size={12} /> Modifier
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

        {/* Grille 3 colonnes : DA · Intervention · Pièce catalogue */}
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', alignItems: 'stretch' }}>

          {/* Colonne 1 — Infos DA */}
          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader icon={ShoppingCart} title="Demande d'achat" color="var(--blue-9)" />
            <Flex direction="column" gap="1">
              <Flex gap="1" wrap="wrap" mb="1">
                <Badge
                  size="1"
                  style={statusColor ? { background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` } : {}}
                >
                  {statusLabel}
                </Badge>
                <Badge color={urgency.color} variant="soft" size="1">{urgency.label}</Badge>
                {item.urgent && (
                  <Badge color="red" variant="solid" size="1">
                    <AlertTriangle size={10} /> Urgent
                  </Badge>
                )}
              </Flex>
              <DetailRow label="Quantité">
                <Text size="2" weight="medium">{item.quantity} {item.unit || 'pcs'}</Text>
              </DetailRow>
              <DetailRow label="Demandeur">
                <Text size="2">{item.requester_name || item.requested_by || '—'}</Text>
              </DetailRow>
              {item.workshop && (
                <DetailRow label="Atelier">
                  <Text size="2">{item.workshop}</Text>
                </DetailRow>
              )}
              {item.reason && (
                <DetailRow label="Motif">
                  <Text size="2" color="gray">{item.reason}</Text>
                </DetailRow>
              )}
              {item.notes && (
                <DetailRow label="Notes">
                  <Text size="2" color="gray">{item.notes}</Text>
                </DetailRow>
              )}
              <DetailRow label="Créée le">
                <Text size="2" color="gray">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </Text>
              </DetailRow>
            </Flex>
          </Card>

          {/* Colonne 2 — Intervention liée */}
          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader icon={Wrench} title="Intervention liée" />
            {item.intervention ? (
              <Flex direction="column" gap="1">
                <Flex align="center" gap="2" mb="1">
                  <Badge
                    size="1"
                    variant="soft"
                    color={PRIORITY_CONFIG[item.intervention.priority?.toLowerCase()]?.color || 'gray'}
                  >
                    {item.intervention.code}
                  </Badge>
                  <Link to={`/intervention/${item.intervention.id}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={12} color="var(--blue-9)" />
                  </Link>
                </Flex>
                {item.intervention.title && (
                  <Text size="1" color="gray" mb="1">{item.intervention.title}</Text>
                )}
                {item.intervention.status_actual && (
                  <DetailRow label="Statut">
                    <Badge size="1" variant="soft" color={INTERVENTION_STATUS_COLORS[item.intervention.status_actual] || 'gray'}>
                      {item.intervention.status_actual.replace(/_/g, ' ')}
                    </Badge>
                  </DetailRow>
                )}
                {item.intervention.priority && (
                  <DetailRow label="Priorité">
                    <Badge size="1" variant="soft" color={PRIORITY_CONFIG[item.intervention.priority?.toLowerCase()]?.color || 'gray'}>
                      {item.intervention.priority}
                    </Badge>
                  </DetailRow>
                )}
                {item.intervention.equipement && (
                  <DetailRow label="Équipement">
                    <Flex direction="column">
                      <Text size="2" weight="medium">{item.intervention.equipement.code}</Text>
                      <Text size="1" color="gray">{item.intervention.equipement.name}</Text>
                    </Flex>
                  </DetailRow>
                )}
              </Flex>
            ) : (
              <Flex direction="column" align="center" justify="center" gap="1" py="4">
                <Wrench size={22} color="var(--gray-5)" />
                <Text size="1" color="gray">Aucune intervention liée</Text>
              </Flex>
            )}
          </Card>

          {/* Colonne 3 — Pièce catalogue */}
          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader icon={Package} title="Pièce catalogue" />
            {item.stock_item ? (
              <Flex direction="column" gap="1">
                <Flex align="center" gap="2" mb="1">
                  <Link to={`/stock?q=${encodeURIComponent(item.stock_item.ref)}`} style={{ display: 'contents' }}>
                    <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer' }}>
                      {item.stock_item.ref}
                    </Badge>
                  </Link>
                  <Link to={`/stock?q=${encodeURIComponent(item.stock_item.ref)}`} style={{ display: 'flex', alignItems: 'center' }}>
                    <ExternalLink size={12} color="var(--blue-9)" />
                  </Link>
                </Flex>
                <Text size="2" weight="medium" mb="1">{item.stock_item.name}</Text>
                {item.stock_item.family_code && (
                  <DetailRow label="Famille">
                    <Text size="2">{item.stock_item.family_code}{item.stock_item.sub_family_code ? ` / ${item.stock_item.sub_family_code}` : ''}</Text>
                  </DetailRow>
                )}
                {item.stock_item.location && (
                  <DetailRow label="Emplacement">
                    <Text size="2">{item.stock_item.location}</Text>
                  </DetailRow>
                )}
                <DetailRow label="Stock">
                  <Text size="2">{item.stock_item.quantity ?? '—'} {item.stock_item.unit || item.unit || 'pcs'}</Text>
                </DetailRow>
                {item.stock_item.supplier_refs_count != null && (
                  <DetailRow label="Fournisseurs">
                    <Text size="2">{item.stock_item.supplier_refs_count} référencé{item.stock_item.supplier_refs_count > 1 ? 's' : ''}</Text>
                  </DetailRow>
                )}
              </Flex>
            ) : (
              <Flex direction="column" align="center" justify="center" gap="1" py="4">
                <Package size={22} color="var(--gray-5)" />
                <Text size="1" color="gray">Aucune pièce catalogue</Text>
              </Flex>
            )}
          </Card>
        </Box>

        {/* Lignes de commande */}
        {item.order_lines && item.order_lines.length > 0 && (
          <>
            <Separator size="4" />
            <Box>
              <Flex align="center" gap="2" mb="2">
                <ShoppingCart size={14} color="var(--gray-9)" />
                <Text size="2" weight="bold" color="gray">
                  Paniers fournisseurs ({item.order_lines.length})
                </Text>
              </Flex>
              <Card size="1" variant="surface" style={{ overflow: 'auto' }}>
                <Table.Root size="1">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>N° panier</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Réf. fabricant</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="center">Qté allouée</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Prix u.</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="right">Total</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="center">Délai</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell align="center">Reçu</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>État</Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {item.order_lines.map((line, i) => {
                      const statusInfo = orderStatuses[line.supplier_order_status] ?? { label: line.supplier_order_status || '—', color: 'gray' };
                      const lineBadgeStyle = hexBadgeStyle(statusInfo.color);
                      const price = line.unit_price ?? line.quote_price;
                      const total = line.total_price ?? (price != null ? price * (line.quantity_allocated ?? item.quantity) : null);
                      return (
                        <Table.Row
                          key={line.id || i}
                          style={line.is_selected ? { background: 'var(--green-2)' } : undefined}
                        >
                          <Table.Cell>
                            {line.supplier_order_number
                              ? <Badge variant="outline" size="1" color="blue">{line.supplier_order_number}</Badge>
                              : <Text size="1" color="gray">—</Text>}
                          </Table.Cell>
                          <Table.Cell>
                            <Flex direction="column" gap="1">
                              <Text size="2" weight="medium">{line.supplier?.name || '—'}</Text>
                              {line.supplier?.code && (
                                <Text size="1" color="gray">{line.supplier.code}</Text>
                              )}
                            </Flex>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge size="1" {...(lineBadgeStyle ? { style: lineBadgeStyle } : { color: statusInfo.color, variant: 'soft' })}>
                              {statusInfo.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            {line.manufacturer_ref
                              ? (
                                <Flex direction="column" gap="1">
                                  <Text size="1" weight="medium">{line.manufacturer_ref}</Text>
                                  {line.manufacturer && <Text size="1" color="gray">{line.manufacturer}</Text>}
                                </Flex>
                              )
                              : <Text size="1" color="gray">—</Text>}
                          </Table.Cell>
                          <Table.Cell align="center">
                            <Text size="2">{line.quantity_allocated ?? item.quantity} {item.unit || 'pcs'}</Text>
                          </Table.Cell>
                          <Table.Cell align="right">
                            {price != null
                              ? <Text size="2">{Number(price).toFixed(2)} €</Text>
                              : <Text size="1" color="gray">—</Text>}
                          </Table.Cell>
                          <Table.Cell align="right">
                            {total != null
                              ? <Text size="2" weight="medium">{Number(total).toFixed(2)} €</Text>
                              : <Text size="1" color="gray">—</Text>}
                          </Table.Cell>
                          <Table.Cell align="center">
                            {line.lead_time_days != null
                              ? <Text size="1" color="gray">{line.lead_time_days}j</Text>
                              : <Text size="1" color="gray">—</Text>}
                          </Table.Cell>
                          <Table.Cell align="center">
                            {line.quantity_received > 0
                              ? <Badge size="1" variant="soft" color="teal">{line.quantity_received} / {line.quantity_allocated ?? item.quantity}</Badge>
                              : <Text size="1" color="gray">0</Text>}
                          </Table.Cell>
                          <Table.Cell>
                            <Flex gap="1" wrap="wrap">
                              {line.is_selected && (
                                <Badge variant="solid" size="1" color="green">Sélectionné</Badge>
                              )}
                              {line.quote_received && (
                                <Badge variant="soft" size="1" color="orange">Devis reçu</Badge>
                              )}
                              {!line.is_selected && !line.quote_received && (
                                <Text size="1" color="gray">En attente</Text>
                              )}
                            </Flex>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Card>
            </Box>
          </>
        )}
      </Flex>
    </Box>
  );
}

PurchaseRequestDetail.propTypes = {
  item: PropTypes.object,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
