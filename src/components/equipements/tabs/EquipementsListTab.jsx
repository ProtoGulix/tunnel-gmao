/**
 * @fileoverview Onglet liste des équipements
 * @module components/equipements/tabs/EquipementsListTab
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Button, Badge } from '@radix-ui/themes';
import { Search, Eye } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/**
 * Onglet liste des équipements avec recherche et santé
 */
export default function EquipementsListTab({ equipements, loading, error, getParentInfo }) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  const filteredEquipements = useMemo(() => {
    if (!searchText.trim()) return equipements;
    const query = searchText.toLowerCase();
    return equipements.filter(
      (eq) =>
        (eq.code && eq.code.toLowerCase().includes(query)) ||
        (eq.name && eq.name.toLowerCase().includes(query))
    );
  }, [equipements, searchText]);

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
            <Text weight="medium" size="2">
              {eq.code || '—'} – {eq.name}
            </Text>
          </Flex>
        ),
      },
      {
        key: 'class',
        header: 'Classe',
        render: (eq) =>
          eq.equipement_class ? (
            <Badge variant="soft" size="1">
              {eq.equipement_class.code}
            </Badge>
          ) : (
            <Text size="2" color="gray">
              —
            </Text>
          ),
      },
      {
        key: 'cause',
        header: 'Cause',
        render: (eq) => (
          <Text size="2" color="gray">
            {eq.health?.reason || '—'}
          </Text>
        ),
      },
      {
        key: 'parent',
        header: 'Équipement mère',
        render: (eq) => {
          const parent = getParentInfo(eq.parent_id);
          return parent ? (
            <Text size="2">
              {parent.code || '—'} – {parent.name}
            </Text>
          ) : (
            <Text size="2" color="gray">
              —
            </Text>
          );
        },
      },
      {
        key: 'action',
        header: 'Action',
        align: 'end',
        render: (eq) => (
          <Button
            size="1"
            variant="ghost"
            onClick={() => navigate(`/equipements/${eq.id}`)}
          >
            <Eye size={16} /> Voir
          </Button>
        ),
      },
    ],
    [getParentInfo, navigate]
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <Box pt="4">
      <DataTable
        headerProps={{
          icon: Search,
          title: 'Recherche',
          count: filteredEquipements.length,
          searchValue: searchText,
          onSearchChange: setSearchText,
          searchPlaceholder: 'Rechercher par code ou nom...',
          showSearchInput: true,
          showResetButton: true,
          showRefreshButton: false,
        }}
        columns={columns}
        data={filteredEquipements}
        loading={loading}
        emptyState={{
          icon: Search,
          title: 'Aucun équipement trouvé',
          description: searchText.trim()
            ? 'Aucun équipement ne correspond à votre recherche.'
            : 'Aucun équipement disponible.',
        }}
      />
    </Box>
  );
}

EquipementsListTab.propTypes = {
  equipements: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  getParentInfo: PropTypes.func.isRequired,
};
