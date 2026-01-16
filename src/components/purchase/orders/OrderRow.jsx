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
import { MoreHorizontal, Copy, Download, Mail, FolderOpen, Send, PackageCheck, Archive, XCircle } from "lucide-react";
import ToggleDetailsButton from "@/components/common/ToggleDetailsButton";
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
import { URGENCY_LEVELS } from "@/config/stockManagementConfig";
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
    : <Text color="gray" size="1" style={{ fontStyle: "italic" }}>À saisir</Text>;
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

const renderUrgencyBadge = (urgencyLevel) => {
  const urgencyConfig = URGENCY_LEVELS.find(u => u.value === urgencyLevel);
  if (!urgencyConfig || urgencyConfig.value === 'all') {
    return <Badge color="gray" variant="soft">Inconnue</Badge>;
  }
  return (
    <Badge color={urgencyConfig.color} variant={urgencyConfig.variant}>
      {urgencyConfig.label}
    </Badge>
  );
};

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
  isExpanded = false,
  onViewDetails,
  onStatusChange,
  onExportCSV,
  onSendEmail,
  onCopyHTMLEmail,
  onPurge,
  onReEvaluateDA,
}) {
  const lineCount = getLineCount(order);
  const ageDays = getAgeInDays(getCreatedAt(order));
  const isBlocking = isBlockingOrder(order.status, ageDays);
  const ageColor = getAgeColor(order);
  // Utiliser urgencyLevel de l'order si disponible, sinon fallback sur le cache
  const urgencyLevel = order.urgencyLevel || 'low';
  const isUrgent = urgencyLevel === 'high' || isUrgentOrder(cachedLines, order.id);
  const statusConfig = getSupplierOrderStatus(order.status);

  const primaryAction = getPrimaryActionConfig(order.status, onViewDetails, onSendEmail);

  return (
    <Fragment>
      <Table.Row>
        {/* Fournisseur / N° Commande (fournisseur en évidence) */}
        <Table.Cell>
          <Flex direction="column" gap="2" align="start" justify="center">
            <Flex gap="2" align="center" wrap="wrap">
              <Text weight="bold" size="2">{getSupplierObj(order)?.name || "—"}</Text>
              {isBlocking && <Badge color="red" size="1">⚠ &gt;7j</Badge>}
            </Flex>
            <Badge variant="soft" color="gray" size="1" style={{ fontFamily: 'monospace' }}>
              {getOrderNumber(order)}
            </Badge>
          </Flex>
        </Table.Cell>

        {/* Âge (j) - signal visuel simple */}
        <Table.Cell>
          {renderAgeBadge(ageDays, ageColor)}
        </Table.Cell>

        {/* Nb lignes */}
        <Table.Cell>
          {renderLineCountBadge(lineCount)}
        </Table.Cell>

        {/* Urgence */}
        <Table.Cell>
          {renderUrgencyBadge(urgencyLevel)}
        </Table.Cell>

        {/* Statut avec sélecteur */}
        <Table.Cell>
          <Select.Root
            value={order.status}
            onValueChange={(value) => onStatusChange(order.id, value)}
            disabled={loading}
          >
            <Select.Trigger variant="soft" size="1" color={statusConfig.color}>
              <Flex align="center" gap="1">
                {statusConfig.icon && (() => {
                  const Icon = STATUS_ICONS[statusConfig.icon];
                  return Icon ? <Icon size={14} /> : null;
                })()}
                {statusConfig.label}
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
    urgencyLevel: PropTypes.oneOf(['low', 'normal', 'high']),
    supplier: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    supplier_id: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  }).isRequired,
  loading: PropTypes.bool,
  cachedLines: PropTypes.instanceOf(Map),
  isExpanded: PropTypes.bool,
  onViewDetails: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onExportCSV: PropTypes.func.isRequired,
  onSendEmail: PropTypes.func.isRequired,
  onCopyHTMLEmail: PropTypes.func.isRequired,
  onPurge: PropTypes.func.isRequired,
  onReEvaluateDA: PropTypes.func,
};
