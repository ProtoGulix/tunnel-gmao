import { useState, useCallback, Fragment, useMemo, useEffect } from "react";
import { useError } from '@/contexts/ErrorContext';
import { Flex, Card, Table, Text } from "@radix-ui/themes";
import { Package, TruckIcon } from "lucide-react";
import { suppliers } from "@/lib/api/facade";
import TableHeader from "@/components/common/TableHeader";
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

  const renderHeader = () =>
    showHeader ? (
      <TableHeader
        icon={TruckIcon}
        title="Paniers fournisseurs"
        count={orders.length}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        showRefreshButton
        searchPlaceholder="Recherche (n°, fournisseur...)"
        actions={
          <Flex align="center" gap="2">
            {typeof statusFilter !== "undefined" && (
              <FilterSelect label="Statut" value={statusFilter} onValueChange={onStatusFilterChange} minWidth="200px" inline options={STATUS_FILTER_OPTIONS} />
            )}
            {typeof supplierFilter !== "undefined" && (
              <FilterSelect label="Fournisseur" value={supplierFilter} onValueChange={onSupplierFilterChange} minWidth="220px" inline options={supplierOptions} />
            )}
          </Flex>
        }
      />
    ) : null;

  return (
    <>
      {renderHeader()}
      {orders.length === 0 ? (
        <Card>
          <Flex align="center" justify="center" p="6" direction="column" gap="3">
            <Package size={48} color="var(--gray-9)" />
            <Text color="gray" size="4">Aucun panier fournisseur</Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          <Table.Root variant="surface">
            <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
              <Table.Row>
                <Table.ColumnHeaderCell>N° Commande</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Nb lignes</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Montant</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Âge (j)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {sortedOrders.map((order) => (
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
                  />

                  {expandedOrderId === order.id && (
                    <ExpandableDetailsRow colSpan={7} withCard={true}>
                      <OrderLineTable order={order} orderLines={orderLines} />
                    </ExpandableDetailsRow>
                  )}
                </Fragment>
              ))}
            </Table.Body>
          </Table.Root>
        </Flex>
      )}
    </>
  );
}
SupplierOrdersTable.propTypes = supplierOrdersTablePropTypes;
