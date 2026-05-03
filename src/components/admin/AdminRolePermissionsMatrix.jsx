/**
 * @fileoverview Matrice de permissions par rôle — toutes les colonnes de rôles, groupées par module
 * @module components/admin/AdminRolePermissionsMatrix
 */

import { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Flex, Text, Badge, Switch, Table, Spinner, ScrollArea,
} from '@radix-ui/themes';
import { Shield, History } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const ROLE_COLORS = {
  RESP: 'blue',
  TECH: 'green',
  OPE: 'gray',
  ADMIN: 'orange',
};

// Grouper les permissions par module (dérivé du préfixe de endpoint_code)
function groupByModule(permissions) {
  const groups = {};
  for (const p of permissions) {
    const parts = (p.endpoint_code || 'général').split(':');
    const mod = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : parts[0];
    if (!groups[mod]) groups[mod] = [];
    groups[mod].push(p);
  }
  return groups;
}

function PermissionRow({ perm, onToggle, toggling }) {
  return (
    <Table.Row>
      <Table.Cell>
        <Text size="2">{perm.endpoint_code}</Text>
        <Text size="1" color="gray" as="div">
          {perm.endpoint_method} {perm.endpoint_path}
        </Text>
      </Table.Cell>
      <Table.Cell align="center">
        {toggling === perm.id ? (
          <Spinner size="1" />
        ) : (
          <Switch
            checked={!!perm.allowed}
            onCheckedChange={(checked) => onToggle(perm.id, checked)}
            size="1"
          />
        )}
      </Table.Cell>
    </Table.Row>
  );
}

PermissionRow.propTypes = {
  perm: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  toggling: PropTypes.string,
};

export default function AdminRolePermissionsMatrix({
  roles,
  selectedRoleId,
  onSelectRole,
  permissions,
  loadingPermissions,
  errorPermissions,
  onTogglePermission,
  onShowAudit,
}) {
  const [toggling, setToggling] = useState(null);

  const grouped = useMemo(() => groupByModule(permissions), [permissions]);

  const handleToggle = useCallback(async (permId, newValue) => {
    setToggling(permId);
    try {
      await onTogglePermission(permId, newValue);
    } finally {
      setToggling(null);
    }
  }, [onTogglePermission]);

  return (
    <Flex gap="4" direction={{ initial: 'column', sm: 'row' }} pt="4">
      {/* Liste des rôles */}
      <Box style={{ minWidth: 200 }}>
        <Text size="2" weight="bold" color="gray" mb="2" as="div"
          style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Rôles
        </Text>
        <Flex direction="column" gap="1">
          {roles.map((role) => (
            <Box
              key={role.id}
              px="3" py="2"
              onClick={() => onSelectRole(role.id)}
              style={{
                cursor: 'pointer',
                borderRadius: 6,
                background: selectedRoleId === role.id ? 'var(--blue-3)' : 'transparent',
                border: selectedRoleId === role.id ? '1px solid var(--blue-6)' : '1px solid transparent',
              }}
            >
              <Flex align="center" gap="2">
                <Badge color={ROLE_COLORS[role.code] ?? 'gray'} variant="soft" size="1">
                  {role.code}
                </Badge>
                <Text size="2">{role.label || role.name}</Text>
              </Flex>
              {role.description && (
                <Text size="1" color="gray">{role.description}</Text>
              )}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Matrice */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        {!selectedRoleId && (
          <Flex align="center" justify="center" py="8">
            <Text color="gray">Sélectionnez un rôle pour voir ses permissions.</Text>
          </Flex>
        )}

        {selectedRoleId && loadingPermissions && <LoadingState />}
        {selectedRoleId && errorPermissions && <ErrorState error={errorPermissions} />}

        {selectedRoleId && !loadingPermissions && !errorPermissions && (
          <>
            <Flex justify="end" mb="3">
              <Box
                as="button"
                onClick={onShowAudit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  background: 'none', border: 'none', color: 'var(--gray-11)',
                  fontSize: 13, padding: '4px 8px', borderRadius: 4,
                }}
              >
                <History size={14} />
                Historique
              </Box>
            </Flex>

            <ScrollArea style={{ maxHeight: 600 }}>
              {Object.entries(grouped).map(([module, perms]) => (
                <Box key={module} mb="4">
                  <Flex align="center" gap="2" mb="2">
                    <Shield size={14} />
                    <Text size="2" weight="bold" style={{ textTransform: 'capitalize' }}>
                      Module : {module}
                    </Text>
                  </Flex>
                  <Table.Root variant="surface" size="1">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Permission</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell style={{ width: 80, textAlign: 'center' }}>
                          Autorisé
                        </Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {perms.map((perm) => (
                        <PermissionRow
                          key={perm.id}
                          perm={perm}
                          onToggle={handleToggle}
                          toggling={toggling}
                        />
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              ))}
            </ScrollArea>
          </>
        )}
      </Box>
    </Flex>
  );
}

AdminRolePermissionsMatrix.propTypes = {
  roles: PropTypes.array.isRequired,
  selectedRoleId: PropTypes.string,
  onSelectRole: PropTypes.func.isRequired,
  permissions: PropTypes.array.isRequired,
  loadingPermissions: PropTypes.bool,
  errorPermissions: PropTypes.string,
  onTogglePermission: PropTypes.func.isRequired,
  onShowAudit: PropTypes.func.isRequired,
};
