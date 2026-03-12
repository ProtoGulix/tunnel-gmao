import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Heading, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { ClipboardList, Plus } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale', label: 'Normal' },
  { value: 'faible', label: 'Faible' },
];

function EquipementField({ equipementId, equipementLabel, locked, fetchFn, onSet }) {
  if (equipementId) {
    const parts = equipementLabel?.split(' — ') ?? [];
    return (
      <SelectionSummary
        variant="stock"
        badgeText={parts.length > 1 ? parts[0] : ''}
        mainText={parts.length > 1 ? parts.slice(1).join(' — ') : equipementLabel}
        onClear={locked ? undefined : () => { onSet('equipementId', null); onSet('equipementLabel', ''); }}
      />
    );
  }
  return (
    <AsyncSearchSelect
      fetchFn={fetchFn}
      onSelect={(eq) => { onSet('equipementId', eq.id); onSet('equipementLabel', `${eq.code ? eq.code + ' — ' : ''}${eq.name}`); }}
      renderItem={(eq) => <Flex align="center" gap="2"><Badge color="blue" variant="soft" size="1">{eq.code}</Badge><Text size="2" weight="bold">{eq.name}</Text></Flex>}
      placeholder="Rechercher par code, nom ou affectation..."
      minChars={1}
    />
  );
}

EquipementField.propTypes = {
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  locked: PropTypes.bool.isRequired,
  fetchFn: PropTypes.func.isRequired,
  onSet: PropTypes.func.isRequired,
};

export default function InterventionCreateForm({ formData, set, locked, fetchEquipementsFn, saving, error, onSubmit, onCancel }) {
  return (
    <Box style={{ flex: '0 0 580px', position: 'relative' }}>
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
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Titre <Text color="red">*</Text>
                </Text>
                <TextField.Root placeholder="Titre de l'intervention" value={formData.title}
                  onChange={(e) => set('title', e.target.value)} disabled={locked} required />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Date de signalement <Text color="red">*</Text>
                </Text>
                <TextField.Root type="datetime-local" value={formData.reportedDate}
                  onChange={(e) => set('reportedDate', e.target.value)} required />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Équipement <Text color="red">*</Text>
                </Text>
                <EquipementField
                  equipementId={formData.equipementId}
                  equipementLabel={formData.equipementLabel}
                  locked={locked}
                  fetchFn={fetchEquipementsFn}
                  onSet={set}
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Initiales technicien <Text color="red">*</Text>
                </Text>
                <TextField.Root placeholder="Ex. : QC" value={formData.techInitials}
                  onChange={(e) => set('techInitials', e.target.value.toUpperCase())} maxLength={5} required />
                <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>Intégrées dans le code d&apos;intervention</Text>
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Signalé par {locked ? '' : '(optionnel)'}
                </Text>
                <TextField.Root placeholder="Nom ou identifiant" value={formData.reportedBy}
                  onChange={(e) => set('reportedBy', e.target.value)} disabled={locked} />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Type</Text>
                <Select.Root value={formData.type} onValueChange={(v) => set('type', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {INTERVENTION_TYPES.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </Box>

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

      {!locked && (
        <Flex direction="column" align="center" justify="center" gap="4"
          style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: 'var(--radius-3)', backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', padding: '2rem', textAlign: 'center' }}>
          <ClipboardList size={48} style={{ opacity: 0.4, color: 'var(--blue-9)' }} />
          <Heading size="5">Étape 1 — Demande d&apos;intervention</Heading>
          <Text size="2" color="gray" style={{ maxWidth: 360 }}>Sélectionnez une demande existante dans la liste ou créez-en une nouvelle avant de renseigner le formulaire.</Text>
        </Flex>
      )}
    </Box>
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
