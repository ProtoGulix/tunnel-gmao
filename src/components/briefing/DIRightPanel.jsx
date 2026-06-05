import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { CalendarClock, UserCog, Wrench } from 'lucide-react';
import { useInterventionRequestDetail } from '@/hooks/intervention-requests/useInterventionRequestDetail';
import { useInterventionCreate } from '@/hooks/interventions/useInterventionCreate';
import { InterventionCard } from './InterventionCard';
import { MachineTitle } from './components/IvHeader';
import { DiBlock, IvEmptyBlock, ChainIcon } from './components/IvHeaderBlocks';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const ORIGIN_CFG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', label: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', label: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   label: 'Technicien' },
};

const TASK_STATUS_CFG = {
  todo:        { color: 'var(--gray-7)',   label: 'À faire',  badge: 'gray' },
  in_progress: { color: 'var(--blue-9)',   label: 'En cours', badge: 'blue' },
  done:        { color: 'var(--green-9)',  label: 'Fait',     badge: 'green' },
  skipped:     { color: 'var(--orange-9)', label: 'Ignoré',   badge: 'orange' },
};

function TaskLine({ task }) {
  const cfg = TASK_STATUS_CFG[task.status] ?? TASK_STATUS_CFG.todo;
  const oc  = task.origin ? ORIGIN_CFG[task.origin] : null;
  return (
    <Flex align="center" gap="2" style={{
      padding: '5px 10px',
      borderBottom: '1px solid var(--gray-3)',
      borderLeft: `3px solid ${cfg.color}`,
    }}>
      {oc && <oc.Icon size={11} color={oc.color} style={{ flexShrink: 0 }} />}
      <Badge size="1" color={cfg.badge} variant="soft" style={{ flexShrink: 0 }}>{cfg.label}</Badge>
      <Text size="1" style={{ flex: 1, color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.label}
      </Text>
    </Flex>
  );
}
TaskLine.propTypes = { task: PropTypes.object.isRequired };

function DiOnlyPanel({ detail, onCreated }) {
  const navigate = useNavigate();
  const eq = detail.equipement ?? null;
  const machine = eq ? { id: eq.id, code: eq.code, name: eq.name, health: eq.health ?? null } : null;
  const req = {
    code:             detail.code,
    createdAt:        detail.created_at ?? null,
    description:      detail.description ?? null,
    demandeurNom:     detail.demandeur_nom ?? null,
    demandeurService: detail.service?.label ?? null,
    statutLabel:      detail.statut_label ?? detail.statut ?? null,
    statutColor:      detail.statut_color ?? null,
    isSystem:         detail.is_system ?? false,
  };
  const tasks = detail.tasks ?? detail.tasksLinked ?? [];

  const { formData, setFormData, users, fetchEquipementsFn, saving, error, handleSubmit: baseSubmit } =
    useInterventionCreate({ navigate });

  // Pré-remplir avec les données de la DI
  const [initialized, setInitialized] = useState(false);
  if (!initialized && eq) {
    setFormData((prev) => ({
      ...prev,
      title:          detail.description ?? prev.title,
      equipementId:   eq.id,
      equipementLabel: `${eq.code ? eq.code + ' — ' : ''}${eq.name}`,
      reportedBy:     detail.demandeur_nom ?? prev.reportedBy,
      requestId:      detail.id,
      ...(detail.suggested_type_inter ? { type: detail.suggested_type_inter } : {}),
    }));
    setInitialized(true);
  }

  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), [setFormData]);

  const handleSubmit = useCallback(async (e) => {
    await baseSubmit(e);
    onCreated?.();
  }, [baseSubmit, onCreated]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* En-tête DI / IV vide */}
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

      {/* Corps scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Tâches liées */}
        {tasks.length > 0 && (
          <div>
            <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              Tâches liées ({tasks.length})
            </Text>
            <div style={{ border: '1px solid var(--gray-4)', borderRadius: 6, overflow: 'hidden' }}>
              {tasks.map((t, i) => (
                <div key={t.id ?? i} style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--gray-3)' : 'none' }}>
                  <TaskLine task={t} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire création intervention */}
        <div>
          <Text size="1" weight="medium" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
            Créer une intervention
          </Text>
          <InterventionCreateForm
            formData={formData}
            set={set}
            locked={!!eq}
            lockedType={!!(detail.is_system && detail.suggested_type_inter)}
            diDetail={detail}
            fetchEquipementsFn={fetchEquipementsFn}
            users={users}
            saving={saving}
            error={error}
            onSubmit={handleSubmit}
            embedded
          />
        </div>
      </div>
    </div>
  );
}

DiOnlyPanel.propTypes = {
  detail: PropTypes.object.isRequired,
  onCreated: PropTypes.func,
};

export function DIRightPanel({ requestId, initialItem, onRefresh }) {
  const { detail, loading, error } = useInterventionRequestDetail(requestId);

  if (loading && !initialItem) return <LoadingState message="Chargement de la demande..." />;
  if (error)   return <ErrorState error={error} />;

  const effectiveDetail = detail ?? initialItem;
  if (!effectiveDetail) return null;

  // Les données de liste (initialItem) sont prioritaires pour `intervention` :
  // le listing inclut toujours l'intervention liée, le endpoint de détail peut retourner un objet vide ou null.
  const iv = initialItem?.intervention ?? detail?.intervention ?? null;

  if (!iv) return <DiOnlyPanel detail={effectiveDetail} onCreated={onRefresh} />;

  const eq = effectiveDetail.equipement ?? null;
  const situation = {
    id:           iv.id,
    code:         iv.code,
    title:        iv.title ?? effectiveDetail.description,
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
  initialItem: PropTypes.object,
  onRefresh: PropTypes.func.isRequired,
};
