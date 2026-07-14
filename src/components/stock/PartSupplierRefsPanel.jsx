/**
 * @fileoverview Refs fournisseur d'une ref fabricant — tableau standard + ghost row d'ajout
 * @module components/stock/PartSupplierRefsPanel
 */

import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { Badge, Flex, IconButton, Table, Text } from '@radix-ui/themes';
import { ExternalLink, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { deleteSupplierRef, setPreferredSupplierRef } from '@/api/parts';
import SupplierRefFormRow from '@/components/stock/SupplierRefFormRow';

const COLSPAN = 7;

function SupplierRefRow({ sup, onEdit, onDelete, onSetPreferred }) {
  return (
    <Table.Row>
      <Table.Cell>
        {sup.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
      </Table.Cell>
      <Table.Cell>
        <Text size="1" weight={sup.is_preferred ? 'bold' : 'regular'}>{sup.supplier_name || sup.supplier_id}</Text>
      </Table.Cell>
      <Table.Cell>
        <Badge variant="soft" color="indigo" size="1">{sup.supplier_ref}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Text size="1" color="gray">{sup.unit_price != null ? `${sup.unit_price} €` : '-'}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="1" color="gray">{sup.delivery_time_days != null ? `${sup.delivery_time_days} j` : '-'}</Text>
      </Table.Cell>
      <Table.Cell>
        {sup.product_url && /^https?:\/\//i.test(sup.product_url) && (
          <a href={sup.product_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue-9)', display: 'flex' }}>
            <ExternalLink size={11} />
          </a>
        )}
      </Table.Cell>
      <Table.Cell>
        <Flex gap="1" justify="end">
          {!sup.is_preferred && (
            <IconButton size="1" variant="ghost" color="amber" title="Définir comme préféré" onClick={() => onSetPreferred(sup.id)}>
              <Star size={11} />
            </IconButton>
          )}
          <IconButton size="1" variant="ghost" color="blue" title="Modifier" onClick={() => onEdit(sup.id)}>
            <Pencil size={11} />
          </IconButton>
          <IconButton size="1" variant="ghost" color="red" title="Supprimer" onClick={() => onDelete(sup.id)}>
            <Trash2 size={11} />
          </IconButton>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

SupplierRefRow.propTypes = {
  sup: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
};

function GhostAddRow({ onClick }) {
  return (
    <Table.Row
      onClick={onClick}
      style={{ cursor: 'pointer', color: 'var(--gray-9)' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <Table.Cell colSpan={COLSPAN}>
        <Flex align="center" gap="2">
          <Plus size={12} />
          <Text size="1" color="gray">Lier un fournisseur (existant ou nouvelle référence)…</Text>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

GhostAddRow.propTypes = { onClick: PropTypes.func.isRequired };

export default function PartSupplierRefsPanel({ mfrRef, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleSetPreferred = useCallback(async (id) => {
    setActionError(null);
    try { await setPreferredSupplierRef(id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Erreur'); }
  }, [onRefresh]);

  const handleDelete = useCallback(async (id) => {
    setActionError(null);
    try { await deleteSupplierRef(id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Erreur'); }
  }, [onRefresh]);

  const supplierRefs = mfrRef.supplier_refs || [];

  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray" weight="bold">Fournisseurs</Text>

      {actionError && <Text size="1" color="red">{actionError}</Text>}

      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell style={{ width: 24 }} />
            <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell />
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {supplierRefs.map((sup) => (
            editingId === sup.id ? (
              <SupplierRefFormRow
                key={sup.id}
                mfrRefId={mfrRef.id}
                initial={sup}
                colSpan={COLSPAN}
                onSaved={() => { setEditingId(null); onRefresh(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <SupplierRefRow
                key={sup.id}
                sup={sup}
                onEdit={(id) => { setEditingId(id); setShowForm(false); }}
                onDelete={handleDelete}
                onSetPreferred={handleSetPreferred}
              />
            )
          ))}

          {showForm ? (
            <SupplierRefFormRow
              mfrRefId={mfrRef.id}
              colSpan={COLSPAN}
              onSaved={() => { setShowForm(false); onRefresh(); }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <GhostAddRow onClick={() => { setShowForm(true); setEditingId(null); }} />
          )}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}

PartSupplierRefsPanel.propTypes = {
  mfrRef: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
