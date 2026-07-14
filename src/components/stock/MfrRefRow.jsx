/**
 * @fileoverview Section d'une ref fabricant — en-tête + son tableau fournisseurs, toujours visible
 * @module components/stock/MfrRefRow
 */

import PropTypes from 'prop-types';
import { useCallback, useState } from 'react';
import { Badge, Box, Flex, IconButton, Text } from '@radix-ui/themes';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { deleteManufacturerRef, setPreferredManufacturerRef } from '@/api/parts';
import MfrRefFormRow from '@/components/stock/MfrRefFormRow';
import PartSupplierRefsPanel from '@/components/stock/PartSupplierRefsPanel';

function MfrRefHeader({ mfrRef, onEdit, onSetPreferred, onDelete }) {
  return (
    <Flex align="center" gap="2">
      <Badge variant={mfrRef.is_preferred ? 'solid' : 'soft'} color="violet" size="1" style={{ fontFamily: 'monospace' }}>
        {mfrRef.manufacturer_ref}
      </Badge>
      <Text size="2" color="gray">{mfrRef.manufacturer_name}</Text>
      {mfrRef.label && <Text size="2" color="gray">— {mfrRef.label}</Text>}
      {mfrRef.is_preferred && <Star size={12} fill="var(--amber-9)" color="var(--amber-9)" />}
      <Box style={{ flex: 1 }} />
      <Flex gap="1">
        {!mfrRef.is_preferred && (
          <IconButton size="1" variant="ghost" color="amber" title="Définir comme préférée" onClick={onSetPreferred}>
            <Star size={11} />
          </IconButton>
        )}
        <IconButton size="1" variant="ghost" color="blue" title="Modifier" onClick={onEdit}>
          <Pencil size={11} />
        </IconButton>
        <IconButton size="1" variant="ghost" color="red" title="Supprimer" onClick={onDelete}>
          <Trash2 size={11} />
        </IconButton>
      </Flex>
    </Flex>
  );
}

MfrRefHeader.propTypes = {
  mfrRef: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onSetPreferred: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MfrRefRow({ mfrRef, partId, onRefresh }) {
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

  return (
    <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-3)', padding: 10 }}>
      <MfrRefHeader
        mfrRef={mfrRef}
        onEdit={() => setEditing((v) => !v)}
        onSetPreferred={handleSetPreferred}
        onDelete={handleDelete}
      />

      {actionError && <Text size="1" color="red" style={{ display: 'block', marginTop: 4 }}>{actionError}</Text>}

      {editing ? (
        <Box mt="2">
          <MfrRefFormRow
            partId={partId}
            initial={mfrRef}
            onSaved={() => { setEditing(false); onRefresh(); }}
            onCancel={() => setEditing(false)}
          />
        </Box>
      ) : (
        <Box mt="2">
          <PartSupplierRefsPanel mfrRef={mfrRef} onRefresh={onRefresh} />
        </Box>
      )}
    </Box>
  );
}

MfrRefRow.propTypes = {
  mfrRef: PropTypes.object.isRequired,
  partId: PropTypes.string.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
