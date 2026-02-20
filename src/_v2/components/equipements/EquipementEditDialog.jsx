/**
 * @fileoverview Dialog de modification d'un équipement
 * @module components/equipements/EquipementEditDialog
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Flex, Box, Text, TextField, Button, Select } from '@radix-ui/themes';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useEquipements } from '@/hooks/useEquipements';
import { useApiCall } from '@/hooks/useApiCall';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

const EMPTY_FORM = { name: '', parentId: null, equipmentClassId: null };

export default function EquipementEditDialog({ open, onOpenChange, equipement, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const { equipements } = useEquipements();
  const fetchClasses = useCallback(() => adapter.equipementClasses.fetchEquipementClasses(), []);
  const { data: rawClasses, execute: loadClasses } = useApiCall(fetchClasses, { autoExecute: false });
  const classes = Array.isArray(rawClasses) ? rawClasses : [];

  useEffect(() => {
    if (open) loadClasses();
  }, [open, loadClasses]);

  useEffect(() => {
    if (equipement && open) {
      setForm({
        name: equipement.name || '',
        parentId: equipement.parentId || null,
        equipmentClassId: equipement.equipmentClass?.id || null,
      });
    }
  }, [equipement, open]);

  const parentOptions = equipements.filter((eq) => eq.id !== equipement?.id);

  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.code} – ${c.label}` }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!equipement || submitting) return;
    setSubmitting(true);
    try {
      await adapter.equipements.updateEquipement(equipement.id, {
        name: form.name,
        parent_id: form.parentId || null,
        equipment_class_id: form.equipmentClassId || null,
      });
      onSaved?.();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 500 }}>
        <Dialog.Title>Modifier l'équipement</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Code</Text>
              <TextField.Root value={equipement?.code || '—'} disabled />
            </label>

            <label>
              <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
              <TextField.Root
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nom de l'équipement"
                required
              />
            </label>

            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Classe d'équipement</Text>
              <Select.Root
                value={form.equipmentClassId || '_none'}
                onValueChange={(v) => setForm({ ...form, equipmentClassId: v === '_none' ? null : v })}
              >
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="_none">Aucune classe</Select.Item>
                  {classOptions.map((opt) => (
                    <Select.Item key={opt.value} value={opt.value}>{opt.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <SearchableSelect
              items={parentOptions}
              label="Équipement mère"
              value={form.parentId}
              onChange={(item) => setForm({ ...form, parentId: item?.id || null })}
              getDisplayText={(eq) => `${eq.code || '—'} – ${eq.name}`}
              getSearchableFields={(eq) => [eq.code, eq.name].filter(Boolean)}
              placeholder="Rechercher un équipement parent..."
              allowSpecialRequest={false}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

EquipementEditDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  equipement: PropTypes.shape({
    id: PropTypes.string,
    code: PropTypes.string,
    name: PropTypes.string,
    parentId: PropTypes.string,
    equipmentClass: PropTypes.shape({ id: PropTypes.string }),
  }),
  onSaved: PropTypes.func,
};
