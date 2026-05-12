/**
 * @fileoverview Page Administration — espace admin principal
 * @module pages/admin/AdminPage
 */

import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { Users, Shield, Database, Lock, ScrollText } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import AdminUsersTab from '@/components/admin/tabs/AdminUsersTab';
import AdminRolesTab from '@/components/admin/tabs/AdminRolesTab';
import AdminReferentielTab from '@/components/admin/tabs/AdminReferentielTab';
import AdminSecurityTab from '@/components/admin/tabs/AdminSecurityTab';
import AdminAuditTab from '@/components/admin/tabs/AdminAuditTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function AdminPage() {
  const { activeTab, setActiveTab } = useTabNavigation('users', 'tab');

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Utilisateurs, rôles, référentiel, sécurité et audit"
      />

      <Container size="4">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="users">
            <Flex align="center" gap="2">
              <Users size={14} />
              <Text>Utilisateurs</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="roles">
            <Flex align="center" gap="2">
              <Shield size={14} />
              <Text>Rôles &amp; Permissions</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="referentiel">
            <Flex align="center" gap="2">
              <Database size={14} />
              <Text>Référentiel</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="security">
            <Flex align="center" gap="2">
              <Lock size={14} />
              <Text>Sécurité</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="audit">
            <Flex align="center" gap="2">
              <ScrollText size={14} />
              <Text>Audit</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="users">
          {activeTab === 'users' && <AdminUsersTab />}
        </Tabs.Content>
        <Tabs.Content value="roles">
          {activeTab === 'roles' && <AdminRolesTab />}
        </Tabs.Content>
        <Tabs.Content value="referentiel">
          {activeTab === 'referentiel' && <AdminReferentielTab />}
        </Tabs.Content>
        <Tabs.Content value="security">
          {activeTab === 'security' && <AdminSecurityTab />}
        </Tabs.Content>
        <Tabs.Content value="audit">
          {activeTab === 'audit' && <AdminAuditTab />}
        </Tabs.Content>
      </Tabs.Root>
      </Container>
    </>
  );
}
