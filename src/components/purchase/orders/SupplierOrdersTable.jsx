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
  handleStatusChange 
} from "./supplierOrdersHandlers";
import { supplierOrdersTablePropTypes } from "./supplierOrdersTablePropTypes";

export default function SupplierOrdersTable({
  orders,
  onRefresh,
  // Optional header controls (when you want the table to manage its own header)
  showHeader = false,
  searchTerm = "",
  onSearchChange = () => {},
  statusFilter = undefined,
  onStatusFilterChange = () => {},
  supplierFilter = undefined,
  onSupplierFilterChange = () => {},
  supplierOptions = [],
}) {
  const { showError } = useError();
  const [localOrders, setLocalOrders] = useState(orders);
  const [orderLines, setOrderLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Tri par défaut : paniers non commandés d'abord, puis âge décroissant
  const sortedOrders = useMemo(() => sortOrdersByStatusAndAge(localOrders), [localOrders]);

  // Fonction utilitaire pour récupérer les lignes (mise en cache)
  const [cachedLines, setCachedLines] = useState(new Map());
  
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
    { key: "orderNumber", header: "N° Commande" },
    { key: "supplier", header: "Fournisseur" },
    { key: "status", header: "Statut" },
    { key: "lineCount", header: "Nb lignes" },
    { key: "amount", header: "Montant" },
    { key: "age", header: "Âge (j)" },
    { key: "actions", header: "Actions" },
  ]), []);

  const rowRenderer = useCallback((order) => {
    const isExpanded = expandedOrderId === order.id;
    return (
      <Fragment key={order.id}>
        <OrderRow
          order={order}
          loading={loading}
          cachedLines={cachedLines}
          onViewDetails={() => handleViewDetails(order)}
          onStatusChange={wrappedHandleStatusChange}
          onExportCSV={() => handleExportCSV(order)}
          onSendEmail={() => handleSendEmail(order)}
          onCopyHTMLEmail={() => handleCopyHTMLEmail(order)}
          onPurge={() => handlePurgeOrder(order)}
        />

        {isExpanded && (
          <ExpandableDetailsRow colSpan={columns.length} withCard={true}>
            <OrderLineTable order={order} orderLines={orderLines} />
          </ExpandableDetailsRow>
        )}
      </Fragment>
    );
  }, [expandedOrderId, cachedLines, handleViewDetails, wrappedHandleStatusChange, handleExportCSV, handleSendEmail, handleCopyHTMLEmail, columns.length, orderLines, loading]);

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
