/**
 * Formulaire de création d'intervention de l'accueil (demande choisie ou saisie, date de
 * prise en charge, technicien pilote, type, priorité). Une seule route de création
 * (ADR 0025) ; utilisé par l'accueil, la fenêtre de création (liste des interventions et
 * Coordination) et le Briefing.
 * @module components/planning/InterventionCreationPanel
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { ClipboardList, X } from 'lucide-react';
import { fetchServices } from '@/api/services';
import { fetchActiveUsers } from '@/api/planning';
import { createIntervention } from '@/api/interventions';
import { TYPE_REQUIRED_MESSAGE } from '@/lib/interventionTypesStore';
import { initialPriority } from '@/lib/acceptRequest';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import { TimelineIcon } from '@/components/interventions/InterventionFormFields';
import { DiSummaryBlock } from '@/components/interventions/DiSummaryBlock';

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/* ── Section DI inline ────────────────────────────────────────────────────── */

function DiSection({ selectedRequest, onClearDi, demandeurNom, serviceId, description, services, onDemandeurChange, onServiceChange, onDescriptionChange }) {
  if (selectedRequest) {
    return (
      <Flex direction="column" gap="1">
        <DiSummaryBlock diDetail={selectedRequest} />
        {onClearDi && (
          <Button size="1" variant="ghost" color="gray" type="button" onClick={onClearDi} style={{ alignSelf: 'flex-start' }}>
            <X size={12} /> Choisir une autre DI
          </Button>
        )}
      </Flex>
    );
  }

  // Pas de DI sélectionnée : formulaire de création inline, intégré à la même
  // frise verticale (icône + traits pointillés) que DiSummaryBlock ci-dessus
  // et TechDateRow/InterventionRow ci-dessous — sinon ce premier maillon de la
  // frise "disparaît" tant qu'aucune DI n'est choisie.
  const done = !!(demandeurNom.trim() && description.trim());
  return (
    <Flex align="stretch" gap="4">
      <TimelineIcon icon={ClipboardList} done={done} />
      <Flex direction="column" gap="2" style={{ flex: 1, padding: '10px 12px', margin: '10px 0', background: 'var(--gray-2)', border: '1px solid var(--gray-4)', borderRadius: 8 }}>
        <Text size="1" weight="bold" color="gray">
          Demande d&apos;intervention <Text size="1" color="gray" weight="regular">— ou sélectionnez-en une à gauche</Text>
        </Text>
        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Demandeur <Text color="red">*</Text></Text>
          <TextField.Root placeholder="Nom du demandeur" value={demandeurNom} onChange={onDemandeurChange} required />
        </Box>
        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Service <Text size="1" color="gray" weight="regular">(optionnel)</Text></Text>
          <Select.Root value={serviceId} onValueChange={onServiceChange}>
            <Select.Trigger placeholder="Sélectionner un service…" style={{ width: '100%' }} />
            <Select.Content>
              {services.map((s) => <Select.Item key={s.id} value={s.id}>{s.label}</Select.Item>)}
            </Select.Content>
          </Select.Root>
        </Box>
        <Box>
          <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Description <Text color="red">*</Text></Text>
          <TextArea placeholder="Décrire le problème ou le besoin…" value={description} onChange={onDescriptionChange} rows={3} />
        </Box>
      </Flex>
    </Flex>
  );
}

