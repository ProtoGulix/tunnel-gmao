import { useState, useEffect } from 'react';
import { Flex, Text, Spinner, Callout, Button, Badge } from '@radix-ui/themes';
import {
  AlertCircle, ClipboardList, Clock, Package, ExternalLink,
  CalendarClock, UserCog, Wrench, CheckCircle2, MinusCircle, Circle,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingItem } from '@/components/briefing/BriefingItem';
import { useBriefingData } from '@/hooks/useBriefingData';
import { fetchIntervention } from '@/api/interventions';
import { fetchInterventionTasks } from '@/api/interventionTasks';
import { STATUS_CONFIG, TYPE_INTER_LABELS } from '@/config/interventionTypes';

/* ── Config origine ─────────────────────────────────────────────────────── */

const ORIGIN_CONFIG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', label: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', label: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   label: 'Technicien' },
};

const TASK_STATUS_CONFIG = {
  todo:        { Icon: Circle,       color: 'var(--gray-7)',   label: 'À faire' },
  in_progress: { Icon: Clock,        color: 'var(--blue-9)',   label: 'En cours' },
  done:        { Icon: CheckCircle2, color: 'var(--green-9)',  label: 'Fait' },
  skipped:     { Icon: MinusCircle,  color: 'var(--orange-9)', label: 'Ignorée' },
};

/* ── Tuile tâche ────────────────────────────────────────────────────────── */

