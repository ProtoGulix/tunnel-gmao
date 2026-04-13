import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import { useInterventionCreate } from '@/hooks/interventions/useInterventionCreate';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import { fetchInterventionRequest } from '@/api/intervention-requests';

function useRequestLinking(setFormData) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const handleSelectRequest = useCallback(async (req) => {
    if (!req) {
      setSelectedRequest(null);
      setFormData((prev) => ({ ...prev, title: '', equipementId: null, equipementLabel: '', reportedBy: '', requestId: null }));
      return;
    }
    try {
      const detail = await fetchInterventionRequest(req.id);
      setSelectedRequest(detail);
      setFormData((prev) => ({
        ...prev,
        title: detail.description,
        equipementId: detail.equipement?.id ?? null,
        equipementLabel: detail.equipement
          ? `${detail.equipement.code ? detail.equipement.code + ' — ' : ''}${detail.equipement.name}`
          : '',
        reportedBy: detail.demandeur_nom,
        requestId: detail.id,
        ...(detail.suggested_type_inter && { type: detail.suggested_type_inter }),
      }));
    } catch { /* sélection silencieuse */ }
  }, [setFormData]);
  return { selectedRequest, handleSelectRequest };
}

export default function InterventionCreatePage() {
  const navigate = useNavigate();
  const { formData, setFormData, fetchEquipementsFn, saving, error, handleSubmit } =
    useInterventionCreate({ navigate });
  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), [setFormData]);
  const { selectedRequest, handleSelectRequest } = useRequestLinking(setFormData);

  return (
    <PageContainer>
      <PageHeader title="Nouvelle intervention" subtitle="Créer une intervention curative ou autre" icon={Plus} />
      <Flex mt="4" gap="4" align="start">
        <Box style={{ flex: 1, minWidth: 280 }}>
          <InterventionRequestSelector selectedId={selectedRequest?.id} onSelect={handleSelectRequest} />
        </Box>
        <InterventionCreateForm
          formData={formData}
          set={set}
          locked={!!selectedRequest}
          lockedType={!!(selectedRequest?.is_system && selectedRequest?.suggested_type_inter)}
          fetchEquipementsFn={fetchEquipementsFn}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/interventions')}
        />
      </Flex>
    </PageContainer>
  );
}
