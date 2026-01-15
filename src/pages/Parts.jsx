import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Tabs,
  Flex,
  Text,
  Button,
  Badge,
} from "@radix-ui/themes";
import {
  Package,
  Building2,
  Factory,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { usePageHeaderProps } from "@/hooks/usePageConfig";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import ErrorDisplay from "@/components/ErrorDisplay";
import LoadingState from "@/components/common/LoadingState";
import TableHeader from "@/components/common/TableHeader";
import StockItemsTable from "@/components/stock/StockItemsTable";
import EmptyState from "@/components/common/EmptyState";
import ManufacturersTable from "@/components/purchase/manufacturers/ManufacturersTable";
import SuppliersInlinePanel from "@/components/purchase/suppliers/SuppliersInlinePanel";
import AddStockItemDialog from "@/components/stock/AddStockItemDialog";
import StatusCallout from "@/components/common/StatusCallout";

// Custom hooks
import { useStockItemsManagement } from "@/hooks/useStockItemsManagement";
import { usePurchasingManagement } from "@/hooks/usePurchasingManagement";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useSearchParam } from "@/hooks/useSearchParam";
import { DEFAULT_SUPPLIER_REF_FORM } from "@/config/stockManagementConfig";
import { manufacturerItems, stock as stockAPI } from "@/lib/api/facade";

const PARTS_TABS = {
  ITEMS: "items",
  SUPPLIERS: "suppliers",
  MANUFACTURERS: "manufacturers",
};

