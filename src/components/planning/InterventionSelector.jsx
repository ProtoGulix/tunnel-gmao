/**
 * Sélecteur d'intervention — affiche les interventions ouvertes d'un équipement
 * sous forme de liste carte, identique à InterventionRequestSelector.
 *
 * Quand aucune intervention ouverte n'existe (et que onInterventionCreated est
 * fourni) : un bouton "Créer" déclenche le flow de création via
 * onCreationFlowChange(true) — le flow est rendu hors du <form> par le parent.
 *
 * Export nommé : InterventionCreatorFlow — flow inline demande → intervention.
 *
 * @module components/planning/InterventionSelector
 */
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import { fetchOpenInterventionsByEquipement } from '@/api/planning';
import { createIntervention } from '@/api/interventions';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import { fetchEquipements } from '@/api/equipements';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';

/* ── Constantes d'affichage ───────────────────────────────────────────────── */

const STATUS_LABELS = {
  ouvert: 'Ouvert',
  en_cours: 'En cours',
  attente_pieces: 'Attente pièces',
  attente_prod: 'Attente production',
};

const STATUS_COLORS = {
  ouvert: 'blue',
  en_cours: 'green',
  attente_pieces: 'orange',
  attente_prod: 'orange',
};

const PRIORITY_LABELS = {
  faible: 'Faible',
  normale: 'Normale',
  important: 'Important',
  urgent: 'Urgent',
};

const PRIORITY_COLORS = {
  faible: 'gray',
  normale: 'gray',
  important: 'orange',
  urgent: 'red',
};

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/* ── Ligne d'intervention ─────────────────────────────────────────────────── */

function InterventionRow({ item, isSelected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const priority = item.priority;

  return (
    <Box
      onClick={() => onToggle(isSelected ? null : item)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        padding: '10px 12px',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--accent-3)' : hovered ? 'var(--gray-2)' : undefined,
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        transition: 'background-color 0.15s',
      }}
    >
      <Flex direction="column" gap="1">
        <Flex align="center" justify="between" gap="2">
          <Text size="1" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
            {item.code}
          </Text>
          <Badge size="1" variant="soft" color={STATUS_COLORS[item.status_actual] ?? 'gray'}>
            {STATUS_LABELS[item.status_actual] ?? item.status_actual}
          </Badge>
        </Flex>
        {item.title && (
          <Text size="2" weight="medium">{item.title}</Text>
        )}
        {priority && priority !== 'normale' && priority !== 'faible' && (
          <Badge size="1" color={PRIORITY_COLORS[priority] ?? 'gray'} variant="soft">
            {PRIORITY_LABELS[priority] ?? priority}
          </Badge>
        )}
      </Flex>
    </Box>
  );
}

InterventionRow.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

/* ── Flow inline : demande → intervention ─────────────────────────────────── */

export function InterventionCreatorFlow({ equipementId, equipementLabel, onCreated, onCancel, initialRequest = null }) {
  const [selectedRequest, setSelectedRequest] = useState(initialRequest);
  const [formData, setFormData] = useState(() => ({
    title: initialRequest?.description ?? '',
    type: initialRequest?.suggested_type_inter ?? 'CUR',
    priority: 'normale',
    equipementId,
    equipementLabel: equipementLabel ?? '',
    techInitials: '',
    reportedBy: initialRequest?.demandeur_nom ?? '',
    reportedDate: getDefaultDateTimeLocal(),
    ...(initialRequest?.id && { requestId: initialRequest.id }),
  }));
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
      ...(req.suggested_type_inter && { type: req.suggested_type_inter }),
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
      {onCancel && (
        <Button size="1" variant="ghost" color="gray" type="button" onClick={onCancel}>
          ← Retour au sélecteur d&apos;intervention
        </Button>
      )}

      {/* Liste des demandes — masquée si une demande est pré-sélectionnée (venue de l'onglet Demandes) */}
      {!initialRequest && (
        <InterventionRequestSelector
          selectedId={selectedRequest?.id}
          onSelect={handleSelectRequest}
          machineId={equipementId}
          machineName={equipementLabel}
        />
      )}

      {selectedRequest && (
        <InterventionCreateForm
          formData={formData}
          set={set}
          locked={!!selectedRequest}
          lockedType={!!(selectedRequest.is_system && selectedRequest.suggested_type_inter)}
          fetchEquipementsFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
          saving={saving}
          error={error}
          onSubmit={handleSubmit}
          onCancel={initialRequest ? onCancel : () => setSelectedRequest(null)}
        />
      )}
    </Flex>
  );
}

InterventionCreatorFlow.propTypes = {
  equipementId: PropTypes.string.isRequired,
  equipementLabel: PropTypes.string,
  onCreated: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  initialRequest: PropTypes.object,
};

/* ── Sélecteur principal ──────────────────────────────────────────────────── */

export default function InterventionSelector({
  equipementId,
  equipementLabel,
  value,
  onChange,
  onInterventionCreated,
  onCreationFlowChange,
  locked = false,
  lockedLabel,
}) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locked) return;
    if (!equipementId) {
      setInterventions([]);
      onChange?.(null);
      onCreationFlowChange?.(false);
      return;
    }
    setLoading(true);
    fetchOpenInterventionsByEquipement(equipementId)
      .then((data) => {
        setInterventions(data);
        onChange?.(null);
        onCreationFlowChange?.(data.length === 0 && !!onInterventionCreated);
      })
      .catch(() => { setInterventions([]); onCreationFlowChange?.(false); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId, locked]);

  if (!locked && !equipementId) {
    return (
      <Text size="2" color="gray" style={{ padding: '6px 0', display: 'block' }}>
        Sélectionnez d&apos;abord un équipement
      </Text>
    );
  }

  return (
    <EntitySelectorCard
      title="Interventions ouvertes"
      icon={Wrench}
      items={interventions}
      loading={loading}
      selectedId={value?.id ?? ''}
      onSelect={onChange}
      renderRow={(item, isSelected, onSelect) => (
        <InterventionRow item={item} isSelected={isSelected} onToggle={onSelect} />
      )}
      onCreateClick={onInterventionCreated ? () => onCreationFlowChange?.(true) : undefined}
      createLabel="Créer"
      emptyMessage="Aucune intervention ouverte sur cet équipement"
      locked={locked}
      lockedLabel={lockedLabel ?? 'Intervention fixée'}
      lockedIcon={Wrench}
    />
  );
}

InterventionSelector.propTypes = {
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onInterventionCreated: PropTypes.func,
  /** Appelé avec true/false quand le flow de création (hors <form>) doit s'afficher */
  onCreationFlowChange: PropTypes.func,
  locked: PropTypes.bool,
  lockedLabel: PropTypes.string,
};
