/**
 * @fileoverview Tableau des logs de sécurité
 * @module components/admin/AdminSecurityLogsTable
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Select, Text } from '@radix-ui/themes';
import { Shield } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const EVENT_COLORS = {
  LOGIN_FAIL: 'red',
  LOGIN_SUCCESS: 'green',
  TOKEN_REVOKED: 'orange',
  ROLE_CHANGE: 'blue',
  USER_DEACTIVATED: 'red',
  IP_BLOCKED: 'red',
  FORBIDDEN_ACCESS: 'orange',
  PERMISSION_CHANGED: 'blue',
};

const EVENT_OPTIONS = [
  { value: '__all__', label: 'Tous les événements' },
  { value: 'LOGIN_FAIL', label: 'Échec connexion' },
  { value: 'LOGIN_SUCCESS', label: 'Connexion réussie' },
  { value: 'TOKEN_REVOKED', label: 'Token révoqué' },
  { value: 'ROLE_CHANGE', label: 'Changement rôle' },
  { value: 'USER_DEACTIVATED', label: 'Utilisateur désactivé' },
  { value: 'IP_BLOCKED', label: 'IP bloquée' },
  { value: 'FORBIDDEN_ACCESS', label: 'Accès refusé' },
  { value: 'PERMISSION_CHANGED', label: 'Permission modifiée' },
];

export default function AdminSecurityLogsTable({
  logs,
  loading,
  eventType,
  onEventTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  pagination,
}) {
  const columns = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      width: 160,
      render: (l) => (
        <Text size="1" color="gray">
          {l.created_at ? new Date(l.created_at).toLocaleString('fr-FR') : '—'}
        </Text>
      ),
    },
    {
      key: 'event',
      header: 'Événement',
      width: 180,
      render: (l) => (
        <Badge variant="soft" color={EVENT_COLORS[l.event_type] ?? 'gray'} size="1">
          {l.event_type}
        </Badge>
      ),
    },
    {
      key: 'user',
      header: 'Utilisateur',
      width: 160,
      render: (l) => <Text size="2">{l.user_email || l.user_id || '—'}</Text>,
    },
    {
      key: 'ip',
      header: 'IP',
      width: 130,
      render: (l) => <Text size="2" style={{ fontFamily: 'monospace' }}>{l.ip_address || '—'}</Text>,
    },
    {
      key: 'detail',
      header: 'Détail',
      render: (l) => <Text size="1" color="gray">{l.detail || l.message || '—'}</Text>,
    },
  ], []);

  return (
    <DataTable
      headerProps={{
        icon: Shield,
        title: 'Logs de sécurité',
        count: pagination?.total,
        showSearchInput: false,
        actions: (
          <Flex gap="2" align="center" wrap="wrap">
            <Select.Root value={eventType || '__all__'} onValueChange={(v) => onEventTypeChange(v === '__all__' ? '' : v)} size="2">
              <Select.Trigger placeholder="Type d'événement" />
              <Select.Content>
                {EVENT_OPTIONS.map((o) => (
                  <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--gray-6)', fontSize: 13 }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--gray-6)', fontSize: 13 }}
            />
          </Flex>
        ),
      }}
      columns={columns}
      data={logs}
      loading={loading}
      emptyState={{
        icon: Shield,
        title: 'Aucun événement de sécurité',
        description: 'Aucun log ne correspond aux filtres sélectionnés.',
      }}
      pagination={
        pagination
          ? {
              currentPage: pagination.page,
              total: pagination.total,
              pageSize: pagination.pageSize,
              totalPages: pagination.totalPages,
              onPageChange: pagination.goToPage,
            }
          : undefined
      }
    />
  );
}

AdminSecurityLogsTable.propTypes = {
  logs: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  eventType: PropTypes.string,
  onEventTypeChange: PropTypes.func.isRequired,
  startDate: PropTypes.string,
  onStartDateChange: PropTypes.func.isRequired,
  endDate: PropTypes.string,
  onEndDateChange: PropTypes.func.isRequired,
  pagination: PropTypes.object,
};
