/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📑 InterventionTabs.jsx - Onglets modulaires pour détail intervention
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composants tabs exportés pour affichage détail intervention:
 * - ActionsTab : Timeline actions avec recherche et regroupement par jour
 * - SummaryTab : Demandes d'achat liées (réutilise PurchaseRequestsTable)
 * - StatsTab : Statistiques intervention (temps, actions, statut)
 * - SheetTab : Génération et visualisation PDF fiche intervention
 * - HistoryTab : Historique chronologique actions + changements statut
 * 
 * Architecture modulaire avec composants réutilisables (GenericTabComponents)
 * 
 * ✅ Implémenté :
 * - 5 tabs exportés individuellement pour composition flexible
 * - Réutilisation GenericTabComponents (Timeline, History, StatsGrid, PdfViewer)
 * - TableHeader avec actions, refresh, recherche intégrés
 * - TimelineItemRenderer avec badges colorés par type
 * - HistoryItem avec affichage actions + changements statut
 * - SummaryTab avec formulaire création demande d'achat inline
 * - Gestion états loading/error/empty pour chaque tab
 * - PropTypes complets pour tous les tabs exportés (✅ complété)
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Mémoïser TimelineItemRenderer et HistoryItem avec useCallback
 * - [ ] Filtres avancés ActionsTab : par technicien, catégorie, période
 * - [ ] Export Excel/CSV des actions (ActionsTab)
 * - [ ] Graphiques statistiques avancés (StatsTab) : temps par tech, par catégorie
 * - [ ] Mode comparaison : comparer intervention avec moyenne équipe
 * - [ ] Notifications temps réel : badge update si nouvelles actions
 * - [ ] Drag & drop : réorganiser ordre actions dans timeline
 * - [ ] Templates actions rapides : boutons actions prédéfinies
 * - [ ] Commentaires collaboratifs : fil discussion par intervention
 * 
 * @module components/interventions/InterventionTabs
 * @requires react
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

// ===== IMPORTS =====
// 1. React core
import { useState } from "react";
import PropTypes from "prop-types";

// 2. UI Libraries (Radix)
import { Box, Flex, Text, Button, Badge, Card } from "@radix-ui/themes";

// 3. Icons
import { Plus, Activity, Clock, User, CheckCircle, FileDown, History, Package } from "lucide-react";

// 4. Custom Components
import LoadingState from "@/components/common/LoadingState";
import EmptyState from "@/components/common/EmptyState";
import TableHeader from "@/components/common/TableHeader";
import ActionItemCard from "@/components/actions/ActionItemCard";
import PurchaseRequestsTable from "@/components/stock/PurchaseRequestsTable";
import PurchaseRequestFormBody from "@/components/stock/PurchaseRequestFormBody";
import { 
  Timeline,
  History as HistoryComponent, 
  StatsGrid, 
  PdfViewer 
} from "@/components/common/GenericTabComponents";

// 5. Utilities
import { getCategoryColor, sanitizeDescription, getTimeDiff, getStatusColorAtDate } from "@/lib/utils/interventionUtils.jsx";

// 6. Config & Constants
import { STATE_COLORS, STATUS_CONFIG } from "@/config/interventionTypes";

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ACTIONS TAB
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tab Actions : Timeline des actions avec recherche et regroupement par jour
 * 
 * @component
 * @description
 * Affiche la chronologie complète des actions de l'intervention avec :
 * - Recherche en temps réel (description, catégorie, technicien)
 * - Regroupement par jour avec indicateur de statut
 * - Badges colorés par type d'action
 * - Refresh manuel des données
 * - État vide personnalisé si aucune action
 * 
 * @param {Object} props - Props du composant
 * @param {Object} props.interv - Intervention complète
 * @param {Array} props.interv.action - Actions de l'intervention
 * @param {boolean} props.loading - État chargement intervention
 * @param {string} props.searchActions - Valeur recherche actions
 * @param {Function} props.setSearchActions - Setter recherche
 * @param {Array<Object>} props.timelineByDay - Actions groupées par jour [{date, items}]
 * @param {Array} props.statusLog - Historique changements statut
 * @param {Function} props.refetchIntervention - Fonction refresh données
 * 
 * @example
 * <ActionsTab
 *   interv={intervention}
 *   loading={false}
 *   searchActions="dépannage"
 *   setSearchActions={setSearch}
 *   timelineByDay={groupedActions}
 *   statusLog={statusHistory}
 *   refetchIntervention={refetch}
 * />
 * 
 * @returns {JSX.Element} Tab avec timeline actions et recherche
 */
