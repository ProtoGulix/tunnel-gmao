/**
 * @fileoverview Table des fabricants
 * @module components/suppliers/ManufacturersTable
 */

import PropTypes from 'prop-types';
import { Box, Button, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { Factory, Plus, Search } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';

export default function ManufacturersTable({
  manufacturers,
  total,
  page,
  pageSize,
  loading,
  search,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  selectedId,
  onSelect,
  onCreate,
}) {
  return (
    <Flex direction="column" gap="3">
      <Flex gap="2" align="center">
        <Box style={{ flex: 1 }}>
          <TextField.Root
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un fabricant..."
          >
            <TextField.Slot>
              <Search size={14} />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        <Button size="2" color="blue" onClick={onCreate}>
          <Plus size={14} /> Ajouter
        </Button>
      </Flex>

      <Text size="2" color="gray">
        {total} fabricant{total !== 1 ? 's' : ''}
      </Text>

      {loading ? (
        <LoadingState message="Chargement des fabricants..." />
      ) : (
        <Table.Root variant="surface" size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Fabricant</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Reference catalogue</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {manufacturers.map((m) => (
              <Table.Row
                key={m.id}
                onClick={() => onSelect(m)}
                style={{
                  cursor: 'pointer',
                  background: m.id === selectedId ? 'var(--blue-3)' : undefined,
                }}
              >
                <Table.Cell>
                  <Flex align="center" gap="2">
                    <Factory size={13} color="var(--gray-9)" />
                    <Text size="2" weight={m.id === selectedId ? 'bold' : 'regular'}>
                      {m.manufacturer_name}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text size="2" color="gray">
                    {m.manufacturer_ref || '—'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
            {manufacturers.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={2}>
                  <Text size="2" color="gray">
                    Aucun fabricant trouve.
                  </Text>
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      )}

      <Pagination
        currentPage={page}
        totalItems={total}
        itemsPerPage={pageSize}
        onPageChange={onPageChange}
        onItemsPerPageChange={onPageSizeChange}
        pageSizeOptions={[25, 50, 100]}
      />
    </Flex>
  );
}

ManufacturersTable.propTypes = {
  manufacturers: PropTypes.array.isRequired,
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  loading: PropTypes.bool,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
