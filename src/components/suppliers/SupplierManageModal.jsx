/**
 * @fileoverview Modale de gestion d'un fournisseur (coordonnees, edition) depuis la vue references
 * @module components/suppliers/SupplierManageModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import SupplierInfo from '@/components/suppliers/SupplierInfo';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { useSupplierDetail } from '@/hooks/suppliers/useSupplierDetail';

export default function SupplierManageModal({ open, onOpenChange, supplierId }) {
  const { supplier, loading, error, refresh, editSupplier } = useSupplierDetail(open ? supplierId : null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (data) => {
    try {
      setSaving(true);
      await editSupplier(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setEditing(false); }}>
      <Dialog.Content style={{ maxWidth: 560 }}>
        <Dialog.Title>Fournisseur</Dialog.Title>
        {loading && <LoadingState fullscreen={false} message="Chargement..." />}
        {error && <ErrorState error={error} onRetry={refresh} />}
        {!loading && !error && supplier && (
          editing ? (
            <SupplierForm supplier={supplier} onSubmit={handleSave} onCancel={() => setEditing(false)} saving={saving} />
          ) : (
            <SupplierInfo supplier={supplier} onEdit={() => setEditing(true)} />
          )
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

SupplierManageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  supplierId: PropTypes.string,
};
