/**
 * @fileoverview Modals de confirmation actions utilisateur admin
 * Regroupe : changement de rôle, activation/désactivation, reset mot de passe
 * @module components/admin/AdminUserConfirmModals
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Button, Dialog, Select, Callout, Code } from '@radix-ui/themes';
import { Copy, AlertTriangle } from 'lucide-react';

const ROLES = ['RESP', 'TECH', 'OPE', 'ADMIN'];

// ---- Modal changement de rôle ----

export function AdminChangeRoleModal({ open, onOpenChange, user, onSubmit, submitting }) {
  const [newRole, setNewRole] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRole) return;
    await onSubmit(user.id, newRole);
    setNewRole('');
  };

  const handleOpenChange = (v) => {
    if (!v) setNewRole('');
    onOpenChange(v);
  };

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }}>
        <Dialog.Title>Changer le rôle</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <Text size="2">
              Changer le rôle de <Text weight="bold">{user.first_name} {user.last_name}</Text> (actuellement <Text weight="bold">{user.role_code?.toUpperCase() || '?'}</Text>).
            </Text>
            <Callout.Root color="orange" size="1">
              <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
              <Callout.Text>Cette action révoquera toutes les sessions actives de cet utilisateur.</Callout.Text>
            </Callout.Root>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Nouveau rôle *</Text>
              <Select.Root value={newRole} onValueChange={setNewRole}>
                <Select.Trigger placeholder="Choisir..." style={{ width: '100%' }} />
                <Select.Content>
                  {ROLES.filter((r) => r !== user.role_code?.toUpperCase()).map((r) => (
                    <Select.Item key={r} value={r}>{r}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting || !newRole} color="blue">
              {submitting ? 'Modification...' : 'Confirmer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminChangeRoleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

// ---- Modal activation / désactivation ----

export function AdminToggleActiveModal({ open, onOpenChange, user, onSubmit, submitting }) {
  if (!user) return null;
  const isDeactivating = user.is_active;

  const handleConfirm = async () => {
    await onSubmit(user.id, !user.is_active);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }}>
        <Dialog.Title>{isDeactivating ? 'Désactiver' : 'Activer'} l'utilisateur</Dialog.Title>
        <Flex direction="column" gap="3" mt="4">
          {isDeactivating ? (
            <>
              <Text size="2">
                Désactiver <Text weight="bold">{user.first_name} {user.last_name}</Text> ?
              </Text>
              <Callout.Root color="red" size="1">
                <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
                <Callout.Text>L'utilisateur sera déconnecté immédiatement.</Callout.Text>
              </Callout.Root>
            </>
          ) : (
            <Text size="2">
              Réactiver <Text weight="bold">{user.first_name} {user.last_name}</Text> ?
            </Text>
          )}
        </Flex>
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">Annuler</Button>
          </Dialog.Close>
          <Button
            color={isDeactivating ? 'red' : 'green'}
            disabled={submitting}
            onClick={handleConfirm}
          >
            {submitting ? 'En cours...' : isDeactivating ? 'Désactiver' : 'Activer'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminToggleActiveModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

// ---- Modal reset mot de passe ----

export function AdminResetPasswordModal({ open, onOpenChange, user, onConfirm, submitting, tempPassword }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }}>
        <Dialog.Title>Réinitialiser le mot de passe</Dialog.Title>

        {!tempPassword ? (
          <>
            <Text size="2" mt="4" as="p">
              Réinitialiser le mot de passe de <Text weight="bold">{user.first_name} {user.last_name}</Text> ?
              Un mot de passe temporaire sera généré.
            </Text>
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">Annuler</Button>
              </Dialog.Close>
              <Button color="orange" disabled={submitting} onClick={onConfirm}>
                {submitting ? 'Génération...' : 'Réinitialiser'}
              </Button>
            </Flex>
          </>
        ) : (
          <Flex direction="column" gap="3" mt="4">
            <Callout.Root color="orange" size="1">
              <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
              <Callout.Text>Ce mot de passe ne sera affiché qu'une seule fois.</Callout.Text>
            </Callout.Root>
            <Text size="2">Mot de passe temporaire :</Text>
            <Flex align="center" gap="2">
              <Code size="3" style={{ flex: 1, padding: '8px 12px' }}>{tempPassword}</Code>
              <Button size="2" variant="soft" onClick={handleCopy}>
                <Copy size={14} />
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            </Flex>
            <Flex justify="end" mt="2">
              <Dialog.Close>
                <Button variant="soft" color="gray">Fermer</Button>
              </Dialog.Close>
            </Flex>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminResetPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  user: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  tempPassword: PropTypes.string,
};
