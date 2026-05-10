import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { Calendar, ClipboardList, MapPin, Wrench } from 'lucide-react';
import InterventionSelector from '@/components/planning/InterventionSelector';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import EquipementSearch from '@/components/planning/EquipementSearch';

function EquipementRequired() {
  return (
    <Flex
      direction="column" align="center" justify="center" gap="2"
      style={{
        minHeight: 120,
        border: '1px dashed var(--gray-5)',
        borderRadius: 'var(--radius-2)',
        background: 'var(--gray-1)',
        padding: '1.5rem',
      }}
    >
      <MapPin size={18} color="var(--gray-7)" />
      <Text size="2" color="gray" align="center">
        Sélectionne un équipement pour afficher les interventions et demandes
      </Text>
    </Flex>
  );
}

export default function DayContextLeftColumn({
  formattedDate,
  pickedEquipement,
  onEquipementChange,
  preselectedEquipement,
  equipementId,
  equipementLabel,
  selectedIntervention,
  onSelectIntervention,
  selectedRequest,
  onSelectRequest,
}) {
  const handleToggleIntervention = useCallback((item) => {
    onSelectIntervention(item);
    if (item) onSelectRequest(null);
  }, [onSelectIntervention, onSelectRequest]);

  const handleToggleRequest = useCallback((item) => {
    onSelectRequest(item);
    if (item) onSelectIntervention(null);
  }, [onSelectRequest, onSelectIntervention]);

  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <Calendar size={16} color="var(--blue-9)" />
        <Text size="3" weight="bold" style={{ textTransform: 'capitalize' }}>
          {formattedDate}
        </Text>
      </Flex>

      <EquipementSearch
        key={preselectedEquipement?.id ?? 'empty'}
        value={pickedEquipement}
        onChange={onEquipementChange}
        placeholder="Équipement concerné…"
      />

      {equipementId ? (
        <Tabs.Root defaultValue="interventions">
          <Tabs.List>
            <Tabs.Trigger value="interventions">
              <Flex align="center" gap="1">
                <Wrench size={12} />
                Interventions ouvertes
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="requests">
              <Flex align="center" gap="1">
                <ClipboardList size={12} />
                Demandes en attente
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="2">
            <Tabs.Content value="interventions">
              <InterventionSelector
                equipementId={equipementId}
                equipementLabel={equipementLabel}
                value={selectedIntervention}
                onChange={handleToggleIntervention}
                onCreateClick={null}
              />
            </Tabs.Content>
            <Tabs.Content value="requests">
              <InterventionRequestSelector
                selectedId={selectedRequest?.id ?? null}
                onSelect={handleToggleRequest}
                machineId={equipementId}
                machineName={equipementLabel}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      ) : (
        <EquipementRequired />
      )}
    </Flex>
  );
}

DayContextLeftColumn.propTypes = {
  formattedDate: PropTypes.string,
  pickedEquipement: PropTypes.object,
  onEquipementChange: PropTypes.func.isRequired,
  preselectedEquipement: PropTypes.object,
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  selectedIntervention: PropTypes.object,
  onSelectIntervention: PropTypes.func.isRequired,
  selectedRequest: PropTypes.object,
  onSelectRequest: PropTypes.func.isRequired,
};
