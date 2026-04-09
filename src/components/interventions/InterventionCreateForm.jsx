import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Heading, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { MapPin, Plus, User, Wrench } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import LockedBadge from '@/components/ui/LockedBadge';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale', label: 'Normal' },
  { value: 'faible', label: 'Faible' },
];

export default function InterventionCreateForm({ formData, set, locked, fetchEquipementsFn, saving, error, onSubmit, onCancel }) {
  return (
    <Card style={{ padding: '1.5rem', backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="3">
          <Plus size={20} color="var(--blue-9)" />
          <Heading size="4" weight="bold">Nouvelle intervention</Heading>
        </Flex>

        {error && (
          <Box style={{ backgroundColor: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 4, padding: '0.75rem' }}>
            <Text size="2" color="red" weight="medium">{error}</Text>
          </Box>
        )}

        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3">

            {/* Titre */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Titre <Text color="red">*</Text>
              </Text>
              {locked ? (
                <LockedBadge icon={Wrench} label={formData.title} />
              ) : (
                <TextField.Root placeholder="Titre de l'intervention" value={formData.title}
                  onChange={(e) => set('title', e.target.value)} required />
              )}
            </Box>

            {/* Date de signalement */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Date de signalement <Text color="red">*</Text>
              </Text>
              <TextField.Root type="datetime-local" value={formData.reportedDate}
                onChange={(e) => set('reportedDate', e.target.value)} required />
            </Box>

            {/* Équipement */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Équipement <Text color="red">*</Text>
              </Text>
              {formData.equipementId ? (
                locked ? (
                  <LockedBadge icon={MapPin} label={formData.equipementLabel} />
                ) : (
                  <SelectionSummary
                    badgeText={formData.equipementLabel?.split(' — ')[0] ?? ''}
                    mainText={formData.equipementLabel?.split(' — ').slice(1).join(' — ') || formData.equipementLabel}
                    onClear={() => { set('equipementId', null); set('equipementLabel', ''); }}
                  />
                )
              ) : (
                <AsyncSearchSelect
                  fetchFn={fetchEquipementsFn}
                  onSelect={(eq) => { set('equipementId', eq.id); set('equipementLabel', `${eq.code ? eq.code + ' — ' : ''}${eq.name}`); }}
                  renderItem={(eq) => (
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold">{eq.code}</Text>
                      <Text size="2">{eq.name}</Text>
                    </Flex>
                  )}
                  placeholder="Rechercher par code, nom ou affectation..."
                  minChars={1}
                />
              )}
            </Box>

            {/* Initiales technicien */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Initiales technicien <Text color="red">*</Text>
              </Text>
              <TextField.Root placeholder="Ex. : QC" value={formData.techInitials}
                onChange={(e) => set('techInitials', e.target.value.toUpperCase())} maxLength={5} required />
              <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>Intégrées dans le code d&apos;intervention</Text>
            </Box>

            {/* Signalé par */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                Signalé par {locked ? '' : '(optionnel)'}
              </Text>
              {locked && formData.reportedBy ? (
                <LockedBadge icon={User} label={formData.reportedBy} />
              ) : (
                <TextField.Root placeholder="Nom ou identifiant" value={formData.reportedBy}
                  onChange={(e) => set('reportedBy', e.target.value)} />
              )}
            </Box>

            {/* Type */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Type</Text>
              <Select.Root value={formData.type} onValueChange={(v) => set('type', v)}>
                <Select.Trigger />
                <Select.Content>
                  {INTERVENTION_TYPES.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Priorité */}
            <Box>
              <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Priorité</Text>
              <Select.Root value={formData.priority} onValueChange={(v) => set('priority', v)}>
                <Select.Trigger />
                <Select.Content>
                  {PRIORITY_OPTIONS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>

            <Flex gap="3" justify="end" mt="2">
              <Button type="button" variant="soft" color="gray" size="2" disabled={saving} onClick={onCancel}>
                Annuler
              </Button>
              <Button type="submit" size="2" disabled={saving} style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}>
                {saving ? <Spinner size="2" /> : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

InterventionCreateForm.propTypes = {
  formData: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  locked: PropTypes.bool.isRequired,
  fetchEquipementsFn: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
