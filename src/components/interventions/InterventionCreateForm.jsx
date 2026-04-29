import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { MapPin, Plus, User, Wrench } from 'lucide-react';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import LockedBadge from '@/components/ui/LockedBadge';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { INTERVENTION_TYPES, TYPE_INTER_LABELS } from '@/config/interventionTypes';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale', label: 'Normal' },
  { value: 'faible', label: 'Faible' },
];

export default function InterventionCreateForm({ formData, set, locked, lockedType = false, fetchEquipementsFn, users, saving, error, onSubmit, onCancel }) {
  const userList = Array.isArray(users) ? users : [];
  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">Nouvelle intervention</Text>
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
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
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
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                Date de signalement <Text color="red">*</Text>
              </Text>
              <TextField.Root type="datetime-local" value={formData.reportedDate}
                onChange={(e) => set('reportedDate', e.target.value)} required />
            </Box>

            {/* Équipement + Type + Priorité sur la même ligne */}
            <Flex gap="3" align="end" wrap="wrap">
              <Box style={{ flex: '1 1 200px' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
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

              <Box style={{ flex: '0 0 auto' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Type</Text>
                {lockedType ? (
                  <Flex align="center" gap="2" style={{ height: 32 }}>
                    <Badge color="blue" variant="soft">
                      {TYPE_INTER_LABELS[formData.type] ?? formData.type}
                    </Badge>
                    <Text size="1" color="gray">imposé par le système</Text>
                  </Flex>
                ) : (
                  <Select.Root value={formData.type} onValueChange={(v) => set('type', v)}>
                    <Select.Trigger />
                    <Select.Content>
                      {INTERVENTION_TYPES.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
                    </Select.Content>
                  </Select.Root>
                )}
              </Box>

              <Box style={{ flex: '0 0 auto' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Priorité</Text>
                <Select.Root value={formData.priority} onValueChange={(v) => set('priority', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {PRIORITY_OPTIONS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Technicien pilote */}
            <Box>
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                Technicien pilote <Text color="red">*</Text>
              </Text>
              <Select.Root value={formData.techId} onValueChange={(v) => set('techId', v)} required>
                <Select.Trigger placeholder="Sélectionner un technicien…" style={{ width: '100%' }} />
                <Select.Content>
                  {userList.map((u) => (
                    <Select.Item key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}{u.initial ? ` (${u.initial})` : ''}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Signalé par */}
            <Box>
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                Signalé par {locked ? '' : '(optionnel)'}
              </Text>
              {locked && formData.reportedBy ? (
                <LockedBadge icon={User} label={formData.reportedBy} />
              ) : (
                <TextField.Root placeholder="Nom ou identifiant" value={formData.reportedBy}
                  onChange={(e) => set('reportedBy', e.target.value)} />
              )}
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
  lockedType: PropTypes.bool,
  fetchEquipementsFn: PropTypes.func.isRequired,
  users: PropTypes.array,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
