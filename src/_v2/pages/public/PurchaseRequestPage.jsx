// ===== IMPORTS =====
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '@/contexts/ErrorContext';
import { Box } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { usePageHeaderProps } from '@/hooks/usePageConfig';
import { stock } from '@/lib/api/facade';
import PurchaseRequestForm from '@/components/purchase/requests/PurchaseRequestForm';
import SelectionSummary from '@/components/common/SelectionSummary';

// ===== COMPONENT =====
export default function PurchaseRequestPage() {
  const { showError } = useError();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastRequestSummary, setLastRequestSummary] = useState(null);

  const navigate = useNavigate();
  const headerProps = usePageHeaderProps();

  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await stock.createPurchaseRequest(formData);
      setLastRequestSummary({
        item_label: formData.item_label,
        quantity: formData.quantity,
        unit: formData.unit,
        stock_item_id: formData.stock_item_id || null
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error : new Error('Erreur lors de la création'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader {...headerProps} />

      <Box p='6' maxWidth='800px' mx='auto'>
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
            submitLabel='Créer'
          />

      </Box>
    </Box>
  );
}
