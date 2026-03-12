import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Heading, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import { useInterventionCreate } from '@/hooks/interventions/useInterventionCreate';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
import OpenInterventionRequestsList from '@/components/interventions/OpenInterventionRequestsList';
import { fetchInterventionRequest } from '@/api/intervention-requests';

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale', label: 'Normal' },
  { value: 'faible', label: 'Faible' },
];

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
      }));
    } catch { /* sélection silencieuse */ }
  }, [setFormData]);
  return { selectedRequest, handleSelectRequest };
}

function EquipementField({ equipementId, equipementLabel, locked, fetchFn, onSet }) {
  if (equipementId) {
    const parts = equipementLabel?.split(' — ') ?? [];
    return (
      <SelectionSummary
        variant="stock"
        badgeText={parts.length > 1 ? parts[0] : ''}
        mainText={parts.length > 1 ? parts.slice(1).join(' — ') : equipementLabel}
        onClear={locked ? undefined : () => { onSet('equipementId', null); onSet('equipementLabel', ''); }}
      />
    );
  }
  return (
    <AsyncSearchSelect
      fetchFn={fetchFn}
      onSelect={(eq) => { onSet('equipementId', eq.id); onSet('equipementLabel', `${eq.code ? eq.code + ' — ' : ''}${eq.name}`); }}
      renderItem={(eq) => <Flex align="center" gap="2"><Badge color="blue" variant="soft" size="1">{eq.code}</Badge><Text size="2" weight="bold">{eq.name}</Text></Flex>}
      placeholder="Rechercher par code, nom ou affectation..."
      minChars={1}
    />
  );
}

EquipementField.propTypes = {
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  locked: PropTypes.bool.isRequired,
  fetchFn: PropTypes.func.isRequired,
  onSet: PropTypes.func.isRequired,
};

export default function InterventionCreatePage() {
  const navigate = useNavigate();
  const { formData, setFormData, fetchEquipementsFn, saving, error, handleSubmit } =
    useInterventionCreate({ navigate });

  const set = useCallback(
    (field, value) => setFormData((prev) => ({ ...prev, [field]: value })),
    [setFormData]
  );

  const { selectedRequest, handleSelectRequest } = useRequestLinking(setFormData);
  const locked = !!selectedRequest;

  return (
    <PageContainer>
      <PageHeader title="Nouvelle intervention" subtitle="Créer une intervention curative ou autre" icon={Plus} />
      <Flex mt="4" gap="4" align="start">
        <Card style={{ flex: '0 0 580px', padding: '1.5rem', backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
        <Flex direction="column" gap="3">
          <Flex align="center" gap="3">
            <Plus size={20} color="var(--blue-9)" />
            <Heading size="4" weight="bold">Nouvelle intervention</Heading>
          </Flex>

          {error && (
            <Box style={{ backgroundColor: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 4, padding: '0.75rem' }}>
              <Text size="2" color="red" weight="medium">{error}</Text>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3">
              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Titre <Text color="red">*</Text>
                </Text>
                <TextField.Root placeholder="Titre de l'intervention" value={formData.title}
                  onChange={(e) => set('title', e.target.value)} disabled={locked} required />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Date de signalement <Text color="red">*</Text>
                </Text>
                <TextField.Root type="datetime-local" value={formData.reportedDate}
                  onChange={(e) => set('reportedDate', e.target.value)} required />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Équipement <Text color="red">*</Text>
                </Text>
                <EquipementField
                  equipementId={formData.equipementId}
                  equipementLabel={formData.equipementLabel}
                  locked={locked}
                  fetchFn={fetchEquipementsFn}
                  onSet={set}
                />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Initiales technicien <Text color="red">*</Text>
                </Text>
                <TextField.Root placeholder="Ex. : QC" value={formData.techInitials}
                  onChange={(e) => set('techInitials', e.target.value.toUpperCase())} maxLength={5} required />
                <Text size="1" color="gray" mt="1" style={{ display: 'block' }}>Intégrées dans le code d&apos;intervention</Text>
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Signalé par {locked ? '' : '(optionnel)'}
                </Text>
                <TextField.Root placeholder="Nom ou identifiant" value={formData.reportedBy}
                  onChange={(e) => set('reportedBy', e.target.value)} disabled={locked} />
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Type</Text>
                <Select.Root value={formData.type} onValueChange={(v) => set('type', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {INTERVENTION_TYPES.map((t) => <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Priorité</Text>
                <Select.Root value={formData.priority} onValueChange={(v) => set('priority', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {PRIORITY_OPTIONS.map((p) => <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>)}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Flex gap="3" justify="end" mt="2">
                <Button type="button" variant="soft" color="gray" size="2" disabled={saving} onClick={() => navigate('/interventions')}>
                  Annuler
                </Button>
                <Button type="submit" size="2" disabled={saving} style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}>
                  {saving ? <Spinner size="2" /> : 'Enregistrer'}
                </Button>
              </Flex>
            </Flex>
          </form>
        </Flex>
      </Card>

      <Box style={{ flex: 1, minWidth: 280 }}>
        <OpenInterventionRequestsList selectedId={selectedRequest?.id} onSelect={handleSelectRequest} />
      </Box>
    </Flex>
    </PageContainer>
  );
}
