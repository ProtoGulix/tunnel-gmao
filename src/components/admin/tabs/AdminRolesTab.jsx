/**
 * @fileoverview Onglet rôles et matrice de permissions
 * @module components/admin/tabs/AdminRolesTab
 */

import { useState, useCallback } from 'react';
import { Box, Callout } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import AdminRolePermissionsMatrix from '@/components/admin/AdminRolePermissionsMatrix';
import AdminPermissionAuditPanel from '@/components/admin/AdminPermissionAuditPanel';
import { useAdminRoles, useRolePermissions, usePermissionAudit } from '@/hooks/admin/useAdminRoles';
import { useNotification } from '@/hooks/shared/useNotification';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminRolesTab() {
  const { roles, loading, error } = useAdminRoles();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const { permissions, loadingPermissions, errorPermissions, togglePermission } =
    useRolePermissions(selectedRoleId);

  const { audit, loading: auditLoading, load: loadAudit } = usePermissionAudit();

  const { notification, notify } = useNotification();

  const handleToggle = useCallback(async (permId, newValue) => {
    try {
      await togglePermission(permId, newValue);
      notify('Permission modifiée');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la modification'), 'error');
    }
  }, [togglePermission, notify]);

  const handleShowAudit = useCallback(() => {
    loadAudit();
    setAuditOpen(true);
  }, [loadAudit]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

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

      <AdminRolePermissionsMatrix
        roles={roles}
        selectedRoleId={selectedRoleId}
        onSelectRole={setSelectedRoleId}
        permissions={permissions}
        loadingPermissions={loadingPermissions}
        errorPermissions={errorPermissions}
        onTogglePermission={handleToggle}
        onShowAudit={handleShowAudit}
      />

      <AdminPermissionAuditPanel
        open={auditOpen}
        onOpenChange={setAuditOpen}
        audit={audit}
        loading={auditLoading}
      />
    </Box>
  );
}
