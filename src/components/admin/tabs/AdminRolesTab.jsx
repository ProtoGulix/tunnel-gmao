/**
 * @fileoverview Onglet rôles et matrice de permissions
 * @module components/admin/tabs/AdminRolesTab
 */

import { useState, useCallback } from 'react';
import { Box, Button, Callout, Flex } from '@radix-ui/themes';
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { syncAdminEndpoints } from '@/api/adminEndpoints';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import AdminRolePermissionsMatrix from '@/components/admin/AdminRolePermissionsMatrix';
import AdminPermissionAuditPanel from '@/components/admin/AdminPermissionAuditPanel';
import { useRolesMatrix, usePermissionAudit } from '@/hooks/admin/useAdminRoles';
import { useNotification } from '@/hooks/shared/useNotification';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminRolesTab() {
  const { matrix, loading, error, togglePermission, refresh: refreshMatrix } = useRolesMatrix();
  const [auditOpen, setAuditOpen] = useState(false);

  const { audit, loading: auditLoading, load: loadAudit } = usePermissionAudit();
  const { notification, notify } = useNotification();

  const handleToggle = useCallback(async (permId, roleCode, endpointId, newAllowed) => {
    try {
      await togglePermission(permId, roleCode, endpointId, newAllowed);
      notify('Permission modifiée');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la modification'), 'error');
    }
  }, [togglePermission, notify]);

  const handleShowAudit = useCallback(() => {
    loadAudit();
    setAuditOpen(true);
  }, [loadAudit]);

  const [syncing, setSyncing] = useState(false);
  const handleSyncEndpoints = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncAdminEndpoints();
      const msg = result?.synced != null
        ? `Endpoints synchronisés — ${result.synced} ajouté(s) / mis à jour`
        : 'Endpoints synchronisés';
      notify(msg);
      refreshMatrix();
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la synchronisation'), 'error');
    } finally {
      setSyncing(false);
    }
  }, [notify, matrix]);

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

      <Flex justify="end" mb="3">
        <Button
          variant="soft"
          color="gray"
          size="2"
          onClick={handleSyncEndpoints}
          disabled={syncing}
        >
          <RefreshCw size={14} />
          {syncing ? 'Synchronisation...' : 'Synchroniser les endpoints'}
        </Button>
      </Flex>

      <AdminRolePermissionsMatrix
        matrix={matrix}
        onToggle={handleToggle}
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