export const ActionsTab = ({
  interv,
  loading,
  searchActions,
  setSearchActions,
  timelineByDay,
  statusLog,
  refetchIntervention
}) => {
  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Activity}
          title="Actions"
          count={interv.action?.length || 0}
          searchValue={searchActions}
          onSearchChange={setSearchActions}
          onRefresh={refetchIntervention}
          loading={loading}
          searchPlaceholder="Rechercher une action..."
          searchLabel="Recherche"
          showResetButton={true}
          showRefreshButton={false}
        />
        
        {timelineByDay.length > 0 ? (
          <Timeline
            items={timelineByDay}
            renderItem={(item) => <TimelineItemRenderer item={item} />}
            getStatusColor={(dayGroup, statusLog) => {
              const dayEnd = new Date(dayGroup.date.split('/').reverse().join('-'));
              dayEnd.setHours(23, 59, 59, 999);
              return getStatusColorAtDate(dayEnd, statusLog, STATE_COLORS);
            }}
            getTimeDiff={getTimeDiff}
            statusLog={statusLog}
          />
        ) : (
          <Box mt="4">
            <EmptyState
              icon={<Activity size={48} />}
              title={searchActions ? "Aucune action trouvée" : "Aucune action"}
              description={searchActions ? "Aucune action ne correspond à votre recherche." : "Décris ce que tu viens de faire ci-dessus."}
            />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

ActionsTab.propTypes = {
  interv: PropTypes.shape({
    action: PropTypes.array
  }).isRequired,
  loading: PropTypes.bool,
  searchActions: PropTypes.string,
  setSearchActions: PropTypes.func.isRequired,
  timelineByDay: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string.isRequired,
      items: PropTypes.array.isRequired
    })
  ).isRequired,
  statusLog: PropTypes.array,
  refetchIntervention: PropTypes.func.isRequired,
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// NOTE: Timeline and TimelineSeparator have been moved to GenericTabComponents.jsx for reusability
// These generic components are used by ActionsTab and can be reused in StockManager and other modules
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// TIMELINE ITEM RENDERER
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Renderer pour item timeline : affiche action ou changement statut
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.item - Item timeline
 * @param {string} props.item.type - Type ('action' ou 'status')
 * @param {string} props.item.date - Date item ISO
 * @param {Object} props.item.data - Données action ou statut
 * @returns {JSX.Element} ActionItemCard ou badge statut
 */
