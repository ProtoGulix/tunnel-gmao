/**
 * @fileoverview Formulaire inline pour ajouter/modifier une ref fabricant
 * @module components/stock/MfrRefFormRow
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { addManufacturerRef, updateManufacturerRef } from '@/api/parts';
import StatusCallout from '@/components/ui/StatusCallout';

function initialFormState(initial) {
  if (!initial) return { manufacturer_name: '', manufacturer_ref: '', label: '', is_preferred: false };
  return {
    manufacturer_name: initial.manufacturer_name || '',
    manufacturer_ref: initial.manufacturer_ref || '',
    label: initial.label || '',
    is_preferred: initial.is_preferred || false,
  };
}

function validateForm(form) {
  if (!form.manufacturer_name.trim() || !form.manufacturer_ref.trim()) {
    return 'Nom fabricant et référence sont obligatoires.';
  }
  return null;
}

async function submitForm({ form, isEdit, partId, initialId }) {
  if (isEdit) return updateManufacturerRef(initialId, form);
  return addManufacturerRef(partId, form);
}

export default function MfrRefFormRow({ partId, initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => initialFormState(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) { setError(validationError); return; }
    setSaving(true);
    setError(null);
    try {
      await submitForm({ form, isEdit, partId, initialId: initial?.id });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box style={{ background: 'var(--violet-2)', border: '1px solid var(--violet-6)', borderRadius: 'var(--radius-3)', padding: 12 }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">{isEdit ? 'Modifier la référence fabricant' : 'Ajouter une référence fabricant'}</Text>
          {error && <StatusCallout type="error">{error}</StatusCallout>}
          <Flex gap="2" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 140 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fabricant *</Text>
              <TextField.Root value={form.manufacturer_name} onChange={set('manufacturer_name')} placeholder="ex: SKF" />
            </Box>
            <Box style={{ flex: 1, minWidth: 140 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence fabricant *</Text>
              <TextField.Root value={form.manufacturer_ref} onChange={set('manufacturer_ref')} placeholder="ex: 6205-2RS" />
            </Box>
          </Flex>
          <Box>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Désignation</Text>
            <TextField.Root value={form.label} onChange={set('label')} placeholder="ex: Roulement à billes..." />
          </Box>
          <Flex justify="end" gap="2" pt="1">
            <Button type="button" size="1" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" size="1" color="violet" loading={saving}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

MfrRefFormRow.propTypes = {
  partId: PropTypes.string.isRequired,
  initial: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
