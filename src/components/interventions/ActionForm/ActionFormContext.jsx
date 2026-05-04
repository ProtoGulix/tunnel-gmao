/**
 * @fileoverview Sous-composants de contexte pour ActionForm
 * @module components/interventions/ActionForm/ActionFormContext
 *
 * ContextSection — sélecteurs équipement + intervention avec onglets permanents.
 * La création inline s'étend en dessous du sélecteur concerné sans jamais
 * remplacer l'interface (tabs toujours visibles).
 */

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { ClipboardList, MapPin, Wrench } from 'lucide-react';
import { createIntervention } from '@/api/interventions';
import { fetchEquipements } from '@/api/equipements';
import { fetchActiveUsers } from '@/api/planning';
import EquipementSearch from '@/components/planning/EquipementSearch';
import InterventionSelector from '@/components/planning/InterventionSelector';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import LockedBadge from '@/components/ui/LockedBadge';

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function buildFormData(equipementId, equipementLabel, req = null) {
  return {
    title: req?.description ?? '',
    type: req?.suggested_type_inter ?? 'CUR',
    priority: 'normale',
    equipementId,
    equipementLabel: equipementLabel ?? '',
    techId: '',
    reportedBy: req?.demandeur_nom ?? '',
    reportedDate: getDefaultDateTimeLocal(),
    ...(req?.id && { requestId: req.id }),
  };
}

/* ── Section contexte ─────────────────────────────────────────────────────── */

export function ContextSection({
  interventionId,
  pickedEquipement,
  onEquipementChange,
  pickedIntervention,
  onInterventionChange,
}) {
  // Inline creation — Interventions tab
  const [showInterventionCreate, setShowInterventionCreate] = useState(false);
  // Inline creation — Demandes tab (null = none selected)
  const [selectedRequest, setSelectedRequest] = useState(null);
  // Shared form state for whichever create form is open
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchActiveUsers().then(setUsers).catch(() => {});
  }, []);

  const equipementLabel = pickedEquipement
    ? `${pickedEquipement.code ? pickedEquipement.code + ' — ' : ''}${pickedEquipement.name ?? ''}`
    : '';

  const openCount = pickedEquipement?.health?.open_interventions_count ?? 0;
  const requestCount = pickedEquipement?.health?.new_requests_count ?? 0;

  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), []);

  const handleOpenInterventionCreate = useCallback(() => {
    setShowInterventionCreate(true);
    setFormData(buildFormData(pickedEquipement?.id, equipementLabel));
    setCreateError(null);
  }, [pickedEquipement, equipementLabel]);

  const handleSelectRequest = useCallback((req) => {
    if (!req) { setSelectedRequest(null); setFormData(null); return; }
    setSelectedRequest(req);
    setFormData(buildFormData(pickedEquipement?.id, equipementLabel, req));
    setCreateError(null);
  }, [pickedEquipement, equipementLabel]);

  const handleCreate = useCallback(async (e) => {
    e?.preventDefault?.();
    setCreateError(null);
    if (!formData?.title?.trim()) { setCreateError('Le titre est obligatoire'); return; }
    if (!formData?.techId) { setCreateError('Veuillez sélectionner un technicien'); return; }
    setSaving(true);
    try {
      const created = await createIntervention({
        ...formData,
        reportedDate: formData.reportedDate ? new Date(formData.reportedDate).toISOString() : undefined,
      });
      onInterventionChange(created);
      setShowInterventionCreate(false);
      setSelectedRequest(null);
      setFormData(null);
    } catch (err) {
      setCreateError(err?.response?.data?.detail ?? err.message ?? "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }, [formData, onInterventionChange]);

  return (
    <Flex direction="column" gap="3">
      {/* Équipement */}
      <Box>
        <Flex align="center" gap="1" mb="1">
          <MapPin size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">
            Équipement {!interventionId && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>
        {interventionId
          ? <LockedBadge icon={MapPin} label="Via l'intervention" />
          : <EquipementSearch value={pickedEquipement} onChange={onEquipementChange} />
        }
      </Box>

      {/* Intervention */}
      <Box>
        <Flex align="center" gap="1" mb="1">
          <Wrench size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">
            Intervention {!interventionId && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>

        {interventionId && <LockedBadge icon={Wrench} label="Intervention fixée" />}

        {!interventionId && !pickedEquipement && (
          <Text size="2" color="gray" style={{ padding: '6px 0', display: 'block' }}>
            Sélectionnez d&apos;abord un équipement
          </Text>
        )}

        {/* Tabs — toujours visibles dès qu'un équipement est choisi */}
        {!interventionId && pickedEquipement && (
          <Tabs.Root defaultValue="interventions">
            <Tabs.List>
              <Tabs.Trigger value="interventions">
                <Flex align="center" gap="1">
                  <Wrench size={12} />
                  Interventions
                  {openCount > 0 && <Badge color="blue" variant="soft" size="1">{openCount}</Badge>}
                </Flex>
              </Tabs.Trigger>
              <Tabs.Trigger value="requests">
                <Flex align="center" gap="1">
                  <ClipboardList size={12} />
                  Demandes
                  {requestCount > 0 && <Badge color="orange" variant="soft" size="1">{requestCount}</Badge>}
                </Flex>
              </Tabs.Trigger>
            </Tabs.List>

            <Box pt="2">
              {/* ── Onglet Interventions ── */}
              <Tabs.Content value="interventions">
                <InterventionSelector
                  equipementId={pickedEquipement.id}
                  equipementLabel={equipementLabel}
                  value={pickedIntervention}
                  onChange={onInterventionChange}
                  onCreateClick={handleOpenInterventionCreate}
                />
                {showInterventionCreate && formData && (
                  <Box mt="2">
                    <InterventionCreateForm
                      formData={formData}
                      set={set}
                      locked={false}
                      lockedType={false}
                      embedded
                      fetchEquipementsFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
                      users={users}
                      saving={saving}
                      error={createError}
                      onSubmit={handleCreate}
                      onCancel={() => { setShowInterventionCreate(false); setFormData(null); setCreateError(null); }}
                    />
                  </Box>
                )}
              </Tabs.Content>

              {/* ── Onglet Demandes ── */}
              <Tabs.Content value="requests">
                <InterventionRequestSelector
                  selectedId={selectedRequest?.id ?? null}
                  onSelect={handleSelectRequest}
                  machineId={pickedEquipement.id}
                  machineName={pickedEquipement.name}
                />
                {selectedRequest && formData && (
                  <Box mt="2">
                    <InterventionCreateForm
                      formData={formData}
                      set={set}
                      locked={true}
                      lockedType={!!(selectedRequest.is_system && selectedRequest.suggested_type_inter)}
                      embedded
                      fetchEquipementsFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
                      users={users}
                      saving={saving}
                      error={createError}
                      onSubmit={handleCreate}
                      onCancel={() => { setSelectedRequest(null); setFormData(null); setCreateError(null); }}
                    />
                  </Box>
                )}
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        )}
      </Box>
    </Flex>
  );
}

ContextSection.propTypes = {
  interventionId: PropTypes.string,
  pickedEquipement: PropTypes.object,
  onEquipementChange: PropTypes.func.isRequired,
  pickedIntervention: PropTypes.object,
  onInterventionChange: PropTypes.func.isRequired,
};
