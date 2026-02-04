/**
 * @fileoverview Cellules de rendu pour PurchaseRequestRow
 */
import PropTypes from "prop-types";
import { Table, Text, Badge, Button, Flex, Box } from "@radix-ui/themes";
import StockRefLink from "@/components/common/StockRefLink";
import DeletePurchaseRequestButton from "@/components/purchase/requests/DeletePurchaseRequestButton";
import { StatusBadges, renderUrgencyBadge } from "@/components/purchase/requests/purchaseRequestRow.helpers";
import { normalizeBasketStatus } from "@/lib/purchasing/basketItemRules";

const getStatusColor = (status) => {
  const n = normalizeBasketStatus(status);
  if (n === "ORDERED" || n === "CLOSED") return "red";
  if (n === "RECEIVED") return "green";
  if (n === "SENT") return "orange";
  return "blue";
};

function OrderLineRow({ line, order }) {
  const num = order.order_number || order.orderNumber || order.id;
  const color = getStatusColor(order.status);
  return (
    <Table.Row>
      <Table.Cell><Badge variant="soft" color={color}>{num}</Badge></Table.Cell>
      <Table.Cell><Badge size="1" color={color}>{order.status || "—"}</Badge></Table.Cell>
      <Table.Cell><Text size="2">{line.stock_item_id?.name || "—"}</Text></Table.Cell>
      <Table.Cell><Text size="1" color="gray">{line.stock_item_id?.ref || "—"}</Text></Table.Cell>
      <Table.Cell><Text weight="medium">{line.quantity}</Text></Table.Cell>
      <Table.Cell>
        {line.is_selected
          ? <Badge color="green" size="1">Sélectionnée</Badge>
          : <Badge color="gray" size="1" variant="outline">Non sélectionnée</Badge>}
      </Table.Cell>
    </Table.Row>
  );
}

OrderLineRow.propTypes = { line: PropTypes.object.isRequired, order: PropTypes.object.isRequired };

export function OrderLinesExpandedSection({ groupedOrders, colSpan }) {
  const allLines = groupedOrders.flatMap((g) => g.lines.map((l) => ({ line: l, order: g.order })));
  if (allLines.length === 0) return null;

  return (
    <Table.Row>
      <Table.Cell colSpan={colSpan}>
        <Box py="2">
          <Text size="2" weight="bold" mb="2">Lignes de commande liées ({allLines.length})</Text>
          <Table.Root variant="surface" size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Panier</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Réf.</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Sélection</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {allLines.map(({ line, order }) => <OrderLineRow key={line.id} line={line} order={order} />)}
            </Table.Body>
          </Table.Root>
        </Box>
      </Table.Cell>
    </Table.Row>
  );
}

OrderLinesExpandedSection.propTypes = { groupedOrders: PropTypes.array.isRequired, colSpan: PropTypes.number.isRequired };

export function StockRefCell({ stockRef, hasLink }) {
  if (stockRef) return <Table.Cell><StockRefLink reference={stockRef} tab="stock" color="green" variant="soft" /></Table.Cell>;
  if (hasLink) return <Table.Cell><Badge color="amber" variant="outline">À définir</Badge></Table.Cell>;
  return <Table.Cell><Text color="gray" size="2">-</Text></Table.Cell>;
}

StockRefCell.propTypes = { stockRef: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), hasLink: PropTypes.bool.isRequired };

export function ActionsCell({ requestId, isExpanded, detailsLoading, onDetailsClick, deleteConfirmId, deleteLoading, handleDeleteButtonClick }) {
  return (
    <Table.Cell>
      <Flex gap="2" align="center">
        <Button size="1" variant={isExpanded ? "solid" : "soft"} color={isExpanded ? "blue" : "gray"} loading={detailsLoading} onClick={onDetailsClick}>
          Détails
        </Button>
        <DeletePurchaseRequestButton requestId={requestId} isConfirming={deleteConfirmId === requestId} onClick={handleDeleteButtonClick} disabled={deleteLoading} size="1" />
      </Flex>
    </Table.Cell>
  );
}

ActionsCell.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  detailsLoading: PropTypes.bool,
  onDetailsClick: PropTypes.func.isRequired,
  deleteConfirmId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deleteLoading: PropTypes.bool,
  handleDeleteButtonClick: PropTypes.func.isRequired,
};

export function MainRowCells({ request, age, stockItem, stockRef, hasLink, getAgeColor }) {
  const bg = { background: `color-mix(in srgb, ${getAgeColor(age)} 30%, transparent)` };
  return (
    <>
      <Table.Cell style={bg}><Text weight="medium" size="3">{request.itemLabel || stockItem?.name || "-"}</Text></Table.Cell>
      <Table.Cell><StatusBadges request={request} age={age} /></Table.Cell>
      <Table.Cell>{renderUrgencyBadge(request.urgency)}</Table.Cell>
      <StockRefCell stockRef={stockRef} hasLink={hasLink} />
      <Table.Cell><Text weight="medium">{request.quantity || "-"}</Text></Table.Cell>
      <Table.Cell style={bg}><Text weight="medium">{age}j</Text></Table.Cell>
    </>
  );
}

MainRowCells.propTypes = {
  request: PropTypes.object.isRequired,
  age: PropTypes.number.isRequired,
  stockItem: PropTypes.object,
  stockRef: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  hasLink: PropTypes.bool.isRequired,
  getAgeColor: PropTypes.func.isRequired,
};
