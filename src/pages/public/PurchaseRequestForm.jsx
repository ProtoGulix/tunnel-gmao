// ===== IMPORTS =====
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useError } from '@/contexts/ErrorContext';
import { 
  Box, 
  Card, 
  Callout
} from '@radix-ui/themes';
import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { usePageHeaderProps } from '@/hooks/usePageConfig';
import { stock } from '@/lib/api/facade';
import PurchaseRequestFormBody from '@/components/stock/PurchaseRequestFormBody';

// ===== COMPONENT =====
export default function PurchaseRequestForm() {
  // ----- State -----
  const { showError } = useError();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  // ----- Config Header -----
  const headerProps = usePageHeaderProps();

  // ----- Submit Handler -----
  const handleFormSubmit = async (formData) => {
    try {
      setLoading(true);
      await stock.createPurchaseRequest(formData);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
      
    } catch (error) {
      console.error(error);
      showError(error instanceof Error ? error : new Error("Erreur lors de la création"));
    } finally {
      setLoading(false);
    }
  };

  // ----- Main Render -----
  return (
    <Box>
      <PageHeader {...headerProps} />

      <Box p="6" maxWidth="800px" mx="auto">
        {success && (
          <Callout.Root color="green" mb="4">
            <Callout.Icon>
              <CheckCircle size={20} />
            </Callout.Icon>
            <Callout.Text>
              Demande d&apos;achat créée avec succès !
            </Callout.Text>
          </Callout.Root>
        )}

        <Card>
          <PurchaseRequestFormBody
            onSubmit={handleFormSubmit}
            loading={loading}
            onCancel={() => navigate(-1)}
            submitLabel="Créer"
          />
        </Card>
      </Box>
    </Box>
  );
}
