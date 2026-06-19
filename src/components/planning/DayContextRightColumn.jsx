import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { Calendar, ClipboardList, Lock, Wrench, X } from 'lucide-react';
import { fetchServices } from '@/api/services';

import { createActionDirect, fetchActiveUsers } from '@/api/planning';
import { createIntervention } from '@/api/interventions';
import { createInterventionRequest, fetchInterventionRequest } from '@/api/intervention-requests';
import ActionForm from '@/components/interventions/ActionForm';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import { DiSummaryBlock } from '@/components/interventions/DiSummaryBlock';
import LockedBadge from '@/components/ui/LockedBadge';

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
        <Button size="1" variant="ghost" color="gray" type="button" onClick={onClearDi} style={{ alignSelf: 'flex-start' }}>
          <X size={12} /> Choisir une autre DI
        </Button>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="2" style={{ padding: '10px 12px', background: 'var(--gray-2)', border: '1px solid var(--gray-4)', borderRadius: 8 }}>
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
  );
}

DiSection.propTypes = {
  selectedRequest: PropTypes.object,
  onClearDi: PropTypes.func.isRequired,
  demandeurNom: PropTypes.string.isRequired,
  serviceId: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  services: PropTypes.array.isRequired,
  onDemandeurChange: PropTypes.func.isRequired,
  onServiceChange: PropTypes.func.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
};

/* ── Panel création d'intervention ───────────────────────────────────────── */

function IvCreationPanel({ ivCreationCtx }) {
  const { equipementId, equipementLabel, selectedRequest, onCreated, onCancel } = ivCreationCtx;

  const [formData, setFormData] = useState(() => ({
    // Champs intervention
    type: selectedRequest?.suggested_type_inter ?? 'CUR',
    priority: 'normale',
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
      }));
    }
  }, [selectedRequest]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.techId) { setError('Veuillez sélectionner un technicien'); return; }
    setSaving(true);
    try {
      let requestId = selectedRequest?.id ?? null;

      // Pas de DI sélectionnée → en créer une à la volée
      if (!requestId) {
        if (!formData.diDemandeurNom.trim()) { setError('Le nom du demandeur est obligatoire'); setSaving(false); return; }
        if (!formData.diDescription.trim()) { setError('La description de la demande est obligatoire'); setSaving(false); return; }
        const createdDi = await createInterventionRequest({
          machineId: equipementId,
          demandeurNom: formData.diDemandeurNom.trim(),
          serviceId: formData.diServiceId || null,
          description: formData.diDescription.trim(),
        });
        const detail = await fetchInterventionRequest(createdDi.id);
        requestId = detail.id;
      }

      const created = await createIntervention({
        equipementId,
        type: formData.type,
        techId: formData.techId,
        title: selectedRequest?.description ?? formData.diDescription,
        priority: formData.priority,
        reportedDate: formData.reportedDate
          ? new Date(formData.reportedDate).toISOString()
          : undefined,
        reportedBy: formData.diDemandeurNom || selectedRequest?.demandeur_nom,
        requestId,
      });
      onCreated(created);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? "Erreur lors de la création de l'intervention");
    } finally {
      setSaving(false);
    }
  }, [formData, selectedRequest, equipementId, onCreated]);

  // formData adapté pour InterventionCreateForm (title = diDescription quand pas de DI)
  const formDataForForm = {
    ...formData,
    title: selectedRequest?.description ?? formData.diDescription,
  };

  return (
    <InterventionCreateForm
      formData={formDataForForm}
      set={set}
      lockedType={!!(selectedRequest?.is_system && selectedRequest?.suggested_type_inter)}
      diSection={
        <DiSection
          selectedRequest={selectedRequest}
          onClearDi={() => ivCreationCtx.onRequestSelected?.(null)}
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

IvCreationPanel.propTypes = {
  ivCreationCtx: PropTypes.shape({
    equipementId: PropTypes.string.isRequired,
    equipementLabel: PropTypes.string,
    selectedRequest: PropTypes.object,
    onCreated: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    onRequestSelected: PropTypes.func,
  }).isRequired,
};

/* ── Colonne droite principale ────────────────────────────────────────────── */

export default function DayContextRightColumn({
  date,
  techId,
  selectedTasks,
  onTasksChange,
  createdIntervention,
  ivCreationCtx,
  onSuccess,
  onCancel,
  metadata,
}) {
  const taskIv = selectedTasks?.[0]?._intervention ?? null;
  const resolvedIv = taskIv ?? createdIntervention ?? null;
  const interventionId = resolvedIv?.id?.toString() ?? null;

  const interventionMeta = resolvedIv
    ? {
        id: resolvedIv.id,
        code: resolvedIv.code ?? '',
        title: resolvedIv.title ?? '',
        status_actual: resolvedIv.status_actual ?? resolvedIv.status ?? null,
        type_inter: resolvedIv.type_inter ?? null,
        plan_id: resolvedIv.plan_id ?? null,
      }
    : null;

  const handleSubmit = useCallback((payload) => createActionDirect(payload), []);

  const isActionLocked = !interventionId && !ivCreationCtx;
  const isCreatingIv = !!ivCreationCtx;
  const headerIcon = createdIntervention ? Wrench : ClipboardList;
  const formKey = `${interventionId ?? 'none'}-${date}`;

  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Calendar size={14} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">
          {isCreatingIv ? 'Nouvelle intervention' : 'Saisir l\'action'}
        </Text>
      </Flex>

      {isCreatingIv ? (
        <IvCreationPanel
          key={ivCreationCtx.equipementId}
          ivCreationCtx={ivCreationCtx}
        />
      ) : isActionLocked ? (
        <Flex align="center" justify="center" direction="column" gap="2"
          style={{ minHeight: 160, border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)', padding: '1.5rem' }}
        >
          <Lock size={20} color="var(--gray-7)" />
          <Text size="2" color="gray" align="center">
            Sélectionnez une tâche pour saisir l&apos;action
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="2">
          <LockedBadge
            icon={headerIcon}
            label={`${interventionMeta.code} — ${interventionMeta.title}`}
            sublabel={createdIntervention ? 'Nouvelle intervention' : undefined}
          />
          <Box mt="1">
            <ActionForm
              key={formKey}
              initialState={{ date: date ?? '' }}
              metadata={metadata}
              onCancel={onCancel ?? (() => {})}
              onSubmit={handleSubmit}
              onSuccess={onSuccess}
              interventionId={interventionId}
              interventionMeta={interventionMeta}
              techId={techId}
              showContext={false}
              showTasks={false}
              selectedTasks={selectedTasks}
              onTasksChange={onTasksChange}
            />
          </Box>
        </Flex>
      )}
    </Flex>
  );
}

DayContextRightColumn.propTypes = {
  date: PropTypes.string,
  techId: PropTypes.string,
  selectedTasks: PropTypes.array,
  onTasksChange: PropTypes.func,
  createdIntervention: PropTypes.object,
  ivCreationCtx: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  metadata: PropTypes.object.isRequired,
};
