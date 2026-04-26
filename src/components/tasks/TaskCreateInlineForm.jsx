import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';

const NO_INTERVENTION = '__none__';
const NO_ASSIGNEE = '__none__';

export default function TaskCreateInlineForm({ interventions, users, loading, onSubmit, onCancel }) {
  const [interventionId, setInterventionId] = useState(NO_INTERVENTION);
  const [label, setLabel] = useState('');
  const [assignedTo, setAssignedTo] = useState(NO_ASSIGNEE);

  const interventionOptions = useMemo(() => {
    return interventions.map((intervention) => ({
      value: String(intervention.id),
      label: `${intervention.code || intervention.id} - ${intervention.machine?.code || 'Machine'}`,
    }));
  }, [interventions]);

  const assigneeOptions = useMemo(() => {
    return users.map((user) => ({
      value: String(user.id),
      label: user.initials
        ? `${String(user.initials).toUpperCase()} - ${user.first_name || ''} ${user.last_name || ''}`.trim()
        : `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    }));
  }, [users]);

  const canSubmit = interventionId !== NO_INTERVENTION && label.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      interventionId,
      label: label.trim(),
      assignedTo: assignedTo !== NO_ASSIGNEE ? assignedTo : null,
    });
  };

  return (
    <Card size="2" style={{ borderLeft: '4px solid var(--blue-8)' }}>
      <Flex direction="column" gap="3">
        <Text size="2" weight="medium">Creation rapide</Text>

        <Box>
          <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Intervention</Text>
          <Select.Root value={interventionId} onValueChange={setInterventionId}>
            <Select.Trigger placeholder="Selectionner une intervention" />
            <Select.Content>
              <Select.Item value={NO_INTERVENTION}>Selectionner une intervention</Select.Item>
              {interventionOptions.map((option) => (
                <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Label</Text>
          <TextField.Root
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ex: Controle alignement capteur"
          />
        </Box>

        <Box>
          <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Assigne</Text>
          <Select.Root value={assignedTo} onValueChange={setAssignedTo}>
            <Select.Trigger placeholder="Non assigne" />
            <Select.Content>
              <Select.Item value={NO_ASSIGNEE}>Non assigne</Select.Item>
              {assigneeOptions.map((option) => (
                <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" onClick={onCancel}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
            {loading ? 'Creation...' : 'Creer'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

TaskCreateInlineForm.propTypes = {
  interventions: PropTypes.arrayOf(PropTypes.object).isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
