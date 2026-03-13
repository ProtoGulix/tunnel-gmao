/**
 * @fileoverview Tableau des équipements avec recherche serveur, filtre par classe et pagination
 * @module components/equipements/EquipementTable
 *
 * Composant partagé utilisé par EquipementsPage et EquipementChildrenTab.
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Button, Badge, Select } from '@radix-ui/themes';
import { Search, Eye, Layers } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';
import ErrorState from '@/components/ui/ErrorState';

export default function EquipementTable({
  equipements, loading, error, getParentInfo,
  search, onSearchChange,
  classFilter, onClassFilterChange, facets,
  pagination, page, onPageChange, pageSize, onPageSizeChange,
  showParentColumn,
}) {
  const navigate = useNavigate();

  const classOptions = useMemo(
    () => facets.filter((f) => f.code !== null),
    [facets]
  );

  const columns = useMemo(
    () => [
      {
        key: 'health',
        header: 'Santé',
        width: 120,
        render: (eq) => <EquipementHealthBadge level={eq.health?.level || 'unknown'} />,
      },
      {
        key: 'equipement',
        header: 'Équipement',
        render: (eq) => (
          <Flex direction="column">
            <Text weight="medium" size="2">{eq.code || '—'} – {eq.name}</Text>
          </Flex>
        ),
      },
      {
        key: 'class',
        header: 'Classe',
        render: (eq) =>
          eq.equipement_class ? (
            <Badge variant="soft" size="1">{eq.equipement_class.code}</Badge>
          ) : (
            <Text size="2" color="gray">—</Text>
          ),
      },
      {
        key: 'cause',
        header: 'Cause',
        render: (eq) => <Text size="2" color="gray">{eq.health?.reason || '—'}</Text>,
      },
      ...(showParentColumn ? [
        {
          key: 'parent',
          header: 'Équipement mère',
          render: (eq) => {
            const parent = getParentInfo(eq.parent_id);
            return parent ? (
              <Text size="2">{parent.code || '—'} – {parent.name}</Text>
            ) : (
              <Text size="2" color="gray">—</Text>
            );
          },
        },
      ] : []),
      {
        key: 'action',
        header: 'Action',
        align: 'end',
        render: (eq) => (
          <Button size="1" variant="ghost" onClick={() => navigate(`/equipements/${eq.id}`)}>
            <Eye size={16} /> Voir
          </Button>
        ),
      },
    ],
    [getParentInfo, navigate, showParentColumn]
  );

  if (error) return <ErrorState error={error} />;

  return (
    <Box pt="4">
      {/* Filtre par classe */}
      {classOptions.length > 0 && (
        <Flex align="center" gap="2" mb="3">
          <Layers size={14} color="var(--gray-9)" />
          <Text size="2" color="gray" weight="medium">Classe :</Text>
          <Select.Root value={classFilter || '__all__'} onValueChange={(v) => onClassFilterChange(v === '__all__' ? '' : v)}>
            <Select.Trigger variant="soft" />
            <Select.Content>
              <Select.Item value="__all__">Toutes les classes</Select.Item>
              {classOptions.map((f) => (
                <Select.Item key={f.code} value={f.code}>
                  {f.label ?? f.code} ({f.count})
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      )}

      <DataTable
        headerProps={{
          icon: Search,
          title: 'Recherche',
          count: pagination.total,
          searchValue: search,
          onSearchChange,
          searchPlaceholder: 'Rechercher par code, nom ou affectation...',
          showSearchInput: true,
          showResetButton: true,
          showRefreshButton: false,
        }}
        columns={columns}
        data={equipements}
        loading={loading}
        emptyState={{
          icon: Search,
          title: 'Aucun équipement trouvé',
          description: search.trim() || classFilter
            ? 'Aucun équipement ne correspond à vos filtres.'
            : 'Aucun équipement disponible.',
        }}
      />

      {!loading && pagination.total > 0 && (
        <Box mt="4">
          <Pagination
            currentPage={page}
            totalItems={pagination.total}
            itemsPerPage={pageSize}
            onPageChange={onPageChange}
            onItemsPerPageChange={onPageSizeChange}
            pageSizeOptions={[25, 50, 100]}
          />
        </Box>
      )}
    </Box>
  );
}

EquipementTable.propTypes = {
  equipements: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  getParentInfo: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  classFilter: PropTypes.string.isRequired,
  onClassFilterChange: PropTypes.func.isRequired,
  facets: PropTypes.array.isRequired,
  pagination: PropTypes.object.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageSizeChange: PropTypes.func.isRequired,
  showParentColumn: PropTypes.bool,
};

EquipementTable.defaultProps = {
  showParentColumn: true,
};
