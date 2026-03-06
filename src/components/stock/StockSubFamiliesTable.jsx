/**
 * @fileoverview Tableau sous-familles de stock
 * @module components/stock/StockSubFamiliesTable
 */

import PropTypes from 'prop-types';
import { Button, Text } from '@radix-ui/themes';
import { Pencil, Layers, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const columns = [
  {
    key: 'family_code',
    header: 'Famille',
    render: (row) => <Text weight="medium">{row.family_code}</Text>,
  },
  {
    key: 'code',
    header: 'Sous-famille',
    render: (row) => <Text>{row.code}</Text>,
  },
  {
    key: 'label',
    header: 'Libelle',
    render: (row) => <Text>{row.label}</Text>,
  },
  {
    key: 'template',
    header: 'Template',
    render: (row) => (
      <Text color="gray">
        {row.template?.label || row.template?.code || 'Aucun'}
      </Text>
    ),
  },
  {
    key: 'action',
    header: 'Action',
    align: 'end',
    render: (row, onEdit) => onEdit(row),
  },
];

export default function StockSubFamiliesTable({ subFamilies, loading, onEdit, onCreate }) {
  const tableColumns = columns.map((col) => {
    if (col.key !== 'action') return col;
    return {
      ...col,
      render: (row) => (
        <Button size="1" variant="ghost" onClick={() => onEdit(row)}>
          <Pencil size={14} /> Editer
        </Button>
      ),
    };
  });

  return (
    <DataTable
      headerProps={{
        icon: Layers,
        title: 'Sous-familles',
        count: subFamilies.length,
        showSearchInput: false,
        showRefreshButton: false,
        actions: (
          <Button size="2" color="blue" onClick={onCreate}>
            <Plus size={14} /> Ajouter
          </Button>
        ),
      }}
      columns={tableColumns}
      data={subFamilies}
      loading={loading}
      emptyState={{
        icon: Layers,
        title: 'Aucune sous-famille',
        description: 'Aucune sous-famille disponible.',
      }}
    />
  );
}

StockSubFamiliesTable.propTypes = {
  subFamilies: PropTypes.arrayOf(
    PropTypes.shape({
      family_code: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      template: PropTypes.shape({
        id: PropTypes.string,
        code: PropTypes.string,
        label: PropTypes.string,
      }),
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
