import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import { InterventionCard } from './InterventionCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Panneau droit pour une DI sélectionnée.
 *
 * Fetch GET /intervention-requests/{id}, puis :
 *   - detail.intervention présent → InterventionCard avec situation construite depuis la réponse
 *   - detail.intervention absent  → empty state "Pas encore d'intervention"
 */
export function DIRightPanel({ requestId, onRefresh }) {
  const { detail, loading, error } = useInterventionRequestDetail(requestId);

  if (loading) return <LoadingState message="Chargement de la demande..." />;
  if (error)   return <ErrorState error={error} />;
  if (!detail) return null;

  const iv = detail.intervention ?? null;

  if (!iv) {
    return (
      <Flex align="center" justify="center" direction="column" gap="3"
        style={{ height: '100%', minHeight: 300, color: 'var(--gray-8)' }}>
        <ClipboardList size={32} strokeWidth={1.5} />
        <Text size="2" color="gray">Pas encore d'intervention pour cette demande</Text>
        <Text size="1" color="gray">{detail.statut_label ?? detail.statut}</Text>
      </Flex>
    );
  }

  // Construit la situation depuis les données réelles de la réponse API
  const eq = detail.equipement ?? null;
  const situation = {
    id:           iv.id,
    code:         iv.code,
    title:        iv.title ?? detail.description,
    status:       iv.status_actual,
    type:         iv.type_inter,
    priority:     iv.priority,
    reportedDate: iv.reported_date,
    techInitials: iv.tech_initials,
    next_due_date: iv.next_due_date ?? null,
    overdue:      iv.overdue ?? false,
    machine:      eq ? { id: eq.id, code: eq.code, name: eq.name, health: eq.health } : null,
    stats: iv.stats ? {
      actionCount:    iv.stats.action_count ?? 0,
      totalTime:      iv.stats.total_time ?? 0,
      purchaseCount:  iv.stats.purchase_count ?? 0,
      purchasePending: null,
      taskProgress:   null,
    } : null,
  };

  return <InterventionCard situation={situation} onRefresh={onRefresh} />;
}

DIRightPanel.propTypes = {
  requestId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
