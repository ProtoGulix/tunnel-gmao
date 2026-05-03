/**
 * @fileoverview Modal création d'un utilisateur
 * @module components/admin/AdminUserCreateModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Button, Dialog, TextField, Select } from '@radix-ui/themes';

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  initials: '',
  role: '',
  password: '',
  password_confirm: '',
};

const ROLES = ['RESP', 'TECH', 'CONSULTANT', 'ADMIN'];

export default function AdminUserCreateModal({ open, onOpenChange, onSubmit, submitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Requis';
    if (!form.last_name.trim()) errs.last_name = 'Requis';
    if (!form.email.trim()) errs.email = 'Requis';
    if (!form.initials.trim()) errs.initials = 'Requis';
    if (form.initials.length > 5) errs.initials = '5 caractères max';
    if (!form.role) errs.role = 'Requis';
    if (!form.password) errs.password = 'Requis';
    if (form.password !== form.password_confirm) errs.password_confirm = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onSubmit({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      initials: form.initials.trim().toUpperCase(),
      role: form.role,
      password: form.password,
    });
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleOpenChange = (v) => {
    if (!v) { setForm(EMPTY_FORM); setErrors({}); }
    onOpenChange(v);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 480 }}>
        <Dialog.Title>Nouvel utilisateur</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Prénom *</Text>
                <TextField.Root value={form.first_name} onChange={set('first_name')} placeholder="Jean" />
                {errors.first_name && <Text size="1" color="red">{errors.first_name}</Text>}
              </label>
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
                <TextField.Root value={form.last_name} onChange={set('last_name')} placeholder="Dupont" />
                {errors.last_name && <Text size="1" color="red">{errors.last_name}</Text>}
              </label>
            </Flex>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Email *</Text>
              <TextField.Root type="email" value={form.email} onChange={set('email')} placeholder="jean.dupont@example.com" />
              {errors.email && <Text size="1" color="red">{errors.email}</Text>}
            </label>
            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Initiales * (max 5)</Text>
                <TextField.Root value={form.initials} onChange={set('initials')} placeholder="JD" maxLength={5} />
                {errors.initials && <Text size="1" color="red">{errors.initials}</Text>}
              </label>
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Rôle *</Text>
                <Select.Root value={form.role} onValueChange={(v) => { setForm((p) => ({ ...p, role: v })); if (errors.role) setErrors((p) => ({ ...p, role: undefined })); }}>
                  <Select.Trigger placeholder="Choisir..." style={{ width: '100%' }} />
                  <Select.Content>
                    {ROLES.map((r) => <Select.Item key={r} value={r}>{r}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
                {errors.role && <Text size="1" color="red">{errors.role}</Text>}
              </label>
            </Flex>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Mot de passe *</Text>
              <TextField.Root type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
              {errors.password && <Text size="1" color="red">{errors.password}</Text>}
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Confirmer le mot de passe *</Text>
              <TextField.Root type="password" value={form.password_confirm} onChange={set('password_confirm')} placeholder="••••••••" />
              {errors.password_confirm && <Text size="1" color="red">{errors.password_confirm}</Text>}
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Création...' : 'Créer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminUserCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
