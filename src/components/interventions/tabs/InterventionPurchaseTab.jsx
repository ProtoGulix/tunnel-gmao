/**
 * Onglet Achats d'une intervention.
 * Liste les DA liées via GET /purchase-requests/intervention/{id}/optimized.
 * Réutilise les composants communs du module achats.
 *
 * @module components/interventions/tabs/InterventionPurchaseTab
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { AlertTriangle, ShoppingCart } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import TableHeader from '@/components/ui/TableHeader';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import PurchaseRequestEditForm from '@/components/purchase-requests/PurchaseRequestEditForm';
import { fetchPurchaseRequestsByIntervention, fetchPurchaseRequestDetail, updatePurchaseRequest, deletePurchaseRequest } from '@/api/purchaseRequests';
import { PURCHASE_URGENCY, hexBadgeStyle } from '@/config/purchaseConfig';

function StatusBadge({ derivedStatus }) {
  if (!derivedStatus) return <Text size="1" color="gray">—</Text>;
  const style = hexBadgeStyle(derivedStatus.color);
  return (
    <Badge size="1" {...(style ? { style } : { color: 'gray', variant: 'soft' })}>
      {derivedStatus.label}
    </Badge>
  );
}

StatusBadge.propTypes = { derivedStatus: PropTypes.object };

const COLUMNS = [
  {
    header: 'Article',
    accessor: (row) => (
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          {row.urgent && <AlertTriangle size={12} color="var(--red-9)" />}
          <Text size="2" weight="medium">{row.item_label}</Text>
        </Flex>
        {row.stock_item_ref && (
          <Badge color="blue" variant="soft" size="1" style={{ width: 'fit-content' }}>
            {row.stock_item_ref}
          </Badge>
        )}
      </Flex>
    ),
  },
  {
    header: 'Qté',
    width: 80,
    accessor: (row) => <Text size="2">{row.quantity} {row.unit || 'pcs'}</Text>,
  },
  {
    header: 'Urgence',
    width: 90,
    accessor: (row) => (
      <Badge color={PURCHASE_URGENCY[row.urgency]?.color || 'gray'} variant="soft" size="1">
        {PURCHASE_URGENCY[row.urgency]?.label || 'Normal'}
      </Badge>
    ),
  },
  {
    header: 'Statut',
    width: 160,
    accessor: (row) => <StatusBadge derivedStatus={row.derived_status} />,
  },
  {
    header: 'Demandeur',
    width: 130,
    accessor: (row) => <Text size="1" color="gray">{row.requester_name || '—'}</Text>,
  },
];

export default function InterventionPurchaseTab({ interventionId, isLocked = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchPurchaseRequestsByIntervention(interventionId, 'list')
      .then(setItems)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [interventionId]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = useCallback(async (row) => {
    if (row.id === expandedRowId) {
      setExpandedRowId(null);
      setSelected(null);
      return;
    }
    setSelected(null);
    setExpandedRowId(row.id);
    setDetailLoading(true);
    try {
      const detail = await fetchPurchaseRequestDetail(row.id);
      setSelected(detail);
    } catch {
      setExpandedRowId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [expandedRowId]);

  const handleUpdate = async (data) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updatePurchaseRequest(selected.id, data);
      const detail = await fetchPurchaseRequestDetail(selected.id);
      setSelected(detail);
      setMode(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    await deletePurchaseRequest(selected.id);
    setSelected(null);
    setExpandedRowId(null);
    load();
  };

  const renderDetail = () => {
    if (detailLoading) return <LoadingState fullscreen={false} message="Chargement..." />;
    if (!selected) return null;
    if (mode === 'edit') {
      return (
        <PurchaseRequestEditForm
          item={selected}
          onSubmit={handleUpdate}
          loading={saving}
          onCancel={() => setMode(null)}
        />
      );
    }
    return (
      <PurchaseRequestDetail
        item={selected}
        onEdit={isLocked ? null : () => setMode('edit')}
        onDelete={isLocked ? null : handleDelete}
      />
    );
  };

  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <Box pt="4">
      <TableHeader
        icon={ShoppingCart}
        title="Demandes d'achat"
        count={items.length}
        searchValue=""
        onSearchChange={() => {}}
        loading={loading}
        showSearchInput={false}
        showRefreshButton={false}
      />

      <DataTable
        columns={COLUMNS}
        data={items}
        loading={loading}
        getRowKey={(row) => row.id}
        onRowClick={handleSelect}
        rowHover
        rowStyles={(row) =>
          row.id === expandedRowId
            ? { background: 'var(--accent-3)', boxShadow: 'inset 3px 0 0 var(--accent-9)' }
            : {}
        }
        isRowExpanded={(row) => row.id === expandedRowId}
        renderExpandedRow={renderDetail}
        emptyState={{
          icon: ShoppingCart,
          title: 'Aucune demande d\'achat',
          description: 'Créez une demande depuis une action ou via le bouton ci-dessus.',
        }}
      />
    </Box>
  );
}

InterventionPurchaseTab.propTypes = {
  interventionId: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
};
