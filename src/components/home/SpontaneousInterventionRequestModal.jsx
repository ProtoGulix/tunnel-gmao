import { useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog } from '@radix-ui/themes';
import InterventionRequestForm from '@/components/intervention-requests/InterventionRequestForm';
import StatusCallout from '@/components/ui/StatusCallout';
import { createInterventionRequest } from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function SpontaneousInterventionRequestModal({ open, onOpenChange, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      await createInterventionRequest(formData);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => { setSuccess(false); onOpenChange(false); }, 1500);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création de la demande'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (v) => {
    if (saving) return;
    if (!v) { setSuccess(false); setError(null); }
    onOpenChange(v);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 560 }}>
        <Dialog.Title>Nouvelle demande d&apos;intervention</Dialog.Title>

        {success && (
          <StatusCallout type="success">Demande créée avec succès</StatusCallout>
        )}
        {error && <StatusCallout type="error">{error}</StatusCallout>}

        {!success && (
          <InterventionRequestForm
            bare
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            saving={saving}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

SpontaneousInterventionRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
