/* eslint-disable complexity, max-lines */
/**
 * Onglet Actions - Timeline des actions d'intervention
 *
 * Affiche la timeline des actions avec recherche et regroupement par jour.
 * Inclut à la fois les actions et les changements de statut.
 */

import { Box, Flex, TextField, Button, Text, Badge } from '@radix-ui/themes';
import { Activity, Search, Plus, X, ClipboardCheck } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo, useState, useCallback, useEffect } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { Timeline } from '@/components/ui/GenericTabComponents';
import TimelineItemRenderer from '@/components/interventions/TimelineItemRenderer';
import ActionForm from '@/components/interventions/ActionForm';
import * as actionCategoriesApi from '@/api/actionCategories';
import * as complexityFactorsApi from '@/api/complexityFactors';
import { fetchInterventionTasks, fetchInterventionTasksProgress } from '@/api/interventionTasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Bandeau compact de progression de gamme (comme la demande liée)
 */
function GammeProgressBanner({ interventionId, refreshKey }) {
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchInterventionTasksProgress(String(interventionId))
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [interventionId, refreshKey]);

  if (!progress || progress.total === 0) return null;

  const { done, total, blocking_pending } = progress;
  const pct = Math.round((done / total) * 100);

  let badgeColor = 'green';
  let badgeLabel = 'Complète';
  if ((blocking_pending ?? 0) > 0) {
    badgeColor = 'orange';
    badgeLabel = `${blocking_pending} obligatoire${blocking_pending > 1 ? 's' : ''} restante${blocking_pending > 1 ? 's' : ''}`;
  } else if (progress.pending > 0) {
    badgeColor = 'blue';
    badgeLabel = 'Optionnelles en attente';
  }

  return (
    <Box style={{
      background: 'var(--gray-2)',
      border: '1px solid var(--gray-5)',
      borderRadius: 'var(--radius-2)',
      padding: '0.5rem 0.75rem',
    }}>
      <Flex align="center" gap="2">
        <ClipboardCheck size={14} color="var(--blue-9)" style={{ flexShrink: 0 }} />
        <Text size="2" weight="bold" style={{ flexShrink: 0 }}>Gamme</Text>
        <Box style={{ flex: 1, height: 6, background: 'var(--gray-4)', borderRadius: 3, overflow: 'hidden' }}>
          <Box style={{ height: '100%', width: `${pct}%`, background: 'var(--green-9)', transition: 'width 0.3s' }} />
        </Box>
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>{done}/{total}</Text>
        <Badge color={badgeColor} variant="soft" size="1" style={{ flexShrink: 0 }}>{badgeLabel}</Badge>
      </Flex>
    </Box>
  );
}

GammeProgressBanner.propTypes = {
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  refreshKey: PropTypes.number,
};

/**
 * Groupe les éléments de timeline par jour
 */
function groupTimelineByDay(actions, statusLog) {
  const items = [];

  // Ajouter les actions
  actions.forEach((action) => {
    items.push({
      type: 'action',
      date: action.createdAt || action.date,
      data: action,
    });
  });

  // Ajouter les changements de statut
  statusLog?.forEach((log) => {
    items.push({
      type: 'status',
      date: log.date,
      data: log,
    });
  });

  // Trier par date décroissante (plus récent en haut)
  const sortedItems = items.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Grouper par jour
  const grouped = {};
  sortedItems.forEach((item) => {
    const dateObj = new Date(item.date);
    const dayKey = dateObj.toLocaleDateString('fr-FR');

    if (!grouped[dayKey]) {
      grouped[dayKey] = {
        date: dayKey,
        items: [],
      };
    }

    grouped[dayKey].items.push(item);
  });

  // Retourner tableau trié
  return Object.values(grouped);
}

/**
 * Composant ActionsTab
 *
 * @param {Object} props
 * @param {Array} props.actions - Liste des actions
 * @param {Array} props.statusLog - Log des statuts
 * @param {string} props.searchTerm - Terme de recherche
 * @param {Function} props.onSearchChange - Callback recherche
 * @param {Function} props.onAddAction - Callback ajout action
 * @param {string|number} props.interventionId - ID de l'intervention
 * @param {Function} props.onPurchaseRequestCreated - Callback création demande achat
 */