const TimelineItemRenderer = ({ item }) => {
  const statusConfig = STATE_COLORS[item.data.to?.id];
  
  if (item.type === 'status') {
    return (
      <Box 
        mb="3"
        style={{
          padding: '0.75rem',
          borderRadius: '6px',
          backgroundColor: `${statusConfig?.activeBg || 'var(--blue-6)'}15`,
          transition: 'all 0.2s ease'
        }}
      >
        <Flex align="center" gap="2">
          <Activity size={16} style={{ color: statusConfig?.activeBg || 'var(--blue-9)' }} />
          <Badge 
            variant="solid" 
            size="2"
            style={{ 
              backgroundColor: statusConfig?.activeBg || 'var(--blue-9)',
              color: 'white'
            }}
          >
            {statusConfig?.label || 'Changement d\'état'}
          </Badge>
          <Text size="1" color="gray">
            {new Date(item.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <ActionItemCard 
      action={item.data}
      getCategoryColor={getCategoryColor}
      sanitizeDescription={sanitizeDescription}
    />
  );
};

TimelineItemRenderer.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SUMMARY TAB - Suivi des demandes d'achat liées à l'intervention (réutilise PurchaseRequestsTable)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tab Summary : Gestion demandes d'achat liées à l'intervention
 * 
 * @component
 * @description
 * Affiche et gère les demandes d'achat pour l'intervention :
 * - Table des demandes filtrées par intervention
 * - Formulaire création inline (toggle)
 * - Liaison automatique intervention_id
 * - Refresh après création
 * - Intégration PurchaseRequestsTable (gestion stock, fournisseurs, specs)
 * 
 * @param {Object} props - Props du composant
 * @param {Object} props.interv - Intervention complète
 * @param {string|number} props.interv.id - ID intervention (requis pour filtrage)
 * @param {boolean} props.loading - État chargement intervention
 * @param {Function} props.refetchIntervention - Fonction refresh données
 * @param {Array} [props.purchaseRequests=[]] - Liste demandes d'achat (toutes)
 * @param {Function} props.onCreatePurchaseRequest - Callback création nouvelle demande
 * @param {Array} [props.stockItems=[]] - Items stock disponibles pour sélection
 * @param {Object} [props.supplierRefs={}] - Références fournisseurs par stock_item_id
 * @param {Object} [props.standardSpecs={}] - Spécifications standard par stock_item_id
 * @param {Function} props.onAddSupplierRef - Callback ajout référence fournisseur
 * @param {Function} props.onAddStandardSpec - Callback ajout spécification standard
 * @param {Array} [props.suppliers=[]] - Liste fournisseurs disponibles
 * 
 * @example
 * <SummaryTab
 *   interv={intervention}
 *   loading={false}
 *   refetchIntervention={refetch}
 *   purchaseRequests={allRequests}
 *   onCreatePurchaseRequest={handleCreate}
 *   stockItems={items}
 *   supplierRefs={refs}
 *   standardSpecs={specs}
 *   onAddSupplierRef={handleAddRef}
 *   onAddStandardSpec={handleAddSpec}
 *   suppliers={suppliersList}
 * />
 * 
 * @returns {JSX.Element} Tab avec table demandes et formulaire création
 */
export const SummaryTab = ({ 
  interv, 
  loading, 
  refetchIntervention,
  purchaseRequests = [],
  onCreatePurchaseRequest,
  stockItems = [],
  supplierRefs = {},
  standardSpecs = {},
  onAddSupplierRef,
  onAddStandardSpec,
  suppliers = []
}) => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vérifier que l'intervention est chargée
  if (!interv || loading) {
    return <LoadingState message="Chargement des demandes d'achat..." />;
  }

  // Filtrer les demandes d'achat liées à cette intervention
  const interventionRequests = purchaseRequests.filter(
    req => req.interventionId === interv.id
  );

  const handleFormSubmit = async (formData) => {
    try {
      setSubmitting(true);
      await onCreatePurchaseRequest({
        ...formData,
        intervention_id: interv.id
      });
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Package}
          title="Demandes d'achat"
          count={interventionRequests.length}
          onRefresh={refetchIntervention}
          loading={false}
          showRefreshButton={true}
          actions={
            <Button
              size="2"
              onClick={() => setShowForm(!showForm)}
              style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
            >
              <Plus size={16} />
              Nouvelle demande
            </Button>
          }
        />

        {/* Formulaire de création réutilisable */}
        {showForm && (
          <Card style={{ backgroundColor: 'var(--gray-2)' }}>
            <PurchaseRequestFormBody
              onSubmit={handleFormSubmit}
              loading={submitting}
              onCancel={() => setShowForm(false)}
              submitLabel="Créer la demande"
              compact={true}
            />
          </Card>
        )}

        {/* Table réutilisable des demandes d'achat */}
        <Box mt="2">
          <PurchaseRequestsTable
            requests={interventionRequests}
            stockItems={stockItems}
            supplierRefs={supplierRefs}
            standardSpecs={standardSpecs}
            onRefresh={refetchIntervention}
            onAddSupplierRef={onAddSupplierRef}
            onAddStandardSpec={onAddStandardSpec}
            suppliers={suppliers}
            loading={loading}
            compact={true}
          />
        </Box>
      </Flex>
    </Box>
  );
};

SummaryTab.propTypes = {
  interv: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }),
  loading: PropTypes.bool,
  refetchIntervention: PropTypes.func.isRequired,
  purchaseRequests: PropTypes.array,
  onCreatePurchaseRequest: PropTypes.func.isRequired,
  stockItems: PropTypes.array,
  supplierRefs: PropTypes.object,
  standardSpecs: PropTypes.object,
  onAddSupplierRef: PropTypes.func,
  onAddStandardSpec: PropTypes.func,
  suppliers: PropTypes.array,
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATS TAB - Uses generic StatsGrid component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATS TAB - Uses generic StatsGrid component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tab Stats : Statistiques intervention (temps, actions, statut)
 * 
 * @component
 * @description
 * Affiche les statistiques clés de l'intervention sous forme de grille :
 * - Temps total passé (heures avec 1 décimale)
 * - Nombre total d'actions
 * - Statut actuel avec couleur
 * - Utilise StatsGrid générique pour layout responsive
 * - Refresh manuel des données
 * 
 * @param {Object} props - Props du composant
 * @param {number} props.totalTime - Temps total passé en heures (calculé)
 * @param {Object} props.interv - Intervention complète
 * @param {Array} props.interv.action - Actions de l'intervention
 * @param {Object} props.interv.status_actual - Statut actuel
 * @param {string} props.interv.status_actual.id - ID statut (pour mapping couleur)
 * @param {boolean} props.loading - État chargement intervention
 * @param {Function} props.refetchIntervention - Fonction refresh données
 * 
 * @example
 * <StatsTab
 *   totalTime={42.5}
 *   interv={intervention}
 *   loading={false}
 *   refetchIntervention={refetch}
 * />
 * 
 * @returns {JSX.Element} Tab avec grille statistiques (3 KPI cards)
 */
export const StatsTab = ({ totalTime, interv, loading, refetchIntervention }) => {
  const stats = [
    {
      label: 'Temps total passé',
      value: `${totalTime.toFixed(1)}h`,
      icon: Clock,
      bgColor: 'var(--blue-2)',
      textColor: 'var(--blue-11)',
      size: '8'
    },
    {
      label: 'Nombre d\'actions',
      value: interv.action?.length || 0,
      icon: Activity,
      bgColor: 'var(--gray-2)',
      textColor: 'var(--gray-11)',
      size: '6'
    },
    {
      label: 'Statut actuel',
      value: STATE_COLORS[interv.status_actual?.id]?.label || 'En cours',
      icon: CheckCircle,
      bgColor: 'var(--green-2)',
      textColor: 'var(--green-11)',
      size: '4'
    }
  ];

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={Activity}
          title="Statistiques"
          onRefresh={refetchIntervention}
          loading={loading}
          showRefreshButton={true}
        />
        
        {loading ? (
          <LoadingState message="Chargement des statistiques..." fullscreen={false} size="2" />
        ) : (
          <StatsGrid stats={stats} />
        )}
      </Flex>
    </Box>
  );
};

