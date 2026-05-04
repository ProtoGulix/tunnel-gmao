import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Select, Spinner, Switch, Text, TextField } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import LockedBadge from '@/components/ui/LockedBadge';

function TaskCreateForm({
  formData,
  set,
  users,
  interventions = [],
  optionsLoading = false,
  saving = false,
  errors = [],
  onSubmit,
  onCancel,
  interventionId = null,
  interventionLabel = null,
  embedded = false,
  size = '2',
}) {
  const handleSubmit = (event) => {
    event?.preventDefault?.();
    onSubmit(event);
  };

  const preventParentSubmit = (event) => {
    if (embedded && event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  };

  const content = (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <Plus size={size === '1' ? 16 : 20} color="var(--blue-9)" />
        <Text size={size === '1' ? '2' : '3'} weight="bold">Nouvelle tâche</Text>
      </Flex>

      {errors.length > 0 && (
        <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
          {errors.map((err, idx) => (
            <Text key={idx} as="div" color="red" size="1">• {err}</Text>
          ))}
        </Box>
      )}

      <Flex direction="column" gap="3">
        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
            Intervention <Text color="red">*</Text>
          </Text>
          {interventionId ? (
            <LockedBadge label={interventionLabel || interventionId} />
          ) : (
            <Select.Root value={formData.interventionId} onValueChange={(value) => set('interventionId', value)} disabled={optionsLoading}>
              <Select.Trigger placeholder="Sélectionner une intervention" style={{ width: '100%' }} />
              <Select.Content>
                {interventions.map((intervention) => (
                  <Select.Item key={intervention.id} value={String(intervention.id)}>
                    {intervention.code || intervention.id}{intervention.title ? ` — ${intervention.title}` : ''}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )}
        </Box>

        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
            Libellé <Text color="red">*</Text>
          </Text>
          <TextField.Root
            value={formData.label}
            onChange={(event) => set('label', event.target.value)}
            placeholder="Ex : Contrôle alignement capteur"
            autoFocus
          />
        </Box>

        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Assigné à</Text>
          <Select.Root value={formData.assignedTo || '__none__'} onValueChange={(value) => set('assignedTo', value === '__none__' ? '' : value)} disabled={optionsLoading}>
            <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
            <Select.Content>
              <Select.Item value="__none__">Non assigné</Select.Item>
              {users.map((user) => {
                const initials = (user.initials || user.initial || '').toUpperCase();
                const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                return (
                  <Select.Item key={user.id} value={String(user.id)}>
                    {initials ? `${initials} — ${fullName}` : fullName}
                  </Select.Item>
                );
              })}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Échéance</Text>
          <TextField.Root
            type="date"
            value={formData.dueDate}
            onChange={(event) => set('dueDate', event.target.value)}
          />
        </Box>

        <Flex align="center" gap="2">
          <Switch checked={formData.optional} onCheckedChange={(value) => set('optional', value)} size="2" />
          <Text size="2">Tâche optionnelle</Text>
          <Text size="1" color="gray">(ne bloque pas la clôture)</Text>
        </Flex>

        <Flex justify="end" gap="2">
          <Button type="button" variant="soft" color="gray" size={size} disabled={saving} onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type={embedded ? 'button' : 'submit'}
            color="blue"
            size={size}
            disabled={saving}
            onClick={embedded ? handleSubmit : undefined}
          >
            {saving ? <Spinner size="1" /> : <Plus size={size === '1' ? 12 : 14} />}
            Enregistrer
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );

  return (
    <Card onKeyDownCapture={preventParentSubmit} style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      {embedded ? content : <form onSubmit={handleSubmit}>{content}</form>}
    </Card>
  );
}

TaskCreateForm.propTypes = {
  formData: PropTypes.shape({
    interventionId: PropTypes.string,
    label: PropTypes.string.isRequired,
    assignedTo: PropTypes.string,
    dueDate: PropTypes.string,
    optional: PropTypes.bool.isRequired,
  }).isRequired,
  set: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  interventions: PropTypes.arrayOf(PropTypes.object),
  optionsLoading: PropTypes.bool,
  saving: PropTypes.bool,
  errors: PropTypes.arrayOf(PropTypes.string),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  interventionId: PropTypes.string,
  interventionLabel: PropTypes.string,
  embedded: PropTypes.bool,
  size: PropTypes.oneOf(['1', '2', '3']),
};

export default TaskCreateForm;