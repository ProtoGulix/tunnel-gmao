import PropTypes from 'prop-types';
import { Flex, Text } from '@radix-ui/themes';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import { InterventionCard } from './InterventionCard';
import { MachineTitle } from './components/IvHeader';
import { DiBlock, IvEmptyBlock, ChainIcon } from './components/IvHeaderBlocks';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

function DiOnlyPanel({ detail }) {
  const eq = detail.equipement ?? null;
  const machine = eq ? { id: eq.id, code: eq.code, name: eq.name, health: eq.health ?? null } : null;
  const req = {
    code:           detail.code,
    createdAt:      detail.created_at ?? null,
    description:    detail.description ?? null,
    demandeurNom:   detail.demandeur_nom ?? null,
    demandeurService: detail.service?.label ?? null,
    statutLabel:    detail.statut_label ?? detail.statut ?? null,
    statutColor:    detail.statut_color ?? null,
    isSystem:       detail.is_system ?? false,
  };

  return (
    <div style={{ flexShrink: 0, borderBottom: '1px solid var(--gray-4)' }}>
      <MachineTitle machine={machine} />
      <div style={{ position: 'relative', padding: '10px 14px', borderBottom: '1px solid var(--gray-4)' }}>
        <ChainIcon linked={false} />
        <Flex gap="2" style={{ marginBottom: 6 }}>
          <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Demande</Text>
          <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'center', color: 'var(--gray-11)' }}>Intervention</Text>
        </Flex>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <DiBlock req={req} />
          <IvEmptyBlock />
        </div>
      </div>
    </div>
  );
}

DiOnlyPanel.propTypes = { detail: PropTypes.object.isRequired };

export function DIRightPanel({ requestId, onRefresh }) {
  const { detail, loading, error } = useInterventionRequestDetail(requestId);

  if (loading) return <LoadingState message="Chargement de la demande..." />;
  if (error)   return <ErrorState error={error} />;
  if (!detail) return null;

  const iv = detail.intervention ?? null;

  if (!iv) return <DiOnlyPanel detail={detail} />;

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
