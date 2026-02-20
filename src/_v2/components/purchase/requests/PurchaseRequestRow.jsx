/**
 * Ligne d'affichage pour une demande d'achat (tableau principal).
 */

import PropTypes from "prop-types";
import { Fragment } from "react";
import { Table } from "@radix-ui/themes";

import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import PurchaseRequestDetailsPanel from "@/components/purchase/requests/PurchaseRequestDetailsPanel";
import {
  getOrderLineRelations,
  groupOrderLinesByOrder,
  createDetailsClickHandler,
  getExpandedStates,
} from "@/components/purchase/requests/purchaseRequestOrderLines.helpers";
import {
  OrderLinesExpandedSection,
  MainRowCells,
  ActionsCell,
} from "@/components/purchase/requests/PurchaseRequestRowCells";

export default function PurchaseRequestRow({
  request,
  age,
  stockItem,
  stockRef,
  hasLink,
  colSpan,
  renderExpandedContent,
  detailsExpandedId,
  expandedRequestId,
  detailsLoading,
  onToggleExpand,
  onLoadDetailsData,
  setDetailsExpandedId,
  getAgeColor,
  deleteConfirmId,
  deleteLoading,
  handleDeleteButtonClick,
  getSupplierRefsForItem,
  getStandardSpecsForItem,
  suppliers,
  onAddSupplierRef,
  onDeleteSupplierRef,
  onUpdateSupplierRef,
  onAddStandardSpec,
  onDeleteStandardSpec,
  onUpdateStandardSpec,
  loading,
  onCreateSupplier,
  allManufacturers,
}) {
  const isToQualify = request?.derived_status?.code === "TO_QUALIFY";
  const orderLineRelations = getOrderLineRelations(request);
  const hasOrderLines = Array.isArray(orderLineRelations) && orderLineRelations.length > 0;
  const groupedOrders = groupOrderLinesByOrder(orderLineRelations, request);
  const isExpanded = detailsExpandedId === request.id || expandedRequestId === request.id;
  const supplierRefsForItem = request?.stockItemId ? getSupplierRefsForItem(request.stockItemId) : [];
  const hasSupplierRefs = (request?.stockItemSupplierRefsCount ?? supplierRefsForItem.length ?? 0) > 0;

  const handleDetailsClick = createDetailsClickHandler({
    request,
    isToQualify,
    hasOrderLines,
    hasSupplierRefs,
    isExpanded,
    onToggleExpand,
    setDetailsExpandedId,
    onLoadDetailsData,
  });

  const { showQualifyExpanded, showOrderLinesExpanded, showDetailsPanel } = getExpandedStates({
    request,
    expandedRequestId,
    detailsExpandedId,
    isToQualify,
    hasOrderLines,
    hasSupplierRefs,
  });

  return (
    <Fragment>
      <Table.Row>
        <MainRowCells
          request={request}
          age={age}
          stockItem={stockItem}
          stockRef={stockRef}
          hasLink={hasLink}
          getAgeColor={getAgeColor}
        />
        <ActionsCell
          requestId={request.id}
          isExpanded={isExpanded}
          detailsLoading={detailsLoading}
          onDetailsClick={handleDetailsClick}
          deleteConfirmId={deleteConfirmId}
          deleteLoading={deleteLoading}
          handleDeleteButtonClick={handleDeleteButtonClick}
        />
      </Table.Row>
      {showQualifyExpanded && (
        <Table.Row>
          <Table.Cell colSpan={colSpan}>{renderExpandedContent?.(request)}</Table.Cell>
        </Table.Row>
      )}
      {showOrderLinesExpanded && (
        <OrderLinesExpandedSection groupedOrders={groupedOrders} colSpan={colSpan} />
      )}
      {showDetailsPanel && (
        <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
          <PurchaseRequestDetailsPanel
            request={request}
            stockItem={stockItem}
            supplierRefs={supplierRefsForItem}
            standardSpecs={getStandardSpecsForItem(request.stockItemId)}
            suppliers={suppliers}
            onAddSupplierRef={onAddSupplierRef}
            onDeleteSupplierRef={onDeleteSupplierRef}
            onUpdateSupplierRef={onUpdateSupplierRef}
            onAddStandardSpec={onAddStandardSpec}
            onDeleteStandardSpec={onDeleteStandardSpec}
            onUpdateStandardSpec={onUpdateStandardSpec}
            loading={loading}
            onCreateSupplier={onCreateSupplier}
            allManufacturers={allManufacturers}
          />
        </ExpandableDetailsRow>
      )}
    </Fragment>
  );
}

PurchaseRequestRow.propTypes = {
  request: PropTypes.object.isRequired,
  age: PropTypes.number.isRequired,
  stockItem: PropTypes.object,
  stockRef: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  hasLink: PropTypes.bool.isRequired,
  colSpan: PropTypes.number.isRequired,
  renderExpandedContent: PropTypes.func,
  detailsExpandedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  expandedRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  detailsLoading: PropTypes.bool,
  onToggleExpand: PropTypes.func.isRequired,
  onLoadDetailsData: PropTypes.func.isRequired,
  setDetailsExpandedId: PropTypes.func.isRequired,
  getAgeColor: PropTypes.func.isRequired,
  deleteConfirmId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  deleteLoading: PropTypes.bool,
  handleDeleteButtonClick: PropTypes.func.isRequired,
  getSupplierRefsForItem: PropTypes.func.isRequired,
  getStandardSpecsForItem: PropTypes.func.isRequired,
  suppliers: PropTypes.array,
  onAddSupplierRef: PropTypes.func,
  onDeleteSupplierRef: PropTypes.func,
  onUpdateSupplierRef: PropTypes.func,
  onAddStandardSpec: PropTypes.func,
  onDeleteStandardSpec: PropTypes.func,
  onUpdateStandardSpec: PropTypes.func,
  loading: PropTypes.bool,
  onCreateSupplier: PropTypes.func,
  allManufacturers: PropTypes.array,
};
