/**
 * @fileoverview Onglet gestion des utilisateurs admin
 * @module components/admin/tabs/AdminUsersTab
 */

import { useState, useCallback } from 'react';
import { Box, Callout } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import AdminUsersTable from '@/components/admin/AdminUsersTable';
import AdminUserCreateModal from '@/components/admin/AdminUserCreateModal';
import AdminUserEditModal from '@/components/admin/AdminUserEditModal';
import {
  AdminChangeRoleModal,
  AdminToggleActiveModal,
  AdminResetPasswordModal,
} from '@/components/admin/AdminUserConfirmModals';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useNotification } from '@/hooks/shared/useNotification';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminUsersTab() {
  const {
    users, loading, error,
    search, setSearch,
    filterActive, setFilterActive,
    filterRole, setFilterRole,
    pagination, goToPage,
    createUser, editUser, changeRole, toggleActive, resetPassword,
  } = useAdminUsers();

  const { notification, notify } = useNotification();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [toggleActiveOpen, setToggleActiveOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const handleCreate = useCallback(async (payload) => {
    try {
      setSubmitting(true);
      await createUser(payload);
      notify('Utilisateur créé avec succès');
      setCreateOpen(false);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la création'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [createUser, notify]);

  const handleEdit = useCallback(async (id, payload) => {
    try {
      setSubmitting(true);
      await editUser(id, payload);
      notify('Utilisateur modifié avec succès');
      setEditOpen(false);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la modification'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [editUser, notify]);

  const handleChangeRole = useCallback(async (id, role_code) => {
    try {
      setSubmitting(true);
      await changeRole(id, role_code);
      notify('Rôle modifié avec succès');
      setChangeRoleOpen(false);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors du changement de rôle'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [changeRole, notify]);

  const handleToggleActive = useCallback(async (id, is_active) => {
    try {
      setSubmitting(true);
      await toggleActive(id, is_active);
      notify(is_active ? 'Utilisateur activé' : 'Utilisateur désactivé');
      setToggleActiveOpen(false);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors du changement de statut'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [toggleActive, notify]);

  const handleResetPassword = useCallback(async () => {
    try {
      setSubmitting(true);
      const result = await resetPassword(selectedUser.id);
      setTempPassword(result.temporary_password || result.password || '');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la réinitialisation'), 'error');
      setResetPasswordOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [resetPassword, selectedUser, notify]);

  const handleResetPasswordModalClose = useCallback((v) => {
    if (!v) setTempPassword('');
    setResetPasswordOpen(v);
  }, []);

  if (loading && users.length === 0) return <LoadingState />;
  if (error && users.length === 0) return <ErrorState error={error} />;

  return (
    <Box pt="4">
      {notification && (
        <Callout.Root
          color={notification.type === 'error' ? 'red' : 'green'}
          mb="3"
          size="1"
        >
          <Callout.Icon>
            {notification.type === 'error' ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </Callout.Icon>
          <Callout.Text>{notification.message}</Callout.Text>
        </Callout.Root>
      )}

      <AdminUsersTable
        users={users}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        filterActive={filterActive}
        onFilterActiveChange={setFilterActive}
        filterRole={filterRole}
        onFilterRoleChange={setFilterRole}
        pagination={{ ...pagination, goToPage }}
        onCreateClick={() => setCreateOpen(true)}
        onEditClick={(u) => { setSelectedUser(u); setEditOpen(true); }}
        onChangeRoleClick={(u) => { setSelectedUser(u); setChangeRoleOpen(true); }}
        onToggleActiveClick={(u) => { setSelectedUser(u); setToggleActiveOpen(true); }}
        onResetPasswordClick={(u) => { setSelectedUser(u); setTempPassword(''); setResetPasswordOpen(true); }}
      />

      <AdminUserCreateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />

      <AdminUserEditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <AdminChangeRoleModal
        open={changeRoleOpen}
        onOpenChange={setChangeRoleOpen}
        user={selectedUser}
        onSubmit={handleChangeRole}
        submitting={submitting}
      />

      <AdminToggleActiveModal
        open={toggleActiveOpen}
        onOpenChange={setToggleActiveOpen}
        user={selectedUser}
        onSubmit={handleToggleActive}
        submitting={submitting}
      />

      <AdminResetPasswordModal
        open={resetPasswordOpen}
        onOpenChange={handleResetPasswordModalClose}
        user={selectedUser}
        onConfirm={handleResetPassword}
        submitting={submitting}
        tempPassword={tempPassword}
      />
    </Box>
  );
}
