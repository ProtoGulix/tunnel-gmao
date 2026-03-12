/**
 * @fileoverview Onglet orchestrateur des demandes d'intervention
 *
 * Gère : filtres statut (onglets facets), recherche, liste paginée,
 * détail en ligne expandable et formulaire de création.
 *
 * @module components/intervention-requests/tabs/InterventionRequestsTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { ClipboardList, Plus } from 'lucide-react';
import { useInterventionRequests } from '@/hooks/intervention-requests/useInterventionRequests';
import { createInterventionRequest } from '@/api/intervention-requests';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import Pagination from '@/components/ui/Pagination';
import InterventionRequestDetail from '@/components/intervention-requests/InterventionRequestDetail';
import InterventionRequestForm from '@/components/intervention-requests/InterventionRequestForm';
import StatutTabs from '@/components/intervention-requests/StatutTabs';

// ─── Colonnes ─────────────────────────────────────────────────────────────────

const ELLIPSIS = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300, display: 'block' };
const formatDay = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const columns = [
  { key: 'code', header: 'Code', width: 160,
    render: (row) => <Text size="2" weight="medium" style={{ fontFamily: 'monospace' }}>{row.code}</Text> },
  { key: 'machine', header: 'Équipement',
    render: (row) => (
      <Flex align="center" gap="2">
        {row.equipement?.code && <Badge color="gray" variant="soft" size="1">{row.equipement.code}</Badge>}
        <Text size="2">{row.equipement?.name ?? '—'}</Text>
      </Flex>
    ) },
  { key: 'demandeur', header: 'Demandeur', width: 200,
    render: (row) => (
      <Flex direction="column" gap="0">
        <Text size="2">{row.demandeur_nom}</Text>
        {row.demandeur_service && <Text size="1" color="gray">{row.demandeur_service}</Text>}
      </Flex>
    ) },
  { key: 'description', header: 'Description',
    render: (row) => <Text size="2" color="gray" style={ELLIPSIS}>{row.description}</Text> },
  { key: 'statut', header: 'Statut', width: 120,
    render: (row) => (
      <Badge style={{ backgroundColor: row.statut_color + '22', color: row.statut_color }} variant="soft" radius="full">
        {row.statut_label}
      </Badge>
    ) },
  { key: 'created_at', header: 'Créée le', width: 110,
    render: (row) => <Text size="1" color="gray">{formatDay(row.created_at)}</Text> },
];

// ─── Tab principal ────────────────────────────────────────────────────────────

export default function InterventionRequestsTab() {
  const {
    items,
    loading,
    error,
    search,
    setSearch,
    statut,
    setStatut,
    facets,
    page,
    setPage,
    pageSize,
    changePageSize,
    total,
    refresh,
  } = useInterventionRequests();

  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | null
  const [saving, setSaving] = useState(false);

  const handleRowClick = useCallback(
    (row) => {
      if (mode === 'create') return;
      setSelectedId((prev) => (prev === row.id ? null : row.id));
    },
    [mode]
  );

  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      await createInterventionRequest(formData);
      setMode(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box>
      {/* Formulaire de création */}
      {mode === 'create' && (
        <InterventionRequestForm
          onSubmit={handleCreate}
          onCancel={() => setMode(null)}
          saving={saving}
        />
      )}

      {/* En-tête avec recherche */}
      <TableHeader
        icon={ClipboardList}
        title="Demandes d'intervention"
        count={total}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par code, demandeur ou description…"
        loading={loading}
        showRefreshButton
        onRefresh={refresh}
        rightActions={
          mode !== 'create' && (
            <Button
              size="2"
              color="blue"
              onClick={() => { setSelectedId(null); setMode('create'); }}
            >
              <Plus size={14} />
              Nouvelle demande
            </Button>
          )
        }
      />

      {/* Onglets statut (depuis facets) */}
      {facets.statut?.length > 0 && (
        <Box mb="3">
          <StatutTabs
            facets={facets.statut}
            activeStatut={statut}
            onStatutChange={setStatut}
          />
        </Box>
      )}

      {/* Tableau */}
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        onRowClick={handleRowClick}
        getRowKey={(row) => row.id}
        rowStyles={(row) => ({
          cursor: 'pointer',
          background: row.id === selectedId ? 'var(--accent-3)' : undefined,
          boxShadow: row.id === selectedId ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        })}
        isRowExpanded={(row) => row.id === selectedId}
        renderExpandedRow={(row) => (
          <InterventionRequestDetail
            requestId={row.id}
            onTransitionDone={refresh}
          />
        )}
        emptyState={{
          icon: ClipboardList,
          title: 'Aucune demande',
          description: 'Aucune demande d\'intervention ne correspond aux filtres.',
        }}
      />

      {/* Pagination */}
      {total > pageSize && (
        <Box mt="3">
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemsPerPageChange={changePageSize}
          />
        </Box>
      )}
    </Box>
  );
}
