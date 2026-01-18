/**
 * @fileoverview Ligne du tableau principal des paniers fournisseurs
 * @module components/purchase/orders/OrderRow
 */

/* eslint-disable complexity */
import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Table, Flex, Text, Button, Badge, Select, DropdownMenu } from '@radix-ui/themes';
import { MoreHorizontal, Mail, FolderOpen, Send, PackageCheck, Archive, XCircle, Lock } from 'lucide-react';
import ToggleDetailsButton from '@/components/common/ToggleDetailsButton';
import {
  getOrderNumber,
  getCreatedAt,
  getSupplierObj,
  getLineCount,
  getAgeInDays,
  getAgeColor,
  isBlockingOrder,
} from '../supplierOrdersConfig';
import { getSupplierOrderStatus } from '@/config/purchasingConfig';
import { LineCountBadge, AgeBadge, UrgencyBadge, BlockingBadge } from './BadgeRenderers';

const STATUS_ICONS = {
  FolderOpen,
  Send,
  Mail,
  PackageCheck,
  Archive,
  XCircle,
};

/**
 * Ligne du tableau des paniers fournisseurs
 * @component
 * @eslint-disable complexity
 */
export default function OrderRow({
  order,
  loading = false,
  isExpanded = false,
  onViewDetails,
  onStatusChange,
  onExportCSV,
  onSendEmail,
  onCopyHTMLEmail,
  onPurge,
  onReEvaluateDA,
  isLocked = false,
}) {
  const lineCount = getLineCount(order);
  const ageDays = getAgeInDays(getCreatedAt(order));
  const isBlocking = isBlockingOrder(order.status, ageDays);
  const ageColor = getAgeColor(order);
  const urgencyLevel = order.urgencyLevel || 'low';
  const statusConfig = getSupplierOrderStatus(order.status);

  return (
    <Fragment>
      <Table.Row>
        {/* Fournisseur / N° Commande */}
        <Table.Cell>
          <Flex direction="column" gap="2" align="start" justify="center">
            <Flex gap="2" align="center" wrap="wrap">
              <Text weight="bold" size="2">{getSupplierObj(order)?.name || '—'}</Text>
              <BlockingBadge isBlocking={isBlocking} />
            </Flex>
            <Badge variant="soft" color="gray" size="1" style={{ fontFamily: 'monospace' }}>
              {getOrderNumber(order)}
            </Badge>
          </Flex>
        </Table.Cell>

        {/* Âge (j) */}
        <Table.Cell>
          <AgeBadge ageDays={ageDays} ageColor={ageColor} />
        </Table.Cell>

        {/* Nb lignes */}
        <Table.Cell>
          <LineCountBadge lineCount={lineCount} />
        </Table.Cell>

        {/* Urgence */}
        <Table.Cell>
          <UrgencyBadge urgencyLevel={urgencyLevel} />
        </Table.Cell>

        {/* Statut avec sélecteur */}
        <Table.Cell>
          <Select.Root
            value={order.status}
            onValueChange={(value) => onStatusChange(order.id, value)}
            disabled={loading || isLocked}
          >
            <Select.Trigger variant="soft" size="1" color={statusConfig.color} disabled={isLocked}>
              <Flex align="center" gap="1">
                {statusConfig.icon && (() => {
                  const Icon = STATUS_ICONS[statusConfig.icon];
                  return Icon ? <Icon size={14} /> : null;
                })()}
                {statusConfig.label}
                {isLocked && <Lock size={12} style={{ marginLeft: 4 }} title="Panier verrouillé" />}
              </Flex>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="OPEN">Ouvert</Select.Item>
              <Select.Item value="SENT">Envoyé (attente)</Select.Item>
              <Select.Item value="ACK">Réponse reçue</Select.Item>
              <Select.Item value="RECEIVED">Commandé</Select.Item>
              <Select.Item value="CLOSED">Clôturé</Select.Item>
              <Select.Item value="CANCELLED">Annulé</Select.Item>
            </Select.Content>
          </Select.Root>
        </Table.Cell>

        {/* Actions */}
        <Table.Cell style={{ width: '200px' }}>
          <Flex gap="2" align="center" justify="end">
            <ToggleDetailsButton
              isExpanded={isExpanded}
              onToggle={onViewDetails}
              showText={true}
              size="1"
              label="Afficher/masquer les détails du panier"
            />
            <Button
              size="1"
              variant="soft"
              color="blue"
              onClick={onSendEmail}
            >
              <Mail size={16} />
              Email
            </Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="1" variant="ghost" color="gray">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={onCopyHTMLEmail}>
                  Copier email HTML
                </DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onExportCSV}>
                  Export CSV
                </DropdownMenu.Item>
                {onReEvaluateDA && (
                  <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={onReEvaluateDA} color="orange">
                      Réévaluer statuts DA
                    </DropdownMenu.Item>
                  </>
                )}
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onSelect={onPurge}>
                  Purger le panier
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Table.Cell>
      </Table.Row>
    </Fragment>
  );
}

OrderRow.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    orderNumber: PropTypes.string,
    order_number: PropTypes.string,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    created_at: PropTypes.string,
    totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    lineCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    line_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    urgencyLevel: PropTypes.oneOf(['low', 'normal', 'high']),
    supplier: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    supplier_id: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  }).isRequired,
  loading: PropTypes.bool,
  isExpanded: PropTypes.bool,
  isLocked: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onSendEmail: PropTypes.func.isRequired,
  onCopyHTMLEmail: PropTypes.func.isRequired,
  onPurge: PropTypes.func.isRequired,
  onReEvaluateDA: PropTypes.func,
};
