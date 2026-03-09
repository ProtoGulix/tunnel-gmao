/**
 * @fileoverview Tableau familles de stock
 * @module components/stock/StockFamiliesTable
 */

import PropTypes from 'prop-types';
import { Button, Text } from '@radix-ui/themes';
import { Layers, Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

const columns = [
  {
    key: 'family_code',
    header: 'Famille',
    render: (row) => <Text weight="medium">{row.family_code}</Text>,
  },
  {
    key: 'sub_family_count',
    header: 'Sous-familles',
    align: 'end',
    render: (row) => <Text>{row.sub_family_count}</Text>,
  },
];

export default function StockFamiliesTable({ families, loading, selectedFamily, onSelectFamily, onCreate }) {
  return (
    <DataTable
      headerProps={{
        icon: Layers,
        title: 'Familles',
        count: families.length,
        showSearchInput: false,
        showRefreshButton: false,
        actions: (
          <Button size="2" color="blue" onClick={onCreate}>
            <Plus size={14} /> Ajouter
          </Button>
        ),
      }}
      columns={columns}
      data={families}
      loading={loading}
      onRowClick={onSelectFamily}
      rowStyles={(row) =>
        row.family_code === selectedFamily ? { background: 'var(--blue-2)' } : undefined
      }
      emptyState={{
        icon: Layers,
        title: 'Aucune famille',
        description: 'Aucune famille disponible.',
      }}
    />
  );
}

StockFamiliesTable.propTypes = {
  onCreate: PropTypes.func.isRequired,
  families: PropTypes.arrayOf(
    PropTypes.shape({
      family_code: PropTypes.string.isRequired,
      sub_family_count: PropTypes.number.isRequired,
    })
  ).isRequired,
  loading: PropTypes.bool.isRequired,
  selectedFamily: PropTypes.string,
  onSelectFamily: PropTypes.func.isRequired,
};
