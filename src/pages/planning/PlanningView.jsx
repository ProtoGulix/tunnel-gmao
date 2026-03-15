/**
 * @fileoverview Page de planning journalier des techniciens.
 * Liste les actions du jour par technicien, navigation jour par jour.
 * @module pages/planning/PlanningView
 */

import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Select, Separator, Text } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiStatus } from '@/hooks/shared/useApiStatus';
import { fetchDayActions, fetchActiveUsers, createActionDirect } from '@/api/planning';
import { getCurrentUser } from '@/api/auth';
import ActionForm from '@/components/interventions/ActionForm';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/* ── Utilitaires ─────────────────────────────────────────────────────────── */

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function minutesToDisplay(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 && m > 0 ? `${h}h${String(m).padStart(2, '0')}` : h > 0 ? `${h}h00` : `${m}min`;
}

function actionDurationMinutes(action) {
  if (action.action_start && action.action_end) {
    return (minutesToDisplay(action.action_end) ?? 0) - (minutesToDisplay(action.action_start) ?? 0);
  }
  if (action.time_spent) return Math.round(action.time_spent * 60);
  return 0;
}

function sortActions(actions) {
  return [...actions].sort((a, b) => {
    if (a.action_start && b.action_start) return a.action_start.localeCompare(b.action_start);
    if (a.action_start) return -1;
    if (b.action_start) return 1;
    return (a.created_at ?? '').localeCompare(b.created_at ?? '');
  });
}

/* ── Composant ActionItem ─────────────────────────────────────────────────── */

function TimeSlot({ start, end }) {
  if (!start) return <Text size="1" color="gray">—</Text>;
  return <Text size="2" weight="medium">{start}{end ? ` — ${end}` : ''}</Text>;
}

function ActionItem({ action }) {
  const durationMin = actionDurationMinutes(action);
  const subcatColor = action.subcategory?.category?.color ?? '#6b7280';
  const subcatLabel = action.subcategory?.label ?? action.subcategory?.name ?? '—';
  const interventionCode = action.intervention?.code ?? '—';
  const interventionId = action.intervention?.id;
  const equipementName = action.intervention?.equipements?.name ?? action.intervention?.machine?.name ?? '—';
  const description = action.description ?? '';

  return (
    <Flex align="start" gap="3" py="2" style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <Box style={{ minWidth: 100 }}>
        <TimeSlot start={action.action_start} end={action.action_end} />
      </Box>

      <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap="2" wrap="wrap">
          {interventionId
            ? <Link to={`/intervention/${interventionId}`}><Text size="2" weight="medium" color="blue">{interventionCode}</Text></Link>
            : <Text size="2" weight="medium">{interventionCode}</Text>
          }
          <Text size="1" color="gray">{equipementName}</Text>
          <Badge size="1" style={{ background: subcatColor + '22', color: subcatColor, border: `1px solid ${subcatColor}44` }}>
            {subcatLabel}
          </Badge>
        </Flex>
        <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {description.length > 80 ? description.slice(0, 80) + '…' : description}
        </Text>
      </Flex>

      <Box style={{ minWidth: 60, textAlign: 'right' }}>
        <Text size="2" color="gray">{formatDuration(durationMin)}</Text>
      </Box>
    </Flex>
  );
}

/* ── Footer total heures ──────────────────────────────────────────────────── */

const TARGET_MINUTES = 7.5 * 60; // 7h30

function DayTotal({ actions }) {
  const total = actions.reduce((sum, a) => sum + actionDurationMinutes(a), 0);
  const color = total >= TARGET_MINUTES ? 'green' : total >= 5 * 60 ? 'orange' : 'red';
  return (
    <Flex align="center" gap="2" pt="3">
      <Clock size={14} />
      <Text size="2" weight="bold">Total :</Text>
      <Text size="2" color={color} weight="bold">{formatDuration(total)}</Text>
      <Text size="1" color="gray">/ 7h30 théoriques</Text>
    </Flex>
  );
}

/* ── Composant principal ──────────────────────────────────────────────────── */

