/**
 * @fileoverview Select fournisseur natif avec option "+ Nouveau fournisseur…" inline
 * @module components/suppliers/SupplierSelectWithCreate
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, VisuallyHidden } from '@radix-ui/themes';
import SupplierForm from '@/components/suppliers/SupplierForm';
import { createSupplier } from '@/api/suppliers';

const NEW_OPTION = '__new__';

export default function SupplierSelectWithCreate({
  suppliers, value, onChange, onSupplierCreated, placeholder = 'Fournisseur…', style,
}) {
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelectChange = (e) => {
    if (e.target.value === NEW_OPTION) { setCreating(true); return; }
    onChange(e);
  };

  const handleCreate = async (data) => {
    // SupplierForm catche l'erreur et l'affiche lui-même — on la laisse remonter telle quelle.
    setSaving(true);
    try {
      const created = await createSupplier(data);
      onSupplierCreated(created);
      onChange({ target: { value: created.id } });
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <select
        value={value}
        onChange={handleSelectChange}
        style={style}
      >
        <option value="">{placeholder}</option>
        {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        <option value={NEW_OPTION}>+ Nouveau fournisseur…</option>
      </select>

      <Dialog.Root open={creating} onOpenChange={(v) => { if (!v && !saving) setCreating(false); }}>
        <Dialog.Content style={{ maxWidth: 560 }}>
          <VisuallyHidden>
            <Dialog.Title>Nouveau fournisseur</Dialog.Title>
          </VisuallyHidden>
          <SupplierForm onSubmit={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
}

SupplierSelectWithCreate.propTypes = {
  suppliers: PropTypes.array.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSupplierCreated: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  style: PropTypes.object,
};
