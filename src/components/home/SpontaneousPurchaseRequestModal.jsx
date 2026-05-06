import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';
import StatusCallout from '@/components/ui/StatusCallout';
import { createPurchaseRequest } from '@/api/purchaseRequests';

export default function SpontaneousPurchaseRequestModal({ open, onOpenChange }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      await createPurchaseRequest(formData);
      setSuccess(formData.item_label);
      setTimeout(() => {
        setSuccess(null);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v) => {
    if (loading) return;
    if (!v) {
      setSuccess(null);
      setError(null);
    }
    onOpenChange(v);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 560 }}>
        <Dialog.Title>Demande d'achat spontanée</Dialog.Title>

        {success && (
          <StatusCallout type="success">
            Demande créée — <strong>{success}</strong>
          </StatusCallout>
        )}

        {error && (
          <StatusCallout type="error">
            {error}
          </StatusCallout>
        )}

        {!success && (
          <PurchaseRequestForm
            onSubmit={handleSubmit}
            loading={loading}
            onCancel={() => onOpenChange(false)}
            submitLabel="Créer la demande"
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

SpontaneousPurchaseRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
};
