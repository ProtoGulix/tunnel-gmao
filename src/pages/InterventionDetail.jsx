// ===== IMPORTS =====
// 1. React core
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

// 2. React Router
import { useParams, useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import { Button, Tabs, Flex, Text, Badge } from '@radix-ui/themes';

// 4. Icons
import { Wrench, Plus } from 'lucide-react';

// 5. API / Lib
import { interventions, actions, actionSubcategories, interventionStatusLogs } from '@/lib/api/facade';
import {
  fetchPurchaseRequestsByIntervention,
  createPurchaseRequest,
  updatePurchaseRequest,
  fetchStockItems,
  fetchSuppliers,
  createStockItemSupplier,
  fetchStockItemSuppliers,
  fetchStockItemStandardSpecs,
  createStockItemStandardSpec,
} from '@/lib/api';

// 6. Hooks
import { useApiCall, useApiMutation } from '@/hooks/useApiCall';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useError } from '@/contexts/ErrorContext';

// 7. Components
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorState from '@/components/common/ErrorState';
import ErrorDisplay from '@/components/ErrorDisplay';
import DropdownButton from '@/components/common/DropdownButton';
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
  calculateTotalTime,
  getUniqueTechs,
  getLastUpdateDate,
  groupTimelineByDay,
} from '@/lib/utils/interventionUtils.jsx';

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
 * - Computed : useMemo pour valeurs dérivées (stats, timeline)
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
  const [operationError, setOperationError] = useState('');
  const pdfUrlRef = useRef(null);
  const initialLoadRef = useRef(false);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const [showActionForm, setShowActionForm] = useState(false);
  const [activeTab, setActiveTab] = useState("actions");
  const [searchActions, setSearchActions] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [actionForm, setActionForm] = useState({
    description: "",
    time: "",
    date: "",
    complexity: "",
    category: "",
    complexityFactors: []
  });

  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [supplierRefs, setSupplierRefs] = useState({});
  const [standardSpecs, setStandardSpecs] = useState({});
  const [summaryDataLoaded, setSummaryDataLoaded] = useState(false);
  const [actionDataLoaded, setActionDataLoaded] = useState(false);

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

  const { 
    data: statusLog = [],
    loading: statusLogLoading,
    execute: refetchStatusLog,
    executeSilent: backgroundRefetchStatusLog
  } = useApiCall(() => interventionStatusLogs.fetchInterventionStatusLog(id));

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // INITIALIZATION - Protection React StrictMode
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Protection contre le double appel en React StrictMode (dev)
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    
    refetchIntervention();
    refetchStatusLog();
    
    // Charger les purchase requests pour afficher le badge
    const loadBadgesData = async () => {
      try {
        const requestsData = await fetchPurchaseRequestsByIntervention(id);
        setPurchaseRequests(requestsData || []);
      } catch (error) {
        console.error('Erreur chargement badges:', error);
      }
    };
    loadBadgesData();
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
          console.error('Erreur chargement données action:', error);
        }
      };
      loadActionData();
    }
  }, [showActionForm, actionDataLoaded]);

  // Lazy loading : Charger les données de l'onglet Résumé uniquement lors du premier accès
  useEffect(() => {
    if (activeTab === 'summary' && !summaryDataLoaded) {
      const loadSummaryData = async () => {
        try {
          // Charger stocks et fournisseurs en parallèle
          const [itemsData, suppliersData] = await Promise.all([
            fetchStockItems(),
            fetchSuppliers()
          ]);

          setStockItems(itemsData || []);
          setSuppliers(suppliersData || []);

          // Charger les références fournisseurs et spécifications standards pour chaque article
          // Charger supplier refs et standard specs pour chaque stock item
          if (itemsData && itemsData.length > 0) {
            const refsGrouped = {};
            const specsGrouped = {};

            await Promise.all(
              itemsData.map(async (item) => {
                try {
                  const refs = await fetchStockItemSuppliers(item.id);
                  if (refs && refs.length > 0) {
                    refsGrouped[item.id] = refs;
                  }

                  const specs = await fetchStockItemStandardSpecs(item.id);
                  if (specs && specs.length > 0) {
                    specsGrouped[item.id] = specs;
                  }
                } catch (err) {
                  console.warn(`Erreur chargement données pour item ${item.id}:`, err);
                }
              })
            );

            setSupplierRefs(refsGrouped);
            setStandardSpecs(specsGrouped);
          }
          
          setSummaryDataLoaded(true);
        } catch (error) {
          console.error('Erreur chargement données résumé:', error);
        }
      };
      loadSummaryData();
    }
  }, [activeTab, summaryDataLoaded, id]);

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
    backgroundRefetchStatusLog();
  }, 30, true);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // HANDLERS & CALLBACKS (must be defined before useEffects that depend on them)
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const loadPdf = useCallback(async () => {
    try {
      setPdfLoading(true);
      const EXPORT_API_URL = import.meta.env.VITE_EXPORT_API_URL || "http://localhost:8001";
      const token = localStorage.getItem("auth_access_token") || localStorage.getItem("directus_token");
      
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
    } catch (e) {
      console.error('Erreur chargement PDF:', e);
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

  // Auto-sélection intelligente de la catégorie d'action : dernière utilisée ou DEP par défaut
  useEffect(() => {
    if (!actionForm.category && subcategories.length > 0 && showActionForm) {
      // Trouver la dernière action pour pré-remplir la catégorie
      const lastAction = interv?.action?.length > 0 
        ? interv.action.reduce((latest, a) => 
            new Date(a.createdAt) > new Date(latest.createdAt) ? a : latest
          )
        : null;

      // Priorité : dernière catégorie utilisée > DEP > première catégorie disponible
      let defaultId = lastAction?.subcategory?.id;
      if (!defaultId) {
        const dep = subcategories.find(c => c.category_id?.code === 'DEP');
        defaultId = dep?.id || subcategories[0]?.id;
      }
      if (defaultId) {
        setActionForm(prev => ({ ...prev, category: String(defaultId) }));
      }
    }
  }, [subcategories, interv?.action, showActionForm, actionForm.category]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // MUTATIONS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const { mutate: mutateAddAction } = useApiMutation(actions.addAction, {
    onSuccess: () => {
      refetchIntervention();
      setActionForm({
        description: "",
        time: "",
        date: "",
        complexity: "",
        category: "",
        complexityFactors: []
      });
    }
  });

  const { mutate: mutateUpdateStatus } = useApiMutation(
    (statusData) => interventions.updateStatus(id, statusData),
    {
      onSuccess: () => {
        refetchIntervention();
        refetchStatusLog();
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
  // MEMOIZED VALUES
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const totalTime = useMemo(() => calculateTotalTime(interv?.action), [interv?.action]);
  const uniqueTechs = useMemo(() => getUniqueTechs(interv?.action), [interv?.action]);
  const lastUpdateDate = useMemo(() => getLastUpdateDate(interv?.action), [interv?.action]);
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

  const purchaseRequestsCount = useMemo(() => {
    // Plus besoin de filtrer, les demandes sont déjà filtrées
    return purchaseRequests.length;
  }, [purchaseRequests]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const handleAddAction = useCallback(async (e) => {
    e.preventDefault();
    if (!actionForm.description.trim()) return;

    await mutateAddAction({
      intervention_id: id,
      description: actionForm.description,
      time_spent: parseFloat(actionForm.time) || 0,
      created_at: actionForm.date || new Date().toISOString().split('T')[0],
      complexity_score: parseInt(actionForm.complexity) || null,
      complexity_factors: actionForm.complexityFactors.length > 0 ? actionForm.complexityFactors : null,
      action_subcategory: actionForm.category || null,
      tech: null
    });
  }, [actionForm, id, mutateAddAction]);

  const handleStatusChange = useCallback((newStatus) => {
    mutateUpdateStatus({ status_actual: newStatus });
  }, [mutateUpdateStatus]);

  const handlePriorityChange = useCallback((newPriority) => {
    mutateUpdateIntervention({ priority: newPriority });
  }, [mutateUpdateIntervention]);

  const handleCreatePurchaseRequest = useCallback(async (requestData) => {
    try {
      await createPurchaseRequest(requestData);
      if (summaryDataLoaded) {
        const updated = await fetchPurchaseRequestsByIntervention(id);
        setPurchaseRequests(updated || []);
      }
    } catch (error) {
      console.error('Erreur création demande d\'achat:', error);
      showError(error);
    }
  }, [id, summaryDataLoaded, showError]);

  const handleUpdatePurchaseRequest = useCallback(async (requestId, updates) => {
    try {
      await updatePurchaseRequest(requestId, updates);
      if (summaryDataLoaded) {
        const updated = await fetchPurchaseRequestsByIntervention(id);
        setPurchaseRequests(updated || []);
      }
    } catch (error) {
      console.error('Erreur mise à jour demande d\'achat:', error);
      showError(error);
    }
  }, [id, summaryDataLoaded, showError]);

  const handleAddSupplierRef = useCallback(async (stockItemId, supplierRefData) => {
    try {
      await createStockItemSupplier({
        stock_item_id: stockItemId,
        ...supplierRefData
      });
      
      // Rafraîchir les supplier refs pour cet item
      const refs = await fetchStockItemSuppliers(stockItemId);
      setSupplierRefs(prev => ({
        ...prev,
        [stockItemId]: refs || []
      }));
    } catch (error) {
      console.error('Erreur ajout référence fournisseur:', error);
      showError(error);
    }
  }, [showError]);

  const handleAddStandardSpec = useCallback(async (stockItemId, specData) => {
    try {
      await createStockItemStandardSpec({
        stock_item_id: stockItemId,
        ...specData
      });
      
      // Rafraîchir les standard specs pour cet item
      const specs = await fetchStockItemStandardSpecs(stockItemId);
      setStandardSpecs(prev => ({
        ...prev,
        [stockItemId]: specs || []
      }));
    } catch (error) {
      console.error('Erreur ajout spécification:', error);
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
        title={`${interv.machine_id?.name || "Machine"} • ${interv.code || `INT-${id}`}`}
        subtitle={interv.title || "Intervention"}
        statusDropdown={
          <DropdownButton
            label={STATE_COLORS[interv.status_actual?.id]?.label || 'En cours'}
            color={STATE_COLORS[interv.status_actual?.id]?.activeBg || 'var(--blue-6)'}
            textColor={STATE_COLORS[interv.status_actual?.id]?.textActive || 'white'}
            items={[
              { label: STATE_COLORS.ouvert.label, color: STATE_COLORS.ouvert.activeBg, onClick: () => handleStatusChange('ouvert') },
              { label: STATE_COLORS.attente_pieces.label, color: STATE_COLORS.attente_pieces.activeBg, onClick: () => handleStatusChange('attente_pieces') },
              { label: STATE_COLORS.attente_prod.label, color: STATE_COLORS.attente_prod.activeBg, onClick: () => handleStatusChange('attente_prod') },
              { label: STATE_COLORS.ferme.label, color: STATE_COLORS.ferme.activeBg, onClick: () => handleStatusChange('ferme') }
            ]}
          />
        }
        priorityDropdown={
          <DropdownButton
            label={PRIORITY_COLORS[interv.priority?.toLowerCase()]?.label || 'Normal'}
            color={PRIORITY_COLORS[interv.priority?.toLowerCase()]?.activeBg || 'var(--gray-6)'}
            textColor={PRIORITY_COLORS[interv.priority?.toLowerCase()]?.textActive || 'white'}
            items={[
              { label: 'Urgent', color: PRIORITY_COLORS.urgent.activeBg, onClick: () => handlePriorityChange('urgent') },
              { label: 'Important', color: PRIORITY_COLORS.important.activeBg, onClick: () => handlePriorityChange('important') },
              { label: 'Normal', color: PRIORITY_COLORS.normal.activeBg, onClick: () => handlePriorityChange('normal') },
              { label: 'Faible', color: PRIORITY_COLORS.faible.activeBg, onClick: () => handlePriorityChange('faible') }
            ]}
          />
        }
        stats={[
          { label: "Actions", value: interv.action?.length || 0 },
          { label: "Temps", value: `${totalTime}h` },
          ...(lastUpdateDate ? [{ label: "Dernière MAJ", value: lastUpdateDate }] : []),
          ...(uniqueTechs.length > 0 ? [{ label: "Techs", value: uniqueTechs.join(' · ') }] : [])
        ]}
        actions={[
          {
            label: (
              <Button
                size="2"
                onClick={() => setShowActionForm(!showActionForm)}
                style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
              >
                <Plus size={16} />
                + Action
              </Button>
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
          <ActionsTab
            interv={interv}
            loading={loading}
            actionForm={actionForm}
            setActionForm={setActionForm}
            subcategories={subcategories}
            complexityFactors={complexityFactors}
            showActionForm={showActionForm}
            setShowActionForm={setShowActionForm}
            searchActions={searchActions}
            setSearchActions={setSearchActions}
            timelineByDay={timelineByDay}
            statusLog={statusLog}
            handleAddAction={handleAddAction}
            refetchIntervention={refetchIntervention}
          />
        </Tabs.Content>

        {/* TAB: Résumé */}
        <Tabs.Content value="summary">
          <SummaryTab
            interv={interv}
            loading={loading}
            refetchIntervention={refetchIntervention}
            purchaseRequests={purchaseRequests}
            onCreatePurchaseRequest={handleCreatePurchaseRequest}
            onUpdatePurchaseRequest={handleUpdatePurchaseRequest}
            stockItems={stockItems}
            suppliers={suppliers}
            supplierRefs={supplierRefs}
            standardSpecs={standardSpecs}
            onAddSupplierRef={handleAddSupplierRef}
            onAddStandardSpec={handleAddStandardSpec}
          />
        </Tabs.Content>

        {/* TAB: Fiche */}
        <Tabs.Content value="fiche">
          <SheetTab
            pdfUrl={pdfUrl}
            pdfLoading={pdfLoading}
            loadPdf={loadPdf}
          />
        </Tabs.Content>

        {/* TAB: Historique */}
        <Tabs.Content value="details">
          <HistoryTab
            timeline={timeline}
            loading={loading}
            statusLogLoading={statusLogLoading}
            refetchIntervention={refetchIntervention}
            refetchStatusLog={refetchStatusLog}
          />
        </Tabs.Content>
      </Tabs.Root>
    </PageContainer>
  );
}
