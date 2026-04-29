import PropTypes from 'prop-types';
import { Box, Button, Card, Dialog, Flex, Select, Spinner, Switch, Text, TextField } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import LockedBadge from '@/components/ui/LockedBadge';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';

export default function TaskCreateDialog({ open, onOpenChange, interventionId = null, interventionLabel = null, onSuccess }) {
  const { formData, set, users, interventions, optionsLoading, saving, errors, reset, loadOptions, handleSubmit } = useTaskCreate({
    interventionId,
    onSuccess: (created) => {
      onSuccess?.(created);
      onOpenChange(false);
    },
  });

  const handleOpenChange = (isOpen) => {
    if (isOpen) loadOptions();
    else reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 500, padding: 0, background: 'transparent', boxShadow: 'none' }}>
        <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
          <Flex direction="column" gap="3">

            <Flex align="center" gap="2">
              <Plus size={20} color="var(--blue-9)" />
              <Text size="3" weight="bold">Nouvelle tâche</Text>
            </Flex>

            {errors.length > 0 && (
              <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
                <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
                {errors.map((err, idx) => (
                  <Text key={idx} as="div" color="red" size="1">• {err}</Text>
                ))}
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3">

                {/* Intervention */}
                <Box>
                  <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                    Intervention <Text color="red">*</Text>
                  </Text>
                  {interventionId ? (
                    <LockedBadge label={interventionLabel || interventionId} />
                  ) : (
                    <Select.Root value={formData.interventionId} onValueChange={(v) => set('interventionId', v)} disabled={optionsLoading}>
                      <Select.Trigger placeholder="Sélectionner une intervention" style={{ width: '100%' }} />
                      <Select.Content>
                        {interventions.map((i) => (
                          <Select.Item key={i.id} value={String(i.id)}>
                            {i.code || i.id}{i.title ? ` — ${i.title}` : ''}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  )}
                </Box>

                {/* Libellé */}
                <Box>
                  <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                    Libellé <Text color="red">*</Text>
                  </Text>
                  <TextField.Root
                    value={formData.label}
                    onChange={(e) => set('label', e.target.value)}
                    placeholder="Ex : Contrôle alignement capteur"
                    autoFocus
                  />
                </Box>

                {/* Assigné */}
                <Box>
                  <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Assigné à</Text>
                  <Select.Root value={formData.assignedTo} onValueChange={(v) => set('assignedTo', v)} disabled={optionsLoading}>
                    <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="">Non assigné</Select.Item>
                      {users.map((u) => {
                        const initials = (u.initials || u.initial || '').toUpperCase();
                        const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                        return (
                          <Select.Item key={u.id} value={String(u.id)}>
                            {initials ? `${initials} — ${fullName}` : fullName}
                          </Select.Item>
                        );
                      })}
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Échéance */}
                <Box>
                  <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Échéance</Text>
                  <TextField.Root
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => set('dueDate', e.target.value)}
                  />
                </Box>

                {/* Optionnelle */}
                <Flex align="center" gap="2">
                  <Switch checked={formData.optional} onCheckedChange={(v) => set('optional', v)} size="2" />
                  <Text size="2">Tâche optionnelle</Text>
                  <Text size="1" color="gray">(ne bloque pas la clôture)</Text>
                </Flex>

                <Flex justify="end" gap="2">
                  <Dialog.Close>
                    <Button type="button" variant="soft" color="gray" size="2" disabled={saving}>Annuler</Button>
                  </Dialog.Close>
                  <Button type="submit" color="blue" size="2" disabled={saving}>
                    {saving ? <Spinner size="1" /> : <Plus size={16} />}
                    Enregistrer
                  </Button>
                </Flex>

              </Flex>
            </form>

            {optionsLoading && (
              <Flex align="center" gap="2">
                <Spinner size="1" />
                <Text size="1" color="gray">Chargement des options…</Text>
              </Flex>
            )}

          </Flex>
        </Card>
      </Dialog.Content>
    </Dialog.Root>
  );
}

TaskCreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  interventionId: PropTypes.string,
  interventionLabel: PropTypes.string,
  onSuccess: PropTypes.func,
};
