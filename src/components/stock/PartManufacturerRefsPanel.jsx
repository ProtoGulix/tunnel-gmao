/**
 * @fileoverview Panel des références fabricant d'une pièce — avec gestion CRUD inline
 * @module components/stock/PartManufacturerRefsPanel
 */

import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Separator, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, Factory, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import {
  addManufacturerRef, deleteManufacturerRef, setPreferredManufacturerRef, updateManufacturerRef,
} from '@/api/parts';
import PartSupplierRefsPanel from '@/components/stock/PartSupplierRefsPanel';
import StatusCallout from '@/components/ui/StatusCallout';

// ─── Formulaire inline ref fabricant ─────────────────────────────────────────

function MfrRefForm({ partId, initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    manufacturer_name: initial?.manufacturer_name || '',
    manufacturer_ref: initial?.manufacturer_ref || '',
    label: initial?.label || '',
    is_preferred: initial?.is_preferred || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.manufacturer_name.trim() || !form.manufacturer_ref.trim()) {
      setError('Nom fabricant et référence sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateManufacturerRef(initial.id, form);
      } else {
        await addManufacturerRef(partId, form);
      }
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box style={{ background: 'var(--violet-2)', border: '1px solid var(--violet-6)', borderRadius: 'var(--radius-3)', padding: 12, marginTop: 8 }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">{isEdit ? 'Modifier la référence fabricant' : 'Ajouter une référence fabricant'}</Text>
          {error && <StatusCallout type="error">{error}</StatusCallout>}
          <Flex gap="2" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 140 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fabricant *</Text>
              <TextField.Root value={form.manufacturer_name} onChange={set('manufacturer_name')} placeholder="ex: SKF" />
            </Box>
            <Box style={{ flex: 1, minWidth: 140 }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence fabricant *</Text>
              <TextField.Root value={form.manufacturer_ref} onChange={set('manufacturer_ref')} placeholder="ex: 6205-2RS" />
            </Box>
          </Flex>
          <Box>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Désignation</Text>
            <TextField.Root value={form.label} onChange={set('label')} placeholder="ex: Roulement à billes..." />
          </Box>
          <Flex justify="end" gap="2" pt="1">
            <Button type="button" size="1" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" size="1" color="violet" loading={saving}>{isEdit ? 'Enregistrer' : 'Ajouter'}</Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

MfrRefForm.propTypes = {
  partId: PropTypes.string.isRequired,
  initial: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// ─── Ligne ref fabricant ──────────────────────────────────────────────────────

function MfrRefRow({ mfrRef, partId, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [actionError, setActionError] = useState(null);

  const handleSetPreferred = useCallback(async () => {
    setActionError(null);
    try { await setPreferredManufacturerRef(mfrRef.id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Erreur'); }
  }, [mfrRef.id, onRefresh]);

  const handleDelete = useCallback(async () => {
    setActionError(null);
    try { await deleteManufacturerRef(mfrRef.id); onRefresh(); }
    catch (e) { setActionError(e?.response?.data?.detail || 'Impossible de supprimer (dernière référence?)'); }
  }, [mfrRef.id, onRefresh]);

  const supplierCount = mfrRef.supplier_refs?.length ?? 0;

  return (
    <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)', overflow: 'hidden' }}>
      {/* En-tête de la ref fabricant */}
      <Flex
        align="center" gap="2"
        style={{ padding: '7px 10px', background: 'var(--gray-2)', cursor: 'pointer' }}
        onClick={() => { if (!editing) setExpanded((v) => !v); }}
      >
        {expanded ? <ChevronDown size={13} color="var(--gray-9)" /> : <ChevronRight size={13} color="var(--gray-9)" />}
        <Factory size={12} color={mfrRef.is_preferred ? 'var(--violet-9)' : 'var(--gray-8)'} />
        <Badge variant={mfrRef.is_preferred ? 'solid' : 'soft'} color="violet" size="1" style={{ fontFamily: 'monospace' }}>
          {mfrRef.manufacturer_ref}
        </Badge>
        <Text size="1" color="gray">{mfrRef.manufacturer_name}</Text>
        {mfrRef.label && <Text size="1" color="gray">— {mfrRef.label}</Text>}
        {mfrRef.is_preferred && <Star size={11} fill="var(--amber-9)" color="var(--amber-9)" />}
        <Box style={{ flex: 1 }} />
        {supplierCount > 0 && (
          <Badge variant="soft" color="blue" size="1">{supplierCount} fourn.</Badge>
        )}
        <Flex gap="1" onClick={(e) => e.stopPropagation()}>
          {!mfrRef.is_preferred && (
            <Button size="1" variant="ghost" color="amber" title="Définir comme préférée" onClick={handleSetPreferred}>
              <Star size={11} />
            </Button>
          )}
          <Button size="1" variant="ghost" color="blue" title="Modifier" onClick={() => { setEditing((v) => !v); setExpanded(true); }}>
            <Pencil size={11} />
          </Button>
          <Button size="1" variant="ghost" color="red" title="Supprimer" onClick={handleDelete}>
            <Trash2 size={11} />
          </Button>
        </Flex>
      </Flex>

      {/* Formulaire d'édition inline */}
      {editing && (
        <Box px="2" pb="2">
          <MfrRefForm
            partId={partId}
            initial={mfrRef}
            onSaved={() => { setEditing(false); onRefresh(); }}
            onCancel={() => setEditing(false)}
          />
        </Box>
      )}

      {/* Refs fournisseur dépliables */}
      {expanded && !editing && (
        <Box px="2" pb="2" pt="1">
          <PartSupplierRefsPanel mfrRef={mfrRef} onRefresh={onRefresh} />
        </Box>
      )}

      {actionError && (
        <Text size="1" color="red" style={{ display: 'block', padding: '4px 10px', background: 'var(--red-2)' }}>
          {actionError}
        </Text>
      )}
    </Box>
  );
}

MfrRefRow.propTypes = {
  mfrRef: PropTypes.object.isRequired,
  partId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

// ─── Panel principal ──────────────────────────────────────────────────────────

export default function PartManufacturerRefsPanel({ part, onRefresh }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Box>
      <Separator size="4" />
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="bold" color="gray">
          Références fabricant ({part.manufacturer_refs?.length ?? 0})
        </Text>
        {!showForm && (
          <Button size="1" variant="soft" color="violet" onClick={() => setShowForm(true)}>
            <Plus size={12} /> Ajouter
          </Button>
        )}
      </Flex>

      <Flex direction="column" gap="2">
        {(part.manufacturer_refs || []).map((ref) => (
          <MfrRefRow key={ref.id} mfrRef={ref} partId={part.id} onRefresh={onRefresh} />
        ))}
        {(part.manufacturer_refs || []).length === 0 && (
          <Text size="2" color="gray">Aucune référence fabricant.</Text>
        )}
      </Flex>

      {showForm && (
        <MfrRefForm
          partId={part.id}
          onSaved={() => { setShowForm(false); onRefresh(); }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </Box>
  );
}

PartManufacturerRefsPanel.propTypes = {
  part: PropTypes.object.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
