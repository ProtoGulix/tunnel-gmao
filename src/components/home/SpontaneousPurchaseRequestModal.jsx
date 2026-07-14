import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { ShoppingCart, Upload } from 'lucide-react';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';
import PurchaseRequestSessionBatch from '@/components/purchase-requests/PurchaseRequestSessionBatch';
import PurchaseRequestActionBanner from '@/components/home/PurchaseRequestActionBanner';
import { CsvImportWizardContent } from '@/components/purchase/CsvImportWizard';

import StatusCallout from '@/components/ui/StatusCallout';
import { createPurchaseRequest } from '@/api/purchaseRequests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function SpontaneousPurchaseRequestModal({ open, onOpenChange, action = null, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('form'); // 'form' | 'csv'
  const [batch, setBatch] = useState([]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      const created = await createPurchaseRequest({
        ...formData,
        ...(action?.id && { intervention_action_id: action.id }),
      });
      setBatch((b) => [...b, created]);
      onSuccess?.();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  const handleRowDeleted = (id) => {
    setBatch((b) => b.filter((item) => item.id !== id));
  };

  const handleOpenChange = (v) => {
    if (loading) return;
    if (!v) { setError(null); setBatch([]); setMode('form'); }
    onOpenChange(v);
  };

  const contextBanner = (
    <>
      {action && <PurchaseRequestActionBanner action={action} />}
      <PurchaseRequestSessionBatch batch={batch} onRowDeleted={handleRowDeleted} />
    </>
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: mode === 'csv' ? 720 : 560 }}>
        <Dialog.Title style={{ display: 'none' }}>Demande d&apos;achat</Dialog.Title>

        <Flex align="center" justify="between" mb="2">
          <Flex align="center" gap="2">
            {mode === 'csv' ? <Upload size={18} color="var(--blue-9)" /> : <ShoppingCart size={18} color="var(--blue-9)" />}
            <Text size="3" weight="bold" color="blue">
              {mode === 'csv' ? 'Import CSV — Demandes d’achat' : 'Nouvelle demande d’achat'}
            </Text>
          </Flex>
          <Flex gap="1">
            <Button
              size="1" variant={mode === 'form' ? 'solid' : 'soft'} color="blue" type="button"
              onClick={() => setMode('form')}
            >
              Formulaire
            </Button>
            <Button
              size="1" variant={mode === 'csv' ? 'solid' : 'soft'} color="blue" type="button"
              onClick={() => setMode('csv')}
            >
              <Upload size={12} /> Import CSV
            </Button>
          </Flex>
        </Flex>

        {error && <StatusCallout type="error">{error}</StatusCallout>}

        {mode === 'form' && (
          <>
            <PurchaseRequestForm
              bare
              showTitle={false}
              onSubmit={handleSubmit}
              loading={loading}
              onCancel={() => onOpenChange(false)}
              submitLabel="Créer la demande"
              contextBanner={contextBanner}
            />
            {batch.length > 0 && (
              <Flex justify="end" mt="3">
                <Button size="2" variant="soft" color="green" type="button" onClick={() => onOpenChange(false)}>
                  Terminé
                </Button>
              </Flex>
            )}
          </>
        )}

        {mode === 'csv' && (
          <CsvImportWizardContent
            key={action?.id ?? 'no-action'}
            initialIntervention={action?.intervention ?? null}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
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
