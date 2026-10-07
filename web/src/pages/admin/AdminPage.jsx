/**
 * @fileoverview Page Administration — espace admin principal
 * @module pages/admin/AdminPage
 */

import { lazy, Suspense } from 'react';
import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { Users, Shield, Database, Lock, ScrollText } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

const AdminUsersTab = lazy(() => import('@/components/admin/tabs/AdminUsersTab'));
const AdminRolesTab = lazy(() => import('@/components/admin/tabs/AdminRolesTab'));
const AdminReferentielTab = lazy(() => import('@/components/admin/tabs/AdminReferentielTab'));
const AdminSecurityTab = lazy(() => import('@/components/admin/tabs/AdminSecurityTab'));
const AdminAuditTab = lazy(() => import('@/components/admin/tabs/AdminAuditTab'));

export default function AdminPage() {
  const { activeTab: requestedTab, setActiveTab } = useTabNavigation('users', 'tab');
  const { can } = usePermissions();
  const showRoles = can(PERM.adminTabs.roles);
  const showSecurity = can(PERM.adminTabs.security);
  // Un onglet masqué ne doit pas rester actif via l'URL (?tab=roles)
  const activeTab = (requestedTab === 'roles' && !showRoles) || (requestedTab === 'security' && !showSecurity) ? 'users' : requestedTab;

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
          {showRoles && (
            <Tabs.Trigger value="roles">
              <Flex align="center" gap="2">
                <Shield size={14} />
                <Text>Rôles &amp; Permissions</Text>
              </Flex>
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="referentiel">
            <Flex align="center" gap="2">
              <Database size={14} />
              <Text>Référentiel</Text>
            </Flex>
          </Tabs.Trigger>
          {showSecurity && (
            <Tabs.Trigger value="security">
              <Flex align="center" gap="2">
                <Lock size={14} />
                <Text>Sécurité</Text>
              </Flex>
            </Tabs.Trigger>
          )}
          <Tabs.Trigger value="audit">
            <Flex align="center" gap="2">
              <ScrollText size={14} />
              <Text>Audit</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Suspense fallback={<LoadingState />}>
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
        </Suspense>
      </Tabs.Root>
      </Container>
    </>
  );
}
