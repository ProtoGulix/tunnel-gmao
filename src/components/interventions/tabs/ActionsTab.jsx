/* eslint-disable complexity, max-lines */
/**
 * Onglet Actions - Timeline des actions d'intervention
 *
 * Affiche la timeline des actions avec recherche et regroupement par jour.
 * Inclut à la fois les actions et les changements de statut.
 */

import { Box, Flex, TextField, Button } from '@radix-ui/themes';
import { Activity, Search, Plus, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { useMemo, useState, useCallback } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { Timeline } from '@/components/ui/GenericTabComponents';
import TimelineItemRenderer from '@/components/interventions/TimelineItemRenderer';
import ActionForm from '@/components/interventions/ActionForm';
import GammeProgressBlock from '@/components/preventive/GammeProgressBlock';
import * as actionCategoriesApi from '@/api/actionCategories';
import * as complexityFactorsApi from '@/api/complexityFactors';

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
}) {
  // State pour le formulaire de nouvelle action
  const [showNewActionForm, setShowNewActionForm] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    if (!metadataLoaded) {
      try {
        const [categoriesData, factorsData] = await Promise.all([
          actionCategoriesApi.fetchActionCategories(),
          complexityFactorsApi.fetchComplexityFactors(),
        ]);
        setSubcategories(categoriesData || []);
        setComplexityFactors(factorsData || []);
        setMetadataLoaded(true);
      } catch (error) {
        console.error('Erreur chargement métadonnées:', error);
        setMetadataLoaded(true);
      }
    }
  }, [metadataLoaded]);

  // Handler pour soumettre la nouvelle action
  // ActionForm construit le payload canonique, on le passe directement à onAddAction
  const handleSubmitNewAction = useCallback(async (payload) => {
    if (!onAddAction) return;

    try {
      setSubmitting(true);
      await onAddAction(payload);
      setShowNewActionForm(false);
    } catch (error) {
      console.error('Erreur création action:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [onAddAction]);

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
            onCancel={() => setShowNewActionForm(false)}
            onSubmit={handleSubmitNewAction}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Gamme de maintenance */}
        {planId && (
          <GammeProgressBlock mode="intervention" interventionId={String(interventionId)} />
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
};

ActionsTab.defaultProps = {
  statusLog: [],
  onAddAction: null,
  onPurchaseRequestCreated: null,
};