export default function PlanningView() {
  const [date, setDate] = useState(todayIso());
  const [users, setUsers] = useState([]);
  const [techId, setTechId] = useState(null);
  const [actions, setActions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

  const { status: actionsStatus, error: actionsError, wrap: wrapActions } = useApiStatus();
  const { wrap: wrapUsers } = useApiStatus();

  // Charger users + user courant au montage
  useEffect(() => {
    wrapUsers(async () => {
      const [allUsers, me] = await Promise.all([fetchActiveUsers(), getCurrentUser()]);
      setUsers(allUsers);
      setTechId(me?.id ?? null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les actions quand date ou tech change
  const loadActions = useCallback(() => {
    if (!techId) return;
    wrapActions(() => fetchDayActions(date, techId).then(setActions));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, techId]);

  useEffect(() => { loadActions(); }, [loadActions]);

  // Charger les métadonnées pour ActionForm
  useEffect(() => {
    Promise.all([
      import('@/api/actionCategories').then((m) => m.fetchActionCategories?.() ?? []),
      import('@/api/complexityFactors').then((m) => m.fetchComplexityFactors?.() ?? []),
    ])
      .then(([cats, factors]) => setMetadata({ subcategories: cats, complexityFactors: factors }))
      .catch(() => {});
  }, []);

  const handleActionSubmit = async (payload) => {
    return createActionDirect(payload);
  };

  const handleActionSuccess = () => {
    setShowForm(false);
    loadActions();
  };

  const sorted = sortActions(actions);

  return (
    <Box p="4" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header navigation */}
      <Flex align="center" justify="between" mb="4" wrap="wrap" gap="3">
        <Flex align="center" gap="2">
          <Button size="1" variant="soft" color="gray" onClick={() => setDate((d) => addDays(d, -1))}>
            <ChevronLeft size={14} />
          </Button>
          <Text size="3" weight="bold" style={{ textTransform: 'capitalize' }}>{formatDate(date)}</Text>
          <Button size="1" variant="soft" color="gray" onClick={() => setDate((d) => addDays(d, 1))}>
            <ChevronRight size={14} />
          </Button>
          <Button size="1" variant="ghost" color="blue" onClick={() => setDate(todayIso())}>
            Aujourd&apos;hui
          </Button>
        </Flex>

        <Flex align="center" gap="2">
          <Select.Root value={techId ?? ''} onValueChange={setTechId}>
            <Select.Trigger placeholder="Technicien…" />
            <Select.Content>
              {users.map((u) => (
                <Select.Item key={u.id} value={u.id}>
                  {u.first_name} {u.last_name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>

          <Button size="2" color="blue" onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus size={14} /> Ajouter une action
          </Button>
        </Flex>
      </Flex>

      {/* Formulaire de création */}
      {showForm && (
        <Box mb="4">
          <ActionForm
            metadata={metadata}
            onCancel={() => setShowForm(false)}
            onSubmit={handleActionSubmit}
            onSuccess={handleActionSuccess}
            planningMode
            defaultTechId={techId}
          />
        </Box>
      )}

      {/* Liste des actions */}
      {actionsStatus === 'loading' && <LoadingState fullscreen={false} message="Chargement…" />}
      {actionsStatus === 'error' && <ErrorState error={actionsError} onRetry={loadActions} />}

      {actionsStatus !== 'loading' && sorted.length === 0 && (
        <Flex direction="column" align="center" gap="2" py="8">
          <Clock size={32} color="var(--gray-7)" />
          <Text color="gray" size="2">Aucune action ce jour</Text>
        </Flex>
      )}

      {sorted.length > 0 && (
        <Box>
          <Flex align="center" gap="2" mb="2">
            <Text size="1" color="gray" style={{ minWidth: 100 }}>Créneau</Text>
            <Text size="1" color="gray" style={{ flex: 1 }}>Action</Text>
            <Text size="1" color="gray" style={{ minWidth: 60, textAlign: 'right' }}>Durée</Text>
          </Flex>
          <Separator size="4" />
          {sorted.map((a) => <ActionItem key={a.id} action={a} />)}
          <DayTotal actions={sorted} />
        </Box>
      )}
    </Box>
  );
}
