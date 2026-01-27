/* eslint-disable complexity, max-lines */
// ===== IMPORTS =====
// 1. React core
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// 2. React Router
import { useParams, useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import { Tabs, Flex, Text, Badge } from '@radix-ui/themes';

// 4. Icons
import { Wrench } from 'lucide-react';

// 5. API / Lib
import { interventions, actions, stock, stockSuppliers, actionSubcategories } from '@/lib/api/facade';

// 6. Hooks
import { useApiCall, useApiMutation } from '@/hooks/useApiCall';
import { usePurchaseRequestsManagement } from '@/hooks/usePurchaseRequestsManagement';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useError } from '@/contexts/ErrorContext';
import { useAuth } from '@/auth/useAuth';

// 7. Components
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import ErrorDisplay from '@/components/ErrorDisplay';
import DropdownButton from '@/components/common/DropdownButton';
import ActionForm from '@/components/actions/ActionForm';
import {
  ActionsTab,
  SummaryTab,
  SheetTab,
  HistoryTab,
} from '@/components/interventions/InterventionTabs';
import { TABS_CONFIG } from '@/components/interventions/InterventionTabsComponents';

// 8. Config
import { STATE_COLORS, PRIORITY_COLORS } from '@/config/interventionTypes';

// 9. Utils
import {
  groupTimelineByDay,
} from '@/lib/utils/interventionUtils.jsx';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING (DTO ↔ Backend French)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Maps priority value to config key for UI display.
 * @param {string} priorityValue - Priority value from backend
 * @returns {string} Config key for PRIORITY_COLORS
 */
const mapPriorityToConfigKey = (priorityValue) => {
  if (!priorityValue) return 'normal';
  const key = priorityValue.toLowerCase().trim();
  return key === 'urgent' ? 'urgent'
    : key === 'important' ? 'important'
    : key === 'faible' ? 'faible'
    : 'normal'; // Default fallback
};

/**
 * Maps domain DTO status to config key for UI display.
 * @param {string} dtoStatus - Domain status ('open' | 'in_progress' | 'closed' | 'cancelled')
 * @returns {string} Config key ('ouvert' | 'attente_pieces' | 'ferme' | 'cancelled')
 */
