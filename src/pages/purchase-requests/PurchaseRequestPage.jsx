/**
 * Page de création de demande d'achat
 * 
 * Formulaire simplifié pour créer une demande d'achat rapidement.
 * Affiche un résumé de confirmation après création réussie.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { usePageHeaderProps } from '@/hooks/usePageConfig';
import * as stockApi from '@/api/stock';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';
import SelectionSummary from '@/components/ui/SelectionSummary';

export default function PurchaseRequestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastRequestSummary, setLastRequestSummary] = useState(null);

  const navigate = useNavigate();
  const headerProps = usePageHeaderProps();

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await stockApi.createPurchaseRequest(formData);
      setLastRequestSummary({
        item_label: formData.item_label,
        quantity: formData.quantity,
        unit: formData.unit,
        stock_item_id: formData.stock_item_id || null
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (error) {
      console.error('Erreur lors de la création de la demande d\'achat:', error);
      // TODO: Implement proper error notification (ErrorContext migration needed)
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader {...headerProps} />

      <Box p="6" maxWidth="800px" mx="auto">
        {success && lastRequestSummary && (
          <SelectionSummary
            variant={lastRequestSummary.stock_item_id ? 'stock' : 'special'}
            badgeText={lastRequestSummary.stock_item_id ? undefined : 'Demande spéciale'}
            mainText={lastRequestSummary.item_label}
            rightText={`${lastRequestSummary.quantity || 0} ${lastRequestSummary.unit || ''}`}
          />
        )}

        <PurchaseRequestForm
          onSubmit={handleFormSubmit}
          loading={loading}
          onCancel={() => navigate(-1)}
          submitLabel="Créer"
        />
      </Box>
    </Box>
  );
}