StatsTab.propTypes = {
  totalTime: PropTypes.number.isRequired,
  interv: PropTypes.shape({
    action: PropTypes.array,
    status_actual: PropTypes.object
  }).isRequired,
  loading: PropTypes.bool,
  refetchIntervention: PropTypes.func.isRequired,
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SHEET TAB - Uses generic PdfViewer component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// SHEET TAB - Uses generic PdfViewer component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tab Sheet : Génération et visualisation PDF fiche intervention
 * 
 * @component
 * @description
 * Affiche et génère la fiche intervention au format PDF :
 * - Bouton génération manuelle (appel API export)
 * - Viewer PDF intégré (iframe)
 * - État loading pendant génération
 * - Utilise PdfViewer générique pour affichage
 * - Gestion erreurs et états vides
 * 
 * @param {Object} props - Props du composant
 * @param {string} props.pdfUrl - URL Blob du PDF généré (null si pas encore généré)
 * @param {boolean} props.pdfLoading - État génération PDF (spinner bouton)
 * @param {Function} props.loadPdf - Callback génération PDF (appel GMAO Export API)
 * 
 * @example
 * <SheetTab
 *   pdfUrl={blobUrl}
 *   pdfLoading={isGenerating}
 *   loadPdf={handleGeneratePdf}
 * />
 * 
 * @returns {JSX.Element} Tab avec bouton génération et viewer PDF
 */
export const SheetTab = ({ pdfUrl, pdfLoading, loadPdf }) => {
  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={FileDown}
          title="Fiche intervention (PDF)"
          loading={pdfLoading}
          showRefreshButton={false}
          actions={
            <Button
              size="2"
              onClick={loadPdf}
              disabled={pdfLoading}
              style={{ backgroundColor: 'var(--gray-9)', color: 'white' }}
              title="Générer la fiche PDF"
            >
              {pdfLoading ? (
                <Flex align="center" gap="2">
                  <Box
                    style={{
                      width: "14px",
                      height: "14px",
                      border: "2px solid currentColor",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}
                  />
                  Génération...
                </Flex>
              ) : (
                <Flex align="center" gap="2">
                  <FileDown size={16} />
                  Générer la fiche
                </Flex>
              )}
            </Button>
          }
        />

        <PdfViewer 
          url={pdfUrl}
          loading={pdfLoading}
          onLoad={loadPdf}
          title="Fiche intervention PDF"
        />
      </Flex>
    </Box>
  );
};

SheetTab.propTypes = {
  pdfUrl: PropTypes.string,
  pdfLoading: PropTypes.bool,
  loadPdf: PropTypes.func.isRequired,
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HISTORY TAB - Uses generic History component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HISTORY TAB - Uses generic History component
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Tab History : Historique chronologique actions + changements statut
 * 
 * @component
 * @description
 * Affiche l'historique complet de l'intervention (vue unifiée) :
 * - Timeline fusionnée actions + changements statut
 * - Tri chronologique décroissant (plus récent en haut)
 * - Badges colorés selon type (action/statut)
 * - Détails actions : catégorie, temps, technicien
 * - Détails changements statut : nouveau statut, technicien
 * - Refresh manuel des deux sources (intervention + status log)
 * - Utilise History générique pour layout
 * 
 * @param {Object} props - Props du composant
 * @param {Array<Object>} props.timeline - Timeline fusionnée [{type, date, data}]
 * @param {boolean} props.loading - État chargement intervention
 * @param {boolean} props.statusLogLoading - État chargement historique statuts
 * @param {Function} props.refetchIntervention - Refresh actions intervention
 * @param {Function} props.refetchStatusLog - Refresh historique changements statut
 * 
 * @example
 * <HistoryTab
 *   timeline={mergedTimeline}
 *   loading={loadingInterv}
 *   statusLogLoading={loadingLog}
 *   refetchIntervention={refetchInterv}
 *   refetchStatusLog={refetchLog}
 * />
 * 
 * @returns {JSX.Element} Tab avec historique chronologique unifié
 */
export const HistoryTab = ({ timeline, loading, statusLogLoading, refetchIntervention, refetchStatusLog }) => {
  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <TableHeader
          icon={History}
          title="Historique chronologique"
          count={timeline.length}
          onRefresh={() => {
            refetchIntervention();
            refetchStatusLog();
          }}
          loading={loading || statusLogLoading}
          showRefreshButton={true}
        />

        <HistoryComponent
          items={timeline}
          renderItem={(item) => <HistoryItem item={item} />}
          loading={statusLogLoading}
          onRefresh={() => {
            refetchIntervention();
            refetchStatusLog();
          }}
        />
      </Flex>
    </Box>
  );
};

HistoryTab.propTypes = {
  timeline: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  statusLogLoading: PropTypes.bool,
  refetchIntervention: PropTypes.func.isRequired,
  refetchStatusLog: PropTypes.func.isRequired,
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HISTORY ITEM
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Item d'historique : affiche action ou changement statut
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.item - Item historique
 * @param {string} props.item.type - Type ('action' ou 'status')
 * @param {string} props.item.date - Date ISO
 * @param {Object} props.item.data - Données action ou statut
 * @returns {JSX.Element} Box avec détails item
 */
const HistoryItem = ({ item }) => (
  <Box 
    mb="3"
    p="3"
    style={{
      backgroundColor: item.type === 'status' ? 'var(--amber-2)' : 'var(--gray-2)',
      borderRadius: '6px',
      borderLeft: `4px solid ${item.type === 'status' ? 'var(--amber-6)' : 'var(--blue-6)'}`,
      position: 'relative'
    }}
  >
    <Flex direction="column" gap="2">
      <Flex justify="between" align="center">
        <Flex align="center" gap="2">
          <Flex align="center" gap="1">
            {item.type === 'status' ? (
              <Activity size={14} color="white" />
            ) : (
              <CheckCircle size={14} color="white" />
            )}
            <Badge 
              color={item.type === 'status' ? 'amber' : 'blue'} 
              variant="solid" 
              size="1"
            >
              {item.type === 'status' ? 'Changement statut' : 'Action'}
            </Badge>
          </Flex>
        </Flex>
        <Text size="1" color="gray">
          {new Date(item.date).toLocaleString('fr-FR')}
        </Text>
      </Flex>

      {item.type === 'status' ? (
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Text size="2" weight="bold">
              {STATUS_CONFIG[item.data.to?.id]?.label || item.data.to?.value}
            </Text>
          </Flex>
          {item.data.technician && (
            <Text size="1" color="gray">
              Par: {item.data.technician.firstName} {item.data.technician.lastName}
            </Text>
          )}
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          <Text size="2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {item.data.subcategory && (
              <Badge 
                variant="soft" 
                size="1" 
                style={{
                  backgroundColor: getCategoryColor(item.data.subcategory) || '#6b7280',
                  color: 'white'
                }}
              >
                {item.data.subcategory.code || '—'}
              </Badge>
            )}
            {item.data.description}
          </Text>
          <Flex gap="3" align="center" wrap="wrap">
            {item.data.timeSpent && (
              <Flex align="center" gap="1">
                <Clock size={12} color="var(--blue-9)" />
                <Badge color="blue" variant="soft" size="1">
                  {item.data.timeSpent}h
                </Badge>
              </Flex>
            )}
            {item.data.technician && (
              <Flex align="center" gap="1">
                <User size={12} color="var(--gray-9)" />
                <Text size="1" color="gray">
                  {item.data.technician.firstName} {item.data.technician.lastName}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      )}
    </Flex>
  </Box>
);

HistoryItem.propTypes = {
  item: PropTypes.shape({
    type: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired
  }).isRequired
};
