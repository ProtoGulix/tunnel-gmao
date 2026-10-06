/**
 * @fileoverview Formulaire création/édition d'un fabricant.
 * Supporte le mode standalone (boutons submit/cancel) et le mode embedded
 * (noActions + registerSubmit) pour être piloté par un parent (ex: ItemForm).
 * @module components/manufacturers/ManufacturerForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { Edit2, Factory } from 'lucide-react';
import { handleAPIError } from '@/lib/api/errors';

function fromManufacturer(m) {
  if (!m) return { name: '', ref: '', designation: '' };
  return { name: m.manufacturer_name || '', ref: m.manufacturer_ref || '', designation: m.designation || '' };
}

function validate(form) {
  const errs = [];
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.push('Le nom du fabricant doit contenir au moins 2 caractères.');
  return errs;
}

function ErrorBlock({ errors }) {
  if (!errors.length) return null;
  return (
    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
      <Text color="red" weight="bold" size="2">Erreurs</Text>
      {errors.map((err, idx) => (
        <Text key={idx} color="red" size="1" style={{ display: 'block' }}>• {err}</Text>
      ))}
    </Box>
  );
}
ErrorBlock.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };

export default function ManufacturerForm({
  manufacturer,
  onSubmit,
  onCancel,
  saving,
  embedded = false,
  noActions = false,
  registerSubmit,
}) {
  const isEdit = !!manufacturer;
  const [form, setForm] = useState(() => fromManufacturer(manufacturer));
  const [errors, setErrors] = useState([]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const buildPayload = () => ({
    manufacturer_name: form.name.trim(),
    manufacturer_ref: form.ref.trim() || null,
    designation: form.designation.trim() || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (noActions) return;
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try {
      await onSubmit(buildPayload());
    } catch (err) {
      const typed = handleAPIError(err, 'ManufacturerForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  // Enregistrement du handler pour pilotage externe (appelé à chaque render — closure toujours à jour)
  if (registerSubmit) {
    registerSubmit(async () => {
      const errs = validate(form);
      if (errs.length) { setErrors(errs); return null; }
      setErrors([]);
      try {
        return await onSubmit(buildPayload());
      } catch (err) {
        const typed = handleAPIError(err, 'ManufacturerForm');
        setErrors([typed.message || 'Une erreur est survenue.']);
        return null;
      }
    });
  }

  const content = (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3">
        {!embedded && (
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={20} color="var(--blue-9)" /> : <Factory size={20} color="var(--blue-9)" />}
            <Text size="3" weight="bold">{isEdit ? 'Modifier le fabricant' : 'Nouveau fabricant'}</Text>
          </Flex>
        )}
        <ErrorBlock errors={errors} />
        <Box>
          <Text size="2" weight="bold" as="label">Nom du fabricant *</Text>
          <TextField.Root value={form.name} onChange={set('name')} placeholder="ex: SKF, NSK, Schneider..." />
        </Box>
        <Box>
          <Text size="2" weight="bold" as="label">Référence catalogue</Text>
          <TextField.Root value={form.ref} onChange={set('ref')} placeholder="ex: 6205-2RS" />
        </Box>
        <Box>
          <Text size="2" weight="bold" as="label">Désignation</Text>
          <TextField.Root value={form.designation} onChange={set('designation')} placeholder="ex: Roulement à billes rangée simple" />
        </Box>
        {!noActions && (
          <Flex justify="end" gap="2">
            <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" color="blue" size="2" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </Flex>
        )}
      </Flex>
    </form>
  );

  if (embedded) return content;
  return <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>{content}</Card>;
}

ManufacturerForm.propTypes = {
  manufacturer: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
    designation: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  saving: PropTypes.bool,
  embedded: PropTypes.bool,
  noActions: PropTypes.bool,
  registerSubmit: PropTypes.func,
};
