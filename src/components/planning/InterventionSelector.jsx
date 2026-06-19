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
import { fetchInterventionTasks } from '@/api/interventionTasks';
import { createIntervention } from '@/api/interventions';
import InterventionRequestSelector from '@/components/intervention-requests/InterventionRequestSelector';
import InterventionCreateForm from '@/components/interventions/InterventionCreateForm';
import { fetchEquipements } from '@/api/equipements';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';
import GhostCreateRow, { useUsers } from '@/components/tasks/GhostCreateRow';

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

/**
 * Colonne gauche du flow création d'intervention :
 * affiche la liste des demandes ouvertes. La sélection d'une demande
 * remonte via onRequestSelected pour que le formulaire s'affiche à droite.
 */
export function InterventionCreatorLeft({ equipementId, equipementLabel, selectedRequest, onRequestSelected, onCancel }) {
  return (
    <Flex direction="column" gap="3">
      {onCancel && (
        <Button size="1" variant="ghost" color="gray" type="button" onClick={onCancel}>
          ← Retour
        </Button>
      )}
      <InterventionRequestSelector
        selectedId={selectedRequest?.id}
        onSelect={onRequestSelected}
        machineId={equipementId}
        machineName={equipementLabel}
      />
    </Flex>
  );
}

InterventionCreatorLeft.propTypes = {
  equipementId: PropTypes.string.isRequired,
  equipementLabel: PropTypes.string,
  selectedRequest: PropTypes.object,
  onRequestSelected: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

/**
 * Colonne droite du flow création d'intervention :
 * affiche le formulaire InterventionCreateForm.
 */
export function InterventionCreatorRight({ equipementId, selectedRequest, formData, set, saving, error, onSubmit, onCancel }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetchActiveUsers().then(setUsers).catch(() => {}); }, []);

  if (!selectedRequest) {
    return (
      <Flex align="center" justify="center" direction="column" gap="2"
        style={{ minHeight: 160, border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)', padding: '1.5rem' }}
      >
        <Wrench size={20} color="var(--gray-7)" />
        <Text size="2" color="gray" align="center">
          Sélectionnez une demande pour créer l&apos;intervention
        </Text>
      </Flex>
    );
  }

  return (
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
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

InterventionCreatorRight.propTypes = {
  equipementId: PropTypes.string.isRequired,
  selectedRequest: PropTypes.object,
  formData: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

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

/* ── Liste des tâches d'une intervention + ghost row ─────────────────────── */

const TASK_STATUS_COLORS = { todo: 'gray', in_progress: 'orange', done: 'green', skipped: 'red' };
const TASK_STATUS_LABELS = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé', skipped: 'Ignoré' };

function InterventionTaskList({ interventionId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const users = useUsers();

  useEffect(() => {
    if (!interventionId) return;
    setLoading(true);
    fetchInterventionTasks(interventionId)
      .then(setTasks)
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [interventionId]);

  const handleCreated = useCallback((task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  if (loading) {
    return <Flex justify="center" p="3"><Spinner size="1" /></Flex>;
  }

  return (
    <Box style={{ borderTop: '1px solid var(--gray-4)', background: 'var(--gray-1)' }}>
      <Flex align="center" gap="2" px="3" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
        <Text size="1" weight="bold" color="gray">Tâches</Text>
        <Badge color="gray" variant="soft" size="1">{tasks.length}</Badge>
      </Flex>
      {tasks.length === 0 && (
        <Text size="1" color="gray" style={{ display: 'block', padding: '8px 12px', fontStyle: 'italic' }}>
          Aucune tâche
        </Text>
      )}
      {tasks.map((task) => (
        <Flex
          key={task.id}
          gap="2" px="3" py="2" align="center"
          style={{ borderBottom: '1px solid var(--gray-3)' }}
        >
          <Badge size="1" color={TASK_STATUS_COLORS[task.status] ?? 'gray'} variant="soft" style={{ flexShrink: 0 }}>
            {TASK_STATUS_LABELS[task.status] ?? task.status}
          </Badge>
          <Text size="1" style={{ flex: 1, color: task.status === 'done' || task.status === 'skipped' ? 'var(--gray-8)' : undefined }}>
            {task.label}
          </Text>
          {task.assigned_to && (
            <Text size="1" color="gray" style={{ flexShrink: 0 }}>
              {(task.assigned_to.initials || task.assigned_to.initial || '').toUpperCase()}
            </Text>
          )}
        </Flex>
      ))}
      <GhostCreateRow
        interventionId={interventionId}
        users={users}
        onCreated={handleCreated}
      />
    </Box>
  );
}

InterventionTaskList.propTypes = {
  interventionId: PropTypes.string.isRequired,
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
        <Box style={{ maxHeight: value ? 320 : 480, overflowY: 'auto' }}>
          <GroupedInterventionList
            items={interventions}
            selectedId={value?.id ?? ''}
            onSelect={onChange}
          />
        </Box>
      )}
      {value?.id && (
        <Box style={{ maxHeight: 320, overflowY: 'auto' }}>
          <InterventionTaskList interventionId={String(value.id)} />
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
