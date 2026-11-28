/**
 * @fileoverview Champs du formulaire de création de DI (hors en-tête/erreur) —
 * extrait de InterventionRequestForm pour garder ce dernier lisible.
 * @module components/intervention-requests/RequestFormFields
 */

import PropTypes from 'prop-types';
import { Box, Button, Flex, Select, Spinner, Text, TextArea, TextField } from '@radix-ui/themes';
import EquipmentPickerField from '@/components/intervention-requests/EquipmentPickerField';
import { REQUEST_PRIORITIES } from '@/lib/requestPriority';

const NONE = '__none__';

export default function RequestFormFields({
  form, set, services, machineLocked, onMachineSelect, onMachineClear,
  saving, onCancel, submitLabel,
}) {
  return (
    <Flex direction="column" gap="3">

      <EquipmentPickerField
        machineId={form.machineId}
        machineName={form.machineName}
        locked={machineLocked}
        onSelect={onMachineSelect}
        onClear={onMachineClear}
      />

      {/* Demandeur */}
      <Box>
        <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Demandeur <Text color="red">*</Text>
        </Text>
        <TextField.Root
          placeholder="Nom du demandeur"
          value={form.demandeurNom}
          onChange={(e) => set('demandeurNom', e.target.value)}
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

      {/* Urgence */}
      <Box>
        <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Urgence <Text color="gray" size="1">(optionnel)</Text>
        </Text>
        <Select.Root value={form.priorite || NONE} onValueChange={(v) => set('priorite', v === NONE ? '' : v)}>
          <Select.Trigger style={{ width: '100%' }} />
          <Select.Content>
            <Select.Item value={NONE}>Non précisée</Select.Item>
            {REQUEST_PRIORITIES.map((p) => <Select.Item key={p.code} value={p.code}>{p.label}</Select.Item>)}
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
          {saving ? <Spinner size="2" /> : submitLabel}
        </Button>
      </Flex>

    </Flex>
  );
}

RequestFormFields.propTypes = {
  form: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  services: PropTypes.array.isRequired,
  machineLocked: PropTypes.bool.isRequired,
  onMachineSelect: PropTypes.func.isRequired,
  onMachineClear: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
};
