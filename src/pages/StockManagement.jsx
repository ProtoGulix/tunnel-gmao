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
  Package,
  ShoppingCart,
  TruckIcon,
  Zap,
  Building2,
  Factory,
  Plus,
} from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import { usePageHeaderProps } from "@/hooks/usePageConfig";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import ErrorDisplay from "@/components/ErrorDisplay";
import LoadingState from "@/components/common/LoadingState";
import { usePurchaseRequestFilters } from "@/hooks/useFilters";
import { useRequestStats } from "@/hooks/useStockData";
import FilterSelect from "@/components/common/FilterSelect";
import PurchaseRequestsTable from "@/components/purchase/requests/PurchaseRequestsTable";
import StockItemLinkForm from "@/components/stock/StockItemLinkForm";
import AddStockItemDialog from "@/components/stock/AddStockItemDialog";
import SupplierOrdersTable from "@/components/purchase/orders/SupplierOrdersTable";
import SuppliersTable from "@/components/purchase/suppliers/SuppliersTable";
import TableHeader from "@/components/common/TableHeader";
import { PURCHASE_REQUEST_STATUS } from "@/config/purchasingConfig";
import StockItemsTable from "@/components/stock/StockItemsTable";
import EmptyState from "@/components/common/EmptyState";
import ManufacturersTable from "@/components/purchase/manufacturers/ManufacturersTable";
import StatusCallout from "@/components/common/StatusCallout";

// Custom hooks pour la logique métier
import { useStockItemsManagement } from "@/hooks/useStockItemsManagement";
import { usePurchaseRequestsManagement } from "@/hooks/usePurchaseRequestsManagement";
import { usePurchasingManagement } from "@/hooks/usePurchasingManagement";
import { STOCK_MANAGEMENT_TABS, DEFAULT_SUPPLIER_REF_FORM } from "@/config/stockManagementConfig";
import { manufacturerItems, stock as stockAPI } from "@/lib/api/facade";

