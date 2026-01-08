/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Sub-components pour MachineDetail.jsx
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Blocs d'affichage pour réduire la complexité et la taille de MachineDetail
 * Chaque bloc <200 lignes par ESLint
 * 
 * @module pages/MachineDetail/MachineDetailBlocks
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Flex, Heading, Text, Card, Box } from '@radix-ui/themes';
import { Wrench, Clock, ShoppingCart, Shield, AlertCircle, CheckCircle } from 'lucide-react';

import OpenInterventionsTable from '@/components/machine/OpenInterventionsTable';
import PurchaseRequestsTable from '@/components/purchase/requests/PurchaseRequestsTable';
import PreventiveSuggestionsPanel from '@/components/preventive/PreventiveSuggestionsPanel';

import { formatTime } from '@/lib/utils/timeFormatter';
import { isInterventionOpen } from '@/lib/utils/interventionHelpers';

/**
 * Filtre les interventions pour la page de pilotage
 * Inclut: ouvertes ET clôturées < 30 jours
 * 
 * @param {Array} interventions - Liste des interventions
 * @returns {Array} Interventions filtrées
 */
export const filterDecisionalInterventions = (interventions) => {
  if (!interventions || interventions.length === 0) return [];
  
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(Date.now() - thirtyDaysMs);
  
  return interventions.filter(intervention => {
    // Garder si ouverte
    if (isInterventionOpen(intervention)) return true;
    
    // Garder si clôturée mais < 30j
    if (intervention.closed_date) {
      const closedDate = new Date(intervention.closed_date);
      return closedDate >= thirtyDaysAgo;
    }
    
    // Garder si pas de date de clôture mais date d'ouverture < 30j
    if (intervention.reported_date) {
      const reportedDate = new Date(intervention.reported_date);
      return reportedDate >= thirtyDaysAgo;
    }
    
    return false;
  });
};

/**
 * Calcule le temps passé sur une période donnée
 * 
 * @param {Array} actions - Liste des actions
 * @param {number} periodMs - Durée de la période en ms
 * @returns {number} Temps passé en minutes
 */
export const getTimeSpentInPeriod = (actions, periodMs) => {
  const periodStart = new Date(Date.now() - periodMs);
  
  return (actions || []).reduce((total, action) => {
    if (!action.created_at) return total;
    const actionDate = new Date(action.created_at);
    if (actionDate >= periodStart) {
      return total + parseFloat(action.time_spent || 0);
    }
    return total;
  }, 0);
};

/**
 * Filtre les demandes d&apos;achat liées aux interventions de la machine
 * 
 * @param {Array} requests - Toutes les demandes d&apos;achat
 * @param {Array} interventions - Interventions de la machine
 * @returns {Array} Demandes liées
 */
export const getMachineRequests = (requests, interventions) => {
  if (!requests || !Array.isArray(requests) || !interventions || !Array.isArray(interventions)) {
    return [];
  }
  const interventionIds = new Set(interventions.map(i => i.id));
  return requests.filter(req => interventionIds.has(req.intervention_id));
};

/**
 * Détermine si une alerte urgente doit être affichée
 * 
 * @param {Array} interventions - Interventions filtrées
 * @returns {boolean}
 */
export const hasUrgentAlert = (interventions) => {
  return interventions.some(i => i.priority?.toLowerCase() === 'urgent');
};

/**
 * Construit les props pour le bloc de temps passé
 * 
 * @param {number} timeSpent30d - Temps passé sur 30 jours
 * @param {number} timeSpent90d - Temps passé sur 90 jours
 * @returns {Object} Props nécessaires
 */
export const buildTimeSpentProps = (timeSpent30d, timeSpent90d) => {
  const avgPer30d = timeSpent90d / 3;
  const isAnomalous = timeSpent30d > avgPer30d * 1.2;
  
  return {
    timeSpent30d,
    timeSpent90d,
    avgPer30d,
    isAnomalous,
  };
};

/**
 * Bloc interventions ouvertes et récentes
 */
export function InterventionsBlock({ interventions, machineId }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="3">
        <Wrench size={24} style={{ color: 'var(--orange-9)' }} />
        <Heading size="5">Interventions Actives</Heading>
      </Flex>
      <Text size="2" color="gray" mb="4" style={{ fontStyle: 'italic' }}>
        Interventions ouvertes ou clôturées depuis moins de 30 jours
      </Text>
      <OpenInterventionsTable 
        interventions={interventions} 
        machineId={machineId} 
      />
    </Box>
  );
}

InterventionsBlock.propTypes = {
  interventions: PropTypes.array.isRequired,
  machineId: PropTypes.string.isRequired,
};

/**
 * Bloc bilan du temps passé
 */
