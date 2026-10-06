import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Button, Dialog, TextField, Tabs, Separator } from '@radix-ui/themes';
import { updateMyProfile, changeMyPassword } from '@/api/auth';

// ===== ONGLET PROFIL =====

function ProfileTab({ user, onSuccess }) {
  const [form, setForm] = useState({ first_name: '', last_name: '', initial: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        initial: user.initial ?? '',
      });
    }
  }, [user]);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'Requis';
    if (!form.last_name.trim()) errs.last_name = 'Requis';
    if (!form.initial.trim()) errs.initial = 'Requis';
    else if (!/^[A-Za-z]{1,5}$/.test(form.initial.trim())) errs.initial = '1 à 5 lettres uniquement';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const updated = await updateMyProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        initial: form.initial.trim().toUpperCase(),
      });
      setSuccessMsg('Profil mis à jour');
      onSuccess(updated);
    } catch (err) {
      setErrors({ global: err?.response?.data?.detail || 'Erreur lors de la mise à jour' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3" mt="3">
        <Flex gap="3">
          <label style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" as="div">Prénom *</Text>
            <TextField.Root value={form.first_name} onChange={set('first_name')} placeholder="Prénom" />
            {errors.first_name && <Text size="1" color="red">{errors.first_name}</Text>}
          </label>
          <label style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
            <TextField.Root value={form.last_name} onChange={set('last_name')} placeholder="Nom" />
            {errors.last_name && <Text size="1" color="red">{errors.last_name}</Text>}
          </label>
        </Flex>
        <label style={{ maxWidth: 160 }}>
          <Text size="2" weight="bold" mb="1" as="div">Initiales * (1-5 lettres)</Text>
          <TextField.Root
            value={form.initial}
            onChange={set('initial')}
            maxLength={5}
            placeholder="Ex: JD"
            style={{ textTransform: 'uppercase' }}
          />
          {errors.initial && <Text size="1" color="red">{errors.initial}</Text>}
        </label>
        {errors.global && <Text size="2" color="red">{errors.global}</Text>}
        {successMsg && <Text size="2" color="green">{successMsg}</Text>}
        <Flex justify="end" mt="2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

ProfileTab.propTypes = {
  user: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};

// ===== ONGLET MOT DE PASSE =====

function PasswordTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMsg('');
  };

  const validate = () => {
    const errs = {};
    if (!form.current) errs.current = 'Requis';
    if (!form.next) errs.next = 'Requis';
    else if (form.next.length < 8) errs.next = '8 caractères minimum';
    else if (!/[A-Z]/.test(form.next)) errs.next = 'Doit contenir au moins une majuscule';
    else if (!/[0-9]/.test(form.next)) errs.next = 'Doit contenir au moins un chiffre';
    if (!form.confirm) errs.confirm = 'Requis';
    else if (form.next !== form.confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      await changeMyPassword(form.current, form.next);
      setSuccessMsg('Mot de passe modifié avec succès');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string' && detail.toLowerCase().includes('incorrect')) {
        setErrors({ current: 'Mot de passe actuel incorrect' });
      } else {
        setErrors({ global: detail || 'Erreur lors du changement de mot de passe' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3" mt="3">
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Mot de passe actuel *</Text>
          <TextField.Root type="password" value={form.current} onChange={set('current')} autoComplete="current-password" />
          {errors.current && <Text size="1" color="red">{errors.current}</Text>}
        </label>
        <Separator size="4" />
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Nouveau mot de passe *</Text>
          <TextField.Root type="password" value={form.next} onChange={set('next')} autoComplete="new-password" />
          {errors.next && <Text size="1" color="red">{errors.next}</Text>}
          <Text size="1" color="gray" mt="1" as="div">8 caractères min., 1 majuscule, 1 chiffre</Text>
        </label>
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Confirmer le nouveau mot de passe *</Text>
          <TextField.Root type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
          {errors.confirm && <Text size="1" color="red">{errors.confirm}</Text>}
        </label>
        {errors.global && <Text size="2" color="red">{errors.global}</Text>}
        {successMsg && <Text size="2" color="green">{successMsg}</Text>}
        <Flex justify="end" mt="2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

// ===== MODAL PRINCIPAL =====

export default function UserProfileModal({ open, onOpenChange, user, onProfileUpdated }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 480 }}>
        <Dialog.Title>Mon profil</Dialog.Title>
        <Tabs.Root defaultValue="profile">
          <Tabs.List>
            <Tabs.Trigger value="profile">Informations</Tabs.Trigger>
            <Tabs.Trigger value="password">Mot de passe</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="profile">
            <ProfileTab user={user} onSuccess={onProfileUpdated} />
          </Tabs.Content>
          <Tabs.Content value="password">
            <PasswordTab />
          </Tabs.Content>
        </Tabs.Root>
        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Button variant="soft" color="gray" type="button">Fermer</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

UserProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onProfileUpdated: PropTypes.func.isRequired,
};
