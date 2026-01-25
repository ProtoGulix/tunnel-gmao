/**
 * @fileoverview Page liste des équipements
 * @module EquipementsList
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Table, Text, Button, Container } from '@radix-ui/themes';
import { Search, Eye } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import EquipementHealthBadge from '@/components/common/EquipementHealthBadge';
import { useEquipements } from '@/hooks/useEquipements';
import { useApiCall } from '@/hooks/useApiCall';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

/**
 * Page liste des équipements
 * Affiche tous les équipements avec santé, cause et hiérarchie
 *
 * @component
 * @returns {JSX.Element} Page équipements
 *
 * @example
 * <EquipementsList />
 */
export default function EquipementsList() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');

  // Charger cache des équipements
  const {
    equipements: rawEquipements,
    getParentInfo,
    loading: cacheLoading,
    error: cacheError,
  } = useEquipements();

  // S'assurer que c'est un array
  const equipementList = Array.isArray(rawEquipements) ? rawEquipements : [];

  // Charger la liste complète (depuis le cache)
  const { data: rawList, loading, error } = useApiCall(
    adapter.equipements.fetchEquipements,
    { autoExecute: true }
  );

  // S'assurer que list est toujours un array
  const list = Array.isArray(rawList) ? rawList : [];

  // Filtrer par recherche
  const filteredEquipements = useMemo(() => {
    if (!searchText.trim()) return list;

    const query = searchText.toLowerCase();
    return list.filter(
      (eq) =>
        (eq.code && eq.code.toLowerCase().includes(query)) ||
        (eq.name && eq.name.toLowerCase().includes(query))
    );
  }, [list, searchText]);

  if (error || cacheError) {
    return (
      <Container>
        <PageHeader title="Équipements" />
        <ErrorDisplay error={error || cacheError} />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader title="Équipements" description="Liste de tous les équipements" />

      {/* Recherche */}
      <Box mb="4">
        <Flex align="center" gap="2" mb="3" asChild>
          <label>
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher par code ou nom..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--gray-7)',
                borderRadius: '4px',
                flex: 1,
                fontSize: '14px',
              }}
            />
          </label>
        </Flex>
        <Text size="1" color="gray">
          {filteredEquipements.length} équipement{filteredEquipements.length !== 1 ? 's' : ''} trouvé
          {filteredEquipements.length !== 1 ? 's' : ''}
        </Text>
      </Box>

      {/* Tableau */}
      <Box overflowX="auto">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Santé</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Équipement</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Cause</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Équipement mère</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell align="right">Action</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {filteredEquipements.map((eq) => {
              const parentInfo = getParentInfo(eq.parentId);

              return (
                <Table.Row key={eq.id}>
                  <Table.Cell>
                    <EquipementHealthBadge level={eq.health.level} />
                  </Table.Cell>

                  <Table.Cell>
                    <Flex direction="column">
                      <Text weight="medium" size="2">
                        {eq.code || '—'} – {eq.name}
                      </Text>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <Text size="2" color="gray">
                      {eq.health.reason}
                    </Text>
                  </Table.Cell>

                  <Table.Cell>
                    {parentInfo ? (
                      <Text size="2">
                        {parentInfo.code || '—'} – {parentInfo.name}
                      </Text>
                    ) : (
                      <Text size="2" color="gray">
                        —
                      </Text>
                    )}
                  </Table.Cell>

                  <Table.Cell align="right">
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => navigate(`/equipements/${eq.id}`)}
                    >
                      <Eye size={16} />
                      Voir
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        {filteredEquipements.length === 0 && !loading && (
          <Flex align="center" justify="center" py="6">
            <Text color="gray">Aucun équipement trouvé</Text>
          </Flex>
        )}
      </Box>
    </Container>
  );
}
