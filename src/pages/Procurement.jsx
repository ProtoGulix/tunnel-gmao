import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Tabs,
  Flex,
  Text,
  Card,
  Button,
  Badge,
  AlertDialog,
} from "@radix-ui/themes";
import {
  ShoppingCart,
  TruckIcon,
  Zap,
  PackagePlus,
  Send,
  PackageCheck,
  Archive,
  Users,
  AlertTriangle,
  Settings,
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
import StockItemSearch from "@/components/stock/StockItemSearch";
import SupplierOrdersTable from "@/components/purchase/orders/SupplierOrdersTable";
import TableHeader from "@/components/common/TableHeader";
import { PURCHASE_REQUEST_STATUS } from "@/config/purchasingConfig";
import EmptyState from "@/components/common/EmptyState";
import StatusCallout from "@/components/common/StatusCallout";

// Custom hooks
import { useStockItemsManagement } from "@/hooks/useStockItemsManagement";
import { usePurchaseRequestsManagement } from "@/hooks/usePurchaseRequestsManagement";
import { usePurchasingManagement } from "@/hooks/usePurchasingManagement";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useSearchParam } from "@/hooks/useSearchParam";
import { useDeletePurchaseRequest } from "@/hooks/useDeletePurchaseRequest";
import useTwinLinesValidation from "@/hooks/useTwinLinesValidation";
import { manufacturerItems, stock as stockAPI, suppliers as suppliersApi } from "@/lib/api/facade";
import {
  canSelectItem,
  canDeselectItem,
  canModifyItem,
  getInitialItemSelection,
  normalizeBasketStatus,
} from "@/lib/purchasing/basketItemRules";
import TwinLinesValidationAlert from "@/components/purchase/orders/TwinLinesValidationAlert";
import { recalculateAllOrderTotals } from "@/lib/purchasing/lineCalculationUtils";
import { derivePurchaseRequestStatus } from "@/lib/purchasing/purchaseRequestStatusUtils";

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
  const [dispatchResult, setDispatchResult] = useState(null);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);

  const [requestSearchTerm, setRequestSearchTerm] = useSearchParam('search', '');
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierOrderStatusFilter, setSupplierOrderStatusFilter] = useState("all");
  const [supplierOrderSearchTerm, setSupplierOrderSearchTerm] = useSearchParam('search', '');
  const [supplierOrderSupplierFilter, setSupplierOrderSupplierFilter] = useState("all");

  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [compactRows, setCompactRows] = useState(false);
  
  // État de sélection des items par panier
  const [itemSelectionByBasket, setItemSelectionByBasket] = useState({});
  
  // État des validations de jumelles (stocke les infos par ligne)
  const [twinValidationsByLine, setTwinValidationsByLine] = useState({});

  // État pour le recalcul des totaux
  const [showRecalculateDialog, setShowRecalculateDialog] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Load manufacturers
  const [allManufacturers, setAllManufacturers] = useState([]);
  
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

  // Load stock families
  const [stockFamilies, setStockFamilies] = useState([]);
  useEffect(() => {
    stockAPI.fetchStockFamilies().then(families => setStockFamilies(families || []));
  }, []);

  // ========== COMPUTED VALUES ==========
  const requestStats = useRequestStats(purchases.requests);
  const baseFilteredRequests = usePurchaseRequestFilters(
    purchases.requests,
    requestSearchTerm,
    urgencyFilter,
    statusFilter
  );

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
      .filter(req => {
        const derivedStatus = req.derived_status || derivePurchaseRequestStatus(req);
        return derivedStatus !== 'received';
      })
      .sort((a, b) => {
        const aMissing = hasMissingInfo(a) ? 1 : 0;
        const bMissing = hasMissingInfo(b) ? 1 : 0;
        if (aMissing !== bMissing) return bMissing - aMissing;

        const ageA = new Date().getTime() - new Date(a.createdAt).getTime();
        const ageB = new Date().getTime() - new Date(b.createdAt).getTime();
        return ageB - ageA;
      });
  }, [baseFilteredRequests, stock.supplierRefsByItem]);

  const receivedRequests = useMemo(() => {
    return [...baseFilteredRequests]
      .filter(req => {
        const derivedStatus = req.derived_status || derivePurchaseRequestStatus(req);
        return derivedStatus === 'received';
      })
      .sort((a, b) => {
        const ageA = new Date().getTime() - new Date(a.createdAt).getTime();
        const ageB = new Date().getTime() - new Date(b.createdAt).getTime();
        return ageB - ageA;
      });
  }, [baseFilteredRequests]);

  // Séparer les paniers par état métier
  const ordersByState = useMemo(() => {
    const pooling = [];
    const sent = [];
    const ordered = [];
    const closed = [];

    purchasing.supplierOrders.forEach((order) => {
      const statusValue = order.status?.id ?? order.status;
      const normalizedStatus = normalizeBasketStatus(statusValue);

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

  // Calcul de l'urgence globale et de l'âge max pour les paniers en mutualisation
  const enrichedPoolingOrders = useMemo(() => {
    return ordersByState.pooling.map(order => {
      const lines = order.lines || [];
      let maxUrgency = 'low';
      let maxAge = 0;
      let hasUrgent = false;
      let hasNormalOver7Days = false;
      
      lines.forEach(line => {
        const urgency = line.urgency || 'normal';
        const lineAge = line.createdAt ? Math.floor((Date.now() - new Date(line.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        // Calculer l'urgence max
        if (urgency === 'high') {
          maxUrgency = 'high';
          hasUrgent = true;
        } else if (urgency === 'normal' && maxUrgency === 'low') {
          maxUrgency = 'normal';
        }
        
        // Calculer l'âge max
        if (lineAge > maxAge) {
          maxAge = lineAge;
        }
        
        // Détecter rupture de mutualisation
        if (urgency === 'high') {
          hasUrgent = true;
        }
        if (urgency === 'normal' && lineAge > 7) {
          hasNormalOver7Days = true;
        }
      });
      
      const poolingBroken = hasUrgent || hasNormalOver7Days;
      
      return {
        ...order,
        globalUrgency: maxUrgency,
        maxLineAge: maxAge,
        poolingBroken,
        hasUrgentLines: hasUrgent,
      };
    });
  }, [ordersByState.pooling]);

  // Filtrage dynamique selon l'onglet actif
  const filteredSupplierOrders = useMemo(() => {
    let orders = [];
    
    switch (activeTab) {
      case PROCUREMENT_TABS.POOLING:
        orders = enrichedPoolingOrders;
        break;
      case PROCUREMENT_TABS.SENT:
        orders = ordersByState.sent;
        break;
      case PROCUREMENT_TABS.ORDERED:
        orders = ordersByState.ordered;
        break;
      case PROCUREMENT_TABS.CLOSED:
        orders = ordersByState.closed;
        break;
      default:
        return [];
    }
    
    // Appliquer la recherche
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
  }, [activeTab, ordersByState, supplierOrderSearchTerm, supplierOrderSupplierFilter]);

  const supplierOrderSupplierOptions = useMemo(() => {
    // Options de fournisseurs basées sur l'onglet actif
    let relevantOrders = [];
    switch (activeTab) {
      case PROCUREMENT_TABS.POOLING:
        relevantOrders = enrichedPoolingOrders;
        break;
      case PROCUREMENT_TABS.SENT:
        relevantOrders = ordersByState.sent;
        break;
      case PROCUREMENT_TABS.ORDERED:
        relevantOrders = ordersByState.ordered;
        break;
      case PROCUREMENT_TABS.CLOSED:
        relevantOrders = ordersByState.closed;
        break;
      default:
        relevantOrders = [];
    }
    
    const names = new Set(
      relevantOrders
        .map((o) => o.supplier_id?.name)
        .filter((n) => typeof n === "string" && n.trim().length > 0)
    );
    return [
      { value: "all", label: "Tous" },
      ...Array.from(names).sort((a, b) => a.localeCompare(b)).map((n) => ({ value: n, label: n })),
    ];
  }, [activeTab, ordersByState]);



  const readyCount = useMemo(() => {
    return purchases.requests.filter((r) => {
      const derivedStatus = r.derived_status || derivePurchaseRequestStatus(r);
      // Statut 'open' = à dispatcher (selon SUPPLIER_ORDER_LIFECYCLE.md)
      if (derivedStatus !== "open" || !r.stockItemId) return false;
      
      return (r.stockItemSupplierRefsCount ?? 0) > 0;
    }).length;
  }, [purchases.requests]);

  const toQualifyCount = useMemo(
    () => purchases.requests.filter((r) => {
      const derivedStatus = r.derived_status || derivePurchaseRequestStatus(r);
      // Statut 'open' = à dispatcher
      if (derivedStatus !== "open") return false;
      if (!r.stockItemId) return false;
      
      return (r.stockItemSupplierRefsCount ?? 0) === 0;
    }).length,
    [purchases.requests]
  );

  const unlinkedCount = useMemo(
    () => purchases.requests.filter((r) => {
      const derivedStatus = r.derived_status || derivePurchaseRequestStatus(r);
      // Statut 'open' = à dispatcher
      return derivedStatus === "open" && !r.stockItemId;
    }).length,
    [purchases.requests]
  );

  const totalOrdersCount = useMemo(
    () => ordersByState.pooling.length + ordersByState.sent.length + ordersByState.ordered.length,
    [ordersByState.pooling.length, ordersByState.sent.length, ordersByState.ordered.length]
  );

  const poolingBrokenCount = useMemo(
    () => enrichedPoolingOrders.filter(o => o.poolingBroken).length,
    [enrichedPoolingOrders]
  );

  // ========== CALLBACKS ==========
  const refreshRequests = async () => {
    await purchases.loadRequests(false);
  };

  const refreshOrders = async () => {
    await purchasing.loadSupplierOrders(false);
    // Réinitialiser l'état de sélection après rafraîchissement
    initializeItemSelection();
  };

  const refreshStock = async () => {
    await stock.loadStockItems(false);
  };

  useDeletePurchaseRequest(async () => {
    await refreshRequests();
    setDispatchResult({
      type: 'success',
      message: 'Demande d\'achat supprimée'
    });
    setTimeout(() => setDispatchResult(null), 3000);
  });

  const onAddSupplierRefForRequests = useCallback(async (stockItemId, refData) => {
    try {
      setFormLoading(true);
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

  const onUpdateStandardSpecForRequests = useCallback(async (specId, specsData) => {
    try {
      setFormLoading(true);
      await stock.updateStockItemStandardSpec(specId, {
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
        message: 'Spécification mise à jour',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (err) {
      console.error('Erreur mise à jour spécification:', err);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la mise à jour de la spécification',
      });
    } finally {
      setFormLoading(false);
    }
  }, [stock, purchases, setDispatchResult]);

  const onDeleteStandardSpecForRequests = useCallback(async (specId) => {
    try {
      setFormLoading(true);
      await stock.deleteStockItemStandardSpec(specId);
      await Promise.all([
        stock.loadStockItems(false),
        purchases.loadRequests(false),
      ]);
      setDispatchResult({
        type: 'success',
        message: 'Spécification supprimée',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (err) {
      console.error('Erreur suppression spécification:', err);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la suppression de la spécification',
      });
    } finally {
      setFormLoading(false);
    }
  }, [stock, purchases, setDispatchResult]);

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

  const [detailsLoadingStates, setDetailsLoadingStates] = useState({});

  const handleLoadDetailsForRequest = useCallback(async (requestId) => {
    const req = purchases.requests.find((r) => r.id === requestId);
    const stockItemId = req?.stockItemId;
    if (!stockItemId) return;

    if (stock.supplierRefsByItem?.[stockItemId] && stock.standardSpecsByItem?.[stockItemId]) {
      return;
    }

    setDetailsLoadingStates(prev => ({ ...prev, [requestId]: true }));

    try {
      const loadPromises = [];
      if (!stock.supplierRefsByItem?.[stockItemId]) {
        loadPromises.push(stock.loadSupplierRefs?.(stockItemId));
      }
      if (!stock.standardSpecsByItem?.[stockItemId]) {
        loadPromises.push(stock.loadStandardSpecs?.(stockItemId));
      }
      await Promise.all(loadPromises);
    } finally {
      setDetailsLoadingStates(prev => ({ ...prev, [requestId]: false }));
    }
  }, [purchases.requests, stock]);

  const handleLinkExisting = async (requestId, stockItem) => {
    try {
      setFormLoading(true);
      await purchases.linkExistingItem(requestId, stockItem);
      await refreshRequests();
      setExpandedRequestId(null);
      
      setDispatchResult({
        type: 'success',
        message: 'Pièce liée avec succès',
        details: `"${stockItem.name}" a été liée à la demande`
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
        message: 'Pièce créée et liée avec succès',
        details: `"${newStockItem.name}" (${newStockItem.ref}) a été créée et liée à la demande`
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

  // ========== GESTION SÉLECTION ITEMS PANIER ==========
  const initializeItemSelection = useCallback(() => {
    const newSelection = {};
    purchasing.supplierOrders.forEach(basket => {
      newSelection[basket.id] = getInitialItemSelection(basket);
    });
    setItemSelectionByBasket(newSelection);
  }, [purchasing.supplierOrders]);

  useEffect(() => {
    if (purchasing.supplierOrders.length > 0) {
      initializeItemSelection();
    }
  }, [purchasing.supplierOrders, initializeItemSelection]);

  const handleToggleItemSelection = useCallback(async (basketId, itemId, nextSelected, updatedLines = []) => {
    const basket = purchasing.supplierOrders.find(b => b.id === basketId);
    const lines = updatedLines.length > 0
      ? updatedLines
      : basket?.lines || basket?.orderLines || [];
    const item = lines.find((l) => l.id === itemId);
    if (!basket || !item) return;

    const currentSelection = itemSelectionByBasket[basketId] || {};
    const isCurrentlySelected = currentSelection[itemId] !== false;
    const targetSelected = typeof nextSelected === 'boolean' ? nextSelected : !isCurrentlySelected;

    // Vérifier si on peut sélectionner/désélectionner
    if (!targetSelected && isCurrentlySelected) {
      // On veut désélectionner
      const result = canDeselectItem(basket, item, purchasing.supplierOrders);
      if (!result.canDeselect) {
        setDispatchResult({
          type: 'warning',
          message: 'Désélection impossible',
          details: result.reason
        });
        setTimeout(() => setDispatchResult(null), 5000);
        return;
      }
    } else if (targetSelected && !isCurrentlySelected) {
      // On veut sélectionner
      const result = canSelectItem(basket, item);
      if (!result.canSelect) {
        setDispatchResult({
          type: 'warning',
          message: 'Sélection impossible',
          details: result.reason
        });
        setTimeout(() => setDispatchResult(null), 5000);
        return;
      }
    }

    // Mettre à jour la sélection
    setItemSelectionByBasket(prev => ({
      ...prev,
      [basketId]: {
        ...prev[basketId],
        [itemId]: targetSelected,
      },
    }));

    purchasing.updateOrderLine(basketId, itemId, {
      is_selected: targetSelected,
      isSelected: targetSelected,
    });

    try {
      await suppliersApi.updateSupplierOrderLine(itemId, { isSelected: targetSelected });
    } catch (err) {
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la mise à jour de la sélection',
        details: err?.message,
      });
      setTimeout(() => setDispatchResult(null), 5000);
    }
  }, [itemSelectionByBasket, purchasing.supplierOrders, purchasing, suppliersApi]);

  /**
   * Valide les lignes jumelles d'un panier
   * Retourne les erreurs trouvées
   */
  const validateBasketTwinLines = useCallback((basket) => {
    const errors = [];
    const warnings = [];
    const lines = basket.lines || [];
    
    // Pour chaque ligne, vérifier s'il y a des problèmes de validation de jumelles
    lines.forEach(line => {
      const validation = twinValidationsByLine[line.id];
      if (!validation) return;
      
      // Si la ligne a des jumelles et des erreurs de validation
      if (validation.hasTwins && validation.validationErrors.length > 0) {
        errors.push({
          lineId: line.id,
          stockItem: line.stock_item_id?.name || 'Article inconnu',
          errors: validation.validationErrors
        });
      }
      
      // Collecter aussi les warnings
      if (validation.hasTwins && validation.validationWarnings.length > 0) {
        warnings.push({
          lineId: line.id,
          stockItem: line.stock_item_id?.name || 'Article inconnu',
          warnings: validation.validationWarnings
        });
      }
    });
    
    return { errors, warnings };
  }, [twinValidationsByLine]);

  const handleBasketStatusChange = useCallback(async (basketId, newStatus) => {
    const basket = purchasing.supplierOrders.find(b => b.id === basketId);
    if (!basket) return;

    const currentSelection = itemSelectionByBasket[basketId] || {};
    
    // Valider les lignes jumelles si on passe de ASK (SENT) vers ORDERED
    const currentStatus = normalizeBasketStatus(basket.status || '');
    if (currentStatus === 'SENT' && newStatus === 'ORDERED') {
      const twinValidation = validateBasketTwinLines(basket);
      
      if (twinValidation.errors.length > 0) {
        const errorDetails = twinValidation.errors.map(e => 
          `${e.stockItem}: ${e.errors.join(', ')}`
        ).join('\n');
        
        setDispatchResult({
          type: 'error',
          message: 'Validation des jumelles échouée',
          details: `${twinValidation.errors.length} ligne(s) avec erreurs :\n${errorDetails}`
        });
        setTimeout(() => setDispatchResult(null), 8000);
        return;
      }
      
      // Afficher un avertissement si des warnings existent
      if (twinValidation.warnings.length > 0) {
        const warningDetails = twinValidation.warnings.map(w => 
          `${w.stockItem}: ${w.warnings.join(', ')}`
        ).join('\n');
        
        setDispatchResult({
          type: 'warning',
          message: 'Avertissements sur les jumelles',
          details: `${twinValidation.warnings.length} ligne(s) avec avertissements :\n${warningDetails}`
        });
        setTimeout(() => setDispatchResult(null), 6000);
      }
    }
    
    // Vérifier si la transition est possible
    const transitionResult = canTransitionBasket(
      basket,
      newStatus,
      currentSelection,
      purchasing.supplierOrders
    );

    if (!transitionResult.canTransition) {
      setDispatchResult({
        type: 'error',
        message: 'Transition impossible',
        details: transitionResult.reason
      });
      setTimeout(() => setDispatchResult(null), 6000);
      return;
    }

    try {
      setFormLoading(true);
      
      // Si des items doivent être supprimés (transition POOLING -> SENT)
      if (transitionResult.itemsToRemove.length > 0) {
        // Supprimer chaque item désélectionné du panier
        for (const item of transitionResult.itemsToRemove) {
          try {
            // TODO: Appeler l'API de suppression d'item et retour à "à dispatcher"
            // await suppliers.deleteSupplierOrderLine(item.id);
            // await purchases.setPurchaseRequestStatus(item.purchaseRequestUid, 'open');
            console.log(`Supprimer item ${item.id} et retourner DA ${item.purchaseRequestUid} à dispatcher`);
          } catch (err) {
            console.error(`Erreur suppression item ${item.id}:`, err);
          }
        }
      }

      // Effectuer la transition de statut du panier
      // TODO: Appeler l'API pour changer le statut
      // await suppliers.updateSupplierOrder(basketId, { status: newStatus });
      console.log(`Transition panier ${basketId} vers ${newStatus}`);

      await refreshOrders();
      
      setDispatchResult({
        type: 'success',
        message: 'Statut du panier mis à jour',
      });
      setTimeout(() => setDispatchResult(null), 3000);
    } catch (error) {
      console.error('Erreur transition panier:', error);
      setDispatchResult({
        type: 'error',
        message: 'Erreur lors de la transition',
        details: error.response?.data?.errors?.[0]?.message || error.message
      });
      setTimeout(() => setDispatchResult(null), 6000);
    } finally {
      setFormLoading(false);
    }
  }, [itemSelectionByBasket, purchasing.supplierOrders, refreshOrders, validateBasketTwinLines]);

  const handleDispatchClick = () => {
    const dispatchableCount = filteredRequests.filter(r => {
      const statusId = typeof r.status === 'string' ? r.status : r.status?.id;
      return statusId === "open" && r.stockItemId;
    }).length;

    if (dispatchableCount === 0) {
      setDispatchResult({
        type: 'warning',
        message: 'Aucune demande dispatchable',
        details: 'Les demandes ouvertes doivent avoir une pièce liée'
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

  // ========== EFFECTS ==========
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
      purchasing.loadAll(true)
    ]);
  }, [purchases, purchasing, stock]);

  // ========== RECALCUL DES TOTAUX ==========
  const handleRecalculateAllTotals = useCallback(async () => {
    setIsRecalculating(true);
    try {
      const results = await recalculateAllOrderTotals(purchasing.supplierOrders);
      if (results.failed === 0) {
        setError(null);
        // Rafraîchir après succès
        await Promise.all([
          stock.loadStockItems(true),
          purchases.loadRequests(true),
          purchasing.loadAll(true)
        ]);
        // Afficher un succès
        console.log(`✅ Recalcul réussi: ${results.success} commande(s) traitée(s)`);
      } else {
        setError(new Error(
          `Recalcul partiellement réussi: ${results.success} succès, ${results.failed} erreur(s)`
        ));
      }
    } catch (err) {
      setError(err);
      console.error('Erreur lors du recalcul:', err);
    } finally {
      setIsRecalculating(false);
      setShowRecalculateDialog(false);
    }
  }, [purchasing.supplierOrders, stock, purchases, purchasing]);

  useAutoRefresh(async () => {
    await Promise.all([
      stock.loadStockItems(false),
      purchases.loadRequests(false),
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
        : activeTab === PROCUREMENT_TABS.POOLING
        ? `${filteredSupplierOrders.length} panier${filteredSupplierOrders.length > 1 ? "s" : ""} en mutualisation`
        : activeTab === PROCUREMENT_TABS.SENT
        ? `${filteredSupplierOrders.length} panier${filteredSupplierOrders.length > 1 ? "s" : ""} en chiffrage`
        : activeTab === PROCUREMENT_TABS.ORDERED
        ? `${filteredSupplierOrders.length} panier${filteredSupplierOrders.length > 1 ? "s" : ""} commandé${filteredSupplierOrders.length > 1 ? "s" : ""}`
        : activeTab === PROCUREMENT_TABS.CLOSED
        ? `${filteredSupplierOrders.length} panier${filteredSupplierOrders.length > 1 ? "s" : ""} clôturé${filteredSupplierOrders.length > 1 ? "s" : ""}`
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
    actions: [
      {
        label: "Outils",
        icon: Settings,
        onClick: () => setShowRecalculateDialog(true),
        variant: "soft",
        color: "gray",
      },
    ],
    onRefresh: () => Promise.all([
      stock.loadStockItems(true),
      purchases.loadRequests(true),
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
                    Ces demandes ont une pièce liée et peuvent être dispatchées automatiquement
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

        {unlinkedCount > 0 && (
          <StatusCallout type="warning">
            ⚠️ {unlinkedCount} demande{unlinkedCount > 1 ? "s" : ""} non liée{unlinkedCount > 1 ? "s" : ""} à une pièce
          </StatusCallout>
        )}

        {toQualifyCount > 0 && (
          <StatusCallout type="warning">
            ⚠️ {toQualifyCount} demande{toQualifyCount > 1 ? "s" : ""} sans fournisseur préféré
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

            <Tabs.Trigger value={PROCUREMENT_TABS.POOLING}>
              <Flex align="center" gap="2">
                <Users size={14} />
                <Text>Mutualisation</Text>
                {ordersByState.pooling.length > 0 && (
                  <Badge color="purple" variant="solid" size="1">
                    {ordersByState.pooling.length}
                  </Badge>
                )}
                {poolingBrokenCount > 0 && (
                  <Badge color="red" variant="solid" size="1">
                    {poolingBrokenCount}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value={PROCUREMENT_TABS.SENT}>
              <Flex align="center" gap="2">
                <Send size={14} />
                <Text>En chiffrage</Text>
                {ordersByState.sent.length > 0 && (
                  <Badge color="blue" variant="solid" size="1">
                    {ordersByState.sent.length}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value={PROCUREMENT_TABS.ORDERED}>
              <Flex align="center" gap="2">
                <PackageCheck size={14} />
                <Text>Commandés</Text>
                {ordersByState.ordered.length > 0 && (
                  <Badge color="green" variant="solid" size="1">
                    {ordersByState.ordered.length}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>

            <Tabs.Trigger value={PROCUREMENT_TABS.CLOSED}>
              <Flex align="center" gap="2">
                <Archive size={14} />
                <Text>Clôturés</Text>
                {ordersByState.closed.length > 0 && (
                  <Badge color="gray" variant="soft" size="1">
                    {ordersByState.closed.length}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            {/* ===== TAB: DEMANDES D'ACHAT ===== */}
            <Tabs.Content value="requests">
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={ShoppingCart}
                  title="Demandes d'achat"
                  count={filteredRequests.length}
                  searchValue={requestSearchTerm}
                  onSearchChange={setRequestSearchTerm}
                  searchPlaceholder="Recherche (pièce, demandeur...)"
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
                    description="Ajustez ou réinitialisez les filtres"
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
                      key={`${filteredRequests.length}-${stock.stockItems.length}`}
                      requests={filteredRequests}
                      expandedRequestId={expandedRequestId}
                      onToggleExpand={toggleExpand}
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
                      onDeleteSupplierRef={handleDeleteSupplierRef}
                      onUpdateSupplierRef={handleUpdateSupplierRef}
                      onDeleteStandardSpec={onDeleteStandardSpecForRequests}
                      onUpdateStandardSpec={onUpdateStandardSpecForRequests}
                      onCreateSupplier={purchasing.createSupplier}
                      allManufacturers={allManufacturers}
                      onLoadDetailsData={handleLoadDetailsForRequest}
                      detailsLoadingStates={detailsLoadingStates}
                      renderExpandedContent={(request) => (
                        <StockItemSearch
                          requestId={request.id}
                          initialItemLabel={request.itemLabel}
                          onLinkExisting={handleLinkExisting}
                          onCreateNew={handleCreateNew}
                          loading={formLoading}
                          stockFamilies={stockFamilies}
                        />
                      )}
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
                            expandedRequestId={expandedRequestId}
                            onToggleExpand={toggleExpand}
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
                            onDeleteSupplierRef={handleDeleteSupplierRef}
                            onUpdateSupplierRef={handleUpdateSupplierRef}
                            onDeleteStandardSpec={onDeleteStandardSpecForRequests}
                            onUpdateStandardSpec={onUpdateStandardSpecForRequests}
                            onCreateSupplier={purchasing.createSupplier}
                            allManufacturers={allManufacturers}
                            onLoadDetailsData={handleLoadDetailsForRequest}
                            detailsLoadingStates={detailsLoadingStates}
                            renderExpandedContent={(request) => (
                              <StockItemSearch
                                requestId={request.id}
                                initialItemLabel={request.itemLabel}
                                onLinkExisting={handleLinkExisting}
                                onCreateNew={handleCreateNew}
                                loading={formLoading}
                                stockFamilies={stockFamilies}
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

            {/* ===== TAB: MUTUALISATION ===== */}
            <Tabs.Content value={PROCUREMENT_TABS.POOLING}>
              <Flex direction="column" gap="3">
                {poolingBrokenCount > 0 && (
                  <StatusCallout type="warning">
                    <Flex align="center" gap="2">
                      <AlertTriangle size={16} />
                      <Text size="2">
                        {poolingBrokenCount} panier{poolingBrokenCount > 1 ? 's' : ''} en rupture de mutualisation (ligne urgente ou ligne normale &gt; 7 jours)
                      </Text>
                    </Flex>
                  </StatusCallout>
                )}
                
                <TableHeader
                  icon={Users}
                  title="Paniers en mutualisation"
                  count={filteredSupplierOrders.length}
                  searchValue={supplierOrderSearchTerm}
                  onSearchChange={setSupplierOrderSearchTerm}
                  searchPlaceholder="Recherche (n°, fournisseur...)"
                  onRefresh={refreshOrders}
                  showRefreshButton={false}
                  actions={
                    <FilterSelect
                      label="Fournisseur"
                      value={supplierOrderSupplierFilter}
                      onValueChange={setSupplierOrderSupplierFilter}
                      minWidth="220px"
                      options={supplierOrderSupplierOptions}
                    />
                  }
                />

                {filteredSupplierOrders.length === 0 ? (
                  <EmptyState
                    icon={<Users size={64} />}
                    title="Aucun panier en mutualisation"
                    description="Les paniers en attente volontaire apparaîtront ici"
                    actions={[
                      <Button key="refresh-orders" size="2" onClick={refreshOrders}>
                        Rafraîchir
                      </Button>,
                    ]}
                  />
                ) : (
                  <SupplierOrdersTable
                    orders={filteredSupplierOrders}
                    onRefresh={refreshOrders}
                    onOrderLineUpdate={purchasing.updateOrderLine}
                    showPoolingColumns
                    itemSelectionByBasket={itemSelectionByBasket}
                    onToggleItemSelection={handleToggleItemSelection}
                    onBasketStatusChange={handleBasketStatusChange}
                    canModifyItem={canModifyItem}
                    twinValidationsByLine={twinValidationsByLine}
                    onTwinValidationUpdate={setTwinValidationsByLine}
                  />
                )}
              </Flex>
            </Tabs.Content>

            <Tabs.Content value={PROCUREMENT_TABS.SENT}>
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={Send}
                  title="Paniers en chiffrage"
                  count={filteredSupplierOrders.length}
                  searchValue={supplierOrderSearchTerm}
                  onSearchChange={setSupplierOrderSearchTerm}
                  searchPlaceholder="Recherche (n°, fournisseur...)"
                  onRefresh={refreshOrders}
                  showRefreshButton={false}
                  actions={
                    <FilterSelect
                      label="Fournisseur"
                      value={supplierOrderSupplierFilter}
                      onValueChange={setSupplierOrderSupplierFilter}
                      minWidth="220px"
                      options={supplierOrderSupplierOptions}
                    />
                  }
                />

                {filteredSupplierOrders.length === 0 ? (
                  <EmptyState
                    icon={<TruckIcon size={64} />}
                    title="Aucun panier en chiffrage"
                    description="Les paniers envoyés aux fournisseurs pour devis apparaîtront ici"
                    actions={[
                      <Button key="refresh-orders" size="2" onClick={refreshOrders}>
                        Rafraîchir
                      </Button>,
                    ]}
                  />
                ) : (
                  <SupplierOrdersTable
                    orders={filteredSupplierOrders}
                    onRefresh={refreshOrders}
                    onOrderLineUpdate={purchasing.updateOrderLine}
                    itemSelectionByBasket={itemSelectionByBasket}
                    onToggleItemSelection={handleToggleItemSelection}
                    onBasketStatusChange={handleBasketStatusChange}
                    canModifyItem={canModifyItem}
                    twinValidationsByLine={twinValidationsByLine}
                    onTwinValidationUpdate={setTwinValidationsByLine}
                  />
                )}
              </Flex>
            </Tabs.Content>

            <Tabs.Content value={PROCUREMENT_TABS.ORDERED}>
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={PackageCheck}
                  title="Paniers commandés"
                  count={filteredSupplierOrders.length}
                  searchValue={supplierOrderSearchTerm}
                  onSearchChange={setSupplierOrderSearchTerm}
                  searchPlaceholder="Recherche (n°, fournisseur...)"
                  onRefresh={refreshOrders}
                  showRefreshButton={false}
                  actions={
                    <FilterSelect
                      label="Fournisseur"
                      value={supplierOrderSupplierFilter}
                      onValueChange={setSupplierOrderSupplierFilter}
                      minWidth="220px"
                      options={supplierOrderSupplierOptions}
                    />
                  }
                />

                {filteredSupplierOrders.length === 0 ? (
                  <EmptyState
                    icon={<TruckIcon size={64} />}
                    title="Aucun panier commandé"
                    description="Les paniers validés et commandés apparaîtront ici"
                    actions={[
                      <Button key="refresh-orders" size="2" onClick={refreshOrders}>
                        Rafraîchir
                      </Button>,
                    ]}
                  />
                ) : (
                  <SupplierOrdersTable
                    orders={filteredSupplierOrders}
                    onRefresh={refreshOrders}
                    onOrderLineUpdate={purchasing.updateOrderLine}
                    itemSelectionByBasket={itemSelectionByBasket}
                    onToggleItemSelection={handleToggleItemSelection}
                    onBasketStatusChange={handleBasketStatusChange}
                    canModifyItem={canModifyItem}
                    twinValidationsByLine={twinValidationsByLine}
                    onTwinValidationUpdate={setTwinValidationsByLine}
                  />
                )}
              </Flex>
            </Tabs.Content>

            <Tabs.Content value={PROCUREMENT_TABS.CLOSED}>
              <Flex direction="column" gap="3">
                <TableHeader
                  icon={Archive}
                  title="Paniers clôturés"
                  count={filteredSupplierOrders.length}
                  searchValue={supplierOrderSearchTerm}
                  onSearchChange={setSupplierOrderSearchTerm}
                  searchPlaceholder="Recherche (n°, fournisseur...)"
                  onRefresh={refreshOrders}
                  showRefreshButton={false}
                  actions={
                    <FilterSelect
                      label="Fournisseur"
                      value={supplierOrderSupplierFilter}
                      onValueChange={setSupplierOrderSupplierFilter}
                      minWidth="220px"
                      options={supplierOrderSupplierOptions}
                    />
                  }
                />

                {filteredSupplierOrders.length === 0 ? (
                  <EmptyState
                    icon={<TruckIcon size={64} />}
                    title="Aucun panier clôturé"
                    description="Les paniers archivés apparaîtront ici"
                    actions={[
                      <Button key="refresh-orders" size="2" onClick={refreshOrders}>
                        Rafraîchir
                      </Button>,
                    ]}
                  />
                ) : (
                  <SupplierOrdersTable
                    orders={filteredSupplierOrders}
                    onRefresh={refreshOrders}
                    onOrderLineUpdate={purchasing.updateOrderLine}
                    itemSelectionByBasket={itemSelectionByBasket}
                    onToggleItemSelection={handleToggleItemSelection}
                    onBasketStatusChange={handleBasketStatusChange}
                    canModifyItem={canModifyItem}
                    twinValidationsByLine={twinValidationsByLine}
                    onTwinValidationUpdate={setTwinValidationsByLine}
                  />
                )}
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        {/* Dialog Recalcul des totaux */}
        <AlertDialog.Root open={showRecalculateDialog} onOpenChange={setShowRecalculateDialog}>
          <AlertDialog.Content maxWidth="450px">
            <AlertDialog.Title>Recalculer tous les totaux</AlertDialog.Title>
            <AlertDialog.Description size="2">
              Cette action va recalculer les totaux des lignes pour <strong>toutes les commandes</strong>.
              <br />
              Utile pour corriger les incohérences de calcul.
              <br />
              <br />
              <Text size="1" color="gray">
                ⏱️ Cette opération peut prendre quelques secondes selon le nombre de commandes.
              </Text>
            </AlertDialog.Description>

            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel asChild>
                <Button variant="soft" color="gray">
                  Annuler
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  onClick={handleRecalculateAllTotals}
                  disabled={isRecalculating}
                  loading={isRecalculating}
                >
                  {isRecalculating ? "Recalcul en cours..." : "Recalculer"}
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </PageContainer>
    </Box>
  );
}