DiSection.propTypes = {
  selectedRequest: PropTypes.object,
  onClearDi: PropTypes.func,
  demandeurNom: PropTypes.string.isRequired,
  serviceId: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  services: PropTypes.array.isRequired,
  onDemandeurChange: PropTypes.func.isRequired,
  onServiceChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

/* ── Panel création d'intervention ───────────────────────────────────────── */

export default function InterventionCreationPanel({ ivCreationCtx }) {
  const { equipementId, equipementLabel, selectedRequest, onCreated, onCancel } = ivCreationCtx;

  const [formData, setFormData] = useState(() => ({
    // Champs intervention
    type: selectedRequest?.suggested_type_inter ?? '',
    priority: initialPriority(selectedRequest),
    equipementId,
    equipementLabel: equipementLabel ?? '',
    techId: '',
    reportedDate: getDefaultDateTimeLocal(),
    // Champs DI inline (utilisés seulement si pas de selectedRequest)
    diDemandeurNom: selectedRequest?.demandeur_nom ?? '',
    diServiceId: '',
    diDescription: selectedRequest?.description ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => { fetchActiveUsers().then(setUsers).catch(() => {}); }, []);
  useEffect(() => { fetchServices().then(setServices).catch(() => {}); }, []);

  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), []);

  // Sync quand selectedRequest change (sélection/désélection depuis la liste gauche)
  const prevRequestRef = useRef(undefined);
  useEffect(() => {
    if (prevRequestRef.current === selectedRequest) return;
    prevRequestRef.current = selectedRequest;
    if (!selectedRequest) {
      setFormData((fd) => ({ ...fd, diDemandeurNom: '', diServiceId: '', diDescription: '' }));
    } else {
      setFormData((fd) => ({
        ...fd,
        diDemandeurNom: selectedRequest.demandeur_nom ?? fd.diDemandeurNom,
        diDescription: selectedRequest.description ?? fd.diDescription,
        ...(selectedRequest.suggested_type_inter && { type: selectedRequest.suggested_type_inter }),
        priority: initialPriority(selectedRequest),
      }));
    }
  }, [selectedRequest]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.type) { setError(TYPE_REQUIRED_MESSAGE); return; }
    if (!formData.techId) { setError('Veuillez sélectionner un technicien'); return; }
    setSaving(true);
    try {
      // Pas de DI sélectionnée : la demande est créée dans le même appel que l'intervention
      // (ADR 0025), ou rien n'est créé.
      let request;
      if (!selectedRequest?.id) {
        if (!formData.diDemandeurNom.trim()) { setError('Le nom du demandeur est obligatoire'); setSaving(false); return; }
        if (!formData.diDescription.trim()) { setError('La description de la demande est obligatoire'); setSaving(false); return; }
        request = {
          demandeurNom: formData.diDemandeurNom.trim(),
          description: formData.diDescription.trim(),
          serviceId: formData.diServiceId || null,
        };
      }

      const created = await createIntervention({
        equipementId,
        type: formData.type,
        techId: formData.techId,
        priority: formData.priority,
        reportedDate: formData.reportedDate
          ? new Date(formData.reportedDate).toISOString()
          : undefined,
        reportedBy: formData.diDemandeurNom || selectedRequest?.demandeur_nom,
        requestId: selectedRequest?.id,
        request,
      });
      onCreated(created);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? "Erreur lors de la création de l'intervention");
    } finally {
      setSaving(false);
    }
  }, [formData, selectedRequest, equipementId, onCreated]);

  return (
    <InterventionCreateForm
      formData={formData}
      set={set}
      lockedType={!!(selectedRequest?.is_system && selectedRequest?.suggested_type_inter)}
      diSection={
        <DiSection
          selectedRequest={selectedRequest}
          onClearDi={ivCreationCtx.onRequestSelected ? () => ivCreationCtx.onRequestSelected(null) : undefined}
          demandeurNom={formData.diDemandeurNom}
          serviceId={formData.diServiceId}
          description={formData.diDescription}
          services={services}
          onDemandeurChange={(e) => set('diDemandeurNom', e.target.value)}
          onServiceChange={(v) => set('diServiceId', v)}
          onDescriptionChange={(e) => set('diDescription', e.target.value)}
        />
      }
      users={users}
      saving={saving}
      error={error}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
}

InterventionCreationPanel.propTypes = {
  ivCreationCtx: PropTypes.shape({
    equipementId: PropTypes.string.isRequired,
    equipementLabel: PropTypes.string,
    selectedRequest: PropTypes.object,
    onCreated: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onRequestSelected: PropTypes.func,
  }).isRequired,
};
