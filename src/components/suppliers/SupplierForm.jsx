/**
 * @fileoverview Formulaire creation/edition fournisseur
 * @module components/suppliers/SupplierForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Checkbox, Flex, Text, TextField } from '@radix-ui/themes';
import { Plus, Edit2 } from 'lucide-react';

const empty = { name: '', code: '', contact_name: '', email: '', phone: '', address: '', notes: '', is_active: true };

function fromSupplier(supplier) {
  if (!supplier) return { ...empty };
  return {
    name: supplier.name || '',
    code: supplier.code || '',
    contact_name: supplier.contact_name || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    notes: supplier.notes || '',
    is_active: supplier.is_active ?? true,
  };
}

function validate(form) {
  const errs = [];
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.push('Le nom doit contenir au moins 2 caracteres.');
  return errs;
}

function ErrorBlock({ errors }) {
  if (!errors.length) return null;
  return (
    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
      <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
      {errors.map((err, idx) => (
        <Text key={idx} color="red" size="1" style={{ display: 'block' }}>• {err}</Text>
      ))}
    </Box>
  );
}

ErrorBlock.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };

export default function SupplierForm({ supplier, onSubmit, onCancel, saving }) {
  const isEdit = !!supplier;
  const [form, setForm] = useState(() => fromSupplier(supplier));
  const [errors, setErrors] = useState([]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const setCode = (e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
  const setActive = (checked) => setForm((prev) => ({ ...prev, is_active: !!checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    await onSubmit(form);
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isEdit ? <Edit2 size={20} color="var(--blue-9)" /> : <Plus size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">{isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</Text>
        </Flex>

        <ErrorBlock errors={errors} />

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '2', minWidth: '180px' }}>
                <Text size="2" weight="bold" as="label">Nom *</Text>
                <TextField.Root value={form.name} onChange={set('name')} placeholder="PONS & SABOT" />
              </Box>
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Text size="2" weight="bold" as="label">Code</Text>
                <TextField.Root value={form.code} onChange={setCode} placeholder="PS" />
              </Box>
            </Flex>

            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '1', minWidth: '180px' }}>
                <Text size="2" weight="bold" as="label">Contact</Text>
                <TextField.Root value={form.contact_name} onChange={set('contact_name')} placeholder="M. Martin" />
              </Box>
              <Box style={{ flex: '1', minWidth: '180px' }}>
                <Text size="2" weight="bold" as="label">Email</Text>
                <TextField.Root value={form.email} onChange={set('email')} type="email" placeholder="commandes@fournisseur.fr" />
              </Box>
              <Box style={{ flex: '1', minWidth: '120px' }}>
                <Text size="2" weight="bold" as="label">Telephone</Text>
                <TextField.Root value={form.phone} onChange={set('phone')} placeholder="01 23 45 67 89" />
              </Box>
            </Flex>

            <Box>
              <Text size="2" weight="bold" as="label">Adresse</Text>
              <TextField.Root value={form.address} onChange={set('address')} placeholder="12 rue de l'Industrie, 69001 Lyon" />
            </Box>

            <Box>
              <Text size="2" weight="bold" as="label">Notes</Text>
              <TextField.Root value={form.notes} onChange={set('notes')} placeholder="Delai moyen, conditions..." />
            </Box>

            <Flex align="center" gap="2">
              <Checkbox checked={form.is_active} onCheckedChange={setActive} />
              <Text size="2" weight="bold">Fournisseur actif</Text>
            </Flex>

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={saving}>Annuler</Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                {isEdit ? <Edit2 size={16} /> : <Plus size={16} />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

SupplierForm.propTypes = {
  supplier: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