function TaskRow({ task }) {
  const statusCfg = TASK_STATUS_CONFIG[task.status] ?? TASK_STATUS_CONFIG.todo;
  const originCfg = ORIGIN_CONFIG[task.origin] ?? null;
  const { Icon: StatusIcon } = statusCfg;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = task.due_date && new Date(task.due_date) < today;
  const dueFmt = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    : null;

  return (
    <div style={{
      borderLeft: `3px solid ${statusCfg.color}`,
      background: task.status === 'done' ? 'var(--green-2)' : task.status === 'skipped' ? 'var(--orange-2)' : 'var(--color-panel-solid)',
      borderRadius: 6,
      border: '1px solid var(--gray-4)',
      marginBottom: 6,
      padding: '7px 10px',
      opacity: task.status === 'done' ? 0.75 : 1,
    }}>
      {/* Ligne 1 : statut + label + optional */}
      <Flex align="center" gap="2">
        <StatusIcon size={13} color={statusCfg.color} style={{ flexShrink: 0 }} />
        <Text size="2" weight={task.status === 'in_progress' ? 'bold' : 'regular'}
          style={{ flex: 1, color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.label}
        </Text>
        {task.optional && (
          <Badge size="1" variant="soft" color="gray" style={{ flexShrink: 0 }}>optionnelle</Badge>
        )}
      </Flex>

      {/* Ligne 2 : origine + assigné + échéance + temps */}
      <Flex align="center" gap="2" mt="1" style={{ flexWrap: 'wrap' }}>
        {originCfg && (
          <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
            <originCfg.Icon size={11} color={originCfg.color} />
            <Text size="1" style={{ color: originCfg.color }}>{originCfg.label}</Text>
          </Flex>
        )}
        {task.assigned_to && (
          <Badge size="1" variant="soft" color="gray" style={{ flexShrink: 0, fontFamily: 'monospace' }}>
            {task.assigned_to.initial ?? `${task.assigned_to.first_name?.[0] ?? ''}${task.assigned_to.last_name?.[0] ?? ''}`}
          </Badge>
        )}
        {task.action_count > 0 && (
          <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
            <Clock size={11} color="var(--gray-9)" />
            <Text size="1" color="gray">{task.action_count} action{task.action_count > 1 ? 's' : ''} · {task.time_spent}h</Text>
          </Flex>
        )}
        {overdue && dueFmt && (
          <Badge color="red" variant="solid" size="1" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
            <AlertTriangle size={10} />{dueFmt}
          </Badge>
        )}
        {dueFmt && !overdue && (
          <Text size="1" color="gray" style={{ flexShrink: 0 }}>{dueFmt}</Text>
        )}
        {task.status === 'skipped' && task.skip_reason && (
          <Text size="1" color="orange" style={{ flexShrink: 0, fontStyle: 'italic' }}>
            {task.skip_reason}
          </Text>
        )}
      </Flex>
    </div>
  );
}

/* ── Panneau détail intervention ────────────────────────────────────────── */

const PRIORITY_CONFIG = {
  urgent:    { color: 'red',    label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normale:   { color: 'gray',   label: 'Normale' },
  faible:    { color: 'gray',   label: 'Faible' },
};

function DetailPanel({ situation }) {
  const [detail, setDetail]   = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!situation) return;
    setDetail(null);
    setTasks([]);
    setLoading(true);
    Promise.all([
      fetchIntervention(situation.id),
      fetchInterventionTasks(situation.id),
    ])
      .then(([iv, t]) => { setDetail(iv); setTasks(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [situation?.id]);

  if (!situation) {
    return (
      <Flex align="center" justify="center" direction="column" gap="3"
        style={{ height: '100%', minHeight: 300, color: 'var(--gray-8)' }}>
        <ClipboardList size={32} strokeWidth={1.5} />
        <Text size="2" color="gray">Sélectionne une intervention</Text>
      </Flex>
    );
  }

  const statusCfg   = STATUS_CONFIG[situation.status_actual] ?? null;
  const priorityCfg = PRIORITY_CONFIG[situation.priority] ?? PRIORITY_CONFIG.normale;
  const typeLabel   = TYPE_INTER_LABELS[situation.type] ?? situation.type ?? '—';

  const TASK_SORT = { in_progress: 0, todo: 1, skipped: 2, done: 3 };
  const sortedTasks = [...tasks].sort((a, b) => (TASK_SORT[a.status] ?? 9) - (TASK_SORT[b.status] ?? 9));

  const totalTime    = detail?.action?.reduce((s, a) => s + (a.timeSpent ?? 0), 0) ?? situation.stats?.totalTime ?? 0;
  const actionCount  = detail?.action?.length ?? situation.stats?.actionCount ?? 0;
  const purchaseCount = situation.stats?.purchaseCount ?? 0;
  const daysOpen     = situation.daysOpen ?? 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── En-tête intervention ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>

        {/* Ligne codes + lien */}
        <Flex align="center" gap="2" mb="2">
          <Link to={`/intervention/${situation.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Badge variant="outline" color="gray" size="2"
              style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
              {situation.code}
            </Badge>
          </Link>
          {statusCfg && <Badge size="1" color={statusCfg.color} variant="soft">{statusCfg.label}</Badge>}
          <Badge size="1" color={priorityCfg.color} variant="soft">{priorityCfg.label}</Badge>
          <Badge size="1" color="gray" variant="soft">{typeLabel}</Badge>
          <Link to={`/intervention/${situation.id}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Button size="1" variant="ghost" color="gray"><ExternalLink size={13} /></Button>
          </Link>
        </Flex>

        {/* Titre */}
        <Text size="3" weight="medium" style={{ display: 'block', color: 'var(--gray-12)', marginBottom: 2 }}>
          {situation.title}
        </Text>

        {/* Équipement */}
        {situation.machine && (
          <Text size="2" color="gray" style={{ display: 'block', fontStyle: 'italic' }}>
            {situation.machine.code} — {situation.machine.name}
          </Text>
        )}

        {/* DI à l'origine */}
        {detail?.request && (
          <Flex align="center" gap="2" mt="2" style={{ padding: '5px 8px', background: 'var(--gray-2)', borderRadius: 4 }}>
            <ClipboardList size={12} color="var(--gray-9)" style={{ flexShrink: 0 }} />
            <Text size="1" color="gray">
              <strong>{detail.request.code}</strong>
              {detail.request.demandeur_nom ? ` · ${detail.request.demandeur_nom}` : ''}
              {detail.request.description ? ` — ${detail.request.description}` : ''}
            </Text>
          </Flex>
        )}

        {/* Compteurs */}
        <Flex align="center" gap="3" mt="2" style={{ flexWrap: 'wrap' }}>
          <Flex align="center" gap="1">
            <Clock size={12} color="var(--gray-9)" />
            <Text size="1" color="gray">
              <strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong>
            </Text>
          </Flex>
          <Flex align="center" gap="1">
            <Text size="1" color="gray"><strong>{daysOpen}j</strong> ouvert</Text>
          </Flex>
          {purchaseCount > 0 && (
            <Flex align="center" gap="1">
              <Package size={12} color="var(--orange-9)" />
              <Text size="1" style={{ color: 'var(--orange-11)' }}>
                <strong>{purchaseCount}</strong> DA en attente
              </Text>
            </Flex>
          )}
          {situation.techInitials && (
            <Badge size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>
              {situation.techInitials}
            </Badge>
          )}
        </Flex>
      </div>

      {/* ── Liste des tâches ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px' }}>
        {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

        {!loading && sortedTasks.length === 0 && (
          <Text size="2" color="gray" style={{ display: 'block', textAlign: 'center', marginTop: 24, fontStyle: 'italic' }}>
            Aucune tâche liée à cette intervention
          </Text>
        )}

        {!loading && sortedTasks.map((task) => <TaskRow key={task.id} task={task} />)}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function BriefingPage() {
  const { sections, counters, loading, error, retry } = useBriefingData();
  const [selectedSituation, setSelectedSituation] = useState(null);

  const visibleSections = sections.filter((s) => s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  return (
    <>
      <PageHeader title="Briefing" subtitle="Situations actives et décisions en attente" icon={ClipboardList} />

      <div style={{ display: 'flex', alignItems: 'flex-start', height: 'calc(100vh - 64px)' }}>

        {/* ── Colonne gauche — liste interventions ─────────────────────── */}
        <div style={{ width: '42%', borderRight: '1px solid var(--gray-5)', height: '100%', overflowY: 'auto', padding: '10px 14px' }}>

          <BriefingCounters counters={counters} loading={loading} />

          {error && (
            <Callout.Root color="red" style={{ marginBottom: 14 }}>
              <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
              <Button size="1" variant="soft" color="red" onClick={retry} style={{ marginLeft: 'auto' }}>
                Réessayer
              </Button>
            </Callout.Root>
          )}

          {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

          {allEmpty && (
            <Flex align="center" justify="center" style={{ minHeight: 200 }}>
              <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
                Tout est sous contrôle — aucune situation active
              </Text>
            </Flex>
          )}

          {!loading && visibleSections.map((section, idx) => (
            <BriefingSection key={section.id} label={section.label} isFirst={idx === 0}>
              {section.items.map((situation) => (
                <div
                  key={situation.id}
                  onClick={() => setSelectedSituation(situation)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    outline: selectedSituation?.id === situation.id ? '2px solid var(--blue-8)' : 'none',
                    outlineOffset: 1,
                  }}
                >
                  <BriefingItem situation={situation} sectionId={section.id} />
                </div>
              ))}
            </BriefingSection>
          ))}
        </div>

        {/* ── Colonne droite — détail + tâches ─────────────────────────── */}
        <div style={{ flex: 1, height: '100%', minWidth: 0 }}>
          <DetailPanel situation={selectedSituation} />
        </div>
      </div>
    </>
  );
}
