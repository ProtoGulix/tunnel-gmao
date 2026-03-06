/**
 * @fileoverview Tableau liste des fournisseurs
 * @module components/suppliers/SuppliersTable
 */

import PropTypes from 'prop-types';
import { Badge, Text, Button } from '@radix-ui/themes';
import { Truck, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const columns = [
  {
    key: 'name',
    header: 'Nom',
    render: (row) => <Text weight="medium">{row.name}</Text>,
  },
  {
    key: 'code',
    header: 'Code',
    width: 80,
    render: (row) => row.code || '-',
  },
  {
    key: 'contact_name',
    header: 'Contact',
    render: (row) => row.contact_name || '-',
  },
  {
    key: 'is_active',
    header: 'Statut',
    width: 90,
    render: (row) => (
      <Badge color={row.is_active ? 'green' : 'gray'} variant="soft">
        {row.is_active ? 'Actif' : 'Inactif'}
      </Badge>
    ),
  },
];

export default function SuppliersTable({ suppliers, loading, search, onSearchChange, selectedId, onSelect, onCreate }) {
  return (
    <DataTable
      headerProps={{
        icon: Truck,
        title: 'Fournisseurs',
        count: suppliers.length,
        searchValue: search,
        onSearchChange,
        loading,
        actions: (
          <Button size="2" color="blue" onClick={onCreate}>
            <Plus size={14} /> Ajouter
          </Button>
        ),
      }}
      columns={columns}
      data={suppliers}
      loading={loading}
      onRowClick={onSelect}
      rowStyles={(row) =>
        row.id === selectedId ? { background: 'var(--blue-2)' } : undefined
      }
      emptyState={{
        icon: Truck,
        title: 'Aucun fournisseur',
        description: 'Aucun fournisseur ne correspond a la recherche.',
      }}
    />
  );
}

SuppliersTable.propTypes = {
  suppliers: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
