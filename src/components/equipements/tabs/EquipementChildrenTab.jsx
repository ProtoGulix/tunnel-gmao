/**
 * @fileoverview Onglet enfants d'un équipement
 * @module components/equipements/tabs/EquipementChildrenTab
 *
 * Affiche la liste paginée des enfants avec recherche
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, Button } from '@radix-ui/themes';
import { Eye, Search } from 'lucide-react';
import PropTypes from 'prop-types';
import DataTable from '@/components/ui/DataTable';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { useEquipementChildren } from '@/hooks/equipements/useEquipementChildren';

/**
 * Onglet liste des enfants d'un équipement
 */
export default function EquipementChildrenTab({ parentId, childrenCount }) {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const {
    children,
    loading,
    error,
    pagination,
    searchText,
    loadChildren,
    goToPage,
    changePageSize,
    search,
    resetSearch,
  } = useEquipementChildren(parentId);

  // Lazy loading : charge uniquement quand le composant est monté
  useEffect(() => {
    if (!isLoaded && parentId) {
      setIsLoaded(true);
      loadChildren(1, '');
    }
  }, [isLoaded, parentId, loadChildren]);

  const columns = [
    {
      key: 'health',
      header: 'Santé',
      width: 120,
      render: (child) => <EquipementHealthBadge level={child.health?.level || 'unknown'} />,
    },
    {
      key: 'code',
      header: 'Code',
      render: (child) => (
        <Text weight="medium" size="2">
          {child.code || '—'}
        </Text>
      ),
    },
    {
      key: 'name',
      header: 'Nom',
      render: (child) => (
        <Text size="2">{child.name}</Text>
      ),
    },
    {
      key: 'reason',
      header: 'Raison',
      render: (child) => (
        <Text size="2" color="gray">
          {child.health?.reason || '—'}
        </Text>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'end',
      render: (child) => (
        <Button
          size="1"
          variant="ghost"
          onClick={() => navigate(`/equipements/${child.id}`)}
        >
          <Eye size={16} /> Voir
        </Button>
      ),
    },
  ];

  if (!isLoaded) {
    return (
      <Box py="4">
        <Text color="gray">Chargement en attente...</Text>
      </Box>
    );
  }

  if (loading && children.length === 0) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  if (childrenCount === 0) {
    return (
      <Box py="4">
        <Text color="gray">Cet équipement n&apos;a pas d&apos;enfants.</Text>
      </Box>
    );
  }

  return (
    <Box pt="4">
      <DataTable
        headerProps={{
          icon: Search,
          title: 'Enfants',
          count: pagination.total,
          searchValue: searchText,
          onSearchChange: search,
          searchPlaceholder: 'Rechercher par code ou nom...',
          showSearchInput: true,
          showResetButton: searchText.trim().length > 0,
          onReset: resetSearch,
          showRefreshButton: false,
        }}
        columns={columns}
        data={children}
        loading={loading}
        emptyState={{
          icon: Search,
          title: 'Aucun enfant trouvé',
          description: searchText.trim()
            ? 'Aucun équipement ne correspond à votre recherche.'
            : 'Cet équipement n&apos;a pas d&apos;enfants.',
        }}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onPageChange: goToPage,
          onPageSizeChange: changePageSize,
        }}
      />
    </Box>
  );
}

EquipementChildrenTab.propTypes = {
  parentId: PropTypes.string.isRequired,
  childrenCount: PropTypes.number,
};
