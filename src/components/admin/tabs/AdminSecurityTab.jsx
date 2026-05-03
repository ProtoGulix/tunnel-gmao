/**
 * @fileoverview Onglet sécurité admin (logs, blocklist IP, domaines)
 * @module components/admin/tabs/AdminSecurityTab
 */

import { useState, useCallback } from 'react';
import { Box, Callout, Flex, Tabs, Text } from '@radix-ui/themes';
import { CheckCircle, XCircle, Activity, Ban, Globe, KeyRound } from 'lucide-react';
import AdminSecurityLogsTable from '@/components/admin/AdminSecurityLogsTable';
import AdminSecurityBlocklist from '@/components/admin/AdminSecurityBlocklist';
import AdminSecurityDomains from '@/components/admin/AdminSecurityDomains';
import AdminSecurityApiKeys from '@/components/admin/AdminSecurityApiKeys';
import {
  useSecurityLogs,
  useIpBlocklist,
  useEmailDomainRules,
  useApiKeys,
} from '@/hooks/admin/useAdminSecurity';
import { useNotification } from '@/hooks/shared/useNotification';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminSecurityTab() {
  const { activeTab, setActiveTab } = useTabNavigation('logs', 'sec');
  const { notification, notify } = useNotification();

  const [eventType, setEventType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const logsHook = useSecurityLogs({ eventType, startDate, endDate });
  const blocklistHook = useIpBlocklist();
  const domainsHook = useEmailDomainRules();
  const apiKeysHook = useApiKeys();

  const handleBlockIp = useCallback(async (payload) => {
    try {
      await blocklistHook.blockIp(payload);
      notify('IP bloquée avec succès');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors du blocage'), 'error');
      throw err;
    }
  }, [blocklistHook, notify]);

  const handleUnblockIp = useCallback(async (id) => {
    try {
      await blocklistHook.unblockIp(id);
      notify('IP débloquée');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors du déblocage'), 'error');
      throw err;
    }
  }, [blocklistHook, notify]);

  const handleAddDomain = useCallback(async (payload) => {
    try {
      await domainsHook.addDomain(payload);
      notify('Domaine ajouté');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de l\'ajout'), 'error');
      throw err;
    }
  }, [domainsHook, notify]);

  const handleRemoveDomain = useCallback(async (id) => {
    try {
      await domainsHook.removeDomain(id);
      notify('Domaine supprimé');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la suppression'), 'error');
      throw err;
    }
  }, [domainsHook, notify]);

  const handleCreateApiKey = useCallback(async (payload) => {
    try {
      const created = await apiKeysHook.createKey(payload);
      notify('Cle API creee');
      return created;
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la creation de cle'), 'error');
      throw err;
    }
  }, [apiKeysHook, notify]);

  const handlePatchApiKey = useCallback(async (id, payload) => {
    try {
      await apiKeysHook.patchKey(id, payload);
      notify('Cle API mise a jour');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la mise a jour'), 'error');
      throw err;
    }
  }, [apiKeysHook, notify]);

  const handleRevokeApiKey = useCallback(async (id) => {
    try {
      await apiKeysHook.revokeKey(id);
      notify('Cle API revoquee');
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur lors de la revocation'), 'error');
      throw err;
    }
  }, [apiKeysHook, notify]);

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

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-5)', marginBottom: '1.5rem' }}>
          <Tabs.Trigger value="logs">
            <Flex align="center" gap="2"><Activity size={13} /><Text>Logs</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="blocklist">
            <Flex align="center" gap="2"><Ban size={13} /><Text>IP Bloquées</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="domains">
            <Flex align="center" gap="2"><Globe size={13} /><Text>Domaines</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="api-keys">
            <Flex align="center" gap="2"><KeyRound size={13} /><Text>Cles API</Text></Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="logs">
          {activeTab === 'logs' && (
            <AdminSecurityLogsTable
              logs={logsHook.logs}
              loading={logsHook.loading}
              eventType={eventType}
              onEventTypeChange={setEventType}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              pagination={{ ...logsHook.pagination, goToPage: logsHook.goToPage }}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="blocklist">
          {activeTab === 'blocklist' && (
            <AdminSecurityBlocklist
              items={blocklistHook.items}
              loading={blocklistHook.loading}
              onBlock={handleBlockIp}
              onUnblock={handleUnblockIp}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="domains">
          {activeTab === 'domains' && (
            <AdminSecurityDomains
              items={domainsHook.items}
              loading={domainsHook.loading}
              onAdd={handleAddDomain}
              onRemove={handleRemoveDomain}
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="api-keys">
          {activeTab === 'api-keys' && (
            <AdminSecurityApiKeys
              items={apiKeysHook.items}
              loading={apiKeysHook.loading}
              onCreate={handleCreateApiKey}
              onPatch={handlePatchApiKey}
              onRevoke={handleRevokeApiKey}
            />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