const mapDtoStatusToConfigKey = (dtoStatus) => {
  const mapping = {
    'open': 'ouvert',
    'in_progress': 'attente_pieces', // Default display
    'closed': 'ferme',
    'cancelled': 'cancelled'
  };
  return mapping[dtoStatus] || 'ouvert';
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Page de détail d'une intervention avec gestion complète
 * 
 * @component
 * @description
 * Composant principal affichant le détail complet d'une intervention avec :
 * - Header dynamique avec dropdowns statut/priorité
 * - 4 onglets : Actions (timeline), Résumé (demandes achat), Fiche (PDF), Historique
 * - Lazy loading des données par onglet pour optimiser les performances
 * - Auto-refresh toutes les 30s (background)
 * - Formulaire d'ajout d'action rapide
 * 
 * @architecture
 * - État : useState pour formulaires et UI, useRef pour anti-patterns
 * - Data fetching : useApiCall avec execute/executeSilent
 * - Mutations : useApiMutation avec callbacks onSuccess
 * - Computed : useMemo pour valeurs dérivées (timeline, grouping)
 * - Effects : useEffect pour initialisation, lazy loading onglets, responsive styles
 * 
 * @performance
 * - Protection React StrictMode (initialLoadRef)
 * - Lazy loading données (summaryDataLoaded, actionDataLoaded)
 * - Requêtes parallèles (Promise.all)
 * - Auto-refresh silencieux (pas de loader)
 * 
 * @route /intervention/:id
 * @requires Auth
 * 
 * @example
 * // Route définie dans menuConfig.js
 * {
 *   path: "/intervention/:id",
 *   component: InterventionDetail,
 *   requiresAuth: true
 * }
 * 
 * @see {@link InterventionTabs} - Composants onglets
 * @see {@link PageHeader} - Header avec stats et actions
 * @see {@link TABS_CONFIG} - Configuration onglets
 * 
 * @returns {JSX.Element} Page détail intervention avec onglets
 */
export default function InterventionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useError();
  const { user } = useAuth();
  const [operationError, setOperationError] = useState('');
  const pdfUrlRef = useRef(null);
  const initialLoadRef = useRef(false);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const [showActionForm, setShowActionForm] = useState(false);
  const [activeTab, setActiveTab] = useTabNavigation("actions", 'tab');
  const [searchActions, setSearchActions] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);
  const [supplierRefs, setSupplierRefs] = useState({});
  const [standardSpecs, setStandardSpecs] = useState({});
  const [summaryDataLoaded, setSummaryDataLoaded] = useState(false);
  const [actionDataLoaded, setActionDataLoaded] = useState(false);

  // Charger les purchase requests via l'API (même source que Procurement)
  // Filtrage côté backend pour charger uniquement les demandes de cette intervention
  const purchases = usePurchaseRequestsManagement(showError, id);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const {
    data: interv,
    loading,
    error,
    execute: refetchIntervention,
    executeSilent: backgroundRefetchIntervention
  } = useApiCall(() => interventions.fetchIntervention(id));

  // Status logs are now included in the intervention endpoint (interv.statusLogs)
  const statusLog = useMemo(() => interv?.statusLogs || [], [interv?.statusLogs]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION - Protection React StrictMode
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Protection contre le double appel en React StrictMode (dev)
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    refetchIntervention();
    purchases.loadRequests(); // Charger les purchase requests dès l'ouverture (pour le badge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Lazy loading : Charger les données du formulaire d'action uniquement à l'ouverture
  useEffect(() => {
    if (showActionForm && !actionDataLoaded) {
      const loadActionData = async () => {
        try {
          // Requêtes parallèles pour optimiser le temps de chargement
          const [subcatsData, factorsData] = await Promise.all([
            actionSubcategories.fetchActionSubcategories(),
            interventions.fetchComplexityFactors()
          ]);
          setSubcategories(subcatsData || []);
          setComplexityFactors(factorsData || []);
          setActionDataLoaded(true);
        } catch (error) {
          showError(error);
        }
      };
      loadActionData();
    }
  }, [showActionForm, actionDataLoaded, showError]);

  // Lazy loading : Charger les données de l'onglet Résumé uniquement lors du premier accès
  useEffect(() => {
    if (activeTab === 'summary' && !summaryDataLoaded) {
      const loadSummaryData = async () => {
        try {
          // Charger supplier refs et standard specs pour les stock items des purchase requests
          const uniqueStockItemIds = new Set();
          purchases.requests.forEach(pr => {
            if (pr.stockItemId) {
              uniqueStockItemIds.add(pr.stockItemId);
            }
          });

          const stockItemIdsArray = Array.from(uniqueStockItemIds);

          // Load supplier refs in a single bulk API call instead of N individual calls
          const refsGrouped = await stockSuppliers.fetchStockItemSuppliersBulk(stockItemIdsArray);

          // Load standard specs (still individual calls, could be optimized later)
          const specsGrouped = {};
          await Promise.all(
            stockItemIdsArray.map(async (stockItemId) => {
              try {
                const specs = await stock.fetchStockItemStandardSpecs(stockItemId);
                if (specs && specs.length > 0) {
                  specsGrouped[stockItemId] = specs;
                }
              } catch {
                // Silently skip individual item load failures
              }
            })
          );

          setSupplierRefs(refsGrouped);
          setStandardSpecs(specsGrouped);
          
          setSummaryDataLoaded(true);
        } catch (error) {
          showError(error);
        }
      };
      loadSummaryData();
    }
  }, [activeTab, summaryDataLoaded, showError, purchases.requests]);

  // Injection de styles responsive pour timeline et boutons d'action
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .timeline-line, .timeline-dot, .action-button-text { display: none !important; }
      }
      @media (min-width: 769px) {
        .action-button-text { display: inline !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Auto-refresh silencieux toutes les 30 secondes (pas de loader)
  useAutoRefresh(() => {
    backgroundRefetchIntervention();
  }, 30, true);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // HANDLERS & CALLBACKS (must be defined before useEffects that depend on them)
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const loadPdf = useCallback(async () => {
    try {
      setPdfLoading(true);
      const EXPORT_API_URL = import.meta.env.VITE_EXPORT_API_URL || "http://localhost:8001";
      const token = localStorage.getItem("auth_access_token") || localStorage.getItem("legacy_api_token");
      
      if (!token) {
        setOperationError('Session expirée. Veuillez vous reconnecter.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${EXPORT_API_URL}/api/items/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorMsg = response.status === 401 
          ? 'Session expirée. Veuillez vous reconnecter.'
          : response.status === 404
          ? "Intervention non trouvée pour l'export."
          : `Erreur ${response.status}: ${response.statusText}`;
        setOperationError(errorMsg);
        if (response.status === 401) navigate('/login');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      if (pdfUrlRef.current) {
        try { window.URL.revokeObjectURL(pdfUrlRef.current); } catch { /* ignore revoke errors */ }
      }
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch {
      setOperationError('Impossible de charger la fiche PDF.');
    } finally {
      setPdfLoading(false);
    }
  }, [id, navigate]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

  // PDF cleanup
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        try { window.URL.revokeObjectURL(pdfUrlRef.current); } catch { /* ignore revoke errors */ }
      }
    };
  }, []);

  // Load PDF when tab opens
  useEffect(() => {
    if (activeTab === 'fiche') {
      loadPdf();
    }
  }, [activeTab, loadPdf]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const { mutate: mutateAddAction } = useApiMutation(actions.createAction, {
    onSuccess: () => {
      refetchIntervention();
    }
  });

  const { mutate: mutateUpdateStatus } = useApiMutation(
    (statusData) => interventions.updateStatus(id, statusData),
    {
      onSuccess: () => {
        refetchIntervention(); // Status logs are included in intervention endpoint
      }
    }
  );

  const { mutate: mutateUpdateIntervention } = useApiMutation(
    (data) => interventions.updateIntervention(id, data),
    {
      onSuccess: () => refetchIntervention()
    }
  );

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // MEMOIZED VALUES (UI-only, never business logic)
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ⚠️ Timeline grouping is ONLY for UI display - no business calculations here
  // Stats are passed directly from API (interv.stats.*), not recalculated from actions
  const timelineByDay = useMemo(() => groupTimelineByDay(interv?.action, statusLog, searchActions), [interv?.action, statusLog, searchActions]);

  const timeline = useMemo(() => {
    const items = [];
    if (interv?.action) {
      interv.action.forEach(action => {
        items.push({ type: 'action', date: action.createdAt, data: action });
      });
    }
    if (statusLog) {
      statusLog.forEach(log => {
        items.push({ 
          type: 'status', 
          date: log.date, 
          data: {
            ...log,
            date: typeof log.date === 'string' ? log.date : new Date(log.date).toISOString()
          }
        });
      });
    }
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [interv?.action, statusLog]);

  const ficheFileName = useMemo(() => {
    const base = interv?.code || id || 'intervention';
    return `${base}.pdf`;
  }, [interv?.code, id]);

  // Compter les purchase requests de cette intervention (déjà filtrées par l'API)
  const purchaseRequestsCount = useMemo(() => {
    return purchases.requests.length;
  }, [purchases.requests]);

  // État initial du formulaire d'action avec catégorie par défaut
  const actionFormInitialState = useMemo(() => {
    if (!subcategories.length) return {};

    // Trouver la dernière action pour pré-remplir la catégorie
    const lastAction = interv?.action?.length > 0 
      ? interv.action.reduce((latest, a) => 
          new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest
        )
      : null;

    // Priorité : dernière catégorie utilisée > DEP > première catégorie disponible
    let defaultId = lastAction?.subcategory?.id;
    if (!defaultId) {
      const dep = subcategories.find(c => c.category?.code === 'DEP');
      defaultId = dep?.id || subcategories[0]?.id;
    }

    return {
      category: defaultId ? String(defaultId) : '',
      date: new Date().toISOString().split('T')[0]
    };
  }, [subcategories, interv?.action]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const handleAddAction = useCallback(async (formData) => {
    if (!formData.description?.trim()) return;

    await mutateAddAction({
      intervention: { id },
      description: formData.description,
      timeSpent: parseFloat(formData.time) || 0,
      date: formData.date || new Date().toISOString().split('T')[0],
      complexityScore: parseInt(formData.complexity) || null,
      complexityFactors: formData.complexityFactors?.length > 0 ? formData.complexityFactors : [],
      subcategory: formData.category ? { id: String(formData.category) } : undefined,
      technician: user?.id ? { id: user.id } : undefined,
    });

    // Fermer le formulaire après succès
    setShowActionForm(false);
  }, [id, mutateAddAction, user?.id]);

  const handleStatusChange = useCallback((backendStatus) => {
    // Backend status is in French (ouvert, attente_pieces, attente_prod, ferme, cancelled)
    // Adapter expects a raw status code string and will build { status_actual: { id: <code> } }
    mutateUpdateStatus(backendStatus);
  }, [mutateUpdateStatus]);

  const handlePriorityChange = useCallback((newPriority) => {
    mutateUpdateIntervention({ priority: newPriority });
  }, [mutateUpdateIntervention]);

  const handleMarkPrintedFiche = useCallback(async () => {
    await mutateUpdateIntervention({ printedFiche: true });
  }, [mutateUpdateIntervention]);

  const handleRefreshSummary = useCallback(async () => {
    // Recharger les purchase requests depuis l'API (comme Procurement)
    purchases.invalidate();
  }, [purchases]);

  const handlePurchaseRequestCreated = useCallback((createdRequest) => {
    // Rafraîchir les purchase requests depuis l'API
    if (createdRequest?.id) {
      purchases.invalidate();
    }
  }, [purchases]);

  const handleAddSupplierRef = useCallback(async (stockItemId, supplierRefData) => {
    try {
      await stockSuppliers.createStockItemSupplier({
        stockItemId: stockItemId,
        ...supplierRefData
      });
      
      // Rafraîchir les supplier refs pour cet item
      const refs = await stockSuppliers.fetchStockItemSuppliers(stockItemId);
      setSupplierRefs(prev => ({
        ...prev,
        [stockItemId]: refs || []
      }));
    } catch (error) {
      showError(error);
    }
  }, [showError]);

  const handleAddStandardSpec = useCallback(async (stockItemId, specData) => {
    try {
      await stock.createStockItemStandardSpec({
        stockItemId: stockItemId,
        ...specData
      });
      
      // Rafraîchir les standard specs pour cet item
      const specs = await stock.fetchStockItemStandardSpecs(stockItemId);
      setStandardSpecs(prev => ({
        ...prev,
        [stockItemId]: specs || []
      }));
    } catch (error) {
      showError(error);
    }
  }, [showError]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // RENDER - États de chargement et erreurs
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState message="Chargement de l'intervention..." />;

  if (error || !interv) {
    return (
      <ErrorState 
        error={error || "Intervention non trouvée"} 
        onRetry={refetchIntervention}
        backLink="/interventions"
        backLabel="Retour aux interventions"
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  return (
    <PageContainer style={{ paddingBottom: "4rem" }}>
      <PageHeader
        icon={Wrench}
        title={`${interv.machine?.name || "Machine"} • ${interv.code || `INT-${id}`}`}
        subtitle={interv.title || "Intervention"}
        stats={[
          // ⚠️ Stats from API ONLY (via mapper) - never calculated on frontend
          { label: "Actions", value: interv.stats?.action_count || 0 },
          { label: "Temps", value: `${interv.stats?.total_time || 0}h` }
        ]}
        actions={[
          {
            label: (
              <DropdownButton
                label={STATE_COLORS[mapDtoStatusToConfigKey(interv.status)]?.label || 'En cours'}
                color={STATE_COLORS[mapDtoStatusToConfigKey(interv.status)]?.activeBg || 'var(--blue-6)'}
                textColor={STATE_COLORS[mapDtoStatusToConfigKey(interv.status)]?.textActive || 'white'}
                items={[
                  { label: STATE_COLORS.ouvert.label, color: STATE_COLORS.ouvert.activeBg, onClick: () => handleStatusChange('ouvert') },
                  { label: STATE_COLORS.attente_pieces.label, color: STATE_COLORS.attente_pieces.activeBg, onClick: () => handleStatusChange('attente_pieces') },
                  { label: STATE_COLORS.attente_prod.label, color: STATE_COLORS.attente_prod.activeBg, onClick: () => handleStatusChange('attente_prod') },
                  { label: STATE_COLORS.ferme.label, color: STATE_COLORS.ferme.activeBg, onClick: () => handleStatusChange('ferme') }
                ]}
              />
            )
          },
          {
            label: (
              <DropdownButton
                label={PRIORITY_COLORS[mapPriorityToConfigKey(interv.priority)]?.label || 'Normal'}
                color={PRIORITY_COLORS[mapPriorityToConfigKey(interv.priority)]?.activeBg || 'var(--gray-6)'}
                textColor={PRIORITY_COLORS[mapPriorityToConfigKey(interv.priority)]?.textActive || 'white'}
                items={[
                  { label: 'Urgent', color: PRIORITY_COLORS.urgent.activeBg, onClick: () => handlePriorityChange('urgent') },
                  { label: 'Important', color: PRIORITY_COLORS.important.activeBg, onClick: () => handlePriorityChange('important') },
                  { label: 'Normal', color: PRIORITY_COLORS.normal.activeBg, onClick: () => handlePriorityChange('normal') },
                  { label: 'Faible', color: PRIORITY_COLORS.faible.activeBg, onClick: () => handlePriorityChange('faible') }
                ]}
              />
            )
          }
        ]}
      />

      {/* Error Display - Positioned after header as per UX standards */}
      {operationError && (
        <ErrorDisplay
          error={operationError}
          title="Erreur opération"
          onRetry={activeTab === 'fiche' ? loadPdf : undefined}
        />
      )}

      {/* TABS */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ marginTop: '2rem' }}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          {TABS_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const badgeValue = tab.badge ? tab.badge({ 
              ...interv, 
              timeline: timeline,
              purchaseRequestsCount: purchaseRequestsCount
            }) : null;

            return (
              <Tabs.Trigger key={tab.id} value={tab.id}>
                <Flex align="center" gap="2">
                  <Icon size={16} />
                  <Text>{tab.label}</Text>
                  {badgeValue !== null && (
                    <Badge color={tab.badgeColor} variant="soft" size="1">
                      {badgeValue}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
        
        {/* TAB: Actions */}
        <Tabs.Content value="actions">
          {showActionForm && (
            <ActionForm
              initialState={actionFormInitialState}
              metadata={{
                subcategories: subcategories,
                complexityFactors: complexityFactors
              }}
              onCancel={() => setShowActionForm(false)}
              onSubmit={handleAddAction}
              style={{ marginTop: '1rem', marginBottom: '1rem' }}
            />
          )}
          <ActionsTab
            model={{
              interv,
              searchActions,
              timelineByDay,
              loading,
              purchaseRequests: purchases.requests
            }}
            handlers={{
              onSearchChange: setSearchActions,
              onRefresh: refetchIntervention,
              onAddAction: () => setShowActionForm(!showActionForm)
            }}
            metadata={{
              statusLog
            }}
            onPurchaseRequestCreated={handlePurchaseRequestCreated}
          />
        </Tabs.Content>

        {/* TAB: Résumé */}
        <Tabs.Content value="summary">
          <SummaryTab
            model={{
              interv,
              loading: loading || purchases.loading,
              purchaseRequests: purchases.requests
            }}
            handlers={{
              onRefresh: handleRefreshSummary,
              onAddSupplierRef: handleAddSupplierRef,
              onAddStandardSpec: handleAddStandardSpec
            }}
            metadata={{
              stockItems: [],
              supplierRefs,
              standardSpecs,
              suppliers: []
            }}
          />
        </Tabs.Content>

        {/* TAB: Fiche */}
        <Tabs.Content value="fiche">
          <SheetTab
            model={{
              pdfUrl,
              pdfLoading,
              printedFiche: interv.printedFiche,
              fileName: ficheFileName
            }}
            handlers={{
              onLoadPdf: loadPdf,
              onMarkPrinted: handleMarkPrintedFiche
            }}
          />
        </Tabs.Content>

        {/* TAB: Historique */}
        <Tabs.Content value="details">
          <HistoryTab
            model={{
              timeline,
              loading: loading
            }}
            handlers={{
              onRefresh: () => {
                refetchIntervention(); // Status logs are included in intervention endpoint
              }
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </PageContainer>
  );
}