export function TimeSpentBlock({ timeSpent30d, timeSpent90d }) {
  const props = useMemo(
    () => buildTimeSpentProps(timeSpent30d, timeSpent90d),
    [timeSpent30d, timeSpent90d]
  );

  // Computed props object shape: { timeSpent30d, timeSpent90d, avgPer30d, delta, isAnomalous }
  // eslint-disable-next-line react/prop-types

  return (
    <Box>
      <Flex align="center" gap="2" mb="3">
        <Clock size={24} style={{ color: 'var(--blue-9)' }} />
        <Heading size="5">Bilan du Temps Passé</Heading>
      </Flex>
      <Text size="2" color="gray" mb="4" style={{ fontStyle: 'italic' }}>
        Charge de maintenance sur la période courante
      </Text>
      <Card>
        <Flex direction="column" gap="3" p="4">
          {/* Temps 30j */}
          <Flex justify="between" align="center" p="3" style={{ background: 'var(--gray-2)', borderRadius: '8px' }}>
            <Flex direction="column">
              <Text weight="bold" size="3">Derniers 30 jours</Text>
              <Text size="1" color="gray">Temps passé total</Text>
            </Flex>
            <Flex direction="column" align="end">
              <Text weight="bold" size="4" color="blue">
                {formatTime(props.timeSpent30d)}
              </Text>
              <Text size="1" color="gray">
                ({Math.round(props.timeSpent30d / 60)} actions)
              </Text>
            </Flex>
          </Flex>

          {/* Comparaison */}
          {props.timeSpent90d > 0 && (
            <>
              <Flex justify="between" align="center" p="3" style={{ background: 'var(--gray-1)', borderRadius: '8px' }}>
                <Flex direction="column">
                  <Text weight="medium" size="2">Moyenne 90 jours</Text>
                  <Text size="1" color="gray">Référence pour comparaison</Text>
                </Flex>
                <Flex direction="column" align="end">
                  <Text weight="medium" size="3" color="gray">
                    {formatTime(props.avgPer30d)}
                  </Text>
                  <Text size="1" color="gray">par 30 jours</Text>
                </Flex>
              </Flex>

              <Flex justify="between" align="center" p="3" style={{ 
                background: props.isAnomalous ? 'var(--amber-2)' : 'var(--green-2)',
                borderRadius: '8px'
              }}>
                <Flex align="center" gap="2">
                  {props.isAnomalous ? (
                    <AlertCircle size={18} color="var(--amber-9)" />
                  ) : (
                    <CheckCircle size={18} color="var(--green-9)" />
                  )}
                  <Text weight="bold" size="2">Écart</Text>
                </Flex>
                <Text weight="bold" size="3" color={props.isAnomalous ? 'amber' : 'green'}>
                  {props.timeSpent30d > props.avgPer30d ? '+' : ''}{formatTime(props.timeSpent30d - props.avgPer30d)}
                </Text>
              </Flex>
            </>
          )}

          {props.timeSpent90d === 0 && (
            <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
              Pas de données historiques pour comparaison (à partir de 90 jours d&apos;activité)
            </Text>
          )}
        </Flex>
      </Card>
    </Box>
  );
}

TimeSpentBlock.propTypes = {
  timeSpent30d: PropTypes.number.isRequired,
  timeSpent90d: PropTypes.number.isRequired,
};
export function PurchaseRequestsBlock({ requests, stockItems, loading }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="3">
        <ShoppingCart size={24} style={{ color: 'var(--green-9)' }} />
        <Heading size="5">Demandes d&apos;Achat Associées</Heading>
      </Flex>
      <Text size="2" color="gray" mb="4" style={{ fontStyle: 'italic' }}>
        Articles commandés pour les interventions de cette machine
      </Text>
      <PurchaseRequestsTable 
        requests={requests}
        stockItems={stockItems}
        supplierRefs={{}}
        standardSpecs={{}}
        suppliers={[]}
        loading={loading}
        compact={true}
      />
    </Box>
  );
}

PurchaseRequestsBlock.propTypes = {
  requests: PropTypes.array.isRequired,
  stockItems: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};

PurchaseRequestsBlock.defaultProps = {
  loading: false,
};

/**
 * Bloc suggestions préventif
 */
export function PreventiveSuggestionsBlock({ machineId, hasRequests }) {
  return (
    <Box>
      <Flex align="center" gap="2" mb="3">
        <Shield size={24} style={{ color: 'var(--purple-9)' }} />
        <Heading size="5">Suggestions Préventif</Heading>
      </Flex>
      <Text size="2" color="gray" mb="4" style={{ fontStyle: 'italic' }}>
        Pannes récurrentes à transformer en maintenance planifiée
      </Text>
      <PreventiveSuggestionsPanel machineId={machineId} status="NEW" />
    </Box>
  );
}

PreventiveSuggestionsBlock.propTypes = {
  machineId: PropTypes.string.isRequired,
  hasRequests: PropTypes.bool,
};

PreventiveSuggestionsBlock.defaultProps = {
  hasRequests: false,
};
