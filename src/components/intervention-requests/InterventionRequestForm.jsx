import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Heading, Select, Spinner, Text, TextArea, TextField } from '@radix-ui/themes';
import { ClipboardList, MapPin } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import LockedBadge from '@/components/ui/LockedBadge';
import { fetchEquipements } from '@/api/equipements';
import { fetchServices } from '@/api/services';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const INITIAL_FORM = {
  machineId: '',
  machineName: '',
  demandeurNom: '',
  serviceId: '',
  description: '',
};

function validate(form) {
  if (!form.machineId) return 'Veuillez sélectionner un équipement';
  if (!form.demandeurNom.trim()) return 'Le nom du demandeur est obligatoire';
  if (!form.description.trim()) return 'La description est obligatoire';
  return null;
}

export default function InterventionRequestForm({ onSubmit, onCancel, saving = false, machineId = null, machineName = null }) {
  const [form, setForm] = useState(() => ({
    ...INITIAL_FORM,
    ...(machineId ? { machineId, machineName: machineName ?? '' } : {}),
  }));
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    fetchServices().then(setServices).catch(() => {});
  }, []);

  const set = useCallback((field, value) => setForm((prev) => ({ ...prev, [field]: value })), []);

  const handleMachineSelect = (eq) => {
    set('machineId', eq.id);
    set('machineName', [eq.code, eq.name].filter(Boolean).join(' — '));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const validationError = validate(form);
    if (validationError) { setError(validationError); return; }
    try {
      await onSubmit({
        machineId: form.machineId,
        demandeurNom: form.demandeurNom.trim(),
        serviceId: form.serviceId || null,
        description: form.description.trim(),
      });
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création de la demande'));
    }
  };

  return (
    <Card
      mt="4"
      mb="3"
      style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}
    >
      <Flex direction="column" gap="3">
        {/* En-tête */}
        <Flex align="center" gap="3">
          <ClipboardList size={20} color="var(--blue-9)" />
          <Heading size="4" weight="bold">Nouvelle demande d&apos;intervention</Heading>
        </Flex>

        {/* Erreur */}
        {error && (
          <Box style={{ backgroundColor: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 4, padding: '0.75rem' }}>
            <Text size="2" color="red" weight="medium">{error}</Text>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">

            {/* Équipement */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Équipement <Text color="red">*</Text>
              </Text>
              {form.machineId ? (
                machineId ? (
                  <LockedBadge icon={MapPin} label={form.machineName} color="blue" />
                ) : (
                  <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--green-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--green-6)' }}>
                    <MapPin size={14} color="var(--green-9)" />
                    <Text size="2" weight="medium" style={{ flex: 1 }}>{form.machineName}</Text>
                    <Button size="1" variant="ghost" color="gray" type="button" onClick={() => { set('machineId', ''); set('machineName', ''); }}>×</Button>
                  </Flex>
                )
              ) : (
                <AsyncSearchSelect
                  fetchFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
                  onSelect={handleMachineSelect}
                  renderItem={(eq) => (
                    <Flex align="center" gap="2">
                      {eq.code && <Badge color="blue" variant="soft" size="1">{eq.code}</Badge>}
                      <Text size="2" weight="bold">{eq.name}</Text>
                    </Flex>
                  )}
                  placeholder="Rechercher par code ou nom…"
                  minChars={1}
                />
              )}
            </Box>

            {/* Demandeur */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Demandeur <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Nom du demandeur"
                value={form.demandeurNom}
                onChange={(e) => set('demandeurNom', e.target.value)}
                required
              />
            </Box>

            {/* Service */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Service <Text color="gray" size="1">(optionnel)</Text>
              </Text>
              <Select.Root value={form.serviceId} onValueChange={(v) => set('serviceId', v)}>
                <Select.Trigger placeholder="Sélectionner un service…" style={{ width: '100%' }} />
                <Select.Content>
                  {services.map((s) => (
                    <Select.Item key={s.id} value={s.id}>{s.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Description */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Description <Text color="red">*</Text>
              </Text>
              <TextArea
                placeholder="Décrire l'intervention souhaitée…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
              />
            </Box>

            {/* Boutons */}
            <Flex gap="3" justify="end" mt="2">
              <Button type="button" variant="soft" color="gray" size="2" disabled={saving} onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" size="2" disabled={saving} style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}>
                {saving ? <Spinner size="2" /> : 'Créer la demande'}
              </Button>
            </Flex>

          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

InterventionRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  machineId: PropTypes.string,
  machineName: PropTypes.string,
};
