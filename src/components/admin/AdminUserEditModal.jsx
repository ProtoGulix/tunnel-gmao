/**
 * @fileoverview Modal édition d'un utilisateur
 * @module components/admin/AdminUserEditModal
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Button, Dialog, TextField } from '@radix-ui/themes';

export default function AdminUserEditModal({ open, onOpenChange, user, onSubmit, submitting }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', initials: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        initials: user.initials ?? '',
      });
      setErrors({});
    }
  }, [user]);

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
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    await onSubmit(user.id, {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      initials: form.initials.trim().toUpperCase(),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 480 }}>
        <Dialog.Title>Modifier l'utilisateur</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <Flex gap="3">
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Prénom *</Text>
                <TextField.Root value={form.first_name} onChange={set('first_name')} />
                {errors.first_name && <Text size="1" color="red">{errors.first_name}</Text>}
              </label>
              <label style={{ flex: 1 }}>
                <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
                <TextField.Root value={form.last_name} onChange={set('last_name')} />
                {errors.last_name && <Text size="1" color="red">{errors.last_name}</Text>}
              </label>
            </Flex>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Email *</Text>
              <TextField.Root type="email" value={form.email} onChange={set('email')} />
              {errors.email && <Text size="1" color="red">{errors.email}</Text>}
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Initiales * (max 5)</Text>
              <TextField.Root value={form.initials} onChange={set('initials')} maxLength={5} />
              {errors.initials && <Text size="1" color="red">{errors.initials}</Text>}
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminUserEditModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