export default function Parts() {
  // ========== STATE ==========
  const [error, setError] = useState(null);
  const stock = useStockItemsManagement(setError);
  const purchasing = usePurchasingManagement(setError);

  const [activeTab, setActiveTab] = useTabNavigation(PARTS_TABS.ITEMS, 'tab');
  const [dispatchResult, setDispatchResult] = useState(null);
  
  const [stockSearchTerm, setStockSearchTerm] = useSearchParam('search', '');
  const [supplierSearchTerm, setSupplierSearchTerm] = useSearchParam('search', '');
  const [compactRows, setCompactRows] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  const [supplierRefFormData, setSupplierRefFormData] = useState(DEFAULT_SUPPLIER_REF_FORM);

  // Load manufacturers
  const [allManufacturers, setAllManufacturers] = useState([]);
  const [manufacturersVersion, setManufacturersVersion] = useState(0);
  
  const refreshManufacturers = useCallback(async () => {
    try {
      const items = await manufacturerItems.fetchManufacturerItems();
      setAllManufacturers(items || []);
      setManufacturersVersion(v => v + 1);
    } catch (error) {
      console.error('Erreur rechargement fabricants:', error);
    }
  }, []);
  
  useEffect(() => {
    refreshManufacturers();
  }, [refreshManufacturers]);

  // Load stock families
  const [stockFamilies, setStockFamilies] = useState([]);
  useEffect(() => {
    stockAPI.fetchStockFamilies().then(families => setStockFamilies(families || []));
  }, []);

  // ========== COMPUTED VALUES ==========
  const supplierRefsCounts = useMemo(() => {
    const counts = {};
    stock.stockItems.forEach(item => {
      counts[item.id] = item.supplierRefsCount ?? 0;
    });
    return counts;
  }, [stock.stockItems]);
  
  const filteredStockItems = useMemo(() => {
    return stock.stockItems.filter(item => {
      const matchesSearch = !stockSearchTerm || 
        item.name?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.ref?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.family_code?.toLowerCase().includes(stockSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [stock.stockItems, stockSearchTerm]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm.trim()) return purchasing.suppliers;
    const term = supplierSearchTerm.toLowerCase();
    return purchasing.suppliers.filter(supplier => 
      supplier.name?.toLowerCase().includes(term) ||
      supplier.code?.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term)
    );
  }, [purchasing.suppliers, supplierSearchTerm]);

  const partsStats = useMemo(
    () => ({
      total: stock.stockItems.length,
      suppliers: purchasing.suppliers.length,
      manufacturers: allManufacturers.length,
    }),
    [stock.stockItems.length, purchasing.suppliers.length, allManufacturers.length]
  );

  // ========== CALLBACKS ==========
  const refreshStock = async () => {
    await stock.loadStockItems(false);
  };

  const refreshSuppliers = async () => {
    await purchasing.loadSuppliers(false);
  };

  const handleAddStockItem = async (itemData) => {
    try {
      const newItem = await stock.addStockItem(itemData);
      await refreshStock();
      
      setDispatchResult({
        type: 'success',
        message: 'Pièce ajoutée avec succès',
        details: `"${newItem.name}" a été ajoutée au référentiel`
      });
      setTimeout(() => setDispatchResult(null), 4000);
    } catch (error) {
      console.error("Erreur ajout pièce:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de l\'ajout',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    }
  };

  const handleUpdateStockItem = async (itemId, itemData) => {
    try {
      const apiData = { ...itemData };
      delete apiData.manufacturer_name;
      delete apiData.manufacturer_ref;
      delete apiData.manufacturer_designation;

      const updatedItem = await stock.updateItem(itemId, apiData);
      await refreshStock();
      
      setDispatchResult({
        type: 'success',
        message: 'Pièce modifiée avec succès',
        details: `"${updatedItem.name}" a été mise à jour`
      });
      setTimeout(() => setDispatchResult(null), 4000);
    } catch (error) {
      console.error("Erreur modification pièce:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la modification',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    }
  };

  const handleAddSupplierRef = useCallback(async (stockItemId) => {
    const currentFormData = { ...supplierRefFormData };
    const trimmedSupplierRef = (currentFormData.supplier_ref || '').trim();
    const trimmedSupplierId = (currentFormData.supplier_id || '').trim();

    if (!trimmedSupplierId && !trimmedSupplierRef) {
      try {
        await stock.loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur rechargement références:', error);
      }
      return;
    }

    if (!trimmedSupplierId || !trimmedSupplierRef) {
      setDispatchResult({
        type: 'warning',
        message: 'Veuillez remplir le fournisseur et la référence',
      });
      return;
    }

    try {
      setFormLoading(true);
      let manufacturer_item_id = null;
      
      const manuName = currentFormData.manufacturer_name?.trim() || '';
      const manuRef = currentFormData.manufacturer_ref?.trim() || '';
      if (manuName || manuRef) {
        const manu = await manufacturerItems.getOrCreateManufacturerItem({
          name: manuName,
          ref: manuRef,
          designation: currentFormData.manufacturer_designation?.trim() || '',
        });
        manufacturer_item_id = manu?.id || null;
      }

      const existingRefs = stock.supplierRefsByItem?.[stockItemId] || [];
      const makePreferred = existingRefs.length === 0;

      const refData = {
        supplier_id: trimmedSupplierId,
        supplier_ref: trimmedSupplierRef,
        unit_price: parseFloat(currentFormData.unit_price) || null,
        delivery_time_days: parseInt(currentFormData.delivery_time_days) || null,
        is_preferred: currentFormData.is_preferred ?? makePreferred,
        ...(manufacturer_item_id ? { manufacturer_item_id } : {}),
      };

      await stock.addSupplierRef(stockItemId, refData);

      await Promise.all([
        stock.loadSupplierRefs(stockItemId),
        stock.loadStockItems(false),
      ]);

      setSupplierRefFormData(DEFAULT_SUPPLIER_REF_FORM);
      setDispatchResult({
        type: 'success',
        message: 'Référence fournisseur ajoutée',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (error) {
      console.error("Erreur ajout référence:", error);
      const isDuplicate = error?.code === 'DUPLICATE_SUPPLIER_REF' || /unique/i.test(error?.message || '');
      setDispatchResult({
        type: 'error',
        message: isDuplicate
          ? 'Ce fournisseur est déjà associé à cette pièce (référence existante).'
          : 'Erreur lors de l\'ajout de la référence',
        details: error.message,
      });
    } finally {
      setFormLoading(false);
    }
  }, [stock, supplierRefFormData, setDispatchResult]);

  const handleDeleteSupplierRef = useCallback(async (refId, stockItemId) => {
    try {
      await stock.deleteSupplierRef(refId);
      await Promise.all([
        stock.loadSupplierRefs(stockItemId),
        stock.loadStockItems(false),
      ]);
      
      setDispatchResult({
        type: 'success',
        message: 'Référence supprimée',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (error) {
      console.error("Erreur suppression référence:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la suppression',
      });
    }
  }, [stock, setDispatchResult]);

  const handleUpdateSupplierRef = useCallback(async (refId, updates, stockItemId) => {
    try {
      await stock.updateSupplierRef(refId, updates);
      await Promise.all([
        stock.loadSupplierRefs(stockItemId),
        stock.loadStockItems(false),
      ]);
      
      setDispatchResult({
        type: 'success',
        message: 'Référence mise à jour',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (error) {
      console.error("Erreur mise à jour référence:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la mise à jour',
      });
    }
  }, [stock, setDispatchResult]);

  const onAddSupplier = useCallback(async (supplierData) => {
    setFormLoading(true);
    try {
      const newSupplier = await purchasing.createSupplier(supplierData);
      await purchasing.loadSuppliers(false);
      setDispatchResult({ type: 'success', message: 'Fournisseur créé avec succès' });
      return newSupplier;
    } catch (err) {
      setDispatchResult({ type: 'error', message: 'Erreur lors de la création du fournisseur' });
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [purchasing, setFormLoading, setDispatchResult]);

  const onUpdateSupplier = useCallback(async (supplierId, supplierData) => {
    setFormLoading(true);
    try {
      const updatedSupplier = await purchasing.updateSupplier(supplierId, supplierData);
      await purchasing.loadSuppliers(false);
      setDispatchResult({ type: 'success', message: 'Fournisseur mis à jour avec succès' });
      return updatedSupplier;
    } catch (err) {
      setDispatchResult({ type: 'error', message: 'Erreur lors de la mise à jour du fournisseur' });
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [purchasing, setFormLoading, setDispatchResult]);

  const onDeleteSupplier = useCallback(async (supplierId) => {
    setFormLoading(true);
    try {
      await purchasing.deleteSupplier(supplierId);
      await purchasing.loadSuppliers(false);
      setDispatchResult({ type: 'success', message: 'Fournisseur supprimé avec succès' });
    } catch (err) {
      setDispatchResult({ type: 'error', message: 'Erreur lors de la suppression du fournisseur' });
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [purchasing, setFormLoading, setDispatchResult]);

  // ========== EFFECTS ==========
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    Promise.all([
      stock.loadStockItems(true),
      purchasing.loadSuppliers(true)
    ]);
  }, [purchasing, stock]);

  useAutoRefresh(async () => {
    await Promise.all([
      stock.loadStockItems(false),
      purchasing.loadSuppliers(false)
    ]);
  }, 30, true);

  const isLoading = stock.loading || purchasing.loading;
  const componentError = error;

  // ========== HEADER ==========
  const headerProps = usePageHeaderProps({
    subtitle:
      activeTab === "items"
        ? `${filteredStockItems.length} pièce${filteredStockItems.length > 1 ? "s" : ""}`
        : activeTab === "suppliers"
        ? `${filteredSuppliers.length} fournisseur${filteredSuppliers.length > 1 ? "s" : ""}`
        : `Fabricants`,
    stats: !isLoading && !componentError ? [
      { label: "Pièces", value: partsStats.total },
      { label: "Fournisseurs", value: partsStats.suppliers },
      { label: "Fabricants", value: partsStats.manufacturers },
    ] : [],
    onRefresh: () => Promise.all([
      stock.loadStockItems(true),
      purchasing.loadSuppliers(true)
    ]),
  });

  if (isLoading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <LoadingState message="Chargement du référentiel..." />
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
              purchasing.loadSuppliers(true)
            ])}
            title="Erreur de chargement du référentiel"
          />
        </PageContainer>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader {...headerProps} />
      <PageContainer>
        <Flex justify="end" mb="2" align="center" gap="2">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={compactRows}
              onChange={(e) => setCompactRows(e.target.checked)}
              aria-label="Basculer l'affichage compact des tableaux"
            />
            <Text size="2">Affichage compact</Text>
          </label>
        </Flex>

        {dispatchResult && (
          <StatusCallout type={dispatchResult.type} title={dispatchResult.message}>
            {dispatchResult.details && (
              <Text size="2" mt="1">{dispatchResult.details}</Text>
            )}
          </StatusCallout>
        )}

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="items">
              <Flex align="center" gap="2">
                <Package size={14} />
                <Text>Pièces</Text>
                <Badge color="gray" variant="soft" size="1">
                  {filteredStockItems.length}
                </Badge>
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value="suppliers">
              <Flex align="center" gap="2">
                <Building2 size={14} />
                <Text>Fournisseurs</Text>
                <Badge color="gray" variant="soft" size="1">
                  {purchasing.suppliers.length}
                </Badge>
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value="manufacturers">
              <Flex align="center" gap="2">
                <Factory size={14} />
                <Text>Fabricants</Text>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            {/* ===== TAB: PIÈCES ===== */}
            <Tabs.Content value="items">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={Package}
                  title="Pièces"
                  count={filteredStockItems.length}
                  searchValue={stockSearchTerm}
                  onSearchChange={setStockSearchTerm}
                  searchPlaceholder="Recherche (nom, ref, famille...)"
                  showRefreshButton={false}
                  actions={<AddStockItemDialog onAdd={handleAddStockItem} loading={isLoading} stockFamilies={stockFamilies} />}
                />
                {filteredStockItems.length === 0 ? (
                  <EmptyState
                    icon={<Package size={64} />}
                    title="Aucune pièce trouvée"
                    description="Ajoutez une pièce ou modifiez les filtres"
                    actions={[
                      <Button
                        key="reset-filters-stock"
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() => setStockSearchTerm("")}
                      >
                        Réinitialiser les filtres
                      </Button>,
                      <Button key="refresh-stock" size="2" onClick={refreshStock}>Rafraîchir</Button>
                    ]}
                  />
                ) : (
                  <StockItemsTable
                    key={`stock-items-${manufacturersVersion}`}
                    items={filteredStockItems}
                    compactRows={compactRows}
                    specsCounts={stock.specsCounts}
                    specsHasDefault={stock.specsHasDefault}
                    supplierRefsCounts={supplierRefsCounts}
                    onEditStockItem={handleUpdateStockItem}
                    suppliers={purchasing.suppliers}
                    refs={stock.supplierRefsByItem}
                    formData={supplierRefFormData}
                    setFormData={setSupplierRefFormData}
                    onAdd={handleAddSupplierRef}
                    onUpdatePreferred={handleUpdateSupplierRef}
                    onDelete={handleDeleteSupplierRef}
                    onLoadSupplierRefs={stock.loadSupplierRefs}
                    loading={isLoading}
                    showStockCol={false}
                    allManufacturers={allManufacturers}
                    stockFamilies={stockFamilies}
                  />
                )}
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: FOURNISSEURS ===== */}
            <Tabs.Content value="suppliers">
              <Flex direction="column" gap="3">
                <SuppliersInlinePanel
                  suppliers={filteredSuppliers}
                  onAdd={onAddSupplier}
                  onUpdate={onUpdateSupplier}
                  onDelete={onDeleteSupplier}
                  loading={formLoading}
                />
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: FABRICANTS ===== */}
            <Tabs.Content value="manufacturers">
              <ManufacturersTable onManufacturerAdded={refreshManufacturers} />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </PageContainer>
    </Box>
  );
}
