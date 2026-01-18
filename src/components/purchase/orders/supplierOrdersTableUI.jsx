import { Flex } from '@radix-ui/themes';
import { TruckIcon } from 'lucide-react';
import FilterSelect from '@/components/common/FilterSelect';
import { STATUS_FILTER_OPTIONS } from './supplierOrdersTableHelpers';

export const buildHeaderProps = ({
  showHeader,
  ordersLength,
  searchTerm,
  onSearchChange,
  onRefresh,
  statusFilter,
  onStatusFilterChange,
  supplierFilter,
  onSupplierFilterChange,
  supplierOptions,
}) => {
  if (!showHeader) return null;
  
  const actions = [];
  
  if (typeof statusFilter !== 'undefined') {
    actions.push(
      <FilterSelect
        key="status-filter"
        label="Statut"
        value={statusFilter}
        onValueChange={onStatusFilterChange}
        minWidth="200px"
        inline
        options={STATUS_FILTER_OPTIONS}
      />
    );
  }
  
  if (typeof supplierFilter !== 'undefined') {
    actions.push(
      <FilterSelect
        key="supplier-filter"
        label="Fournisseur"
        value={supplierFilter}
        onValueChange={onSupplierFilterChange}
        minWidth="220px"
        inline
        options={supplierOptions}
      />
    );
  }
  
  return {
    icon: TruckIcon,
    title: 'Paniers fournisseurs',
    count: ordersLength,
    searchValue: searchTerm,
    onSearchChange,
    onRefresh,
    showRefreshButton: true,
    searchPlaceholder: 'Recherche (n°, fournisseur...)',
    actions: actions.length > 0 ? <Flex align="center" gap="2">{actions}</Flex> : null,
  };
};

export const buildColumns = (sortKey, sortDir, toggleSort) => [
  { key: 'orderSupplier', header: 'Fournisseur / N°' },
  {
    key: 'age',
    header: (
      <span style={{ cursor: 'pointer' }} onClick={() => toggleSort('age')}>
        Âge (j)
        {sortKey === 'age' ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
      </span>
    ),
  },
  { key: 'lineCount', header: 'Nb lignes' },
  { key: 'urgency', header: 'Urgence' },
  { key: 'statusSelect', header: 'Statut' },
  { key: 'actions', header: 'Actions' },
];
