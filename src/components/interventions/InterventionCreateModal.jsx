import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Dialog, Flex, Select, Spinner, Tabs, Text, TextField, VisuallyHidden,
} from '@radix-ui/themes';
import { ClipboardList, Plus, Trash2, Wrench } from 'lucide-react';
import { createIntervention } from '@/api/interventions';
import { createInterventionTask } from '@/api/interventionTasks';
import { createInterventionRequest, fetchInterventionRequests } from '@/api/intervention-requests';
import { fetchEquipements } from '@/api/equipements';
import { fetchActiveUsers } from '@/api/planning';
import { fetchServices } from '@/api/services';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { useAuth } from '@/auth/useAuth';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';
import SelectionSummary from '@/components/ui/SelectionSummary';
import { TechDateRow } from '@/components/interventions/InterventionFormFields';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const PRIORITY_OPTIONS = [
  { value: 'urgent',    label: 'Urgent' },
  { value: 'important', label: 'Important' },
  { value: 'normale',   label: 'Normal' },
  { value: 'faible',    label: 'Faible' },
];

// ── Sélecteur de DI existante ─────────────────────────────────────────────────

function DIRow({ req, isSelected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Box
      onClick={() => onToggle(isSelected ? null : req)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        padding: '8px 12px',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--accent-3)' : hovered ? 'var(--gray-2)' : undefined,
        boxShadow: isSelected ? 'inset 3px 0 0 var(--accent-9)' : undefined,
        transition: 'background-color 0.15s',
      }}
    >
      <Flex direction="column" gap="1">
        <Flex align="center" justify="between" gap="2">
          <Text size="1" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)' }}>
            {req.code}
          </Text>
          {req.equipement?.code && (
            <Badge color="blue" variant="soft" size="1">{req.equipement.code}</Badge>
          )}
        </Flex>
        <Text size="2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {req.description}
        </Text>
        <Text size="1" color="gray">
          {req.demandeur_nom}
          {req.demandeur_service ? ` — ${req.demandeur_service}` : ''}
        </Text>
      </Flex>
    </Box>
  );
}
DIRow.propTypes = { req: PropTypes.object.isRequired, isSelected: PropTypes.bool, onToggle: PropTypes.func.isRequired };

