/**
 * @fileoverview Section fournisseurs du détail d'une pièce référencée
 * @module components/stock/StockItemSuppliers
 */

import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { Badge, Box, Button, Flex, Separator, Text } from '@radix-ui/themes';
import { Star, Trash2, Plus, Pencil } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { deleteSupplierItemLink, setPreferredSupplierItemLink, createSupplierItemLink, updateSupplierItemLink } from '@/api/suppliers';
import SupplierItemForm from '@/components/suppliers/SupplierItemForm';

export function SuppliersSection({ suppliers, stockItemId, stockItemLabel, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleSetPreferred = useCallback(async (row) => {
    setActionError(null);
    try {
      await setPreferredSupplierItemLink(row.id);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la mise à jour du fournisseur préféré');
    }
  }, [onRefresh]);

  const handleDelete = useCallback(async (row) => {
    setActionError(null);
    try {
      await deleteSupplierItemLink(row.id);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'Impossible de supprimer ce fournisseur');
    }
  }, [onRefresh]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    onRefresh();
  }, [onRefresh]);

  const handleEditSuccess = useCallback(() => {
    setEditingRow(null);
    onRefresh();
  }, [onRefresh]);

  const handleCreate = useCallback(async (payload) => {
    setSaving(true);
    try {
      await createSupplierItemLink(payload);
      handleFormSuccess();
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.message || 'Erreur lors de la création.');
    } finally {
      setSaving(false);
    }
  }, [handleFormSuccess]);

  const handleEdit = useCallback(async (payload) => {
    setSaving(true);
    try {
      await updateSupplierItemLink(editingRow.id, payload);
      handleEditSuccess();
    } catch (err) {
      setActionError(err?.response?.data?.detail || err?.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  }, [editingRow, handleEditSuccess]);

  const columns = [
    {
      key: 'name',
      header: 'Fournisseur',
      render: (row) => (
        <Flex align="center" gap="1">
          {row.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
          <Text size="2" weight={row.is_preferred ? 'medium' : 'regular'}>{row.supplier_name}</Text>
        </Flex>
      ),
    },
    {
      key: 'ref',
      header: 'Réf. fourn.',
      render: (row) => <Badge variant="soft" color="indigo" size="1">{row.supplier_ref}</Badge>,
    },
    {
      key: 'manufacturer',
      header: 'Réf. fabricant',
      render: (row) => row.manufacturer_item ? (
        <Flex direction="column" gap="0">
          <Badge variant="soft" color="violet" size="1">{row.manufacturer_item.manufacturer_ref}</Badge>
          <Text size="1" color="gray">{row.manufacturer_item.manufacturer_name}</Text>
        </Flex>
      ) : <Text size="1" color="gray">—</Text>,
    },
    {
      key: 'price',
      header: 'Prix unit.',
      align: 'right',
      render: (row) => <Text size="2">{row.unit_price != null ? `${row.unit_price} €` : '—'}</Text>,
    },
    {
      key: 'moq',
      header: 'Qté min.',
      align: 'right',
      render: (row) => <Text size="2" color="gray">{row.min_order_quantity ?? '—'}</Text>,
    },
    {
      key: 'delay',
      header: 'Délai',
      align: 'right',
      render: (row) => <Text size="2" color="gray">{row.delivery_time_days != null ? `${row.delivery_time_days} j` : '—'}</Text>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Flex gap="1" justify="end">
          {!row.is_preferred && (
            <Button size="1" variant="ghost" color="amber" title="Définir comme fournisseur préféré" onClick={() => handleSetPreferred(row)}>
              <Star size={12} />
            </Button>
          )}
          <Button size="1" variant="ghost" color="blue" title="Modifier" onClick={() => { setEditingRow(row); setShowForm(false); }}>
            <Pencil size={12} />
          </Button>
          <Button size="1" variant="ghost" color="red" title="Supprimer" onClick={() => handleDelete(row)}>
            <Trash2 size={12} />
          </Button>
        </Flex>
      ),
    },
  ];

  return (
    <>
      <Separator size="4" />
      <Box>
        <Flex justify="between" align="center" mb="2">
          <Text size="2" weight="bold" color="gray">Fournisseurs ({suppliers.length})</Text>
          {!showForm && !editingRow && (
            <Button size="1" variant="soft" onClick={() => setShowForm(true)}>
              <Plus size={12} /> Ajouter
            </Button>
          )}
        </Flex>
        {actionError && (
          <Text size="1" color="red" style={{ display: 'block', marginBottom: 8 }}>{actionError}</Text>
        )}
        {suppliers.length === 0
          ? <Text size="2" color="gray">Aucun fournisseur référencé.</Text>
          : <DataTable columns={columns} data={suppliers} size="1" variant="ghost" getRowKey={(r) => r.id} />}
        {showForm && (
          <SupplierItemForm
            stockItemId={stockItemId}
            stockItemLabel={stockItemLabel}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={saving}
          />
        )}
        {editingRow && (
          <SupplierItemForm
            link={editingRow}
            stockItemId={stockItemId}
            stockItemLabel={stockItemLabel}
            onSubmit={handleEdit}
            onCancel={() => setEditingRow(null)}
            saving={saving}
          />
        )}
      </Box>
    </>
  );
}

SuppliersSection.propTypes = {
  suppliers: PropTypes.array.isRequired,
  stockItemId: PropTypes.string.isRequired,
  stockItemLabel: PropTypes.string,
  onRefresh: PropTypes.func.isRequired,
};

