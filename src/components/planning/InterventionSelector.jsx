/**
 * Sélecteur d'intervention déclenché par la sélection d'un équipement.
 * Charge les interventions ouvertes via GET /interventions/open-by-equipement/{id}.
 *
 * Quand aucune intervention ouverte n'existe (et que onInterventionCreated est fourni) :
 *   Étape 1 — sélection/création d'une demande (InterventionRequestSelector filtré sur l'équipement)
 *   Étape 2 — création de l'intervention liée (InterventionCreateForm)
 *   → l'intervention créée est auto-sélectionnée
 *
 * @module components/planning/InterventionSelector
 */
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Select, Spinner, Text } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';
import { fetchOpenInterventionsByEquipement } from '@/api/planning';
import { createIntervention } from '@/api/interventions';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import { fetchEquipements } from '@/api/equipements';

const STATUS_LABELS = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
};

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/* ── Flow inline : demande → intervention ─────────────────────────────────── */

export function InterventionCreatorFlow({ equipementId, equipementLabel, onCreated }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'CUR',
    priority: 'normale',
    equipementId,
    equipementLabel: equipementLabel ?? '',
    techInitials: '',
    reportedBy: '',
    reportedDate: getDefaultDateTimeLocal(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), []);

  const handleSelectRequest = useCallback((req) => {
    if (!req) {
      setSelectedRequest(null);
      setFormData((prev) => ({ ...prev, title: '', reportedBy: '', requestId: null }));
      return;
    }
    setSelectedRequest(req);
    setFormData((prev) => ({
      ...prev,
      title: req.description ?? '',
      reportedBy: req.demandeur_nom ?? '',
      requestId: req.id,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.title.trim()) { setError('Le titre est obligatoire'); return; }
    if (!formData.techInitials.trim()) { setError('Les initiales du technicien sont obligatoires'); return; }
    setSaving(true);
    try {
      const created = await createIntervention({
        ...formData,
        reportedDate: formData.reportedDate
          ? new Date(formData.reportedDate).toISOString()
          : undefined,
      });
      onCreated(created);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? "Erreur lors de la création de l'intervention");
    } finally {
      setSaving(false);
    }
  }, [formData, onCreated]);

  return (
    <Flex direction="column" gap="3">
      <InterventionRequestSelector
        selectedId={selectedRequest?.id}
        onSelect={handleSelectRequest}
        machineId={equipementId}
        machineName={equipementLabel}
      />

      {selectedRequest && (
        <InterventionCreateForm
          formData={formData}
          set={set}
          locked={!!selectedRequest}
          fetchEquipementsFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={() => setSelectedRequest(null)}
        />
      )}
    </Flex>
  );
}

InterventionCreatorFlow.propTypes = {
  equipementId: PropTypes.string.isRequired,
  equipementLabel: PropTypes.string,
  onCreated: PropTypes.func.isRequired,
};

/* ── Sélecteur principal ──────────────────────────────────────────────────── */

export default function InterventionSelector({ equipementId, equipementLabel, value, onChange, disabled, onInterventionCreated, onCreationFlowChange }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!equipementId) {
      setInterventions([]);
      onChange(null);
      onCreationFlowChange?.(false);
      return;
    }
    setLoading(true);
    fetchOpenInterventionsByEquipement(equipementId)
      .then((data) => {
        setInterventions(data);
        if (data.length === 1) {
          onChange(data[0]);
        } else {
          onChange(null);
        }
        // Signal au parent si le flow de création doit s'afficher
        onCreationFlowChange?.(data.length === 0 && !!onInterventionCreated);
      })
      .catch(() => { setInterventions([]); onCreationFlowChange?.(false); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId]);

  if (!equipementId) {
    return (
      <Text size="2" color="gray" style={{ padding: '6px 0', display: 'block' }}>
        Sélectionnez d&apos;abord un équipement
      </Text>
    );
  }

  if (loading) {
    return (
      <Flex align="center" gap="2">
        <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
        <Text size="2" color="gray">Chargement…</Text>
      </Flex>
    );
  }

  if (interventions.length === 0) {
    // Le flow de création est géré par le parent (hors du <form>) via onCreationFlowChange
    if (onInterventionCreated) return null;
    return (
      <Flex align="center" gap="2" style={{
        padding: '6px 10px',
        background: 'var(--amber-3)',
        borderRadius: 'var(--radius-2)',
        border: '1px solid var(--amber-6)',
      }}>
        <Text size="2" color="amber" weight="medium">Aucune intervention ouverte sur cet équipement.</Text>
      </Flex>
    );
  }

  if (interventions.length === 1) {
    const i = interventions[0];
    return (
      <Flex align="center" gap="2" style={{ padding: '6px 10px', background: 'var(--green-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--green-6)' }}>
        <Badge color="green" variant="soft" size="1">{i.code}</Badge>
        <Text size="2" weight="medium">{i.title}</Text>
        <Badge color="gray" variant="soft" size="1">{STATUS_LABELS[i.status_actual] ?? i.status_actual}</Badge>
      </Flex>
    );
  }

  return (
    <Select.Root
      value={value?.id ?? ''}
      onValueChange={(id) => onChange(interventions.find((i) => i.id === id) ?? null)}
      disabled={disabled}
    >
      <Select.Trigger placeholder="Sélectionner une intervention…" style={{ width: '100%' }} />
      <Select.Content>
        {interventions.map((i) => (
          <Select.Item key={i.id} value={i.id}>
            <Flex align="center" gap="2">
              <Text size="2" weight="medium">{i.code}</Text>
              <Text size="2" color="gray">— {i.title}</Text>
              <Badge color="gray" variant="soft" size="1">{STATUS_LABELS[i.status_actual] ?? i.status_actual}</Badge>
            </Flex>
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

InterventionSelector.propTypes = {
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onInterventionCreated: PropTypes.func,
  /** Appelé avec true/false quand le flow de création (hors <form>) doit s'afficher */
  onCreationFlowChange: PropTypes.func,
};