export default function ActionsTab({
  actions,
  statusLog,
  searchTerm,
  onSearchChange,
  onAddAction,
  interventionId,
  onPurchaseRequestCreated,
  planId = null,
  isLocked = false,
}) {
  // State pour le formulaire de nouvelle action
  const [showNewActionForm, setShowNewActionForm] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingValidations, setPendingValidations] = useState([]);
  const [gammeRefreshKey, setGammeRefreshKey] = useState(0);

  // Fusionner et grouper actions + statusLog
  const timelineByDay = useMemo(() => {
    return groupTimelineByDay(actions, statusLog || []);
  }, [actions, statusLog]);

  // Filtrage de la timeline par terme de recherche
  const filteredTimelineByDay = useMemo(() => {
    if (!searchTerm.trim()) return timelineByDay;

    const searchLower = searchTerm.toLowerCase();

    return timelineByDay
      .map((dayGroup) => {
        const filteredItems = dayGroup.items.filter((item) => {
          if (item.type === 'action') {
            const action = item.data;
            return (
              action.description?.toLowerCase().includes(searchLower) ||
              action.technician?.firstName?.toLowerCase().includes(searchLower) ||
              action.technician?.lastName?.toLowerCase().includes(searchLower)
            );
          }
          // Pour les status, on peut rechercher dans les labels
          if (item.type === 'status') {
            const log = item.data;
            return (
              log.status_from_detail?.label?.toLowerCase().includes(searchLower) ||
              log.status_to_detail?.label?.toLowerCase().includes(searchLower) ||
              log.technician?.firstName?.toLowerCase().includes(searchLower) ||
              log.technician?.lastName?.toLowerCase().includes(searchLower) ||
              log.notes?.toLowerCase().includes(searchLower)
            );
          }
          return false;
        });

        return {
          ...dayGroup,
          items: filteredItems,
        };
      })
      .filter((dayGroup) => dayGroup.items.length > 0);
  }, [timelineByDay, searchTerm]);

  // Handler pour ouvrir le formulaire et charger les métadonnées
  const handleOpenNewActionForm = useCallback(async () => {
    setShowNewActionForm(true);
    const tasks = [
      !metadataLoaded && actionCategoriesApi.fetchActionCategories(),
      !metadataLoaded && complexityFactorsApi.fetchComplexityFactors(),
      planId && fetchInterventionTasks(String(interventionId)),
    ].filter(Boolean);

    try {
      const results = await Promise.all(tasks);
      let idx = 0;
      if (!metadataLoaded) {
        setSubcategories(results[idx++] || []);
        setComplexityFactors(results[idx++] || []);
        setMetadataLoaded(true);
      }
      if (planId) {
        const tasks = results[idx] ?? [];
        setPendingValidations(Array.isArray(tasks) ? tasks.filter((t) => t.origin === 'plan' && (t.status === 'todo' || t.status === 'in_progress')) : []);
      }
    } catch (error) {
      console.error('Erreur chargement métadonnées:', error);
      if (!metadataLoaded) setMetadataLoaded(true);
    }
  }, [metadataLoaded, planId, interventionId]);

  // Handler pour soumettre la nouvelle action
  const handleSubmitNewAction = useCallback(async (payload) => {
    if (!onAddAction) return;

    try {
      setSubmitting(true);
      await onAddAction(payload);
      if (planId) setGammeRefreshKey((k) => k + 1);
      setShowNewActionForm(false);
      setPendingValidations([]);
    } catch (error) {
      console.error('Erreur création action:', error);
      throw new Error(extractApiErrorMessage(error, "Erreur lors de la création de l'action"));
    } finally {
      setSubmitting(false);
    }
  }, [onAddAction, planId]);

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        {/* Barre de recherche et bouton ajout */}
        <Flex gap="2" align="center">
          <Box style={{ flex: 1 }}>
            <TextField.Root
              placeholder="Rechercher une action..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              size="2"
            >
              <TextField.Slot>
                <Search size={16} />
              </TextField.Slot>
            </TextField.Root>
          </Box>
          {onAddAction && (
            <Button
              size="2"
              onClick={showNewActionForm ? () => setShowNewActionForm(false) : handleOpenNewActionForm}
              disabled={submitting}
              style={{
                backgroundColor: showNewActionForm ? 'var(--gray-9)' : 'var(--blue-9)',
                color: 'white'
              }}
            >
              {showNewActionForm ? <X size={16} /> : <Plus size={16} />}
              {showNewActionForm ? 'Annuler' : 'Action'}
            </Button>
          )}
        </Flex>

        {/* Bandeau gamme de maintenance */}
        {planId && (
          <GammeProgressBanner interventionId={interventionId} refreshKey={gammeRefreshKey} />
        )}

        {/* Formulaire nouvelle action */}
        {showNewActionForm && (
          <ActionForm
            initialState={{
              time: '',
              date: new Date().toISOString().split('T')[0],
              category: '',
              description: '',
              complexity: '5',
              complexityFactors: [],
            }}
            metadata={{ subcategories, complexityFactors }}
            interventionId={String(interventionId)}
            showContext={false}
            onCancel={() => { setShowNewActionForm(false); setPendingValidations([]); }}
            onSubmit={handleSubmitNewAction}
            gammeValidations={pendingValidations}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Timeline ou état vide */}
        {filteredTimelineByDay.length === 0 ? (
          <EmptyState
            compact
            icon={<Activity size={16} />}
            title={searchTerm ? 'Aucun élément trouvé' : 'Aucune action pour cette intervention'}
            description={searchTerm ? 'Aucun élément ne correspond à votre recherche.' : undefined}
          />
        ) : (
          <Timeline
            items={filteredTimelineByDay}
            renderItem={(item) => (
              <TimelineItemRenderer
                item={item}
                interventionId={interventionId}
                onPurchaseRequestCreated={onPurchaseRequestCreated}
                isLocked={isLocked}
              />
            )}
          />
        )}
      </Flex>
    </Box>
  );
}

ActionsTab.propTypes = {
  actions: PropTypes.array.isRequired,
  statusLog: PropTypes.array,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onAddAction: PropTypes.func,
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onPurchaseRequestCreated: PropTypes.func,
  planId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isLocked: PropTypes.bool,
};

ActionsTab.defaultProps = {
  statusLog: [],
  onAddAction: null,
  onPurchaseRequestCreated: null,
};
