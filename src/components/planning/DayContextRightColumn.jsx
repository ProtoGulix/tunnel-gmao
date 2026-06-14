import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Calendar, ClipboardList, Lock, Wrench } from 'lucide-react';
import { createActionDirect } from '@/api/planning';
import ActionForm from '@/components/interventions/ActionForm';
import LockedBadge from '@/components/ui/LockedBadge';

export default function DayContextRightColumn({
  date,
  techId,
  selectedTasks,
  onTasksChange,
  createdIntervention,
  onSuccess,
  onCancel,
  metadata,
}) {
  const taskIv = selectedTasks?.[0]?._intervention ?? null;
  const resolvedIv = taskIv ?? createdIntervention ?? null;
  const interventionId = resolvedIv?.id?.toString() ?? null;

  const interventionMeta = resolvedIv
    ? {
        id: resolvedIv.id,
        code: resolvedIv.code ?? '',
        title: resolvedIv.title ?? '',
        status_actual: resolvedIv.status_actual ?? resolvedIv.status ?? null,
        type_inter: resolvedIv.type_inter ?? null,
        plan_id: resolvedIv.plan_id ?? null,
      }
    : null;

  const handleSubmit = useCallback((payload) => createActionDirect(payload), []);

  const isLocked = !interventionId;
  const headerIcon = createdIntervention ? Wrench : ClipboardList;
  const formKey = `${interventionId ?? 'none'}-${date}`;

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Calendar size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Saisir l&apos;action</Text>
      </Flex>

      {isLocked ? (
        <Flex align="center" justify="center" direction="column" gap="2"
          style={{ minHeight: 160, border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)', padding: '1.5rem' }}
        >
          <Lock size={20} color="var(--gray-7)" />
          <Text size="2" color="gray" align="center">
            Sélectionnez une tâche pour saisir l&apos;action
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          <LockedBadge
            icon={headerIcon}
            label={`${interventionMeta.code} — ${interventionMeta.title}`}
            sublabel={createdIntervention ? 'Nouvelle intervention' : undefined}
          />
          <Box mt="1">
            <ActionForm
              key={formKey}
              initialState={{ date: date ?? '' }}
              metadata={metadata}
              onCancel={onCancel ?? (() => {})}
              onSubmit={handleSubmit}
              onSuccess={onSuccess}
              interventionId={interventionId}
              interventionMeta={interventionMeta}
              techId={techId}
              showContext={false}
              showTasks={false}
              selectedTasks={selectedTasks}
              onTasksChange={onTasksChange}
            />
          </Box>
        </Flex>
      )}
    </Flex>
  );
}

DayContextRightColumn.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  selectedTasks: PropTypes.array,
  onTasksChange: PropTypes.func,
  createdIntervention: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  metadata: PropTypes.object.isRequired,
};
