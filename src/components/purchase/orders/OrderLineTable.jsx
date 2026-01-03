/**
 * @fileoverview Tableau des lignes d'une commande fournisseur
 *
 * Affiche le détail des articles d'une commande avec informations
 * complètes (article, références, demandeurs, etc.).
 *
 * @module components/purchase/orders/OrderLineTable
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { Table, Flex, Text, Box, Badge } from "@radix-ui/themes";
import { Package } from "lucide-react";

// ===== DTO ACCESSORS =====
const getStock = (line) => line.stockItem ?? line.stock_item_id;
const getPurchaseRequests = (line) => line.purchaseRequests ?? line.purchase_requests ?? [];
const getPurchaseRequest = (pr) => pr.purchaseRequest ?? pr.purchase_request_id;

/**
 * Extrait le code intervention d'un objet intervention
 * @param {Object} interv - Objet intervention
 * @returns {string|null} Code ou id intervention
 */
const getIntervCode = (interv) => {
  if (!interv) return null;
  return typeof interv === 'object' ? (interv.code || interv.id) : interv;
};

/**
 * Récupère le code intervention d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {string|null} Code intervention ou null
 */
const getInterventionCode = (line) => {
  const prs = getPurchaseRequests(line);
  const first = getPurchaseRequest(prs[0]);
  if (!first) return null;
  const interv = first.intervention ?? first.intervention_id;
  return getIntervCode(interv);
};

/**
 * Récupère le nom du demandeur d'une PR
 * @param {Object} pr - Purchase request
 * @returns {string} Nom du demandeur
 */
const getRequesterName = (pr) => {
  const prObj = getPurchaseRequest(pr);
  return (prObj?.requested_by || prObj?.requestedBy || "—");
};

/**
 * Ligne du tableau détail (une ligne de commande)
 *
 * @component
 * @param {Object} props
 * @param {Object} props.line - Ligne de commande
 * @returns {JSX.Element}
 */
function OrderLineRow({ line }) {
  const stock = getStock(line);
  const prs = getPurchaseRequests(line);
  const interventionCode = getInterventionCode(line);
  return (
    <Table.Row key={line.id}>
      <Table.Cell>
        <Text weight="medium">{stock?.name || "—"}</Text>
      </Table.Cell>

      <Table.Cell>
        <Text family="mono" size="1">{stock?.ref || "—"}</Text>
      </Table.Cell>

      <Table.Cell>
        <Badge variant="soft" color="blue">
          {line.supplierRefSnapshot ?? line.supplier_ref_snapshot ?? "—"}
        </Badge>
      </Table.Cell>

      <Table.Cell>
        <Flex align="center" gap="1">
          <Package size={12} />
          <Text weight="medium">{line.quantity}</Text>
          {prs.length > 1 && (
            <Badge color="gray" size="1">{prs.length} DAs</Badge>
          )}
        </Flex>
      </Table.Cell>

      <Table.Cell>
        {interventionCode ? (
          <Badge color="blue" variant="soft" size="1">{interventionCode}</Badge>
        ) : (
          <Text color="gray" size="1">—</Text>
        )}
      </Table.Cell>

      <Table.Cell>
        <Flex direction="column" gap="1">
          {prs.slice(0, 2).map((pr, idx) => (
            <Text key={idx} size="1" color="gray">{getRequesterName(pr)}</Text>
          ))}
          {prs.length > 2 && (
            <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
              +{prs.length - 2} autre{prs.length > 3 ? "s" : ""}
            </Text>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quantity: PropTypes.number,
    supplierRefSnapshot: PropTypes.string,
    supplier_ref_snapshot: PropTypes.string,
    stockItem: PropTypes.object,
    stock_item_id: PropTypes.object,
    purchaseRequests: PropTypes.array,
    purchase_requests: PropTypes.array,
  }).isRequired,
};

/**
 * Tableau complet des lignes de commande
 *
 * @component
 * @param {Object} props
 * @param {Object} props.order - Commande parente
 * @param {Array} props.orderLines - Lignes de la commande
 * @returns {JSX.Element}
 */
export default function OrderLineTable({ order, orderLines = [] }) {
  const isLocked = ['RECEIVED', 'CLOSED'].includes(order.status);

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="bold">
          Lignes de commande ({orderLines.length})
        </Text>
        {isLocked && (
          <Badge color="red" variant="soft" size="1">
            🔒 Panier verrouillé
          </Badge>
        )}
      </Flex>

      <Table.Root variant="surface" size="1">
        <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
          <Table.Row>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Demandeur</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {orderLines.map((line) => (
            <OrderLineRow key={line.id} line={line} />
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

// ===== PROP TYPES =====
OrderLineTable.propTypes = {
  order: PropTypes.shape({
    status: PropTypes.string.isRequired,
  }).isRequired,
  orderLines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
};
