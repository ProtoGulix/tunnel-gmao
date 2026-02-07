import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Tabs,
  Flex,
  Text,
  Card,
  Button,
  Badge,
} from "@radix-ui/themes";
import {
  ShoppingCart,
  TruckIcon,
  Send,
  PackageCheck,
  Archive,
  Users,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { usePageHeaderProps } from "@/hooks/usePageConfig";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import ErrorDisplay from "@/components/ErrorDisplay";
import LoadingState from "@/components/common/LoadingState";
import PurchaseRequestsTable from "@/components/purchase/requests/PurchaseRequestsTable";
import StockItemSearch from "@/components/stock/StockItemSearch";
import SupplierOrdersTable from "@/components/purchase/orders/SupplierOrdersTable";
import DispatchBanner from "@/components/purchase/DispatchBanner";
import TableHeader from "@/components/common/TableHeader";
import EmptyState from "@/components/common/EmptyState";
import StatusCallout from "@/components/common/StatusCallout";

// Custom hooks
import { useStockItemsManagement } from "@/hooks/useStockItemsManagement";
import { usePurchaseRequestsManagement } from "@/hooks/usePurchaseRequestsManagement";
import { usePurchasingManagement } from "@/hooks/usePurchasingManagement";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useSearchParam } from "@/hooks/useSearchParam";
import { useDeletePurchaseRequest } from "@/hooks/useDeletePurchaseRequest";
import { useNotification } from "@/hooks/useNotification";
import { useApiMutation } from "@/hooks/useApiCall";
import { manufacturerItems, stock as stockAPI } from "@/lib/api/facade";
import {
  normalizeBasketStatus,
} from "@/lib/purchasing/basketItemRules";

const PROCUREMENT_TABS = {
  REQUESTS: "requests",
  POOLING: "pooling",
  SENT: "sent",
  ORDERED: "ordered",
  CLOSED: "closed",
};

