/**
 * @fileoverview Formulaire creation/edition fournisseur
 * @module components/suppliers/SupplierForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Checkbox, Flex, Text, TextField } from '@radix-ui/themes';
import { Plus, Edit2, Truck } from 'lucide-react';
import FormErrors from '@/components/shared/FormErrors';
import { handleAPIError } from '@/lib/api/errors';

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
    try {
      await onSubmit(form);
    } catch (err) {
      const typed = handleAPIError(err, 'SupplierForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={18} /> : <Truck size={18} />}
            <Text size="4" weight="bold">{isEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</Text>
          </Flex>

          <FormErrors errors={errors} />

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 2, minWidth: 180 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Nom *</Text>
              <TextField.Root value={form.name} onChange={set('name')} placeholder="PONS & SABOT" />
            </Box>
            <Box style={{ flex: 1, minWidth: 100 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Code</Text>
              <TextField.Root value={form.code} onChange={setCode} placeholder="PS" />
            </Box>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 180 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Contact</Text>
              <TextField.Root value={form.contact_name} onChange={set('contact_name')} placeholder="M. Martin" />
            </Box>
            <Box style={{ flex: 1, minWidth: 180 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Email</Text>
              <TextField.Root value={form.email} onChange={set('email')} type="email" placeholder="commandes@fournisseur.fr" />
            </Box>
            <Box style={{ flex: 1, minWidth: 120 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Telephone</Text>
              <TextField.Root value={form.phone} onChange={set('phone')} placeholder="01 23 45 67 89" />
            </Box>
          </Flex>

          <Box>
            <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Adresse</Text>
            <TextField.Root value={form.address} onChange={set('address')} placeholder="12 rue de l'Industrie, 69001 Lyon" />
          </Box>

          <Box>
            <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Notes</Text>
            <TextField.Root value={form.notes} onChange={set('notes')} placeholder="Delai moyen, conditions..." />
          </Box>

          <Flex align="center" gap="2">
            <Checkbox checked={form.is_active} onCheckedChange={setActive} />
            <Text size="2">Fournisseur actif</Text>
          </Flex>

          <Flex gap="2" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" color="blue" loading={saving}>
              {isEdit ? <><Edit2 size={14} /> Enregistrer</> : <><Plus size={14} /> Créer</>}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

SupplierForm.propTypes = {
  supplier: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
