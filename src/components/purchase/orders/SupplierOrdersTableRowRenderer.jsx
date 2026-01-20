import { Fragment } from "react";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import OrderRow from "./OrderRow";
import OrderLineTable from "./OrderLineTable";
import { normalizeBasketStatus } from "@/lib/purchasing/basketItemRules";

export const createRowRenderer = ({
  expandedOrderId,
  cachedLines,
  handleViewDetails,
  wrappedHandleStatusChange,
  handleExportCSV,
  handleSendEmail,
  handleCopyHTMLEmail,
  handlePurgeOrder,
  handleReEvaluate,
  columnsLength,
  orderLines,
  loading,
  onRefresh,
  handleLineUpdate,
  onToggleItemSelection,
  twinValidationsByLine,
  onTwinValidationUpdate,
}) => {
  const renderer = (order) => {
    const isExpanded = expandedOrderId === order.id;
    const basketStatus = normalizeBasketStatus(order.status);
    // Autoriser le changement de statut pour les paniers commandés (ORDERED/RECEIVED)
    // On ne verrouille que les paniers clôturés pour garder la dropdown active.
    const isLocked = basketStatus === 'CLOSED';

    return (
      <Fragment key={order.id}>
        <OrderRow
          order={order}
          loading={loading}
          cachedLines={cachedLines}
          isExpanded={isExpanded}
          onViewDetails={() => handleViewDetails(order)}
          onStatusChange={wrappedHandleStatusChange}
          onExportCSV={() => handleExportCSV(order)}
          onSendEmail={() => handleSendEmail(order)}
          onCopyHTMLEmail={() => handleCopyHTMLEmail(order)}
          onPurge={() => handlePurgeOrder(order)}
          onReEvaluateDA={() => handleReEvaluate(order)}
          isLocked={isLocked}
        />

        {isExpanded && (
          <ExpandableDetailsRow colSpan={columnsLength} withCard={true}>
            <OrderLineTable
              order={order}
              orderLines={orderLines}
              onLineUpdate={handleLineUpdate}
              onRefresh={onRefresh}
              basketStatus={basketStatus}
              isLocked={isLocked}
              onToggleItemSelection={onToggleItemSelection}
              twinValidationsByLine={twinValidationsByLine}
              onTwinValidationUpdate={onTwinValidationUpdate}
            />
          </ExpandableDetailsRow>
        )}
      </Fragment>
    );
  };

  renderer.displayName = "SupplierOrdersTableRowRenderer";
  return renderer;
};
