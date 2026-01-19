/**
 * Ligne d'affichage pour une demande d'achat (tableau principal).
 */

import PropTypes from "prop-types";
import { Fragment } from "react";
import { Table, Text, Badge, Button, Flex } from "@radix-ui/themes";

import StockRefLink from "@/components/common/StockRefLink";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import PurchaseRequestDetailsPanel from "@/components/purchase/requests/PurchaseRequestDetailsPanel";
import DeletePurchaseRequestButton from "@/components/purchase/requests/DeletePurchaseRequestButton";
import { StatusBadges, renderUrgencyBadge } from "@/components/purchase/requests/purchaseRequestRow.helpers";

// eslint-disable-next-line complexity
export default function PurchaseRequestRow({
  request,
  age,
  stockItem,
  stockRef,
  hasMissing,
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
  return (
    <Fragment>
      <Table.Row>
        <Table.Cell style={{ background: `color-mix(in srgb, ${getAgeColor(age)} 30%, transparent)` }}>
          <Text weight="medium" size="3">
            {request.itemLabel || stockItem?.name || "-"}
          </Text>
        </Table.Cell>
        <Table.Cell>
          <StatusBadges request={request} hasMissing={hasMissing} age={age} />
        </Table.Cell>
        <Table.Cell>{renderUrgencyBadge(request.urgency)}</Table.Cell>
        <Table.Cell>
          {stockRef ? (
            <StockRefLink reference={stockRef} tab="stock" color="green" variant="soft" />
          ) : hasLink ? (
            <Badge color="amber" variant="outline">
              À définir
            </Badge>
          ) : (
            <Text color="gray" size="2">-</Text>
          )}
        </Table.Cell>
        <Table.Cell>
          <Text weight="medium">{request.quantity || "-"}</Text>
        </Table.Cell>
        <Table.Cell style={{ background: `color-mix(in srgb, ${getAgeColor(age)} 30%, transparent)` }}>
          <Text weight="medium">{age}j</Text>
        </Table.Cell>
        <Table.Cell>
          <Flex gap="2" align="center">
            <Button
              size="1"
              variant={detailsExpandedId === request.id || expandedRequestId === request.id ? "solid" : "soft"}
              color={detailsExpandedId === request.id || expandedRequestId === request.id ? "blue" : "gray"}
              loading={detailsLoading}
              onClick={async () => {
                // Toujours ouvrir/fermer le panel
                const isCurrentlyExpanded = detailsExpandedId === request.id || expandedRequestId === request.id;
                
                if (hasMissing) {
                  // Cas 1: données manquantes - utiliser l'expansion de recherche
                  onToggleExpand(request.id);
                } else if (request.stockItemId) {
                  // Cas 2: données complètes - ouvrir le panel de détails
                  const shouldOpen = !isCurrentlyExpanded;
                  
                  // Charger les données avant d'ouvrir
                  if (shouldOpen) {
                    await onLoadDetailsData(request.id);
                  }
                  
                  // Puis ouvrir/fermer le panel
                  setDetailsExpandedId(shouldOpen ? request.id : null);
                }
              }}
            >
              Détails
            </Button>
            <DeletePurchaseRequestButton
              requestId={request.id}
              isConfirming={deleteConfirmId === request.id}
              onClick={handleDeleteButtonClick}
              disabled={deleteLoading}
              size="1"
            />
          </Flex>
        </Table.Cell>
      </Table.Row>
      {expandedRequestId === request.id && (
        <Table.Row>
          <Table.Cell colSpan={colSpan}>{renderExpandedContent?.(request)}</Table.Cell>
        </Table.Row>
      )}
      {detailsExpandedId === request.id && request.stockItemId && (
        <ExpandableDetailsRow colSpan={colSpan} withCard={false}>
          <PurchaseRequestDetailsPanel
            request={request}
            stockItem={stockItem}
            supplierRefs={getSupplierRefsForItem(request.stockItemId)}
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
  hasMissing: PropTypes.bool.isRequired,
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
