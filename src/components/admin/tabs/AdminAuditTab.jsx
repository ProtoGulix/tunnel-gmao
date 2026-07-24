/**
 * @fileoverview Onglet Audit — journal des mutations et règles routine/sensible
 * @module components/admin/tabs/AdminAuditTab
 */

import { Flex, Tabs, Text } from '@radix-ui/themes';
import { ScrollText, Settings2, Tag } from 'lucide-react';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { useAuditRules, useAuditReasons, useAuditReasonsAdmin } from '@/hooks/admin/useAuditRules';
import AdminAuditLogSection from '@/components/admin/AdminAuditLogSection';
import AdminAuditRulesSection from '@/components/admin/AdminAuditRulesSection';
import AdminAuditReasonsSection from '@/components/admin/AdminAuditReasonsSection';

export default function AdminAuditTab() {
  const { activeTab, setActiveTab } = useTabNavigation('log', 'auditSubTab');
  const { items: rules, loading: rulesLoading, refresh: refreshRules } = useAuditRules();
  const { items: reasons } = useAuditReasons();
  const { items: reasonsAdmin, loading: reasonsAdminLoading, refresh: refreshReasonsAdmin } = useAuditReasonsAdmin();

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Trigger value="log">
          <Flex align="center" gap="2">
            <ScrollText size={13} />
            <Text>Journal</Text>
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="rules">
          <Flex align="center" gap="2">
            <Settings2 size={13} />
            <Text>Règles</Text>
          </Flex>
        </Tabs.Trigger>
        <Tabs.Trigger value="reasons">
          <Flex align="center" gap="2">
            <Tag size={13} />
            <Text>Raisons</Text>
          </Flex>
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="log">
        {activeTab === 'log' && <AdminAuditLogSection />}
      </Tabs.Content>
      <Tabs.Content value="rules">
        {activeTab === 'rules' && (
          <AdminAuditRulesSection
            rules={rules}
            reasons={reasons}
            loading={rulesLoading}
            onRefresh={refreshRules}
          />
        )}
      </Tabs.Content>
      <Tabs.Content value="reasons">
        {activeTab === 'reasons' && (
          <AdminAuditReasonsSection
            reasons={reasonsAdmin}
            loading={reasonsAdminLoading}
            onRefresh={refreshReasonsAdmin}
          />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
