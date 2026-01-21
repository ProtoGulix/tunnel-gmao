/**
 * Tableau des demandes d'achat avec expansion, qualification et références.
 * Design simplifié : badges de statut visibles + bouton Détails pour accéder à tout.
 */

import { Fragment, useState, useMemo, useCallback } from "react";
import { Package } from "lucide-react";
import DataTable from "@/components/common/DataTable";
import { useDeletePurchaseRequest } from "@/hooks/useDeletePurchaseRequest";
import PurchaseRequestRow from "@/components/purchase/requests/PurchaseRequestRow";
import { getAgeColor, sortRequests, COLUMNS } from "@/components/purchase/requests/purchaseRequestsTable.helpers.jsx";
import { purchaseRequestsTablePropTypes } from "@/components/purchase/requests/purchaseRequestsTable.propTypes";

// eslint-disable-next-line complexity
export default function PurchaseRequestsTable({
  requests,
  interventionId, // Si fourni, filtre les demandes par intervention
  expandedRequestId,
  renderExpandedContent = () => null,
  stockItems = [],
  supplierRefs = {},
  standardSpecs = {},
  onRefresh,
  onAddSupplierRef,
  onAddStandardSpec,
  onDeleteStandardSpec,
  onUpdateStandardSpec,
  suppliers = [],
  loading = false,
  setDispatchResult,
  compact = false,
  onDeleteSupplierRef,
  onUpdateSupplierRef,
  onCreateSupplier,
  onToggleExpand = () => {},
  allManufacturers = [],
  onLoadDetailsData = () => {},
  detailsLoadingStates = {},
}) {
  const [detailsExpandedId, setDetailsExpandedId] = useState(null);

  // Filtrage automatique par intervention si interventionId fourni
  const filteredRequests = useMemo(() => {
    if (!interventionId) return requests;
    return requests.filter(req => req.interventionId === interventionId);
  }, [requests, interventionId]);

  // Hook pour gérer la suppression avec double-clic
  const {
    deleteConfirmId,
    deleteLoading,
    handleDeleteButtonClick,
  } = useDeletePurchaseRequest(async () => {
    await onRefresh?.();
    setDispatchResult?.({
      type: "success",
      message: "Demande d'achat supprimée",
    });
    setTimeout(() => setDispatchResult?.(null), 3000);
  });

  // ========== HELPERS ==========
  const getStockItemDetails = useCallback((stockItemId) => {
    if (!stockItemId) return null;
    return stockItems.find((item) => item.id === stockItemId) || null;
  }, [stockItems]);

  const getSupplierRefsForItem = useCallback((stockItemId) => {
    if (!stockItemId) return [];
    return supplierRefs[stockItemId] || [];
  }, [supplierRefs]);

  const getStandardSpecsForItem = useCallback((stockItemId) => {
    if (!stockItemId) return [];
    return standardSpecs[stockItemId] || [];
  }, [standardSpecs]);

  const getAgeDays = useCallback((createdAt) => {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  }, []);

  const sortedRequests = useMemo(() => sortRequests(filteredRequests, getAgeDays), [filteredRequests, getAgeDays]);

  const columns = useMemo(() => COLUMNS, []);

  const colSpan = columns.length;

  const rowRenderer = useCallback((request) => {
    const age = getAgeDays(request.createdAt);
    const stockItem = getStockItemDetails(request.stockItemId);

    const stockRef = request.stockItemRef;

    const hasLink = !!request.stockItemId;
    const hasQty = Number(request.quantity) > 0;
    const hasRef = !!stockRef;
    const hasSupplier = (request.stockItemSupplierRefsCount ?? 0) > 0;
    const hasMissing = !(hasLink && hasQty && hasRef && hasSupplier);

    return (
      <PurchaseRequestRow
        key={request.id}
        request={{ ...request, renderExpandedContent }}
        age={age}
        stockItem={stockItem}
        stockRef={stockRef}
        hasMissing={hasMissing}
        hasLink={hasLink}
        colSpan={colSpan}
        renderExpandedContent={renderExpandedContent}
        detailsExpandedId={detailsExpandedId}
        expandedRequestId={expandedRequestId}
        detailsLoading={detailsLoadingStates[request.id]}
        onToggleExpand={onToggleExpand}
        onLoadDetailsData={onLoadDetailsData}
        setDetailsExpandedId={setDetailsExpandedId}
        getAgeColor={getAgeColor}
        deleteConfirmId={deleteConfirmId}
        deleteLoading={deleteLoading}
        handleDeleteButtonClick={handleDeleteButtonClick}
        getSupplierRefsForItem={getSupplierRefsForItem}
        getStandardSpecsForItem={getStandardSpecsForItem}
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
    );
  }, [
    getAgeDays,
    getStockItemDetails,
    getSupplierRefsForItem,
    getStandardSpecsForItem,
    renderExpandedContent,
    suppliers,
    loading,
    deleteConfirmId,
    deleteLoading,
    handleDeleteButtonClick,
    colSpan,
    onAddSupplierRef,
    onDeleteSupplierRef,
    onUpdateSupplierRef,
    onAddStandardSpec,
    onDeleteStandardSpec,
    onUpdateStandardSpec,
    onCreateSupplier,
    allManufacturers,
    onToggleExpand,
    onLoadDetailsData,
    detailsLoadingStates,
    expandedRequestId,
    detailsExpandedId,
  ]);

  return (
    <Fragment>
      <DataTable
        columns={columns}
        data={sortedRequests}
        rowRenderer={rowRenderer}
        size={compact ? "1" : "2"}
        loading={loading}
        emptyState={{
          icon: Package,
          title: "Aucune demande trouvée",
          description: "Aucune demande de matériel n'est disponible.",
        }}
      />
    </Fragment>
  );
}

PurchaseRequestsTable.propTypes = purchaseRequestsTablePropTypes;
