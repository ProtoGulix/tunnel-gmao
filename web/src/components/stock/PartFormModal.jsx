/**
 * @fileoverview Modale de création/édition d'une pièce V4 — enveloppe PartForm
 * @module components/stock/PartFormModal
 */

import PropTypes from 'prop-types';
import { Dialog, VisuallyHidden } from '@radix-ui/themes';
import PartForm from '@/components/stock/PartForm';

export default function PartFormModal({ open, onOpenChange, part, onSubmit, saving }) {
  const handleOpenChange = (v) => { if (!saving) onOpenChange(v); };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 640 }}>
        <VisuallyHidden>
          <Dialog.Title>{part ? 'Modifier la pièce' : 'Nouvelle pièce'}</Dialog.Title>
        </VisuallyHidden>
        <PartForm
          part={part}
          onSubmit={onSubmit}
          onCancel={() => handleOpenChange(false)}
          saving={saving}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}

PartFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  part: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
