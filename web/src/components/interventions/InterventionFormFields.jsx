import PropTypes from 'prop-types';
import { Box, Button, Flex, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { CheckCircle2, UserCog, Wrench } from 'lucide-react';
import DescribedSelect from '@/components/ui/DescribedSelect';

// Descriptions vues et validées à l'écran par l'utilisateur le 2026-11-20
const PRIORITY_OPTIONS = [
  { value: 'urgent',    label: 'Urgent',    color: 'red',    description: 'Arrêt de production ou risque pour la sécurité : à traiter tout de suite.' },
  { value: 'important', label: 'Important', color: 'orange', description: 'Production gênée ou dégradée : à traiter en priorité.' },
  { value: 'normale',   label: 'Normal',    color: 'blue',   description: "Pas d'impact immédiat sur la production : à planifier." },
  { value: 'faible',    label: 'Faible',    color: 'gray',   description: 'Amélioration ou confort : quand le planning le permet.' },
];
const PRIORITY_FIELD_WIDTH = 240;

export function TimelineIcon({ icon: Icon, done = false, last = false }) {
  const color  = done ? 'var(--green-9)' : 'var(--gray-7)';
  const dotted = done ? '2.5px dashed var(--green-7)' : '2.5px dashed var(--gray-6)';
  return (
    <div style={{ flexShrink: 0, width: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
      <div style={{ flex: 1, borderLeft: dotted, transition: 'border-color 0.3s' }} />
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Icon size={18} strokeWidth={2} style={{ color, transition: 'color 0.3s', display: 'block' }} />
        {done && (
          <CheckCircle2
            size={10} strokeWidth={3}
            style={{
              color: 'var(--green-9)', position: 'absolute', bottom: -2, right: -4,
              background: 'var(--color-background)', borderRadius: '50%',
            }}
          />
        )}
      </div>
      {!last && <div style={{ flex: 1, borderLeft: dotted, marginTop: 5, transition: 'border-color 0.3s' }} />}
      {last  && <div style={{ flex: 1, marginTop: 5 }} />}
    </div>
  );
}
TimelineIcon.propTypes = { icon: PropTypes.elementType.isRequired, done: PropTypes.bool, last: PropTypes.bool };

export function TechDateRow({ formData, set, users }) {
  const userList = Array.isArray(users) ? users : [];
  const done = !!(formData.reportedDate && formData.techId);
  return (
    <Flex align="stretch" gap="4">
      <TimelineIcon icon={UserCog} done={done} />
      <Flex gap="3" align="end" wrap="wrap" style={{ flex: 1, padding: '10px 0' }}>
        <Box style={{ flex: '1 1 180px' }}>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
            Date de prise en charge <Text color="red">*</Text>
          </Text>
          <TextField.Root
            type="datetime-local" value={formData.reportedDate}
            onChange={(e) => set('reportedDate', e.target.value)} required
            style={{ borderColor: formData.reportedDate ? 'var(--green-7)' : undefined, transition: 'border-color 0.3s' }}
          />
        </Box>
        <Box style={{ flex: '1 1 160px' }}>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
            Technicien pilote <Text color="red">*</Text>
          </Text>
          <Select.Root value={formData.techId} onValueChange={(v) => set('techId', v)} required>
            <Select.Trigger
              placeholder="Sélectionner…" style={{ width: '100%',
                borderColor: formData.techId ? 'var(--green-7)' : undefined, transition: 'border-color 0.3s',
              }}
            />
            <Select.Content>
              {userList.map((u) => (
                <Select.Item key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}{u.initial ? ` (${u.initial})` : ''}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>
    </Flex>
  );
}
TechDateRow.propTypes = { formData: PropTypes.object.isRequired, set: PropTypes.func.isRequired, users: PropTypes.array };

export function InterventionRow({ formData, set, lockedType, TypeField, saving, embedded, onCancel, onSubmit }) {
  const done = !!(formData.type);
  return (
    <Flex align="stretch" gap="4">
      <TimelineIcon icon={Wrench} done={done} last />
      <Flex direction="column" gap="3" style={{ flex: 1, padding: '10px 0' }}>
        <Flex gap="3" align="start" wrap="wrap">
          <Box style={{ flex: '0 0 auto' }}>
            <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Type {!lockedType && <Text color="red">*</Text>}</Text>
            <TypeField locked={lockedType} value={formData.type} equipementId={formData.equipementId} onChange={(v) => set('type', v)} />
          </Box>
          <Box style={{ flex: '0 0 auto' }}>
            <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Priorité</Text>
            <DescribedSelect
              value={formData.priority} options={PRIORITY_OPTIONS}
              onChange={(v) => set('priority', v)} width={PRIORITY_FIELD_WIDTH}
            />
          </Box>
        </Flex>
        <Flex gap="3" justify="end">
          {onCancel && <Button type="button" variant="soft" color="gray" size="2" disabled={saving} onClick={onCancel}>Annuler</Button>}
          <Button
            type={embedded ? 'button' : 'submit'}
            size="2" disabled={saving}
            onClick={embedded ? onSubmit : undefined}
            style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
          >
            {saving ? <Spinner size="2" /> : 'Enregistrer'}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
InterventionRow.propTypes = {
  formData: PropTypes.object.isRequired, set: PropTypes.func.isRequired,
  lockedType: PropTypes.bool, TypeField: PropTypes.elementType.isRequired,
  saving: PropTypes.bool, embedded: PropTypes.bool,
  onCancel: PropTypes.func, onSubmit: PropTypes.func,
};
