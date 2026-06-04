/**
 * Sélecteur d'intervention — affiche les interventions ouvertes d'un équipement
 * sous forme de liste carte, identique à InterventionRequestSelector.
 *
 * Le bouton "Créer" déclenche le flow via onCreationFlowChange(true).
 * Export nommé : InterventionCreatorFlow — flow inline demande → intervention.
 *
 * @module components/planning/InterventionSelector
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Separator, Spinner, Text } from '@radix-ui/themes';
import { Plus, ShieldCheck, Wrench } from 'lucide-react';
import { fetchOpenInterventionsByEquipement, fetchActiveUsers } from '@/api/planning';
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

// Ordre de tri priorité ASC : urgent(0) → important(1) → normal/normale(2) → faible(3)
const PRIORITY_SORT = { urgent: 0, important: 1, normal: 2, normale: 2, faible: 3 };

function sortByPriority(items) {
  return [...items].sort(
    (a, b) => (PRIORITY_SORT[a.priority] ?? 2) - (PRIORITY_SORT[b.priority] ?? 2),
  );
}

/* ── Liste avec groupement par priorité ──────────────────────────────────── */

const GROUP_LABELS = { urgent: 'Urgent', important: 'Important', normal: 'Normal', normale: 'Normal', faible: 'Faible' };

function GroupedInterventionList({ items, selectedId, onSelect }) {
  // Regrouper par priorité dans l'ordre de tri
  const groups = useMemo(() => {
    const sorted = sortByPriority(items);
    const map = new Map();
    for (const item of sorted) {
      const key = item.priority ?? 'normal';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return [...map.entries()]; // [[priority, items[]], ...]
  }, [items]);

  const multipleGroups = groups.length > 1;

  return (
    <Box>
      {groups.map(([priority, groupItems], gi) => (
        <Box key={priority}>
          {multipleGroups && (
            <Flex align="center" gap="2" px="3" py="1" style={{ background: 'var(--gray-2)', borderBottom: '1px solid var(--gray-4)' }}>
              <Text size="1" weight="bold" color="gray">
                {GROUP_LABELS[priority] ?? priority} · {groupItems.length}
              </Text>
            </Flex>
          )}
          {groupItems.map((item) => (
            <InterventionRow
              key={item.id}
              item={item}
              isSelected={item.id === selectedId || item.id?.toString() === selectedId}
              onToggle={onSelect}
            />
          ))}
          {multipleGroups && gi < groups.length - 1 && <Separator size="4" />}
        </Box>
      ))}
    </Box>
  );
}

GroupedInterventionList.propTypes = {
  items: PropTypes.array.isRequired,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
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
        <Flex align="center" gap="1" wrap="wrap">
          {priority && priority !== 'normale' && priority !== 'faible' && (
            <Badge size="1" color={PRIORITY_COLORS[priority] ?? 'gray'} variant="soft">
              {PRIORITY_LABELS[priority] ?? priority}
            </Badge>
          )}
          {item.plan_id && (
            <Badge size="1" color="green" variant="soft">
              <ShieldCheck size={10} /> Préventif
            </Badge>
          )}
        </Flex>
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
    techId: '',
    reportedBy: initialRequest?.demandeur_nom ?? '',
    reportedDate: getDefaultDateTimeLocal(),
    ...(initialRequest?.id && { requestId: initialRequest.id }),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchActiveUsers().then(setUsers).catch(() => {});
  }, []);

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
    if (!formData.techId) { setError('Veuillez sélectionner un technicien'); return; }
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
          diDetail={selectedRequest}
          fetchEquipementsFn={(q) => fetchEquipements({ search: q }).then((r) => r.items ?? [])}
          users={users}
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
  onCreateClick,
  locked = false,
  lockedLabel,
}) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (locked) return;
    if (!equipementId) {
      setInterventions([]);
      onChange?.(null);
      return;
    }
    setLoading(true);
    fetchOpenInterventionsByEquipement(equipementId)
      .then((data) => {
        setInterventions(data);
        if (!initialValueRef.current) onChange?.(null);
      })
      .catch(() => setInterventions([]))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipementId, locked]);

  if (locked) {
    return (
      <EntitySelectorCard
        title="Interventions ouvertes"
        icon={Wrench}
        items={[]}
        loading={false}
        selectedId=""
        onSelect={onChange}
        renderRow={() => null}
        locked
        lockedLabel={lockedLabel ?? 'Intervention fixée'}
        lockedIcon={Wrench}
      />
    );
  }

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Flex align="center" gap="2" px="3" py="3" style={{ borderBottom: '1px solid var(--gray-4)' }}>
        <Wrench size={18} color="var(--accent-9)" />
        <Text size="3" weight="bold">Interventions ouvertes</Text>
        {!loading && <Badge color="gray" variant="soft" size="1">{interventions.length}</Badge>}
        <Box style={{ flex: 1 }} />
        {onCreateClick && (
          <Button size="1" variant="soft" color="blue" type="button" onClick={onCreateClick}>
            <Plus size={12} /> Créer
          </Button>
        )}
      </Flex>

      {loading && (
        <Flex justify="center" p="4"><Spinner size="2" /></Flex>
      )}
      {!loading && interventions.length === 0 && (
        <Text size="2" color="gray" style={{ display: 'block', padding: '1.5rem', textAlign: 'center' }}>
          Aucune intervention ouverte sur cet équipement
        </Text>
      )}
      {!loading && interventions.length > 0 && (
        <Box style={{ maxHeight: 480, overflowY: 'auto' }}>
          <GroupedInterventionList
            items={interventions}
            selectedId={value?.id ?? ''}
            onSelect={onChange}
          />
        </Box>
      )}
    </Card>
  );
}

InterventionSelector.propTypes = {
  equipementId: PropTypes.string,
  equipementLabel: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  /** Déclenche le formulaire de création inline dans le parent */
  onCreateClick: PropTypes.func,
  locked: PropTypes.bool,
  lockedLabel: PropTypes.string,
};
