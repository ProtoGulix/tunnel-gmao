/**
 * @fileoverview Tableau des utilisateurs admin
 * @module components/admin/AdminUsersTable
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Flex, Text, Select } from '@radix-ui/themes';
import { Plus, Users, Pencil, Shield, Power, KeyRound } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const ROLE_COLORS = {
  RESP: 'blue',
  TECH: 'green',
  OPE: 'gray',
  ADMIN: 'orange',
};

const ROLE_OPTIONS = [
  { value: '__all__', label: 'Tous les rôles' },
  { value: 'RESP', label: 'RESP' },
  { value: 'TECH', label: 'TECH' },
  { value: 'OPE', label: 'OPE' },
  { value: 'ADMIN', label: 'ADMIN' },
];

const ACTIVE_OPTIONS = [
  { value: '__all__', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

export default function AdminUsersTable({
  users,
  loading,
  search,
  onSearchChange,
  filterActive,
  onFilterActiveChange,
  filterRole,
  onFilterRoleChange,
  pagination,
  onCreateClick,
  onEditClick,
  onChangeRoleClick,
  onToggleActiveClick,
  onResetPasswordClick,
}) {
  const columns = useMemo(() => [
    {
      key: 'initials',
      header: 'Initiales',
      width: 90,
      render: (u) => (
        <Badge variant="soft" color="blue" style={{ fontFamily: 'monospace' }}>
          {u.initial}
        </Badge>
      ),
    },
    {
      key: 'name',
      header: 'Prénom Nom',
      render: (u) => (
        <Text weight="medium">{u.first_name} {u.last_name}</Text>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u) => <Text size="2" color="gray">{u.email}</Text>,
    },
    {
      key: 'role',
      header: 'Rôle',
      width: 110,
      render: (u) => {
          const roleUpper = u.role_code?.toUpperCase();
          return (
            <Badge variant="soft" color={ROLE_COLORS[roleUpper] ?? 'gray'}>
              {roleUpper || '?'}
            </Badge>
          );
        },
    },
    {
      key: 'status',
      header: 'Statut',
      width: 90,
      render: (u) => (
        <Badge variant="soft" color={u.is_active ? 'green' : 'red'}>
          {u.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'end',
      width: 200,
      render: (u) => (
        <Flex gap="1">
          <Button size="1" variant="soft" onClick={() => onEditClick(u)} title="Modifier">
            <Pencil size={12} />
          </Button>
          <Button size="1" variant="soft" color="blue" onClick={() => onChangeRoleClick(u)} title="Changer le rôle">
            <Shield size={12} />
          </Button>
          <Button
            size="1"
            variant="soft"
            color={u.is_active ? 'red' : 'green'}
            onClick={() => onToggleActiveClick(u)}
            title={u.is_active ? 'Désactiver' : 'Activer'}
          >
            <Power size={12} />
          </Button>
          <Button size="1" variant="soft" color="orange" onClick={() => onResetPasswordClick(u)} title="Réinitialiser le mot de passe">
            <KeyRound size={12} />
          </Button>
        </Flex>
      ),
    },
  ], [onEditClick, onChangeRoleClick, onToggleActiveClick, onResetPasswordClick]);

  return (
    <DataTable
      headerProps={{
        icon: Users,
        title: 'Utilisateurs',
        count: pagination?.total,
        searchValue: search,
        onSearchChange,
        showSearchInput: true,
        actions: (
          <Flex gap="2" align="center">
            <Select.Root value={filterActive || '__all__'} onValueChange={(v) => onFilterActiveChange(v === '__all__' ? '' : v)} size="2">
              <Select.Trigger placeholder="Statut" />
              <Select.Content>
                {ACTIVE_OPTIONS.map((o) => (
                  <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Select.Root value={filterRole || '__all__'} onValueChange={(v) => onFilterRoleChange(v === '__all__' ? '' : v)} size="2">
              <Select.Trigger placeholder="Rôle" />
              <Select.Content>
                {ROLE_OPTIONS.map((o) => (
                  <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button size="2" onClick={onCreateClick}>
              <Plus size={14} /> Nouvel utilisateur
            </Button>
          </Flex>
        ),
      }}
      columns={columns}
      data={users}
      loading={loading}
      emptyState={{
        icon: Users,
        title: 'Aucun utilisateur',
        description: 'Créez un utilisateur pour commencer.',
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

AdminUsersTable.propTypes = {
  users: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  filterActive: PropTypes.string,
  onFilterActiveChange: PropTypes.func.isRequired,
  filterRole: PropTypes.string,
  onFilterRoleChange: PropTypes.func.isRequired,
  pagination: PropTypes.object,
  onCreateClick: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onChangeRoleClick: PropTypes.func.isRequired,
  onToggleActiveClick: PropTypes.func.isRequired,
  onResetPasswordClick: PropTypes.func.isRequired,
};
