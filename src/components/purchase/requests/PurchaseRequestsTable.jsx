/**
 * Tableau des demandes d'achat avec expansion, qualification et références.
 * Design simplifié : badges de statut visibles + bouton Détails pour accéder à tout.
 */

import { Fragment, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Table, Text, Badge, Flex, Button } from "@radix-ui/themes";
import { Package, AlertTriangle, AlertCircle } from "lucide-react";

import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import DataTable from "@/components/common/DataTable";
import StockRefLink from "@/components/common/StockRefLink";
import DeletePurchaseRequestButton from "@/components/purchase/requests/DeletePurchaseRequestButton";
import PurchaseRequestDetailsPanel from "@/components/purchase/requests/PurchaseRequestDetailsPanel";
import { useDeletePurchaseRequest } from "@/hooks/useDeletePurchaseRequest";

export default function PurchaseRequestsTable({
  requests,
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

  // Hook pour gérer la suppression avec double-clic
  const { 
    deleteConfirmId, 
    deleteLoading, 
    handleDeleteButtonClick 
  } = useDeletePurchaseRequest(async () => {
    await onRefresh?.();
    setDispatchResult?.({
      type: 'success',
      message: 'Demande d\'achat supprimée'
    });
    setTimeout(() => setDispatchResult?.(null), 3000);
  });

  // ========== HELPERS ==========
  const getStockItemDetails = (stockItemId) => {
    if (!stockItemId) return null;
    return stockItems.find((item) => item.id === stockItemId) || null;
  };

  const getSupplierRefsForItem = (stockItemId) => {
    if (!stockItemId) return [];
    return supplierRefs[stockItemId] || [];
  };

  const getStandardSpecsForItem = (stockItemId) => {
    if (!stockItemId) return [];
    return standardSpecs[stockItemId] || [];
  };

  const getAgeDays = (createdAt) => {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const getRowAgeColor = (days) => {
    if (days < 2) return "transparent";
    if (days <= 5) return "var(--amber-2)";
    return "var(--red-2)";
  };

  const getAgeColor = (days) => {
    if (days < 2) return "transparent";
    if (days <= 5) return "var(--amber-2)";
    return "var(--red-2)";
  };

  const StatusBadges = useCallback(({ request, hasMissing, age }) => {
    const statusId = typeof request.status === "string" ? request.status : request.status?.id;
    
    if (hasMissing) {
      return (
        <Badge color="amber" variant="soft">
          <Flex align="center" gap="1">
            <AlertTriangle size={12} />
            À qualifier
          </Flex>
        </Badge>
      );
    }
    
    if (statusId === "in_progress" && age > 2) {
      return (
        <Badge color="orange" variant="soft">
          <Flex align="center" gap="1">
            <AlertCircle size={12} />
            À relancer
          </Flex>
        </Badge>
      );
    }
    
    if (statusId === "ordered") {
      return <Badge color="green" variant="soft">Commandée</Badge>;
    }
    
    if (statusId === "in_progress") {
      return <Badge color="blue" variant="soft">En attente</Badge>;
    }
    
    if (statusId === "sent") {
      return <Badge color="blue" variant="soft">Devis envoyé</Badge>;
    }
    
    return <Badge variant="soft">-</Badge>;
  }, []);

  const sortedRequests = useMemo(() => {
    const getCompletenessScore = (request) => {
      let score = 0;
      const hasLink = !!request.stockItemId;
      const hasRef = !!request.stockItemRef;
      const hasSupplier = (request.stockItemSupplierRefsCount ?? 0) > 0;
      if (hasLink) score += 100;
      if (hasRef) score += 100;
      if (hasSupplier) score += 100;
      return score;
    };

    return [...requests].sort((a, b) => {
      const getStatusPriority = (status) => {
        const statusId = typeof status === "string" ? status : status?.id;
        if (statusId === "received" || statusId === "ordered") return 3;
        if (statusId === "in_progress") return 2;
        return 0;
      };

      const statusPrioA = getStatusPriority(a.status);
      const statusPrioB = getStatusPriority(b.status);
      if (statusPrioA !== statusPrioB) return statusPrioA - statusPrioB;

      const scoreA = getCompletenessScore(a);
      const scoreB = getCompletenessScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;

      const ageA = getAgeDays(a.createdAt);
      const ageB = getAgeDays(b.createdAt);
      return ageB - ageA;
    });
  }, [requests]);

  const columns = useMemo(() => ([
    { key: "item", header: "Article" },
    { key: "state", header: "État" },
    { key: "ref", header: "Référence" },
    { key: "qty", header: "Qté" },
    { key: "age", header: "Âge (j)" },
    { key: "action", header: "Action" },
  ]), []);

  const colSpan = columns.length;

  const rowRenderer = useCallback((request) => {
    const age = getAgeDays(request.createdAt);
    const bg = getRowAgeColor(age);
    const stockItem = getStockItemDetails(request.stockItemId);
    
    // Utiliser la référence depuis la relation M2O (déjà chargée)
    const stockRef = request.stockItemRef;
    
    // Debug log pour voir ce qu'on reçoit
    if (process.env.NODE_ENV === 'development' && request.stockItemId) {
      console.log('[PurchaseRequestsTable] request:', {
        id: request.id,
        itemLabel: request.itemLabel,
        stockItemId: request.stockItemId,
        stockItemRef: request.stockItemRef,
        stockItemSupplierRefsCount: request.stockItemSupplierRefsCount
      });
    }
    
    const hasLink = !!request.stockItemId;
    const hasQty = Number(request.quantity) > 0;
    const hasRef = !!stockRef;
    
    // Utiliser le count depuis la relation M2O (déjà chargé)
    const hasSupplier = (request.stockItemSupplierRefsCount ?? 0) > 0;
    const hasMissing = !(hasLink && hasQty && hasRef && hasSupplier);

    return (
      <Fragment key={request.id}>
        <Table.Row style={{ background: bg }}>
          <Table.Cell>
            <Text weight="medium" size="3">{request.itemLabel || stockItem?.name || "-"}</Text>
          </Table.Cell>
          <Table.Cell>
            <StatusBadges request={request} hasMissing={hasMissing} age={age} />
          </Table.Cell>
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
          <Table.Cell style={{ background: getAgeColor(age) }}>
            <Text weight="medium">{age}j</Text>
          </Table.Cell>
          <Table.Cell>
            <Flex gap="2" align="center">
              <Button
                size="1"
                variant={detailsExpandedId === request.id || expandedRequestId === request.id ? "solid" : "soft"}
                color={detailsExpandedId === request.id || expandedRequestId === request.id ? "blue" : "gray"}
                loading={detailsLoadingStates[request.id]}
                onClick={async () => {
                  if (hasMissing) {
                    // Si à qualifier: ouvrir le formulaire de qualification
                    onToggleExpand(request.id);
                  } else if (request.stockItemId) {
                    // Si qualifié: charger les données puis ouvrir le panel détails
                    const newExpandedId = detailsExpandedId === request.id ? null : request.id;
                    if (newExpandedId) {
                      await onLoadDetailsData(request.id);
                    }
                    setDetailsExpandedId(newExpandedId);
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
            <Table.Cell colSpan={colSpan}>
              {renderExpandedContent(request)}
            </Table.Cell>
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
  }, [
    getAgeDays, getRowAgeColor, getStockItemDetails,
    getSupplierRefsForItem, getStandardSpecsForItem, getAgeColor, StatusBadges,
    detailsExpandedId, expandedRequestId, renderExpandedContent, suppliers, loading,
    deleteConfirmId, deleteLoading, handleDeleteButtonClick, colSpan,
    onAddSupplierRef, onDeleteSupplierRef, onUpdateSupplierRef, onAddStandardSpec, 
    onDeleteStandardSpec, onUpdateStandardSpec, onCreateSupplier, allManufacturers,
    onToggleExpand, onLoadDetailsData, detailsLoadingStates
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
          action: onRefresh ? <Button size="2" variant="soft" color="blue" onClick={onRefresh}>Rafraîchir</Button> : null,
        }}
      />
    </Fragment>
  );
}

PurchaseRequestsTable.propTypes = {
  requests: PropTypes.array.isRequired,
  expandedRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  renderExpandedContent: PropTypes.func,
  stockItems: PropTypes.array,
  supplierRefs: PropTypes.object,
  standardSpecs: PropTypes.object,
  onRefresh: PropTypes.func,
  onAddSupplierRef: PropTypes.func,
  onAddStandardSpec: PropTypes.func,
  suppliers: PropTypes.array,
  loading: PropTypes.bool,
  setDispatchResult: PropTypes.func,
  compact: PropTypes.bool,
  onDeleteSupplierRef: PropTypes.func,
  onUpdateSupplierRef: PropTypes.func,
  onCreateSupplier: PropTypes.func,
  onToggleExpand: PropTypes.func,
  allManufacturers: PropTypes.array,
  onDeleteStandardSpec: PropTypes.func,
  onUpdateStandardSpec: PropTypes.func,
  onLoadDetailsData: PropTypes.func,
  detailsLoadingStates: PropTypes.object,
};
