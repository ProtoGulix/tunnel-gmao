/**
 * @fileoverview Panel latéral — historique des modifications de permissions
 * @module components/admin/AdminPermissionAuditPanel
 */

import PropTypes from 'prop-types';
import { Box, Dialog, Flex, Text, Table, Spinner } from '@radix-ui/themes';
import { History } from 'lucide-react';

export default function AdminPermissionAuditPanel({ open, onOpenChange, audit, loading }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 640 }}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <History size={16} />
            Historique des permissions
          </Flex>
        </Dialog.Title>

        <Box mt="4">
          {loading && (
            <Flex align="center" justify="center" py="6">
              <Spinner />
            </Flex>
          )}

          {!loading && audit.length === 0 && (
            <Text color="gray" size="2">Aucun historique disponible.</Text>
          )}

          {!loading && audit.length > 0 && (
            <Table.Root variant="surface" size="1">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Permission</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Rôle</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Modifié par</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Valeur</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {audit.map((entry, i) => (
                  <Table.Row key={entry.id ?? i}>
                    <Table.Cell>
                      <Text size="1" color="gray">
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleString('fr-FR')
                          : '—'}
                      </Text>
                    </Table.Cell>
                    <Table.Cell><Text size="2">{entry.permission_name || entry.permission_code}</Text></Table.Cell>
                    <Table.Cell><Text size="2">{entry.role_code}</Text></Table.Cell>
                    <Table.Cell><Text size="2">{entry.changed_by || '—'}</Text></Table.Cell>
                    <Table.Cell>
                      <Text size="2" color={entry.allowed ? 'green' : 'red'} weight="bold">
                        {entry.allowed ? 'Autorisé' : 'Refusé'}
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

        <Flex justify="end" mt="4">
          <Dialog.Close>
            <Box as="button" style={{
              padding: '6px 16px', borderRadius: 6,
              background: 'var(--gray-3)', border: 'none', cursor: 'pointer',
              fontSize: 13,
            }}>
              Fermer
            </Box>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AdminPermissionAuditPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  audit: PropTypes.array.isRequired,
  loading: PropTypes.bool,
};
