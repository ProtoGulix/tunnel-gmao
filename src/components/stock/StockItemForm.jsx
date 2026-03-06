/**
 * @fileoverview Formulaire création/édition d'une pièce référencée
 * @module components/stock/StockItemForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Edit2, Package, Plus } from 'lucide-react';
import { UNIT_OPTIONS } from '@/config/units';

const DEFAULTS = { ref: '', name: '', family_code: '', sub_family_code: '', spec: '', dimension: '', quantity: 0, unit: 'pcs', location: '' };

const coerceItem = (item) =>
  Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, item[k] ?? DEFAULTS[k]]));

function fromItem(item) {
  return item ? coerceItem(item) : { ...DEFAULTS };
}

function validate(form) {
  const errs = [];
  if (!form.ref.trim()) errs.push('La référence est obligatoire.');
  if (!form.name.trim() || form.name.trim().length < 2) errs.push('Le nom doit contenir au moins 2 caractères.');
  if (isNaN(Number(form.quantity)) || Number(form.quantity) < 0) errs.push('La quantité doit être un nombre positif.');
  return errs;
}

function ErrorBlock({ errors }) {
  if (!errors.length) return null;
  return (
    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
      <Text color="red" weight="bold" size="2">Erreurs</Text>
      {errors.map((err, idx) => <Text key={idx} color="red" size="1" style={{ display: 'block' }}>• {err}</Text>)}
    </Box>
  );
}

ErrorBlock.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };

export default function StockItemForm({ item, onSubmit, onCancel, saving }) {
  const isEdit = !!item;
  const [form, setForm] = useState(() => fromItem(item));
  const [errors, setErrors] = useState([]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    await onSubmit({ ...form, quantity: Number(form.quantity) });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={18} /> : <Package size={18} />}
            <Text size="4" weight="bold">{isEdit ? 'Modifier la pièce' : 'Nouvelle pièce'}</Text>
          </Flex>

          <ErrorBlock errors={errors} />

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 140 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Référence *</Text>
              <TextField.Root value={form.ref} onChange={set('ref')} placeholder="REF-123" />
            </Box>
            <Box style={{ flex: 2, minWidth: 200 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Nom *</Text>
              <TextField.Root value={form.name} onChange={set('name')} placeholder="Roulement SKF 6205" />
            </Box>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Famille</Text>
              <TextField.Root value={form.family_code} onChange={set('family_code')} placeholder="MECA" />
            </Box>
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Sous-famille</Text>
              <TextField.Root value={form.sub_family_code} onChange={set('sub_family_code')} placeholder="ROUL" />
            </Box>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 150 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Spécification</Text>
              <TextField.Root value={form.spec} onChange={set('spec')} placeholder="SKF 6205-2RS" />
            </Box>
            <Box style={{ flex: 1, minWidth: 150 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Dimension</Text>
              <TextField.Root value={form.dimension} onChange={set('dimension')} placeholder="25x52x15 mm" />
            </Box>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 100 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Quantité</Text>
              <TextField.Root type="number" min="0" value={form.quantity} onChange={set('quantity')} />
            </Box>
            <Box style={{ flex: 1, minWidth: 120 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Unité</Text>
              <Select.Root value={form.unit} onValueChange={setVal('unit')}>
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  {UNIT_OPTIONS.map((u) => <Select.Item key={u.value} value={u.value}>{u.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>
            <Box style={{ flex: 2, minWidth: 160 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Emplacement</Text>
              <TextField.Root value={form.location} onChange={set('location')} placeholder="A-23" />
            </Box>
          </Flex>

          <Flex gap="2" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" color="blue" loading={saving}>
              {isEdit ? <><Edit2 size={14} /> Enregistrer</> : <><Plus size={14} /> Créer</>}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}

StockItemForm.propTypes = {
  item: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
