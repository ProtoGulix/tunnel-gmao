/**
 * @fileoverview Formulaire creation/edition d'un fabricant
 * @module components/suppliers/ManufacturerForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { Edit2, Factory } from 'lucide-react';

function fromManufacturer(m) {
  if (!m) return { name: '', ref: '' };
  return { name: m.manufacturer_name || '', ref: m.manufacturer_ref || '' };
}

function validate(form) {
  const errs = [];
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.push('Le nom du fabricant doit contenir au moins 2 caracteres.');
  return errs;
}

function ErrorBlock({ errors }) {
  if (!errors.length) return null;
  return (
    <Box
      style={{
        background: 'var(--red-3)',
        border: '1px solid var(--red-7)',
        borderRadius: '6px',
        padding: '12px',
      }}
    >
      <Text color="red" weight="bold" size="2">
        Erreurs
      </Text>
      {errors.map((err, idx) => (
        <Text key={idx} color="red" size="1" style={{ display: 'block' }}>
          • {err}
        </Text>
      ))}
    </Box>
  );
}

ErrorBlock.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };

export default function ManufacturerForm({ manufacturer, onSubmit, onCancel, saving }) {
  const isEdit = !!manufacturer;
  const [form, setForm] = useState(() => fromManufacturer(manufacturer));
  const [errors, setErrors] = useState([]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    await onSubmit({
      manufacturer_name: form.name.trim(),
      manufacturer_ref: form.ref.trim() || null,
    });
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isEdit ? (
            <Edit2 size={20} color="var(--blue-9)" />
          ) : (
            <Factory size={20} color="var(--blue-9)" />
          )}
          <Text size="3" weight="bold">
            {isEdit ? 'Modifier le fabricant' : 'Nouveau fabricant'}
          </Text>
        </Flex>

        <ErrorBlock errors={errors} />

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Box>
              <Text size="2" weight="bold" as="label">
                Nom du fabricant *
              </Text>
              <TextField.Root
                value={form.name}
                onChange={set('name')}
                placeholder="ex: SKF, NSK, Schneider..."
              />
            </Box>
            <Box>
              <Text size="2" weight="bold" as="label">
                Reference catalogue
              </Text>
              <TextField.Root
                value={form.ref}
                onChange={set('ref')}
                placeholder="ex: 6205-2RS"
              />
            </Box>
            <Flex justify="end" gap="2">
              <Button
                type="button"
                variant="soft"
                color="gray"
                size="2"
                onClick={onCancel}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

ManufacturerForm.propTypes = {
  manufacturer: PropTypes.shape({
    manufacturer_name: PropTypes.string,
    manufacturer_ref: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
