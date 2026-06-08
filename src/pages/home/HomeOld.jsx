import { Container, Grid, Box, Flex, Text, Badge, Button, Callout } from '@radix-ui/themes';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, Wrench, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import InteractiveTable from '@/components/ui/InteractiveTable';
import { useHomeData } from '@/hooks/useHomeData';
import { PRIORITY_CONFIG } from '@/config/interventionTypes';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '@/config/taskConfig';

function getDueDateColor(dueDate) {
  if (!dueDate) return 'gray';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return 'red';
  if (diff === 0) return 'amber';
  if (diff === 1) return 'blue';
  return 'gray';
}

function formatDateFR(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Colonnes tâches ────────────────────────────────────────────────────────

const TASK_COLUMNS = [
  { key: 'status', header: 'Statut', width: '110px', align: 'left' },
  { key: 'label', header: 'Tâche', align: 'left' },
  { key: 'context', header: 'Contexte', width: '140px', align: 'left' },
  { key: 'due_date', header: 'Échéance', width: '90px', align: 'right' },
];

function renderTaskCell(task, column) {
  switch (column.key) {
    case 'status':
      return (
        <Badge size="1" variant="soft" color={TASK_STATUS_COLOR[task.status] || 'gray'}>
          {TASK_STATUS_LABEL[task.status] || task.status}
        </Badge>
      );
    case 'label':
      return (
        <Text
          size="2"
          weight="medium"
          style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {task.label}
        </Text>
      );
    case 'context': {
      const machineCode = task.equipement?.code;
      const intervId = task.intervention?.id;
      const intervCode = task.intervention?.code;
      return (
        <Flex direction="column" gap="1">
          {machineCode && (
            <Text size="1" weight="medium" color="gray">{machineCode}</Text>
          )}
          {intervId && intervCode && (
            <Link
              to={`/interventions/${intervId}`}
              style={{ fontSize: 11, color: 'var(--blue-11)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140, display: 'block' }}
              title={intervCode}
            >
              {intervCode}
            </Link>
          )}
          {!machineCode && !intervCode && <Text size="1" color="gray">—</Text>}
        </Flex>
      );
    }
    case 'due_date': {
      const color = getDueDateColor(task.due_date);
      return task.due_date ? (
        <Badge size="1" color={color} variant={color === 'red' ? 'solid' : 'soft'}>
          {formatDateFR(task.due_date)}
        </Badge>
      ) : (
        <Text size="1" color="gray">—</Text>
      );
    }
    default:
      return null;
  }
}

// ── Colonnes interventions ─────────────────────────────────────────────────

const INTER_COLUMNS = [
  { key: 'code', header: 'Code', width: '140px', align: 'left' },
  { key: 'title', header: 'Intervention', align: 'left' },
  { key: 'type', header: 'Type', width: '55px', align: 'center' },
  { key: 'progress', header: 'Avancement', width: '110px', align: 'right' },
];

function renderInterventionCell(interv, column) {
  const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
  switch (column.key) {
    case 'code':
      return (
        <Flex align="center" gap="2">
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `var(--${priorityConfig.color}-9)`,
              flexShrink: 0,
            }}
          />
          <Text size="1" weight="medium">{interv.code}</Text>
        </Flex>
      );
    case 'title':
      return (
        <Text
          size="2"
          weight="medium"
          style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {interv.title}
        </Text>
      );
    case 'type':
      return (
        <Badge size="1" color="gray" variant="soft">{interv.type || '—'}</Badge>
      );
    case 'progress': {
      // TODO: task_progress exposé quand /interventions supportera include=stats complètement
      const tp = interv.stats?.taskProgress;
      if (!tp || tp.total === 0) return <Text size="1" color="gray">—</Text>;
      const pct = Math.round((tp.done / tp.total) * 100);
      return (
        <Flex align="center" gap="2" justify="end">
          <Box
            style={{
              width: 50,
              background: 'var(--gray-4)',
              borderRadius: 4,
              height: 5,
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                background: 'var(--blue-9)',
                width: `${pct}%`,
                height: '100%',
                borderRadius: 4,
              }}
            />
          </Box>
          <Text size="1" color="gray">{tp.done}/{tp.total}</Text>
        </Flex>
      );
    }
    default:
      return null;
  }
}

function getInterventionRowStyle(interv) {
  const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
  return { borderLeft: `3px solid var(--${priorityConfig.color}-9)` };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const {
    tasks,
    interventions,
    summary,
    tasksLoading,
    interventionsLoading,
    tasksError,
    interventionsError,
    refresh,
  } = useHomeData();

  const stats = [
    {
      label: 'Tâches actives',
      value: tasksLoading ? '…' : (tasks.length || summary?.active_tasks || 0),
    },
    {
      label: 'Interventions ouvertes',
      value: interventionsLoading ? '…' : (interventions.length || summary?.open_interventions || 0),
    },
  ];

  return (
    <Container>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue personnalisée de votre activité"
        icon={Home}
        stats={stats}
        onRefresh={refresh}
      />

      <Container size="4" p="4">
        <Grid columns={{ initial: '1', md: '2' }} gap="5">

          {/* ── Mes tâches ── */}
          <Box>
            {tasksError && (
              <Callout.Root color="red" size="1" mb="3">
                <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                <Callout.Text>{tasksError}</Callout.Text>
              </Callout.Root>
            )}
            <InteractiveTable
              title="Mes tâches"
              badge={
                !tasksLoading && tasks.length > 0
                  ? <Badge color="blue" variant="soft">{tasks.length}</Badge>
                  : undefined
              }
              columns={TASK_COLUMNS}
              data={tasks}
              loading={tasksLoading}
              loadingMessage="Chargement des tâches..."
              renderCell={renderTaskCell}
            />
            {!tasksLoading && !tasksError && tasks.length === 0 && (
              <Text size="2" color="gray">Aucune tâche assignée en cours</Text>
            )}
            <Flex justify="end" mt="2">
              <Button variant="ghost" size="1" asChild>
                <Link to="/tasks">Voir toutes les tâches →</Link>
              </Button>
            </Flex>
          </Box>

          {/* ── Mes interventions ouvertes ── */}
          <Box>
            {interventionsError && (
              <Callout.Root color="red" size="1" mb="3">
                <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
                <Callout.Text>{interventionsError}</Callout.Text>
              </Callout.Root>
            )}
            <InteractiveTable
              title="Mes interventions"
              badge={
                !interventionsLoading && interventions.length > 0
                  ? <Badge color="blue" variant="soft">{interventions.length}</Badge>
                  : undefined
              }
              columns={INTER_COLUMNS}
              data={interventions}
              loading={interventionsLoading}
              loadingMessage="Chargement des interventions..."
              onRowClick={(interv) => navigate(`/intervention/${interv.id}`)}
              renderCell={renderInterventionCell}
              getRowStyle={getInterventionRowStyle}
            />
            {!interventionsLoading && !interventionsError && interventions.length === 0 && (
              <Text size="2" color="gray">Aucune intervention ouverte</Text>
            )}
            <Flex justify="end" mt="2">
              <Button variant="ghost" size="1" asChild>
                <Link to="/interventions">Voir toutes les interventions →</Link>
              </Button>
            </Flex>
          </Box>

        </Grid>
      </Container>
    </Container>
  );
}

