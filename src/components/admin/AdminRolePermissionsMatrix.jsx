/**
 * @fileoverview Matrice de permissions — toutes les permissions en lignes, tous les rôles en colonnes
 * @module components/admin/AdminRolePermissionsMatrix
 */

import { Fragment, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Box, Flex, Text, Badge, Switch, Table, Spinner, ScrollArea, Button,
} from '@radix-ui/themes';
import { Shield, History } from 'lucide-react';
import { ROLE_COLORS } from '@/config/adminConfig';

export default function AdminRolePermissionsMatrix({ matrix, onToggle, onShowAudit }) {
  const [toggling, setToggling] = useState(null);

  const handleToggle = useCallback(async (permissionId, roleCode, endpointId, newAllowed) => {
    setToggling(permissionId);
    try {
      await onToggle(permissionId, roleCode, endpointId, newAllowed);
    } finally {
      setToggling(null);
    }
  }, [onToggle]);

  if (!matrix) return null;

  const { roles, modules } = matrix;
  const colSpan = roles.length + 1;

  return (
    <Box pt="2">
      <Flex justify="end" mb="3">
        <Button variant="ghost" size="1" onClick={onShowAudit}>
          <History size={14} />
          Historique des modifications
        </Button>
      </Flex>

      <ScrollArea>
        <Table.Root variant="surface" size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell style={{ minWidth: 300 }}>
                Permission
              </Table.ColumnHeaderCell>
              {roles.map((role) => (
                <Table.ColumnHeaderCell
                  key={role.id}
                  style={{ width: 90, textAlign: 'center' }}
                >
                  <Badge color={ROLE_COLORS[role.code] ?? 'gray'} variant="soft" size="1">
                    {role.code}
                  </Badge>
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {Object.entries(modules).map(([mod, endpoints]) => (
              <Fragment key={mod}>
                {/* Ligne de séparation de module */}
                <Table.Row style={{ background: 'var(--gray-3)' }}>
                  <Table.Cell colSpan={colSpan} style={{ padding: '6px 12px' }}>
                    <Flex align="center" gap="2">
                      <Shield size={13} color="var(--gray-11)" />
                      <Text size="1" weight="bold" color="gray"
                        style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {mod}
                      </Text>
                      <Badge variant="soft" color="gray" size="1">{endpoints.length}</Badge>
                    </Flex>
                  </Table.Cell>
                </Table.Row>

                {/* Lignes endpoint */}
                {endpoints.map((ep) => (
                  <Table.Row key={ep.endpoint_id}>
                    <Table.Cell>
                      {ep.description && (
                        <Text size="2" weight="medium" as="div">{ep.description}</Text>
                      )}
                      <Text size="1" color="gray" as="div" style={{ fontFamily: 'monospace' }}>
                        <Text
                          size="1"
                          weight="bold"
                          style={{
                            color: ep.method === 'GET' ? 'var(--green-11)'
                              : ep.method === 'POST' ? 'var(--blue-11)'
                              : ep.method === 'PATCH' || ep.method === 'PUT' ? 'var(--orange-11)'
                              : ep.method === 'DELETE' ? 'var(--red-11)'
                              : 'inherit',
                          }}
                        >
                          {ep.method}
                        </Text>
                        {' '}{ep.path}
                      </Text>
                    </Table.Cell>

                    {roles.map((role) => {
                      const perm = ep.permissions?.[role.code];
                      return (
                        <Table.Cell
                          key={role.id}
                          style={{ textAlign: 'center', verticalAlign: 'middle' }}
                        >
                          {!perm ? (
                            <Text color="gray" size="1">—</Text>
                          ) : toggling === perm.permission_id ? (
                            <Spinner size="1" />
                          ) : (
                            <Switch
                              checked={!!perm.allowed}
                              size="1"
                              onCheckedChange={(v) =>
                                handleToggle(perm.permission_id, role.code, ep.endpoint_id, v)
                              }
                            />
                          )}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                ))}
              </Fragment>
            ))}
          </Table.Body>
        </Table.Root>
      </ScrollArea>
    </Box>
  );
}

AdminRolePermissionsMatrix.propTypes = {
  matrix: PropTypes.shape({
    roles: PropTypes.array.isRequired,
    modules: PropTypes.object.isRequired,
  }),
  onToggle: PropTypes.func.isRequired,
  onShowAudit: PropTypes.func.isRequired,
};
