/**
 * @fileoverview Ligne du tableau principal des paniers fournisseurs
 *
 * Composant pour afficher une ligne de commande avec actions.
 *
 * @module components/purchase/orders/OrderRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { Fragment } from "react";
import PropTypes from 'prop-types';
import { Table, Flex, Text, Button, Badge, Select, DropdownMenu } from "@radix-ui/themes";
import { MoreHorizontal, FolderOpen, Send, Mail, PackageCheck, Archive, XCircle } from "lucide-react";
import {
  getOrderNumber,
  getCreatedAt,
  getSupplierObj,
  getTotalAmount,
  getLineCount,
  getAgeInDays,
  getAgeColor,
  isBlockingOrder,
} from "./supplierOrdersConfig";
import { getSupplierOrderStatus } from "@/config/purchasingConfig";
import { isUrgentOrder, getPrimaryActionConfig, shouldShowAmount } from "./orderRowHelpers";

/**
 * Rend le contenu du montant
 */
const renderAmount = (status, amount, currency) => {
  const showAmount = shouldShowAmount(status) && Number(amount) > 0;
  const isOpen = status === "OPEN";
  
  return showAmount
    ? <Text weight="medium">{Number(amount).toFixed(2)} {currency || "EUR"}</Text>
    : isOpen
    ? <Text color="gray">—</Text>
    : <Text color="amber" size="1" style={{ fontStyle: "italic" }}>À saisir</Text>;
};

const renderOrderNumber = (order, isBlocking, isUrgent) => (
  <Flex align="center" gap="2">
    {isUrgent && <Badge color="red" variant="solid" size="1">Urgent</Badge>}
    {isBlocking && <Text title="Panier bloqué">⚠️</Text>}
    <Text weight="bold" family="mono">{getOrderNumber(order) || "—"}</Text>
  </Flex>
);

const STATUS_ICONS = {
  FolderOpen,
  Send,
  Mail,
  PackageCheck,
  Archive,
  XCircle,
};

const renderStatusBadge = (statusConfig) => {
  const Icon = statusConfig.icon ? STATUS_ICONS[statusConfig.icon] : null;
  return (
    <Badge color={statusConfig.color} variant="solid" size="2">
      {Icon ? <Icon size={16} style={{ marginRight: 4 }} /> : null}
      {statusConfig.label}
    </Badge>
  );
};

const renderLineCountBadge = (lineCount) => (
  <Badge color="gray" variant="soft">
    {lineCount} ligne{lineCount > 1 ? "s" : ""}
  </Badge>
);

const renderAgeBadge = (ageDays, ageColor) => (
  <Badge color={ageColor} variant="soft">
    {ageDays != null ? `${ageDays} j` : "—"}
  </Badge>
);

/**
 * Ligne du tableau des paniers fournisseurs
 * @component
 * @param {Object} props
 * @param {Object} props.order - Données commande
 * @param {Array} props.orderLines - Lignes commande
 * @param {Map} props.cachedLines - Cache lignes
 * @param {Function} props.onViewDetails - Voir détails
 * @param {Function} props.onStatusChange - Changement statut
 * @param {Function} props.onExportCSV - Export CSV
 * @param {Function} props.onSendEmail - Envoi email
 * @param {Function} props.onCopyHTMLEmail - Copie email HTML
 * @returns {JSX.Element}
 */
export default function OrderRow({
  order,
  loading = false,
  cachedLines = new Map(),
  onViewDetails,
  onStatusChange,
  onExportCSV,
  onSendEmail,
  onCopyHTMLEmail,
  onPurge,
}) {
  const lineCount = getLineCount(order);
  const ageDays = getAgeInDays(getCreatedAt(order));
  const isBlocking = isBlockingOrder(order.status, ageDays);
  const ageColor = getAgeColor(order);
  const isUrgent = isUrgentOrder(cachedLines, order.id);
  const statusConfig = getSupplierOrderStatus(order.status);

  const primaryAction = getPrimaryActionConfig(order.status, onViewDetails, onSendEmail);

  return (
    <Fragment>
      <Table.Row>
        <Table.Cell>
          {renderOrderNumber(order, isBlocking, isUrgent)}
        </Table.Cell>

        <Table.Cell>
          <Text weight="medium">{getSupplierObj(order)?.name || "—"}</Text>
        </Table.Cell>

        <Table.Cell>
          {renderStatusBadge(statusConfig)}
        </Table.Cell>

        <Table.Cell>
          {renderLineCountBadge(lineCount)}
        </Table.Cell>

        <Table.Cell>
          {renderAmount(order.status, getTotalAmount(order), order.currency)}
        </Table.Cell>

        <Table.Cell>
          {renderAgeBadge(ageDays, ageColor)}
        </Table.Cell>

        <Table.Cell>
          <Flex gap="2" wrap="wrap" align="center">
            {primaryAction && (
              <Button
                size="1"
                variant="solid"
                color={primaryAction.color}
                onClick={primaryAction.onClick}
                disabled={loading}
              >
                {primaryAction.label}
              </Button>
            )}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="1" variant="ghost" color="gray" aria-label="Autres actions">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onSelect={onViewDetails}>Voir les détails</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onExportCSV}>Export CSV</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onSendEmail}>📧 Email texte (mailto)</DropdownMenu.Item>
                <DropdownMenu.Item onSelect={onCopyHTMLEmail}>📋 Copier email HTML</DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item color="red" onSelect={onPurge}>
                  🗑️ Purger le panier
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <Select.Root
              value={order.status}
              onValueChange={(value) => onStatusChange(order.id, value)}
              disabled={loading}
            >
              <Select.Trigger variant="soft" size="1" style={{ minWidth: '140px' }} />
              <Select.Content>
                <Select.Item value="OPEN">Ouvert</Select.Item>
                <Select.Item value="SENT">Envoyé (attente)</Select.Item>
                <Select.Item value="ACK">Réponse reçue</Select.Item>
                <Select.Item value="RECEIVED">Commandé</Select.Item>
                <Select.Item value="CLOSED">Clôturé</Select.Item>
                <Select.Item value="CANCELLED">Annulé</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
        </Table.Cell>
      </Table.Row>

    </Fragment>
  );
}

// ===== PROP TYPES =====
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
    supplier: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    supplier_id: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  }).isRequired,
  loading: PropTypes.bool,
  cachedLines: PropTypes.instanceOf(Map),
  onViewDetails: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onSendEmail: PropTypes.func.isRequired,
  onCopyHTMLEmail: PropTypes.func.isRequired,
  onPurge: PropTypes.func.isRequired,
};
