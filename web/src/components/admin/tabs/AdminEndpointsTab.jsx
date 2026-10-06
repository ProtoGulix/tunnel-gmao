/**
 * @fileoverview Onglet catalogue des endpoints admin
 * @module components/admin/tabs/AdminEndpointsTab
 */

import { useState, useCallback } from 'react';
import { Box, Callout, Dialog, Flex, Button, Text } from '@radix-ui/themes';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import AdminEndpointsTable from '@/components/admin/AdminEndpointsTable';
import { useAdminEndpoints } from '@/hooks/admin/useAdminEndpoints';
import { useNotification } from '@/hooks/shared/useNotification';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminEndpointsTab() {
  const {
    endpoints, loading, error,
    filterModule, setFilterModule,
    modules,
    editEndpoint, syncEndpoints,
  } = useAdminEndpoints();

  const { notification, notify } = useNotification();
  const [syncConfirmOpen, setSyncConfirmOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleEditEndpoint = useCallback(async (id, payload) => {
    try {
      await editEndpoint(id, payload);
      notify('Endpoint modifié avec succès');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la modification'), 'error');
      throw err;
    }
  }, [editEndpoint, notify]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      await syncEndpoints();
      notify('Catalogue synchronisé avec succès');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la synchronisation'), 'error');
    } finally {
      setSyncing(false);
      setSyncConfirmOpen(false);
    }
  }, [syncEndpoints, notify]);

  if (loading && endpoints.length === 0) return <LoadingState />;
  if (error && endpoints.length === 0) return <ErrorState error={error} />;

  return (
    <Box pt="4">
      {notification && (
        <Callout.Root color={notification.type === 'error' ? 'red' : 'green'} mb="3" size="1">
          <Callout.Icon>
            {notification.type === 'error' ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </Callout.Icon>
          <Callout.Text>{notification.message}</Callout.Text>
        </Callout.Root>
      )}

      {/* Confirmation synchronisation */}
      <Dialog.Root open={syncConfirmOpen} onOpenChange={setSyncConfirmOpen}>
        <Dialog.Content style={{ maxWidth: 400 }}>
          <Dialog.Title>Synchroniser le catalogue</Dialog.Title>
          <Text size="2" mt="3" as="p">
            Resynchroniser le catalogue depuis le code ? Les métadonnées existantes seront conservées.
          </Text>
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">Annuler</Button>
            </Dialog.Close>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? 'Synchronisation...' : 'Confirmer'}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>

      <AdminEndpointsTable
        endpoints={endpoints}
        loading={loading}
        filterModule={filterModule}
        onFilterModuleChange={setFilterModule}
        modules={modules}
        onSync={() => setSyncConfirmOpen(true)}
        onEditEndpoint={handleEditEndpoint}
        syncing={syncing}
      />
    </Box>
  );
}