export default function Procurement() {
  // ========== STATE ==========
  const [error, setError] = useState(null);
  const stock = useStockItemsManagement(setError);
  const purchases = usePurchaseRequestsManagement(setError);
  const purchasing = usePurchasingManagement(setError);

  const [activeTab, setActiveTab] = useTabNavigation(PROCUREMENT_TABS.REQUESTS, 'tab');
  const { notification: dispatchResult, showNotification, showSuccess, showError, showWarning } = useNotification(3000);

  // Clés distinctes pour éviter que les recherches se masquent entre elles
  const legacySearch = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  }, []);

  const [requestSearchTerm, setRequestSearchTerm] = useSearchParam('reqSearch', legacySearch);

  // Si une URL fournit encore ?search=, on réplique vers la nouvelle clé pour que la navigation/Back fonctionne
  useEffect(() => {
    if (!legacySearch) return;
    if (!requestSearchTerm) setRequestSearchTerm(legacySearch);
  }, [legacySearch, requestSearchTerm, setRequestSearchTerm]);

  const [allManufacturers, setAllManufacturers] = useState([]);
  const [stockFamilies, setStockFamilies] = useState([]);

  // Wrapper legacy pour les composants enfants qui utilisent encore setDispatchResult
  const setDispatchResultLegacy = useCallback((result) => {
    if (!result) return;
    showNotification(result.message, result.type, result);
  }, [showNotification]);

  // ========== CALLBACKS ==========
  const refreshManufacturers = useCallback(async () => {
    try {
      const items = await manufacturerItems.fetchManufacturerItems();
      setAllManufacturers(items || []);
    } catch (error) {
      console.error('Erreur rechargement fabricants:', error);
    }
  }, []);

  useEffect(() => {
    refreshManufacturers();
  }, [refreshManufacturers]);

  useEffect(() => {
    stockAPI.fetchStockFamilies().then(families => setStockFamilies(families || []));
  }, []);

  // ========== COMPUTED VALUES ==========
  const requestStats = {
    total: purchases.stats?.totals?.total_requests ?? 0,
    urgent: purchases.stats?.totals?.urgent_count ?? 0,
  };

  const filteredRequests = useMemo(() => {
    return purchases.requests.filter(req => {
      const statusCode = req.derived_status?.code;
      return statusCode !== 'RECEIVED';
    });
  }, [purchases.requests]);

  const receivedRequests = useMemo(() => {
    return purchases.requests.filter(req => {
      const statusCode = req.derived_status?.code;
      return statusCode === 'RECEIVED';
    });
  }, [purchases.requests]);

  // Séparer les paniers par état métier
  const ordersByState = useMemo(() => {
    const pooling = [];
    const sent = [];
    const ordered = [];
    const closed = [];

    purchasing.supplierOrders.forEach((order) => {
      // order.status est déjà une string normalisée en minuscules par le mapper
      const normalizedStatus = normalizeBasketStatus(order.status);

      if (normalizedStatus === "POOLING") {
        pooling.push(order);
      } else if (normalizedStatus === "SENT") {
        sent.push(order);
      } else if (normalizedStatus === "ORDERED") {
        ordered.push(order);
      } else if (normalizedStatus === "CLOSED") {
        // Les paniers reçus ou clôturés vont dans l'onglet Clôturé
        closed.push(order);
      }
    });

    return { pooling, sent, ordered, closed };
  }, [purchasing.supplierOrders]);

  const supplierTabs = useMemo(() => ([
    {
      value: PROCUREMENT_TABS.POOLING,
      icon: Users,
      label: "Mutualisation",
      title: "Paniers en mutualisation",
      subtitle: {
        singular: "panier en mutualisation",
        plural: "paniers en mutualisation",
      },
      emptyTitle: "Aucun panier en mutualisation",
      emptyDescription: "Les paniers en attente volontaire apparaîtront ici",
      emptyIcon: Users,
      badgeColor: "purple",
      orders: ordersByState.pooling,
      showPoolingColumns: true,
    },
    {
      value: PROCUREMENT_TABS.SENT,
      icon: Send,
      label: "En chiffrage",
      title: "Paniers en chiffrage",
      subtitle: {
        singular: "panier en chiffrage",
        plural: "paniers en chiffrage",
      },
      emptyTitle: "Aucun panier en chiffrage",
      emptyDescription: "Les paniers envoyés aux fournisseurs pour devis apparaîtront ici",
      emptyIcon: TruckIcon,
      badgeColor: "blue",
      orders: ordersByState.sent,
    },
    {
      value: PROCUREMENT_TABS.ORDERED,
      icon: PackageCheck,
      label: "Commandés",
      title: "Paniers commandés",
      subtitle: {
        singular: "panier commandé",
        plural: "paniers commandés",
      },
      emptyTitle: "Aucun panier commandé",
      emptyDescription: "Les paniers validés et commandés apparaîtront ici",
      emptyIcon: TruckIcon,
      badgeColor: "green",
      orders: ordersByState.ordered,
    },
    {
      value: PROCUREMENT_TABS.CLOSED,
      icon: Archive,
      label: "Clôturés",
      title: "Paniers clôturés",
      subtitle: {
        singular: "panier clôturé",
        plural: "paniers clôturés",
      },
      emptyTitle: "Aucun panier clôturé",
      emptyDescription: "Les paniers archivés apparaîtront ici",
      emptyIcon: TruckIcon,
      badgeColor: "gray",
      badgeVariant: "soft",
      orders: ordersByState.closed,
    },
  ]), [ordersByState]);

  const activeSupplierTab = useMemo(() => {
    return supplierTabs.find((tab) => tab.value === activeTab) || null;
  }, [activeTab, supplierTabs]);

  const activeSupplierOrders = activeSupplierTab?.orders || [];



  const statusCounts = (purchases.stats?.by_status || []).reduce((acc, item) => {
    acc[item.status] = item.count ?? 0;
    return acc;
  }, {});

  const readyCount = statusCounts.PENDING_DISPATCH ?? 0;
  const toQualifyCount = statusCounts.TO_QUALIFY ?? 0;
  const unlinkedCount = statusCounts.NO_SUPPLIER_REF ?? 0;

  const totalOrdersCount = useMemo(() => {
    const activeOrders = [
      ...ordersByState.pooling,
      ...ordersByState.sent,
      ...ordersByState.ordered,
    ];
    return activeOrders.reduce((sum, order) => sum + (order.line_count ?? 0), 0);
  }, [ordersByState]);

  // ========== CALLBACKS ==========
  const refreshRequests = async () => {
    await purchases.loadRequests(false);
    await purchases.fetchStats();
  };

  const refreshOrders = useCallback(async () => {
    await purchasing.loadSupplierOrders(false);
  }, [purchasing]);

  const refreshStock = async () => {
    await stock.loadStockItems(false);
  };

  useDeletePurchaseRequest(async () => {
    await refreshRequests();
    showSuccess('Demande d\'achat supprimée');
  });

  const { mutate: addSupplierRef, loading: addingSupplierRef } = useApiMutation(
    async ({ stockItemId, refData }) => {
      const existingRefs = stock.supplierRefsByItem?.[stockItemId] || [];
      const makePreferred = existingRefs.length === 0;
      let manufacturer_item_id = null;
      
      const manuName = refData.manufacturer_name?.trim() || '';
      const manuRef = refData.manufacturer_ref?.trim() || '';
      if (manuName || manuRef) {
        const manu = await manufacturerItems.getOrCreateManufacturerItem({
          name: manuName,
          ref: manuRef,
          designation: refData.manufacturer_designation?.trim() || '',
        });
        manufacturer_item_id = manu?.id || null;
      }

      await stock.addSupplierRef(
        stockItemId,
        {
          supplier_id: refData.supplier_id,
          supplier_ref: refData.supplier_ref?.trim() || '',
          unit_price: refData.unit_price,
          delivery_time_days: refData.delivery_time_days,
          is_preferred: refData.is_preferred ?? makePreferred,
          ...(manufacturer_item_id ? { manufacturer_item_id } : {}),
        }
      );
      return { stockItemId };
    },
    {
      onSuccess: async ({ stockItemId }) => {
        await Promise.all([
          stock.loadSupplierRefs(stockItemId),
          stock.loadStockItems(false),
        ]);
      },
      successMessage: 'Référence fournisseur ajoutée',
      errorMessage: (err) => {
        const errorDetail = err.response?.data?.detail || err.message;
        const errors = err.response?.data?.errors;
        let errorMessage = 'Erreur lors de l\'ajout de la référence';

        if (errors && Array.isArray(errors)) {
          const missingFields = errors.map(e => e.loc?.[1] || 'champ inconnu').join(', ');
          errorMessage = `Champs manquants ou invalides: ${missingFields}`;
        } else if (errorDetail) {
          errorMessage = errorDetail;
        }

        return errorMessage;
      },
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: addStandardSpec } = useApiMutation(
    ({ stockItemId, specsData }) => 
      stockAPI.createStockItemStandardSpec({
        stock_item_id: stockItemId,
        title: specsData.title,
        spec_text: specsData.spec_text,
        is_default: specsData.is_default ?? false,
      }),
    {
      onSuccess: async () => {
        await Promise.all([
          stock.loadStockItems(false),
          purchases.loadRequests(false),
        ]);
      },
      successMessage: 'Spécification ajoutée',
      errorMessage: 'Erreur lors de l\'ajout de la spécification',
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: updateStandardSpec } = useApiMutation(
    ({ specId, specsData }) =>
      stock.updateStockItemStandardSpec(specId, {
        title: specsData.title,
        spec_text: specsData.spec_text,
        is_default: specsData.is_default ?? false,
      }),
    {
      onSuccess: async () => {
        await Promise.all([
          stock.loadStockItems(false),
          purchases.loadRequests(false),
        ]);
      },
      successMessage: 'Spécification mise à jour',
      errorMessage: 'Erreur lors de la mise à jour de la spécification',
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: deleteStandardSpec } = useApiMutation(
    (specId) => stock.deleteStockItemStandardSpec(specId),
    {
      onSuccess: async () => {
        await Promise.all([
          stock.loadStockItems(false),
          purchases.loadRequests(false),
        ]);
      },
      successMessage: 'Spécification supprimée',
      errorMessage: 'Erreur lors de la suppression de la spécification',
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: deleteSupplierRef } = useApiMutation(
    async ({ refId, stockItemId }) => {
      await stock.deleteSupplierRef(refId);
      return { stockItemId };
    },
    {
      onSuccess: async ({ stockItemId }) => {
        await Promise.all([
          stock.loadSupplierRefs(stockItemId),
          stock.loadStockItems(false),
        ]);
      },
      successMessage: 'Référence supprimée',
      errorMessage: 'Erreur lors de la suppression',
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: updateSupplierRef } = useApiMutation(
    async ({ refId, updates, stockItemId }) => {
      await stock.updateSupplierRef(refId, updates);
      return { stockItemId };
    },
    {
      onSuccess: async ({ stockItemId }) => {
        await Promise.all([
          stock.loadSupplierRefs(stockItemId),
          stock.loadStockItems(false),
          purchases.loadRequests(false),
        ]);
      },
      successMessage: 'Référence mise à jour',
      errorMessage: 'Erreur lors de la mise à jour',
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: linkExisting, loading: linkingExisting } = useApiMutation(
    async ({ requestId, stockItem }) => {
      await purchases.linkExistingItem(requestId, stockItem);
      return { stockItem };
    },
    {
      onSuccess: async () => {
        await refreshRequests();
      },
      successMessage: 'Pièce liée avec succès',
      successDetails: ({ stockItem }) => `"${stockItem.name}" a été liée à la demande`,
      errorMessage: 'Erreur lors de la liaison',
      errorDetails: (error) => error.response?.data?.errors?.[0]?.message || error.message,
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  const { mutate: createNew, loading: creatingNew } = useApiMutation(
    async ({ requestId, itemData }) => {
      const newStockItem = await stock.addStockItem({
        ...itemData,
        quantity: 0,
      });
      await purchases.linkExistingItem(requestId, newStockItem);
      return { newStockItem };
    },
    {
      onSuccess: async () => {
        await Promise.all([refreshStock(), refreshRequests()]);
      },
      successMessage: 'Pièce créée et liée avec succès',
      successDetails: ({ newStockItem }) => `"${newStockItem.name}" (${newStockItem.ref}) a été créée et liée à la demande`,
      errorMessage: 'Erreur lors de la création',
      errorDetails: (error) => error.response?.data?.errors?.[0]?.message || error.message,
      notify: showNotification,
      disableGlobalError: true,
    }
  );

  // Calculer le loading combiné pour les opérations CRUD sur les demandes d'achat
  const formLoading = addingSupplierRef || linkingExisting || creatingNew;

  const renderExpandedContent = useCallback((request) => (
    <StockItemSearch
      requestId={request.id}
      initialItemLabel={request.itemLabel}
      onLinkExisting={(requestId, stockItem) => linkExisting({ requestId, stockItem })}
      onCreateNew={(requestId, itemData) => createNew({ requestId, itemData })}
      loading={formLoading}
      stockFamilies={stockFamilies}
    />
  ), [createNew, formLoading, linkExisting, stockFamilies]);

  const purchaseTableProps = useMemo(() => ({
    stockItems: stock.stockItems,
    supplierRefs: stock.supplierRefsByItem || {},
    standardSpecs: stock.standardSpecsByItem || {},
    onRefresh: refreshRequests,
    suppliers: purchasing.suppliers,
    loading: formLoading,
    setDispatchResult: setDispatchResultLegacy,
    onAddSupplierRef: (stockItemId, refData) => addSupplierRef({ stockItemId, refData }),
    onAddStandardSpec: (stockItemId, specsData) => addStandardSpec({ stockItemId, specsData }),
    onDeleteSupplierRef: (refId, stockItemId) => deleteSupplierRef({ refId, stockItemId }),
    onUpdateSupplierRef: (refId, updates, stockItemId) => updateSupplierRef({ refId, updates, stockItemId }),
    onDeleteStandardSpec: (specId) => deleteStandardSpec(specId),
    onUpdateStandardSpec: (specId, specsData) => updateStandardSpec({ specId, specsData }),
    onCreateSupplier: purchasing.createSupplier,
    allManufacturers,
    renderExpandedContent,
  }), [
    addStandardSpec,
    addSupplierRef,
    allManufacturers,
    deleteStandardSpec,
    deleteSupplierRef,
    formLoading,
    purchasing.createSupplier,
    refreshRequests,
    renderExpandedContent,
    setDispatchResultLegacy,
    stock.standardSpecsByItem,
    stock.stockItems,
    stock.supplierRefsByItem,
    updateStandardSpec,
    updateSupplierRef,
  ]);

  const handleDispatchConfirm = async () => {
    try {
      const results = await purchasing.dispatch();

      showNotification('Dispatch terminé', results.errors.length > 0 ? 'warning' : 'success', {
        dispatched: results.dispatched,
        createdOrders: results.createdOrders || 0,
        errors: results.errors.length,
        errorDetails: results.errors,
        duration: 8000,
      });

      await Promise.all([refreshRequests(), refreshOrders()]);
    } catch (error) {
      console.error("Erreur dispatch:", error);
      showError('Erreur lors du dispatch', {
        details: error.response?.data?.detail || error.message,
      });
    }
  };

  const handleDispatchNotAvailable = () => {
    showWarning('Aucune demande dispatchable', {
      details: 'Les demandes doivent avoir le statut PENDING_DISPATCH',
      duration: 6000,
    });
  };

  // ========== EFFECTS ==========
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
      purchases.fetchStats(),
      purchasing.loadAll(true)
    ]);
  }, [purchases, purchasing, stock]);

  // ========== RECALCUL DES TOTAUX ==========

  useAutoRefresh(async () => {
    await Promise.all([
      stock.loadStockItems(false),
      purchases.loadRequests(false),
      purchases.fetchStats(),
      purchasing.loadAll(false)
    ]);
  }, 30, true);

  const isLoading = stock.loading || purchases.loading || purchasing.loading;
  const componentError = error;

  // ========== HEADER ==========
  const headerProps = usePageHeaderProps({
    subtitle:
      activeTab === "requests"
        ? `${filteredRequests.length} demande${filteredRequests.length > 1 ? "s" : ""}`
        : activeSupplierTab
        ? `${activeSupplierOrders.length} ${
            activeSupplierOrders.length > 1
              ? activeSupplierTab.subtitle.plural
              : activeSupplierTab.subtitle.singular
          }`
        : "",
    urgentBadge:
      requestStats.urgent > 0
        ? { count: requestStats.urgent, label: "urgent" }
        : null,
    stats: !isLoading && !componentError ? [
      { label: "Demandes", value: requestStats.total },
      { label: "Prêtes", value: readyCount },
      { label: "À qualifier", value: toQualifyCount },
      { label: "Paniers actifs", value: totalOrdersCount },
    ] : [],
    actions: [],
    onRefresh: () => Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
      purchases.fetchStats(),
      purchasing.loadAll(true)
    ]),
  });

  if (isLoading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <LoadingState message="Chargement des approvisionnements..." />
        </PageContainer>
      </Box>
    );
  }

  if (componentError) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <ErrorDisplay
            error={componentError}
            onRetry={() => Promise.all([
              stock.loadStockItems(true),
              purchases.loadRequests(true),
              purchases.fetchStats(),
              purchasing.loadAll(true)
            ])}
            title="Erreur de chargement des approvisionnements"
          />
        </PageContainer>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader {...headerProps} />
      <PageContainer>
        <DispatchBanner
          readyCount={readyCount}
          dispatching={purchasing.dispatching}
          dispatchResult={dispatchResult}
          onDispatch={handleDispatchConfirm}
          onNotDispatchable={handleDispatchNotAvailable}
        />

        {unlinkedCount > 0 && (
          <StatusCallout type="warning">
            {unlinkedCount} demande{unlinkedCount > 1 ? "s" : ""} non liée{unlinkedCount > 1 ? "s" : ""} à une pièce
          </StatusCallout>
        )}

        {toQualifyCount > 0 && (
          <StatusCallout type="warning">
            {toQualifyCount} demande{toQualifyCount > 1 ? "s" : ""} sans fournisseur préféré
          </StatusCallout>
        )}

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="requests">
              <Flex align="center" gap="2">
                <ShoppingCart size={14} />
                <Text>Demandes d&#39;achat</Text>
                {readyCount > 0 && (
                  <Badge color="blue" variant="solid" size="1">
                    {readyCount}
                  </Badge>
                )}
                {(unlinkedCount + toQualifyCount) > 0 && (
                  <Badge color="amber" variant="solid" size="1">
                    {unlinkedCount + toQualifyCount}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>

            {supplierTabs.map((tab) => (
              <Tabs.Trigger key={tab.value} value={tab.value}>
                <Flex align="center" gap="2">
                  <tab.icon size={14} />
                  <Text>{tab.label}</Text>
                  {tab.orders.length > 0 && (
                    <Badge color={tab.badgeColor} variant={tab.badgeVariant || "solid"} size="1">
                      {tab.orders.length}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Box pt="4">
            {/* ===== TAB: DEMANDES D'ACHAT ===== */}
            <Tabs.Content value="requests">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={ShoppingCart}
                  title="Demandes d'achat"
                  count={filteredRequests.length}
                  onRefresh={refreshRequests}
                  showRefreshButton={false}
                  showSearchInput={false}
                />

                {filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingCart size={64} />}
                    title="Aucune demande trouvée"
                    description="Ajustez ou réinitialisez les filtres"
                    actions={[
                      <Button
                        key="reset-filters-requests"
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() => {
                          setRequestSearchTerm("");
                        }}
                      >
                        Réinitialiser les filtres
                      </Button>,
                      <Button key="refresh-requests" size="2" onClick={refreshRequests}>
                        Rafraîchir
                      </Button>
                    ]}
                  />
                ) : (
                  <Flex direction="column" gap="4">
                    <PurchaseRequestsTable
                      key={`${filteredRequests.length}-${stock.stockItems.length}`}
                      requests={filteredRequests}
                      {...purchaseTableProps}
                    />

                    {receivedRequests.length > 0 && (
                      <Card>
                        <Flex direction="column" gap="3">
                          <Text size="3" weight="bold">
                            Demandes archivées ({receivedRequests.length})
                          </Text>
                          <PurchaseRequestsTable
                            key={`received-${receivedRequests.length}`}
                            requests={receivedRequests}
                            {...purchaseTableProps}
                          />
                        </Flex>
                      </Card>
                    )}
                  </Flex>
                )}
              </Flex>
            </Tabs.Content>

            {supplierTabs.map((tab) => (
              <Tabs.Content key={tab.value} value={tab.value}>
                <Flex direction="column" gap="3">
                  <TableHeader
                    icon={tab.icon}
                    title={tab.title}
                    count={tab.orders.length}
                    onRefresh={refreshOrders}
                    showRefreshButton={false}
                    showSearchInput={false}
                  />

                  {tab.orders.length === 0 ? (
                    <EmptyState
                      icon={<tab.emptyIcon size={64} />}
                      title={tab.emptyTitle}
                      description={tab.emptyDescription}
                      actions={[
                        <Button key={`refresh-orders-${tab.value}`} size="2" onClick={refreshOrders}>
                          Rafraîchir
                        </Button>,
                      ]}
                    />
                  ) : (
                    <SupplierOrdersTable
                      orders={tab.orders}
                      onRefresh={refreshOrders}
                      onOrderLineUpdate={purchasing.updateOrderLine}
                      {...(tab.showPoolingColumns ? { showPoolingColumns: true } : {})}
                    />
                  )}
                </Flex>
              </Tabs.Content>
            ))}
          </Box>
        </Tabs.Root>

      </PageContainer>
    </Box>
  );
}