function DISelector({ equipementId, selectedDI, onSelect }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 100, statut: 'nouvelle' };
    if (equipementId) params.machineId = equipementId;
    fetchInterventionRequests(params)
      .then((res) => setItems(res.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [equipementId]);

  if (loading) {
    return <Flex align="center" justify="center" py="4"><Spinner size="2" /></Flex>;
  }
  if (items.length === 0) {
    return (
      <Flex direction="column" align="center" gap="2" py="4" style={{ color: 'var(--gray-8)' }}>
        <ClipboardList size={20} strokeWidth={1.5} />
        <Text size="2" color="gray">Aucune demande ouverte{equipementId ? ' pour cet équipement' : ''}</Text>
      </Flex>
    );
  }

  return (
    <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 6, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
      {items.map((req) => (
        <DIRow
          key={req.id}
          req={req}
          isSelected={selectedDI?.id === req.id}
          onToggle={onSelect}
        />
      ))}
    </Box>
  );
}
DISelector.propTypes = {
  equipementId: PropTypes.string,
  selectedDI: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

// ── Section tâches ────────────────────────────────────────────────────────────

let _key = 0;
const newTask = () => ({ _k: ++_key, label: '' });

function TasksSection({ tasks, onAdd, onRemove, onChange }) {
  function handleKeyDown(e, idx) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onAdd();
      setTimeout(() => {
        const inputs = document.querySelectorAll('[data-task-input]');
        inputs[inputs.length - 1]?.focus();
      }, 0);
    }
    if (e.key === 'Backspace' && !tasks[idx].label && tasks.length > 1) {
      e.preventDefault();
      onRemove(idx);
      setTimeout(() => {
        const inputs = document.querySelectorAll('[data-task-input]');
        inputs[Math.max(0, idx - 1)]?.focus();
      }, 0);
    }
  }

  return (
    <Box>
      <Flex align="center" justify="between" mb="2">
        <Text size="2" weight="bold">Tâches</Text>
        <Text size="1" color="gray">Entrée pour ajouter</Text>
      </Flex>
      <Flex direction="column" gap="1">
        {tasks.map((t, idx) => (
          <Flex key={t._k} align="center" gap="2">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue-8)', flexShrink: 0 }} />
            <TextField.Root
              data-task-input
              placeholder={`Tâche ${idx + 1}…`}
              value={t.label}
              onChange={(e) => onChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              style={{ flex: 1 }}
            />
            {tasks.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--gray-8)', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </Flex>
        ))}
      </Flex>
      <Button type="button" size="1" variant="ghost" color="gray" mt="2" onClick={onAdd}>
        <Plus size={12} /> Ajouter une tâche
      </Button>
    </Box>
  );
}
TasksSection.propTypes = {
  tasks: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ── Modal principale ──────────────────────────────────────────────────────────

const defaultForm = () => ({
  title: '',
  type: 'CUR',
  priority: 'normale',
  equipementId: null,
  equipementLabel: '',
  techId: '',
  reportedDate: getDefaultDateTimeLocal(),
  // champs DI nouvelle
  demandeurNom: '',
  serviceId: '',
});

export default function InterventionCreateModal({ open, onOpenChange, onSuccess }) {
  const { user } = useAuth();
  const [users, setUsers]       = useState([]);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState(defaultForm);
  const [tasks, setTasks]       = useState([newTask()]);
  const [diMode, setDiMode]     = useState('existante'); // 'existante' | 'nouvelle'
  const [selectedDI, setSelectedDI] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState(null);

  const set = useCallback((field, value) => setFormData((prev) => ({ ...prev, [field]: value })), []);

  const fetchEquipementsFn = useCallback(
    (search) => fetchEquipements({ search }).then((r) => r.items ?? []),
    []
  );

  // Reset + chargement à l'ouverture
  useEffect(() => {
    if (!open) return;
    setFormData(defaultForm());
    setTasks([newTask()]);
    setSelectedDI(null);
    setDiMode('existante');
    setError(null);
    fetchServices().then(setServices).catch(() => {});
    fetchActiveUsers().then((list) => {
      setUsers(list);
      if (user?.id) {
        const match = list.find((u) => u.id === user.id);
        if (match) setFormData((prev) => ({ ...prev, techId: match.id }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Quand on sélectionne une DI existante : pré-remplit titre + équipement
  const handleSelectDI = useCallback((di) => {
    setSelectedDI(di);
    if (!di) return;
    setFormData((prev) => ({
      ...prev,
      title: di.description ?? prev.title,
      equipementId: di.equipement?.id ? String(di.equipement.id) : prev.equipementId,
      equipementLabel: di.equipement
        ? `${di.equipement.code ? di.equipement.code + ' — ' : ''}${di.equipement.name}`
        : prev.equipementLabel,
    }));
  }, []);

  const addTask    = () => setTasks((prev) => [...prev, newTask()]);
  const removeTask = (idx) => setTasks((prev) => prev.filter((_, i) => i !== idx));
  const changeTask = (idx, val) => setTasks((prev) => prev.map((t, i) => i === idx ? { ...t, label: val } : t));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError(null);

    if (!formData.title.trim())  return setError('Le titre est obligatoire');
    if (!formData.equipementId)  return setError('Veuillez sélectionner un équipement');
    if (!formData.techId)        return setError('Veuillez sélectionner un technicien');
    if (diMode === 'existante' && !selectedDI) return setError('Veuillez sélectionner une demande ou passer en mode "Nouvelle demande"');

    setSaving(true);
    try {
      let requestId;

      if (diMode === 'existante') {
        requestId = selectedDI.id;
      } else {
        // Création silencieuse d'une nouvelle DI
        const demandeurNom = formData.demandeurNom.trim() || (() => {
          const tech = users.find((u) => u.id === formData.techId);
          return tech ? `${tech.first_name ?? ''} ${tech.last_name ?? ''}`.trim() : 'Système';
        })();
        const di = await createInterventionRequest({
          machineId: formData.equipementId,
          demandeurNom,
          description: formData.title,
          serviceId: formData.serviceId || null,
        });
        requestId = di.id;
      }

      const created = await createIntervention({
        ...formData,
        requestId,
        reportedDate: formData.reportedDate ? new Date(formData.reportedDate).toISOString() : undefined,
      });

      const validTasks = tasks.filter((t) => t.label.trim());
      for (const t of validTasks) {
        await createInterventionTask({ intervention_id: created.id, label: t.label.trim(), status: 'todo' });
      }

      onSuccess?.(created);
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Erreur lors de la création de l'intervention"));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (v) => { if (!saving) onOpenChange(v); };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 580 }}>
        <VisuallyHidden><Dialog.Title>Nouvelle intervention</Dialog.Title></VisuallyHidden>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">

            {/* ── En-tête ── */}
            <Flex align="center" gap="2">
              <Wrench size={18} color="var(--blue-9)" />
              <Text size="4" weight="bold">Nouvelle intervention</Text>
            </Flex>

            {/* ── Erreur ── */}
            {error && (
              <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: '8px 12px' }}>
                <Text size="2" color="red">{error}</Text>
              </Box>
            )}

            {/* ── Titre ── */}
            <Box>
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                Titre <Text color="red">*</Text>
              </Text>
              <TextField.Root
                placeholder="Titre de l'intervention"
                value={formData.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </Box>

            {/* ── Équipement ── */}
            <Box>
              <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                Équipement <Text color="red">*</Text>
              </Text>
              {!formData.equipementId ? (
                <AsyncSearchSelect
                  fetchFn={fetchEquipementsFn}
                  onSelect={(eq) => {
                    set('equipementId', eq.id);
                    set('equipementLabel', `${eq.code ? eq.code + ' — ' : ''}${eq.name}`);
                    setSelectedDI(null); // réinitialise la DI si l'équipement change
                  }}
                  renderItem={(eq) => (
                    <Flex align="center" gap="2">
                      <Text size="2" weight="bold">{eq.code}</Text>
                      <Text size="2">{eq.name}</Text>
                    </Flex>
                  )}
                  placeholder="Rechercher par code, nom…"
                  minChars={1}
                />
              ) : (
                <SelectionSummary
                  badgeText={formData.equipementLabel?.split(' — ')[0] ?? ''}
                  mainText={formData.equipementLabel?.split(' — ').slice(1).join(' — ') || formData.equipementLabel}
                  onClear={() => { set('equipementId', null); set('equipementLabel', ''); setSelectedDI(null); }}
                />
              )}
            </Box>

            {/* ── Source de la DI ── */}
            <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 8, overflow: 'hidden' }}>
              <Tabs.Root value={diMode} onValueChange={(v) => { setDiMode(v); setSelectedDI(null); }}>
                <Tabs.List style={{ background: 'var(--gray-2)', padding: '0 8px' }}>
                  <Tabs.Trigger value="existante">DI existante</Tabs.Trigger>
                  <Tabs.Trigger value="nouvelle">Nouvelle demande</Tabs.Trigger>
                </Tabs.List>

                <Box style={{ padding: '12px' }}>
                  <Tabs.Content value="existante">
                    <DISelector
                      equipementId={formData.equipementId ?? undefined}
                      selectedDI={selectedDI}
                      onSelect={handleSelectDI}
                    />
                    {selectedDI && (
                      <Flex align="center" gap="2" mt="2">
                        <Badge size="1" color="blue" variant="soft">DI sélectionnée</Badge>
                        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{selectedDI.code}</Text>
                      </Flex>
                    )}
                  </Tabs.Content>

                  <Tabs.Content value="nouvelle">
                    <Flex gap="3" wrap="wrap">
                      <Box style={{ flex: '1 1 180px' }}>
                        <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                          Demandeur <Text color="gray" size="1">(optionnel)</Text>
                        </Text>
                        <TextField.Root
                          placeholder="Nom du demandeur…"
                          value={formData.demandeurNom}
                          onChange={(e) => set('demandeurNom', e.target.value)}
                        />
                      </Box>
                      <Box style={{ flex: '1 1 160px' }}>
                        <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                          Service <Text color="gray" size="1">(optionnel)</Text>
                        </Text>
                        <Select.Root value={formData.serviceId} onValueChange={(v) => set('serviceId', v)}>
                          <Select.Trigger placeholder="Sélectionner…" style={{ width: '100%' }} />
                          <Select.Content>
                            {services.map((s) => (
                              <Select.Item key={s.id} value={s.id}>{s.label}</Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Root>
                      </Box>
                    </Flex>
                  </Tabs.Content>
                </Box>
              </Tabs.Root>
            </Box>

            {/* ── Tech + Date ── */}
            <TechDateRow formData={formData} set={set} users={users} />

            {/* ── Type + Priorité ── */}
            <Flex gap="3" wrap="wrap">
              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Type</Text>
                <Select.Root value={formData.type} onValueChange={(v) => set('type', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {INTERVENTION_TYPES.map((t) => (
                      <Select.Item key={t.id} value={t.id}>{t.title}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Priorité</Text>
                <Select.Root value={formData.priority} onValueChange={(v) => set('priority', v)}>
                  <Select.Trigger />
                  <Select.Content>
                    {PRIORITY_OPTIONS.map((p) => (
                      <Select.Item key={p.value} value={p.value}>{p.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* ── Tâches ── */}
            <Box style={{ borderTop: '1px solid var(--gray-4)', paddingTop: 16 }}>
              <TasksSection tasks={tasks} onAdd={addTask} onRemove={removeTask} onChange={changeTask} />
            </Box>

            {/* ── Actions ── */}
            <Flex gap="2" justify="end">
              <Button type="button" variant="soft" color="gray" disabled={saving} onClick={() => handleOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving} style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}>
                {saving ? <><Spinner size="1" /> Création…</> : "Créer l'intervention"}
              </Button>
            </Flex>

          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

InterventionCreateModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
