/**
 * @fileoverview Panel inline d'édition d'un équipement (§7.2 CONVENTIONS)
 * @module components/equipements/EquipementEditPanel
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Card, Flex, Grid, Box, Text, TextField, Button, Select } from '@radix-ui/themes';
import { Edit2 } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useEquipements } from '@/hooks/useEquipements';
import { useApiCall } from '@/hooks/useApiCall';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

export default function EquipementEditPanel({ equipement, onSaved, onCancel }) {
  const [form, setForm] = useState({ name: '', parentId: null, equipmentClassId: null });
  const [submitting, setSubmitting] = useState(false);

  const { equipements } = useEquipements();
  const fetchClasses = useCallback(() => adapter.equipementClasses.fetchEquipementClasses(), []);
  const { data: rawClasses, execute: loadClasses } = useApiCall(fetchClasses, { autoExecute: false });
  const classes = Array.isArray(rawClasses) ? rawClasses : [];

  useEffect(() => { loadClasses(); }, [loadClasses]);

  useEffect(() => {
    if (equipement) {
      setForm({
        name: equipement.name || '',
        parentId: equipement.parentId || null,
        equipmentClassId: equipement.equipmentClass?.id || null,
      });
    }
  }, [equipement]);

  const parentOptions = equipements.filter((eq) => eq.id !== equipement?.id);
  const classOptions = classes.map((c) => ({ value: c.id, label: `${c.code} – ${c.label}` }));

  const handleSave = async () => {
    if (!equipement || submitting || !form.name.trim()) return;
    setSubmitting(true);
    try {
      await adapter.equipements.updateEquipement(equipement.id, {
        name: form.name,
        parent_id: form.parentId || null,
        equipment_class_id: form.equipmentClassId || null,
      });
      onSaved?.();
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      mb="4"
      style={{
        backgroundColor: 'var(--blue-2)',
        border: '1px solid var(--blue-6)',
      }}
    >
      <Box p="3">
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Edit2 size={20} color="var(--blue-9)" />
            <Text weight="bold" size="3">Modifier l&apos;équipement</Text>
          </Flex>
          <Text size="1" color="gray">
            Mettez a jour le nom, la classe ou l&apos;equipement parent.
          </Text>

          <Grid columns={{ initial: '1', sm: '2' }} gap="3" align="start">
            <Flex direction="column" gap="2">
              <Box>
                <Text size="2" as="label" weight="bold">Code</Text>
                <TextField.Root
                  value={equipement?.code || '—'}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
              </Box>

              <Box>
                <Text size="2" as="label" weight="bold">Nom *</Text>
                <TextField.Root
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom de l'equipement"
                  style={{ borderColor: 'var(--gray-7)' }}
                />
              </Box>

              <Box>
                <Text size="2" as="label" weight="bold">Classe d&apos;equipement</Text>
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
            </Flex>

            <Box>
              <SearchableSelect
                items={parentOptions}
                label="Equipement mere"
                value={form.parentId}
                onChange={(item) => setForm({ ...form, parentId: item?.id || null })}
                getDisplayText={(eq) => `${eq.code || '—'} – ${eq.name}`}
                getSearchableFields={(eq) => [eq.code, eq.name].filter(Boolean)}
                placeholder="Rechercher un equipement parent..."
                allowSpecialRequest={false}
                showEmptyState={false}
              />
            </Box>
          </Grid>

          <Flex gap="2" justify="end">
            <Button size="2" variant="soft" color="gray" onClick={onCancel}>
              Annuler
            </Button>
            <Button size="2" color="blue" onClick={handleSave} disabled={submitting || !form.name.trim()}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}

EquipementEditPanel.propTypes = {
  equipement: PropTypes.shape({
    id: PropTypes.string,
    code: PropTypes.string,
    name: PropTypes.string,
    parentId: PropTypes.string,
    equipmentClass: PropTypes.shape({ id: PropTypes.string }),
  }),
  onSaved: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
};