export default function StockManagement() {
  // ========== 1. CUSTOM HOOKS (Logique métier) ==========
  const [error, setError] = useState(null);
  const stock = useStockItemsManagement(setError);
  const purchases = usePurchaseRequestsManagement(setError);
  const purchasing = usePurchasingManagement(setError);

  // ========== 2. UI STATE ==========
  const [activeTab, setActiveTab] = useState(STOCK_MANAGEMENT_TABS.REQUESTS);
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);

  // Search & filter state
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [stockFamilyFilter, setStockFamilyFilter] = useState("all");
  const [requestSearchTerm, setRequestSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierOrderStatusFilter, setSupplierOrderStatusFilter] = useState("all");
  const [supplierOrderSearchTerm, setSupplierOrderSearchTerm] = useState("");
  const [supplierOrderSupplierFilter, setSupplierOrderSupplierFilter] = useState("all");
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("");

  // Ref to SuppliersTable for triggering add dialog from TableHeader
  const suppliersTableRef = useRef(null);

  // Expansion state (pour PurchaseRequestsTable)
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Supplier refs form state (pour StockItemsTable)
  const [supplierRefFormData, setSupplierRefFormData] = useState(DEFAULT_SUPPLIER_REF_FORM);
  
  const [compactRows, setCompactRows] = useState(false);

  // ========== 3. CUSTOM HOOKS VARIABLES ==========
  // availableStatuses not used; removed to satisfy ESLint
  const requestStats = useRequestStats(purchases.requests);
  const baseFilteredRequests = usePurchaseRequestFilters(
    purchases.requests,
    requestSearchTerm,
    urgencyFilter,
    statusFilter
  );

  // Note: Removed unused STATUS_PRIORITY constant to satisfy ESLint.

  const filteredRequests = useMemo(() => {
    const hasMissingInfo = (req) => {
      const hasLink = !!req.stockItemId;
      const hasQty = Number(req.quantity) > 0;
      const supplierRefs = stock.supplierRefsByItem?.[req.stockItemId] || [];
      const hasSupplierInfo = supplierRefs.some(ref => ref.isPreferred);
      const hasRef = !!req.itemLabel;
      return !(hasLink && hasQty && hasSupplierInfo && hasRef);
    };

    return [...baseFilteredRequests]
      .filter(req => req.status !== 'received')
      .sort((a, b) => {
        const aMissing = hasMissingInfo(a) ? 1 : 0;
        const bMissing = hasMissingInfo(b) ? 1 : 0;
        if (aMissing !== bMissing) return bMissing - aMissing;

        const ageA = new Date().getTime() - new Date(a.createdAt).getTime();
        const ageB = new Date().getTime() - new Date(b.createdAt).getTime();
        return ageB - ageA;
      });
  }, [baseFilteredRequests, stock.supplierRefsByItem]);

  // Précharger les refs fournisseurs uniquement pour les demandes visibles
  useEffect(() => {
    const itemIds = filteredRequests.map((req) => req.stockItemId).filter(Boolean);
    stock.prefetchSupplierRefsForItems?.(itemIds);
  }, [filteredRequests, stock]);

  // Précharger les refs pour toutes les demandes non archivées (open/in_progress/ordered)
  useEffect(() => {
    const activeItemIds = purchases.requests
      .filter((req) => {
        const statusId = typeof req.status === 'string' ? req.status : req.status?.id;
        return statusId !== 'received' && statusId !== 'closed' && statusId !== 'cancelled';
      })
      .map((req) => req.stockItemId)
      .filter(Boolean);
    stock.prefetchSupplierRefsForItems?.(activeItemIds);
  }, [purchases.requests, stock]);

  const receivedRequests = useMemo(() => {
    return [...baseFilteredRequests]
      .filter(req => req.status === 'received')
      .sort((a, b) => {
        const ageA = new Date().getTime() - new Date(a.createdAt).getTime();
        const ageB = new Date().getTime() - new Date(b.createdAt).getTime();
        return ageB - ageA;
      });
  }, [baseFilteredRequests]);

  // ========== 4. COMPUTED VALUES (useMemo) ==========
  const families = useMemo(
    () => ["all", ...new Set(stock.stockItems.map(item => item.family_code).filter(Boolean))],
    [stock.stockItems]
  );

  // Pre-calculate supplier ref counts from supplierRefsByItem to avoid dynamic counting
  const supplierRefsCounts = useMemo(() => {
    const counts = {};
    Object.entries(stock.supplierRefsByItem || {}).forEach(([itemId, refs]) => {
      counts[itemId] = (refs || []).length;
    });
    return counts;
  }, [stock.supplierRefsByItem]);
  
  const filteredStockItems = useMemo(() => {
    return stock.stockItems.filter(item => {
      const matchesSearch = !stockSearchTerm || 
        item.name?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.ref?.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
        item.family_code?.toLowerCase().includes(stockSearchTerm.toLowerCase());
      
      const matchesFamily = stockFamilyFilter === "all" || item.family_code === stockFamilyFilter;
      
      return matchesSearch && matchesFamily;
    });
  }, [stock.stockItems, stockSearchTerm, stockFamilyFilter]);

  const filteredSupplierOrders = useMemo(() => {
    let orders = purchasing.supplierOrders;
    
    // Exclure les paniers clôturés et annulés
    orders = orders.filter((order) => !["CLOSED", "CANCELLED"].includes(order.status));
    
    // Appliquer le filtre de statut
    if (supplierOrderStatusFilter !== "all") {
      orders = orders.filter((order) => order.status === supplierOrderStatusFilter);
    }
    // Appliquer la recherche (n°, fournisseur)
    if (supplierOrderSearchTerm.trim()) {
      const term = supplierOrderSearchTerm.toLowerCase();
      orders = orders.filter((order) => {
        const number = (order.order_number || "").toLowerCase();
        const supplierName = (order.supplier_id?.name || "").toLowerCase();
        return number.includes(term) || supplierName.includes(term);
      });
    }
    // Filtre par fournisseur
    if (supplierOrderSupplierFilter !== "all") {
      orders = orders.filter((order) => (order.supplier_id?.name || "") === supplierOrderSupplierFilter);
    }
    
    return orders;
  }, [purchasing.supplierOrders, supplierOrderStatusFilter, supplierOrderSearchTerm, supplierOrderSupplierFilter]);

  // Options fournisseurs (pour le filtre Fournisseur du header)
  const supplierOrderSupplierOptions = useMemo(() => {
    const names = new Set(
      purchasing.supplierOrders
        .map((o) => o.supplier_id?.name)
        .filter((n) => typeof n === "string" && n.trim().length > 0)
    );
    return [
      { value: "all", label: "Tous" },
      ...Array.from(names).sort((a, b) => a.localeCompare(b)).map((n) => ({ value: n, label: n })),
    ];
  }, [purchasing.supplierOrders]);

  const archivedSupplierOrders = useMemo(() => {
    return purchasing.supplierOrders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status));
  }, [purchasing.supplierOrders]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearchTerm.trim()) return purchasing.suppliers;
    const term = supplierSearchTerm.toLowerCase();
    return purchasing.suppliers.filter(supplier => 
      supplier.name?.toLowerCase().includes(term) ||
      supplier.code?.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term)
    );
  }, [purchasing.suppliers, supplierSearchTerm]);

  // Sorted supplier-refs list removed (context moved under Suppliers)
  
  const stockStats = useMemo(
    () => ({
      total: stock.stockItems.length,
      families: families.length - 1,
    }),
    [stock.stockItems.length, families.length]
  );

  const readyCount = useMemo(() => {
    // Une demande est prête au dispatch si :
    // 1. Status = "open"
    // 2. Un article est lié (stock_item_id)
    // 3. L'article a un fournisseur préféré défini
    return purchases.requests.filter((r) => {
      const statusId = typeof r.status === 'string' ? r.status : r.status?.id;
      if (statusId !== "open" || !r.stockItemId) return false;
      
      // Vérifier si l'article lié a un fournisseur préféré
      const supplierRefs = stock.supplierRefsByItem?.[r.stockItemId] || [];
      
      return supplierRefs.some(ref => ref.isPreferred);
    }).length;
  }, [purchases.requests, stock.supplierRefsByItem]);

  const toQualifyCount = useMemo(
    () => purchases.requests.filter((r) => {
      const statusId = typeof r.status === 'string' ? r.status : r.status?.id;
      if (statusId !== "open") return false;
      if (!r.stockItemId) return false;
      
      // Demande a un article mais pas de fournisseur préféré
      const supplierRefs = stock.supplierRefsByItem?.[r.stockItemId] || [];
      const hasPreferredSupplier = supplierRefs.some(ref => ref.isPreferred);
      return !hasPreferredSupplier;
    }).length,
    [purchases.requests, stock.supplierRefsByItem]
  );

  const unlinkedCount = useMemo(
    () => purchases.requests.filter((r) => {
      const statusId = typeof r.status === 'string' ? r.status : r.status?.id;
      return statusId === "open" && !r.stockItemId;
    }).length,
    [purchases.requests]
  );

  const openOrdersCount = useMemo(
    () => purchasing.supplierOrders.filter((o) => o.status === "OPEN").length,
    [purchasing.supplierOrders]
  );

  // ========== 4. CALLBACKS (useCallback) ==========
  // Refresh functions now delegate to hooks
  const refreshRequests = async () => {
    await purchases.loadRequests(false);
  };

  const refreshOrders = async () => {
    await purchasing.loadSupplierOrders(false);
  };

  const refreshStock = async () => {
    await stock.loadStockItems(false);
  };

  const refreshSuppliers = async () => {
    await purchasing.loadSuppliers(false);
  };

  // Handlers passed to child components (memoized to reduce re-renders)
  const onAddSupplierRefForRequests = useCallback(async (stockItemId, refData) => {
    try {
      setFormLoading(true);
      let manufacturer_item_id = null;
      // Créer/récupérer le fabricant si au moins un champ (nom OU référence) est renseigné
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
          is_preferred: false,
          ...(manufacturer_item_id ? { manufacturer_item_id } : {}),
        }
      );
      await Promise.all([
        stock.loadSupplierRefs(stockItemId),
        stock.loadStockItems(false),
      ]);
      setDispatchResult({
        type: 'success',
        message: 'Référence fournisseur ajoutée',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (err) {
      console.error('Erreur ajout référence:', err);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de l\'ajout de la référence',
      });
    } finally {
      setFormLoading(false);
    }
  }, [stock, setDispatchResult]);

  const onAddStandardSpecForRequests = useCallback(async (stockItemId, specsData) => {
    try {
      setFormLoading(true);
      await stockAPI.createStockItemStandardSpec({
        stock_item_id: stockItemId,
        title: specsData.title,
        spec_text: specsData.spec_text,
        is_default: specsData.is_default ?? false,
      });
      await Promise.all([
        stock.loadStockItems(false),
        purchases.loadRequests(false),
      ]);
      setDispatchResult({
        type: 'success',
        message: 'Spécification ajoutée',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (err) {
      console.error('Erreur ajout spécification:', err);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de l\'ajout de la spécification',
      });
    } finally {
      setFormLoading(false);
    }
  }, [stock, purchases, setDispatchResult]);

  // Handlers for StockItemsTable supplier refs management
  const handleAddSupplierRef = useCallback(async (stockItemId) => {
    // Capture les valeurs IMMÉDIATEMENT pour éviter les race conditions
    const currentFormData = { ...supplierRefFormData };
    const trimmedSupplierRef = (currentFormData.supplier_ref || '').trim();
    const trimmedSupplierId = (currentFormData.supplier_id || '').trim();

    // If called without form data, just reload the refs (refresh call from useEffect)
    if (!trimmedSupplierId && !trimmedSupplierRef) {
      try {
        await stock.loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur rechargement références:', error);
      }
      return;
    }

    console.warn('[DEBUG] handleAddSupplierRef called with:', {
      stockItemId,
      currentFormData,
      trimmed: { trimmedSupplierId, trimmedSupplierRef }
    });

    if (!trimmedSupplierId || !trimmedSupplierRef) {
      console.error('[DEBUG] Validation FAILED - Missing data:', {
        supplier_id: trimmedSupplierId ? '✓ OK' : '✗ MISSING',
        supplier_ref: trimmedSupplierRef ? '✓ OK' : '✗ MISSING',
      });
      setDispatchResult({
        type: 'warning',
        message: 'Veuillez remplir le fournisseur et la référence',
      });
      return;
    }

    try {
      setFormLoading(true);
      let manufacturer_item_id = null;
      // Créer/récupérer le fabricant si au moins un champ (nom OU référence) est renseigné
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

      const payload = {
        stock_item_id: stockItemId,
        supplier_id: trimmedSupplierId,
        supplier_ref: trimmedSupplierRef,
        unit_price: parseFloat(currentFormData.unit_price) || null,
        delivery_time_days: parseInt(currentFormData.delivery_time_days) || null,
        is_preferred: currentFormData.is_preferred,
        ...(manufacturer_item_id ? { manufacturer_item_id } : {}),
      };

      console.warn('[DEBUG] Sending payload to API:', payload);

      // Call addSupplierRef with correct signature: (stockItemId, refData)
      // But payload already has stock_item_id, so extract it
      const refData = {
        supplier_id: payload.supplier_id,
        supplier_ref: payload.supplier_ref,
        unit_price: payload.unit_price,
        delivery_time_days: payload.delivery_time_days,
        is_preferred: payload.is_preferred,
        ...(payload.manufacturer_item_id ? { manufacturer_item_id: payload.manufacturer_item_id } : {}),
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
          ? 'Ce fournisseur est déjà associé à cet article (référence existante).'
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
        // Recharger les demandes d'achat car le backend peut avoir changé leur statut
        // si c'est un changement de fournisseur préféré
        purchases.loadRequests(false),
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
  }, [stock, purchases, setDispatchResult]);

  const toggleExpand = (requestId) => {
    setExpandedRequestId(prev => prev === requestId ? null : requestId);
  };

  // Quand on ouvre une demande, charger au besoin les refs/specifics liées à l'article
  useEffect(() => {
    if (!expandedRequestId) return;
    const req = purchases.requests.find((r) => r.id === expandedRequestId);
    const stockItemId = req?.stockItemId;
    if (!stockItemId) return;

    if (!stock.supplierRefsByItem?.[stockItemId]) {
      stock.loadSupplierRefs?.(stockItemId);
    }
    if (!stock.standardSpecsByItem?.[stockItemId]) {
      stock.loadStandardSpecs?.(stockItemId);
    }
  }, [expandedRequestId, purchases.requests, stock]);

  const handleLinkExisting = async (requestId, stockItem) => {
    try {
      setFormLoading(true);
      await purchases.linkExistingItem(requestId, stockItem);
      await refreshRequests();
      setExpandedRequestId(null);
      
      setDispatchResult({
        type: 'success',
        message: 'Article lié avec succès',
        details: `"${stockItem.name}" a été lié à la demande`
      });
      setTimeout(() => setDispatchResult(null), 4000);
    } catch (error) {
      console.error("Erreur liaison:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la liaison',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateNew = async (requestId, itemData) => {
    try {
      setFormLoading(true);
      const newStockItem = await stock.addStockItem({
        ...itemData,
        quantity: 0,
      });

      await purchases.linkExistingItem(requestId, newStockItem);

      await Promise.all([refreshStock(), refreshRequests()]);
      setExpandedRequestId(null);
      
      setDispatchResult({
        type: 'success',
        message: 'Article créé et lié avec succès',
        details: `"${newStockItem.name}" (${newStockItem.ref}) a été créé et lié à la demande`
      });
      setTimeout(() => setDispatchResult(null), 5000);
    } catch (error) {
      console.error("Erreur création:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la création',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddStockItem = async (itemData) => {
    try {
      const newItem = await stock.addStockItem(itemData);
      await refreshStock();
      
      setDispatchResult({
        type: 'success',
        message: 'Article ajouté avec succès',
        details: `"${newItem.name}" a été ajouté au stock`
      });
      setTimeout(() => setDispatchResult(null), 4000);
    } catch (error) {
      console.error("Erreur ajout article:", error);
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
      // 1. Gérer le manufacturer_item_id si des champs fabricant sont remplis
      let manufacturer_item_id = null;
      if (itemData.manufacturer_name?.trim() || itemData.manufacturer_ref?.trim()) {
        const manu = await manufacturerItems.getOrCreateManufacturerItem({
          name: itemData.manufacturer_name?.trim() || "",
          ref: itemData.manufacturer_ref?.trim() || "",
          designation: itemData.manufacturer_designation?.trim() || ""
        });
        manufacturer_item_id = manu?.id || null;
      }

      // 2. Préparer les données pour l'API (retirer les champs temporaires)
      const apiData = { ...itemData };
      delete apiData.manufacturer_name;
      delete apiData.manufacturer_ref;
      delete apiData.manufacturer_designation;
      
      // 3. Ajouter manufacturer_item_id si disponible
      const payload = {
        ...apiData,
        ...(manufacturer_item_id ? { manufacturer_item_id } : {})
      };

      const updatedItem = await stock.updateItem(itemId, payload);
      await refreshStock();
      
      setDispatchResult({
        type: 'success',
        message: 'Article modifié avec succès',
        details: `"${updatedItem.name}" a été mis à jour`
      });
      setTimeout(() => setDispatchResult(null), 4000);
    } catch (error) {
      console.error("Erreur modification article:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la modification',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await purchases.updateStatus(requestId, newStatus);
      await refreshRequests();
    } catch (error) {
      console.error("Erreur changement statut:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors du changement de statut',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    }
  };

  const handleDispatchClick = () => {
    // Compter les demandes vraiment prêtes (open + article + fournisseur préféré)
    const trueReadyCount = filteredRequests.filter(r => {
      const statusId = typeof r.status === 'string' ? r.status : r.status?.id;
      if (statusId !== "open" || !r.stockItemId) return false;
      const supplierRefs = stock.supplierRefsByItem?.[r.stockItemId] || [];
      return supplierRefs.some(ref => ref.isPreferred);
    }).length;

    if (trueReadyCount === 0) {
      setDispatchResult({
        type: 'warning',
        message: 'Aucune demande prête pour dispatch',
        details: 'Les demandes ouvertes doivent avoir : 1) un article lié, 2) un fournisseur préféré défini pour cet article'
      });
      setTimeout(() => setDispatchResult(null), 6000);
      return;
    }
    setShowDispatchConfirm(true);
  };

  const handleDispatchConfirm = async () => {
    setShowDispatchConfirm(false);
    setDispatchResult(null);
    
    try {
      const results = await purchasing.dispatch();

      setDispatchResult({
        type: results.errors.length > 0 ? 'warning' : 'success',
        message: 'Dispatch terminé',
        dispatched: results.dispatched.length,
        toQualify: results.toQualify.length,
        errors: results.errors.length,
        errorDetails: results.errors
      });

      await Promise.all([refreshRequests(), refreshOrders()]);
      
      setTimeout(() => setDispatchResult(null), 8000);
    } catch (error) {
      console.error("Erreur dispatch:", error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors du dispatch',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
    }
  };

  // ========== 5. EFFECTS (useEffect) ==========
  // Protéger contre React StrictMode et les dépendances instables
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    // Charger les données UNE SEULE FOIS au montage
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
      purchasing.loadAll(true)
    ]);
  }, [purchases, purchasing, stock]); // Pas de dépendances - charge une seule fois

  // Auto-refresh silencieux (pas de spinner pour éviter le clignotement)
  useAutoRefresh(async () => {
    await Promise.all([
      stock.loadStockItems(false),
      purchases.loadRequests(false),
      purchasing.loadAll(false)
    ]);
  }, 5, true);

  // Loading and error state - derived from hooks
  const isLoading = stock.loading || purchases.loading || purchasing.loading;
  const componentError = error; // From useState at the top

  // ========== 6. HEADER PROPS ==========
  const headerProps = usePageHeaderProps({
    subtitle:
      activeTab === "stock"
        ? `${filteredStockItems.length} article${filteredStockItems.length > 1 ? "s" : ""}`
        : activeTab === "requests"
        ? `${filteredRequests.length} demande${filteredRequests.length > 1 ? "s" : ""}`
        : activeTab === "orders"
        ? `${filteredSupplierOrders.length} panier${filteredSupplierOrders.length > 1 ? "s" : ""}`
        : activeTab === "suppliers"
        ? `${filteredSuppliers.length} fournisseur${filteredSuppliers.length > 1 ? "s" : ""}`
        : `Fabricants`,
    urgentBadge:
      requestStats.urgent > 0
        ? { count: requestStats.urgent, label: "urgent" }
        : null,
    stats: !isLoading && !componentError ? [
      { label: "Articles", value: stockStats.total },
      { label: "Demandes", value: requestStats.total },
      { label: "Prêtes", value: readyCount },
      { label: "À qualifier", value: toQualifyCount },
      { label: "Paniers ouverts", value: openOrdersCount },
    ] : [],
    onRefresh: () => Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
      purchasing.loadAll(true)
    ]), // Refresh manuel avec spinner
  });

  if (isLoading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <LoadingState message="Chargement du stock et des achats..." />
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
              purchasing.loadAll(true)
            ])}
            title="Erreur de chargement du stock"
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
            <Flex direction="column" gap="1">
              {dispatchResult.dispatched !== undefined && (
                <Flex direction="column" gap="1" mt="2">
                  <Text size="2">✅ {dispatchResult.dispatched} DA dispatchée{dispatchResult.dispatched > 1 ? 's' : ''}</Text>
                  {dispatchResult.toQualify > 0 && (
                    <Text size="2">⚠️ {dispatchResult.toQualify} DA à qualifier (pas de fournisseur préféré)</Text>
                  )}
                  {dispatchResult.errors > 0 && (
                    <Text size="2" color="red">❌ {dispatchResult.errors} erreur{dispatchResult.errors > 1 ? 's' : ''}</Text>
                  )}
                </Flex>
              )}
              {dispatchResult.details && (
                <Text size="2" mt="1">{dispatchResult.details}</Text>
              )}
            </Flex>
          </StatusCallout>
        )}

        {/* Confirmation dispatch */}
        {showDispatchConfirm && (
          <StatusCallout type="info" dialog title="Confirmer le dispatch">
            <Flex direction="column" gap="3">
              <Text size="2" color="gray" style={{ display: 'block', marginTop: '4px' }}>
                {readyCount} demande{readyCount > 1 ? 's' : ''} d&#39;achat {readyCount > 1 ? 'vont être dispatchées' : 'va être dispatchée'} vers les paniers fournisseurs.
              </Text>
              <Flex gap="2">
                <Button 
                  size="2" 
                  color="blue" 
                  onClick={handleDispatchConfirm}
                  disabled={purchasing.dispatching}
                  aria-label="Confirmer le dispatch des demandes d'achat"
                >
                  <Zap size={14} />
                  Confirmer
                </Button>
                <Button 
                  size="2" 
                  variant="soft" 
                  color="gray" 
                  onClick={() => setShowDispatchConfirm(false)}
                  disabled={purchasing.dispatching}
                  aria-label="Annuler le dispatch"
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </StatusCallout>
        )}

        {/* Alert dispatch automatique */}
        {readyCount > 0 && !showDispatchConfirm && (
          <Card mb="3" style={{ background: "var(--blue-2)" }}>
            <Flex align="center" justify="between" gap="3">
              <Flex align="center" gap="3">
                <Zap size={24} color="var(--blue-9)" />
                <Box>
                  <Text weight="bold" size="3">
                    {readyCount} demande{readyCount > 1 ? "s" : ""} ouverte{readyCount > 1 ? "s" : ""} prête{readyCount > 1 ? "s" : ""} pour dispatch
                  </Text>
                  <Text size="2" color="gray" style={{ display: "block" }}>
                    Ces demandes ont un article lié et peuvent être dispatchées automatiquement
                  </Text>
                </Box>
              </Flex>
              <Button
                size="3"
                color="blue"
                onClick={handleDispatchClick}
                disabled={purchasing.dispatching}
                aria-label="Dispatcher les demandes d'achat prêtes vers les paniers fournisseurs"
              >
                <Zap size={16} />
                {purchasing.dispatching ? "Dispatch en cours..." : "Dispatcher maintenant"}
              </Button>
            </Flex>
          </Card>
        )}

        {/* Alert à qualifier */}
        {unlinkedCount > 0 && (
          <StatusCallout type="warning">
            {unlinkedCount} demande{unlinkedCount > 1 ? "s" : ""} sans article lié : 
            vous devez lier ces demandes à un article en stock avant de pouvoir les dispatcher
          </StatusCallout>
        )}

        {/* Alert sans fournisseur préféré */}
        {toQualifyCount > 0 && (
          <StatusCallout type="warning">
            {toQualifyCount} demande{toQualifyCount > 1 ? "s" : ""} sans fournisseur préféré : 
            définissez un fournisseur préféré pour chaque article lié avant de dispatcher
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

            <Tabs.Trigger value="orders">
              <Flex align="center" gap="2">
                <TruckIcon size={14} />
                <Text>Paniers fournisseurs</Text>
                {openOrdersCount > 0 && (
                  <Badge color="gray" variant="solid" size="1">
                    {openOrdersCount}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value="stock">
              <Flex align="center" gap="2">
                <Package size={14} />
                <Text>Articles en stock</Text>
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

            {/* Supplier-refs tab removed: handled under Suppliers */}
            <Tabs.Trigger value="manufacturers">
              <Flex align="center" gap="2">
                <Factory size={14} />
                <Text>Fabricants</Text>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            {/* ===== TAB: PURCHASE REQUESTS ===== */}
            <Tabs.Content value="requests">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={ShoppingCart}
                  title="Demandes d'achat"
                  count={filteredRequests.length}
                  searchValue={requestSearchTerm}
                  onSearchChange={setRequestSearchTerm}
                  searchPlaceholder="Recherche (article, demandeur...)"
                  onRefresh={refreshRequests}
                  showRefreshButton={false}
                  actions={
                    <Flex align="end" gap="2">
                      <FilterSelect
                        label="Statut"
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        minWidth="180px"
                        options={[
                          { value: "all", label: "Tous" },
                          ...Object.values(PURCHASE_REQUEST_STATUS).map((s) => ({
                            value: s.id,
                            label: s.label,
                          })),
                        ]}
                      />
                      <FilterSelect
                        label="Urgence"
                        value={urgencyFilter}
                        onValueChange={setUrgencyFilter}
                        minWidth="150px"
                        options={[
                          { value: "all", label: "Toutes" },
                          { value: "high", label: "Urgent" },
                          { value: "normal", label: "Normal" },
                          { value: "low", label: "Faible" },
                        ]}
                      />
                    </Flex>
                  }
                />

                {filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={<ShoppingCart size={64} />}
                    title="Aucune demande trouvée"
                    description="Ajustez ou réinitialisez les filtres pour afficher les demandes d&#39;achat"
                    actions={[
                      <Button
                        key="reset-filters-requests"
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() => {
                          setRequestSearchTerm("");
                          setUrgencyFilter("all");
                          setStatusFilter("all");
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
                      key={`${filteredRequests.length}-${stock.stockItems.length}-${Object.keys(stock.standardSpecsByItem || {}).length}-${Object.keys(stock.supplierRefsByItem || {}).length}`}
                      requests={filteredRequests}
                      expandedRequestId={expandedRequestId}
                      onToggleExpand={toggleExpand}
                      onStatusChange={handleStatusChange}
                      stockItems={stock.stockItems}
                      supplierRefs={stock.supplierRefsByItem || {}}
                      standardSpecs={stock.standardSpecsByItem || {}}
                      onRefresh={refreshRequests}
                      suppliers={purchasing.suppliers}
                      loading={formLoading}
                      setDispatchResult={setDispatchResult}
                      compact={compactRows}
                      onAddSupplierRef={onAddSupplierRefForRequests}
                      onAddStandardSpec={onAddStandardSpecForRequests}
                      renderExpandedContent={(request) => (
                        <StockItemLinkForm
                          requestId={request.id}
                          initialItemLabel={request.itemLabel}
                          onLinkExisting={handleLinkExisting}
                          onCreateNew={handleCreateNew}
                          loading={formLoading}
                        />
                      )}
                    />

                    {/* Section Demandes terminées (reçues) */}
                    {receivedRequests.length > 0 && (
                      <Card>
                        <Flex direction="column" gap="3">
                          <Text size="3" weight="bold">
                            Demandes archivées ({receivedRequests.length})
                          </Text>
                          <PurchaseRequestsTable
                            key={`received-${receivedRequests.length}`}
                            requests={receivedRequests}
                            expandedRequestId={expandedRequestId}
                            onToggleExpand={toggleExpand}
                            onStatusChange={handleStatusChange}
                            stockItems={stock.stockItems}
                            supplierRefs={stock.supplierRefsByItem || {}}
                            standardSpecs={stock.standardSpecsByItem || {}}
                            onRefresh={refreshRequests}
                            suppliers={purchasing.suppliers}
                            loading={formLoading}
                            setDispatchResult={setDispatchResult}
                            compact={compactRows}
                            onAddSupplierRef={onAddSupplierRefForRequests}
                            onAddStandardSpec={onAddStandardSpecForRequests}
                            renderExpandedContent={(request) => (
                              <StockItemLinkForm
                                requestId={request.id}
                                initialItemLabel={request.itemLabel}
                                onLinkExisting={handleLinkExisting}
                                onCreateNew={handleCreateNew}
                                loading={formLoading}
                              />
                            )}
                          />
                        </Flex>
                      </Card>
                    )}
                  </Flex>
                )}
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: SUPPLIER ORDERS ===== */}
            <Tabs.Content value="orders">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={TruckIcon}
                  title="Paniers fournisseurs"
                  count={filteredSupplierOrders.length}
                  searchValue={supplierOrderSearchTerm}
                  onSearchChange={setSupplierOrderSearchTerm}
                  searchPlaceholder="Recherche (n°, fournisseur...)"
                  onRefresh={refreshOrders}
                  showRefreshButton={false}
                  actions={
                    <Flex align="center" gap="2">
                      <FilterSelect
                        label="Statut"
                        value={supplierOrderStatusFilter}
                        onValueChange={setSupplierOrderStatusFilter}
                        minWidth="200px"
                        options={[
                          { value: "all", label: "Tous" },
                          { value: "OPEN", label: "Ouverts" },
                          { value: "SENT", label: "Envoyés (attente réponse)" },
                          { value: "ACK", label: "Réponse reçue" },
                          { value: "RECEIVED", label: "Commandés" },
                          { value: "CLOSED", label: "Clôturés" },
                        ]}
                      />
                      <FilterSelect
                        label="Fournisseur"
                        value={supplierOrderSupplierFilter}
                        onValueChange={setSupplierOrderSupplierFilter}
                        minWidth="220px"
                        options={supplierOrderSupplierOptions}
                      />
                    </Flex>
                  }
                />
                {filteredSupplierOrders.length === 0 ? (
                  <EmptyState
                    icon={<TruckIcon size={64} />}
                    title="Aucun panier fournisseur"
                    description="Créez une commande ou modifiez les filtres pour voir les paniers existants"
                    actions={[
                      <Button key="refresh-orders" size="2" onClick={refreshOrders}>
                        Rafraîchir
                      </Button>,
                      <Button
                        key="reset-filter-orders"
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() => { setSupplierOrderStatusFilter("all"); setSupplierOrderSupplierFilter("all"); setSupplierOrderSearchTerm(""); }}
                      >
                        Réinitialiser le filtre
                      </Button>
                    ]}
                  />
                ) : (
                  <Flex direction="column" gap="4">
                    <SupplierOrdersTable
                      orders={filteredSupplierOrders}
                      onRefresh={refreshOrders}
                    />

                    {/* Section Paniers archivés (clôturés/annulés) */}
                    {archivedSupplierOrders.length > 0 && (
                      <Card>
                        <Flex direction="column" gap="3">
                          <Text size="3" weight="bold">
                            Paniers archivés ({archivedSupplierOrders.length})
                          </Text>
                          <SupplierOrdersTable
                            orders={archivedSupplierOrders}
                            onRefresh={refreshOrders}
                          />
                        </Flex>
                      </Card>
                    )}
                  </Flex>
                )}
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: STOCK ITEMS ===== */}
            <Tabs.Content value="stock">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={Package}
                  title="Articles en stock"
                  count={filteredStockItems.length}
                  searchValue={stockSearchTerm}
                  onSearchChange={setStockSearchTerm}
                  searchPlaceholder="Recherche (nom, ref, famille...)"
                  showRefreshButton={false}
                  actions={<AddStockItemDialog onAdd={handleAddStockItem} loading={isLoading} />}
                />
                {filteredStockItems.length === 0 ? (
                  <EmptyState
                    icon={<Package size={64} />}
                    title="Aucun article en stock"
                    description="Ajoutez un article ou modifiez les filtres pour voir la liste"
                    actions={[
                      <Button
                        key="reset-filters-stock"
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={() => {
                          setStockSearchTerm("");
                          setStockFamilyFilter("all");
                        }}
                      >
                        Réinitialiser les filtres
                      </Button>,
                      <Button key="refresh-stock" size="2" onClick={refreshStock}>Rafraîchir</Button>
                    ]}
                  />
                ) : (
                  <StockItemsTable
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
                    loading={isLoading}
                    showStockCol={true}
                  />
                )}
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: SUPPLIERS ===== */}
            <Tabs.Content value="suppliers">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={Building2}
                  title="Fournisseurs"
                  count={filteredSuppliers.length}
                  searchValue={supplierSearchTerm}
                  onSearchChange={setSupplierSearchTerm}
                  searchPlaceholder="Recherche (nom, contact, email...)"
                  showRefreshButton={false}
                   actions={
                     <Button onClick={() => suppliersTableRef.current?.openAddDialog()}>
                       <Plus size={16} />
                       Ajouter un fournisseur
                     </Button>
                   }
                />
                <SuppliersTable
                  ref={suppliersTableRef}
                  suppliers={filteredSuppliers}
                  onRefresh={async () => { await refreshSuppliers(); }}
                  searchTerm={supplierSearchTerm}
                  onSearchChange={setSupplierSearchTerm}
                />
              </Flex>
            </Tabs.Content>

            {/* ===== TAB: MANUFACTURERS ===== */}
            <Tabs.Content value="manufacturers">
              <ManufacturersTable />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </PageContainer>
    </Box>
  );
}
