import PropTypes from 'prop-types';
import { Badge, Box, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { MapPin, Plus, Wrench } from 'lucide-react';
import { TechDateRow, InterventionRow } from './InterventionFormFields';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { INTERVENTION_TYPES, TYPE_INTER_LABELS } from '@/config/interventionTypes';
import { DiSummaryBlock } from './DiSummaryBlock';


function LockedField({ icon: Icon, label }) {
  return (
    <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--gray-2)', borderRadius: 6, border: '1px solid var(--gray-4)' }}>
      <Icon size={13} color="var(--gray-7)" style={{ flexShrink: 0 }} />
      <Text size="2" color="gray">{label}</Text>
    </Flex>
  );
}
LockedField.propTypes = { icon: PropTypes.elementType.isRequired, label: PropTypes.string };

function TitleField({ locked, value, onChange }) {
  if (locked) return <LockedField icon={Wrench} label={value} />;
  return <TextField.Root placeholder="Titre de l'intervention" value={value} onChange={onChange} required />;
}
TitleField.propTypes = { locked: PropTypes.bool, value: PropTypes.string, onChange: PropTypes.func };

function EquipementField({ locked, equipementId, equipementLabel, fetchEquipementsFn, onSelect, onClear }) {
  if (!equipementId) {
    return (
      <AsyncSearchSelect
        fetchFn={fetchEquipementsFn}
        onSelect={onSelect}
        renderItem={(eq) => <Flex align="center" gap="2"><Text size="2" weight="bold">{eq.code}</Text><Text size="2">{eq.name}</Text></Flex>}
        placeholder="Rechercher par code, nom ou affectation..."
        minChars={1}
      />
    );
  }
  if (locked) return <LockedField icon={MapPin} label={equipementLabel} />;
  return (
    <SelectionSummary
      badgeText={equipementLabel?.split(' — ')[0] ?? ''}
      mainText={equipementLabel?.split(' — ').slice(1).join(' — ') || equipementLabel}
      onClear={onClear}
    />
  );
}
EquipementField.propTypes = {
  locked: PropTypes.bool, equipementId: PropTypes.string, equipementLabel: PropTypes.string,
  fetchEquipementsFn: PropTypes.func, onSelect: PropTypes.func, onClear: PropTypes.func,
};

function TypeField({ locked: lockedType, value, onChange }) {
  const typeCfg = INTERVENTION_TYPES.find((t) => t.id === value);
  if (lockedType) {
    return (
      <Flex align="center" gap="2" style={{ height: 32 }}>
        <Badge color={typeCfg?.color ?? 'blue'} variant="soft" size="2">{TYPE_INTER_LABELS[value] ?? value}</Badge>
        <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>préconisé</Text>
      </Flex>
    );
  }
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger />
      <Select.Content>
        {INTERVENTION_TYPES.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
      </Select.Content>
    </Select.Root>
  );
}
TypeField.propTypes = { locked: PropTypes.bool, value: PropTypes.string, onChange: PropTypes.func };

export default function InterventionCreateForm({ formData, set, locked, lockedType = false, embedded = false, diDetail = null, fetchEquipementsFn, users, saving, error, onSubmit, onCancel }) {
  const handleSubmit = (event) => { event?.preventDefault?.(); onSubmit(event); };
  const preventParentSubmit = (event) => {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') event.preventDefault();
  };

  const fields = (
    <Flex direction="column" gap={diDetail ? '0' : '3'}>
      {/* Bloc DI avec timeline ou champs standalone */}
      {diDetail ? (
        <DiSummaryBlock diDetail={diDetail} />
      ) : (
        <>
          <Box>
            <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Titre <Text color="red">*</Text></Text>
            <TitleField locked={locked} value={formData.title} onChange={(e) => set('title', e.target.value)} />
          </Box>
          <Box>
            <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Équipement <Text color="red">*</Text></Text>
            <EquipementField
              locked={locked} equipementId={formData.equipementId} equipementLabel={formData.equipementLabel}
              fetchEquipementsFn={fetchEquipementsFn}
              onSelect={(eq) => { set('equipementId', eq.id); set('equipementLabel', `${eq.code ? eq.code + ' — ' : ''}${eq.name}`); }}
              onClear={() => { set('equipementId', null); set('equipementLabel', ''); }}
            />
          </Box>
        </>
      )}

      <TechDateRow formData={formData} set={set} users={users} />
      <InterventionRow
        formData={formData} set={set} lockedType={lockedType}
        TypeField={TypeField} saving={saving} embedded={embedded}
        onCancel={onCancel} onSubmit={handleSubmit}
      />
    </Flex>
  );

  const content = (
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
      {fields}
    </Flex>
  );

  return (
    <Card
      onKeyDownCapture={embedded ? preventParentSubmit : undefined}
      style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}
    >
      {embedded ? content : <form onSubmit={handleSubmit}>{content}</form>}
    </Card>
  );
}

InterventionCreateForm.propTypes = {
  formData: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  locked: PropTypes.bool.isRequired,
  lockedType: PropTypes.bool,
  embedded: PropTypes.bool,
  diDetail: PropTypes.object,
  fetchEquipementsFn: PropTypes.func.isRequired,
  users: PropTypes.array,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};
