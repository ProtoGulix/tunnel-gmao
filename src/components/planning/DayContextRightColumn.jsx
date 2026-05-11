import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import { Calendar, ClipboardList, Lock, Wrench } from 'lucide-react';
import { createActionDirect } from '@/api/planning';
import { fetchInterventionTasks } from '@/api/interventionTasks';
import ActionForm from '@/components/interventions/ActionForm';
import { InterventionCreatorFlow } from '@/components/planning/InterventionSelector';
import LockedBadge from '@/components/ui/LockedBadge';

export default function DayContextRightColumn({
  date,
  techId,
  equipementId,
  equipementLabel,
  selectedIntervention,
  selectedRequest,
  onSuccess,
  metadata,
}) {
  const [createdIntervention, setCreatedIntervention] = useState(null);
  const [gammeValidations, setGammeValidations] = useState([]);

  const prevSelectionKey = `${selectedIntervention?.id ?? ''}-${selectedRequest?.id ?? ''}`;
  const [lastKey, setLastKey] = useState(prevSelectionKey);
  if (prevSelectionKey !== lastKey) {
    setCreatedIntervention(null);
    setGammeValidations([]);
    setLastKey(prevSelectionKey);
  }

  useEffect(() => {
    if (!selectedIntervention?.plan_id) {
      setGammeValidations([]);
      return;
    }
    fetchInterventionTasks(String(selectedIntervention.id))
      .then((data) => setGammeValidations(Array.isArray(data) ? data.filter((t) => t.origin === 'plan') : []))
      .catch(() => setGammeValidations([]));
  }, [selectedIntervention?.id, selectedIntervention?.plan_id]);

  const isLocked = !equipementId || (!selectedIntervention && !selectedRequest);
  const resolvedInterventionId =
    selectedIntervention?.id?.toString() ?? createdIntervention?.id?.toString() ?? null;

  const handleInterventionCreated = useCallback((created) => {
    setCreatedIntervention(created);
  }, []);

  const renderHeader = () => {
    if (selectedIntervention) {
      return (
        <LockedBadge
          icon={Wrench}
          label={`${selectedIntervention.code} — ${selectedIntervention.title ?? ''}`}
        />
      );
    }
    if (selectedRequest) {
      if (createdIntervention) {
        return (
          <LockedBadge
            icon={Wrench}
            label={`${createdIntervention.code} — ${createdIntervention.title ?? ''}`}
            sublabel={`Créée depuis DI ${selectedRequest.code}`}
          />
        );
      }
      return (
        <LockedBadge
          icon={ClipboardList}
          label={`DI ${selectedRequest.code}`}
          sublabel="Créez l'intervention ci-dessous pour saisir l'action"
        />
      );
    }
    return null;
  };

  const lockMessage = !equipementId
    ? 'Sélectionne un équipement'
    : 'Sélectionne une intervention ou une demande';

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Calendar size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Saisir l&apos;action</Text>
      </Flex>

      {isLocked ? (
        <Flex
          align="center" justify="center" direction="column" gap="2"
          style={{
            minHeight: 160,
            border: '1px dashed var(--gray-5)',
            borderRadius: 'var(--radius-2)',
            background: 'var(--gray-1)',
            padding: '1.5rem',
          }}
        >
          <Lock size={20} color="var(--gray-7)" />
          <Text size="2" color="gray" align="center">{lockMessage}</Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          {renderHeader()}

          {selectedRequest && !createdIntervention && (
            <Box mt="1">
              <InterventionCreatorFlow
                equipementId={selectedRequest.machine_id ?? equipementId ?? ''}
                equipementLabel={selectedRequest.machine_name ?? equipementLabel ?? ''}
                initialRequest={selectedRequest}
                onCreated={handleInterventionCreated}
                onCancel={null}
              />
            </Box>
          )}

          {resolvedInterventionId && (
            <Box mt="1">
              <ActionForm
                key={`${resolvedInterventionId}-${date}`}
                initialState={{ date: date ?? '' }}
                metadata={metadata}
                onCancel={() => {}}
                onSubmit={createActionDirect}
                onSuccess={onSuccess}
                interventionId={resolvedInterventionId}
                interventionMeta={selectedIntervention ?? createdIntervention}
                techId={techId}
                showContext={false}
                gammeValidations={gammeValidations}
              />
            </Box>
          )}
        </Flex>
      )}
    </Flex>
  );
}

DayContextRightColumn.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  selectedIntervention: PropTypes.object,
  selectedRequest: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  metadata: PropTypes.object.isRequired,
};
