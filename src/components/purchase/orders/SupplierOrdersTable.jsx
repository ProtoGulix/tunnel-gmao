import { useState, useCallback, Fragment, useMemo, useEffect } from "react";
import { useError } from '@/contexts/ErrorContext';
import { Flex, Button } from "@radix-ui/themes";
import { Package, TruckIcon } from "lucide-react";
import { suppliers } from "@/lib/api/facade";
import DataTable from "@/components/common/DataTable";
import FilterSelect from "@/components/common/FilterSelect";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import OrderRow from "./OrderRow";
import OrderLineTable from "./OrderLineTable";
import { sortOrdersByStatusAndAge, STATUS_FILTER_OPTIONS } from "./supplierOrdersTableHelpers";
import { 
  createHandleExportCSV, 
  createHandleSendEmail, 
  createHandleCopyHTMLEmail, 
  handleStatusChange,
  handleReEvaluateDA,
} from "./supplierOrdersHandlers";
import { supplierOrdersTablePropTypes } from "./supplierOrdersTablePropTypes";
import { normalizeBasketStatus } from "@/lib/purchasing/basketItemRules";

export default function SupplierOrdersTable({
  orders,
  onRefresh,
  onOrderLineUpdate, // Callback pour mise à jour optimiste d'une ligne
  // Optional header controls (when you want the table to manage its own header)
  showHeader = false,
  searchTerm = "",
  onSearchChange = () => {},
  statusFilter = undefined,
  onStatusFilterChange = () => {},
  supplierFilter = undefined,
  onSupplierFilterChange = () => {},
  supplierOptions = [],
  // Props de gestion de sélection des items
  itemSelectionByBasket = {},
  onToggleItemSelection = () => {},
  onBasketStatusChange = () => {},
  canModifyItem = () => true,
  // Props de validation des lignes jumelles
  twinValidationsByLine = {},
  onTwinValidationUpdate = () => {},
}) {
  const { showError } = useError();
  const [localOrders, setLocalOrders] = useState(orders);
  const [orderLines, setOrderLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [cachedLines, setCachedLines] = useState(new Map());

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Callback pour mise à jour optimiste d'une ligne dans les détails
  const handleLineUpdate = useCallback((lineId, updates) => {
    // Mise à jour locale immédiate dans orderLines
    setOrderLines(prev => 
      prev.map(line => 
        line.id === lineId ? { ...line, ...updates } : line
      )
    );
    
    // Mise à jour dans le cache
    if (expandedOrderId && cachedLines.has(expandedOrderId)) {
      const updatedLines = cachedLines.get(expandedOrderId).map(line =>
        line.id === lineId ? { ...line, ...updates } : line
      );
      setCachedLines(prev => new Map(prev).set(expandedOrderId, updatedLines));
    }
    
    // Propager au parent si disponible
    if (onOrderLineUpdate) {
      onOrderLineUpdate(expandedOrderId, lineId, updates);
    }
  }, [expandedOrderId, cachedLines, onOrderLineUpdate]);

  // Tri par défaut : paniers non commandés d'abord, puis âge décroissant
  // Sorting state: default helper or quick sort by 'status' or 'age'
  const [sortKey, setSortKey] = useState(null); // 'status' | 'age' | null
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir('desc');
        return key;
      }
      setSortDir((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      return prevKey;
    });
  }, []);

  const sortedOrders = useMemo(() => {
    if (!Array.isArray(localOrders)) return [];
    if (!sortKey) return sortOrdersByStatusAndAge(localOrders);
    const ordersCopy = [...localOrders];
    if (sortKey === 'age') {
      // Age by createdAt
      ordersCopy.sort((a, b) => {
        const getAge = (o) => {
          const createdAt = o?.createdAt ?? o?.created_at;
          if (!createdAt) return 0;
          return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000*60*60*24)));
        };
        const av = getAge(a);
        const bv = getAge(b);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    } else if (sortKey === 'status') {
      const rank = { OPEN: 1, SENT: 2, ACK: 3, RECEIVED: 4, CLOSED: 5, CANCELLED: 6 };
      ordersCopy.sort((a, b) => {
        const av = rank[a?.status?.toUpperCase?.() || 'OPEN'] || 99;
        const bv = rank[b?.status?.toUpperCase?.() || 'OPEN'] || 99;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
    }
    return ordersCopy;
  }, [localOrders, sortKey, sortDir]);

  // Fonction utilitaire pour récupérer les lignes (mise en cache)
  const getOrderLines = useCallback(
    async (orderId, { forceRefresh = false } = {}) => {
      // Force a refetch when exports need up-to-date manufacturer info
      if (!forceRefresh && cachedLines.has(orderId)) {
        return cachedLines.get(orderId);
      }

      const lines = await suppliers.fetchSupplierOrderLines(orderId);
      setCachedLines((prev) => new Map(prev).set(orderId, lines));
      return lines;
    },
    [cachedLines]
  );

  const handleViewDetails = useCallback(async (order) => {
    try {
      setLoading(true);
      const lines = await getOrderLines(order.id);
      setOrderLines(lines);
      setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors du chargement des détails"));
    } finally {
      setLoading(false);
    }
  }, [getOrderLines, expandedOrderId, showError]);

  const handleExportCSV = useCallback((order) => createHandleExportCSV(getOrderLines, showError)(order), [getOrderLines, showError]);
  const handleSendEmail = useCallback((order) => createHandleSendEmail(getOrderLines, showError)(order), [getOrderLines, showError]);
  const handleCopyHTMLEmail = useCallback((order) => createHandleCopyHTMLEmail(getOrderLines, showError)(order), [getOrderLines, showError]);
  const wrappedHandleStatusChange = useCallback(
    async (orderId, newStatus) => {
      await handleStatusChange(orderId, newStatus, localOrders, onRefresh, expandedOrderId, setLoading, setOrderLines, showError);
      setLocalOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
    },
    [localOrders, onRefresh, expandedOrderId, showError]
  );

  const handlePurgeOrder = useCallback(
    async (order) => {
      const confirmed = window.confirm(
        "Purger ce panier ? Toutes les lignes seront supprimées et les demandes d'achat repasseront en attente de dispatch."
      ); // eslint-disable-line no-alert
      if (!confirmed) return;

      try {
        setLoading(true);
        await suppliers.purgeSupplierOrder(order.id);
        setLocalOrders((prev) => prev.filter((o) => o.id !== order.id));
        setCachedLines((prev) => {
          const next = new Map(prev);
          next.delete(order.id);
          return next;
        });
        if (expandedOrderId === order.id) {
          setExpandedOrderId(null);
          setOrderLines([]);
        }
        await onRefresh?.();
      } catch (error) {
        console.error('Erreur purge panier:', error);
        showError(error instanceof Error ? error : new Error('Erreur lors de la purge du panier'));
      } finally {
        setLoading(false);
      }
    },
    [expandedOrderId, onRefresh, showError]
  );

  const handleReEvaluate = useCallback(
    async (order) => {
      await handleReEvaluateDA(order, onRefresh, setLoading, showError);
    },
    [onRefresh, showError]
  );

  const headerProps = useMemo(() => {
    if (!showHeader) return null;
    return {
      icon: TruckIcon,
      title: "Paniers fournisseurs",
      count: orders.length,
      searchValue: searchTerm,
      onSearchChange,
      onRefresh,
      showRefreshButton: true,
      searchPlaceholder: "Recherche (n°, fournisseur...)",
      actions: (
        <Flex align="center" gap="2">
          {typeof statusFilter !== "undefined" && (
            <FilterSelect label="Statut" value={statusFilter} onValueChange={onStatusFilterChange} minWidth="200px" inline options={STATUS_FILTER_OPTIONS} />
          )}
          {typeof supplierFilter !== "undefined" && (
            <FilterSelect label="Fournisseur" value={supplierFilter} onValueChange={onSupplierFilterChange} minWidth="220px" inline options={supplierOptions} />
          )}
        </Flex>
      )
    };
  }, [showHeader, orders.length, searchTerm, onSearchChange, onRefresh, statusFilter, onStatusFilterChange, supplierFilter, onSupplierFilterChange, supplierOptions]);

  const columns = useMemo(() => ([
    { key: "orderSupplier", header: "Fournisseur / N°" },
    { key: "age", header: (
      <span style={{ cursor: 'pointer' }} onClick={() => toggleSort('age')}>
        Âge (j){sortKey === 'age' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </span>
    ) },
    { key: "lineCount", header: "Nb lignes" },
    { key: "urgency", header: "Urgence" },
    { key: "statusSelect", header: "Statut" },
    { key: "actions", header: "Actions" },
  ]), [sortKey, sortDir, toggleSort]);

  const rowRenderer = useCallback((order) => {
    const isExpanded = expandedOrderId === order.id;
    const basketStatus = normalizeBasketStatus(order.status);
    const isLocked = ['ORDERED', 'CLOSED'].includes(basketStatus);
    const selectionState = itemSelectionByBasket[order.id] || {};
    
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
          basketStatus={basketStatus}
          isLocked={isLocked}
          selectionState={selectionState}
          onToggleItemSelection={onToggleItemSelection}
          onBasketStatusChange={onBasketStatusChange}
        />

        {isExpanded && (
          <ExpandableDetailsRow colSpan={columns.length} withCard={true}>
            <OrderLineTable 
              order={order} 
              orderLines={orderLines}
              onLineUpdate={handleLineUpdate}
              onRefresh={onRefresh}
              basketStatus={basketStatus}
              isLocked={isLocked}
              selectionState={selectionState}
              onToggleItemSelection={onToggleItemSelection}
              canModifyItem={canModifyItem}
              twinValidationsByLine={twinValidationsByLine}
              onTwinValidationUpdate={onTwinValidationUpdate}
            />
          </ExpandableDetailsRow>
        )}
      </Fragment>
    );
  }, [expandedOrderId, cachedLines, handleViewDetails, wrappedHandleStatusChange, handleExportCSV, handleSendEmail, handleCopyHTMLEmail, columns.length, orderLines, loading, handleReEvaluate, itemSelectionByBasket, onToggleItemSelection, onBasketStatusChange]);

  return (
    <DataTable
      headerProps={headerProps}
      columns={columns}
      data={sortedOrders}
      rowRenderer={rowRenderer}
      loading={loading}
      emptyState={{
        icon: Package,
        title: "Aucun panier fournisseur",
        description: "Créez un panier pour commencer.",
        action: onRefresh ? <Button onClick={onRefresh} size="2" variant="soft" color="blue">Rafraîchir</Button> : null,
      }}
    />
  );
}
SupplierOrdersTable.propTypes = supplierOrdersTablePropTypes;
