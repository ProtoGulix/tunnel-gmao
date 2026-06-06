import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Dialog, Flex, Text } from '@radix-ui/themes';
import { Link } from 'lucide-react';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';

import StatusCallout from '@/components/ui/StatusCallout';
import { createPurchaseRequest } from '@/api/purchaseRequests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function SpontaneousPurchaseRequestModal({ open, onOpenChange, action = null, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      await createPurchaseRequest({
        ...formData,
        ...(action?.id && { intervention_action_id: action.id }),
      });
      setSuccess(formData.item_label);
      onSuccess?.();
      setTimeout(() => { setSuccess(null); onOpenChange(false); }, 1500);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (v) => {
    if (loading) return;
    if (!v) { setSuccess(null); setError(null); }
    onOpenChange(v);
  };

  const subcatColor = action?.subcategory?.category?.color ?? '#6b7280';

  const contextBanner = action ? (
    <Flex align="stretch" gap="4">
      {/* Icône link dans la timeline */}
      <Flex direction="column" align="center" style={{ flexShrink: 0, width: 18 }}>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)' }} />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Link size={18} strokeWidth={2.5} style={{ color: subcatColor, display: 'block' }} />
        </div>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)', marginTop: 5 }} />
      </Flex>

      {/* Contenu du bando */}
      <Flex
        align="center" gap="2"
        style={{
          flex: 1, minWidth: 0,
          margin: '8px 0',
          padding: '6px 10px',
          background: `${subcatColor}12`,
          borderLeft: `3px solid ${subcatColor}`,
          borderRadius: 'var(--radius-2)',
        }}
      >
        <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: subcatColor, flexShrink: 0 }}>
          {action.intervention?.code ?? '—'}
        </Text>
        <Badge size="1" style={{ background: `${subcatColor}26`, color: subcatColor, border: 'none', flexShrink: 0 }}>
          {action.subcategory?.code ?? action.subcategory?.name ?? '—'}
        </Badge>
        {action.description && (
          <Text size="1" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {action.description}
          </Text>
        )}
      </Flex>
    </Flex>
  ) : null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 560 }}>
        <Dialog.Title style={{ display: 'none' }}>Demande d&apos;achat</Dialog.Title>

        {success && (
          <StatusCallout type="success">
            Demande créée — <strong>{success}</strong>
          </StatusCallout>
        )}
        {error && <StatusCallout type="error">{error}</StatusCallout>}

        {!success && (
          <PurchaseRequestForm
            bare
            onSubmit={handleSubmit}
            loading={loading}
            onCancel={() => onOpenChange(false)}
            submitLabel="Créer la demande"
            contextBanner={contextBanner}
          />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

SpontaneousPurchaseRequestModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  action: PropTypes.object,
  onSuccess: PropTypes.func,
};
