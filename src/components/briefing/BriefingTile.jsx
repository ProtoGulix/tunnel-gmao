import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { AlertTriangle, CalendarClock, UserCog, Wrench, Clock, Bot, User } from 'lucide-react';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';
import { normalizeTileData, SECTION_BAR_COLOR } from './briefingTileNormalize';
import { BriefingTileHeader } from './BriefingTileHeader';

const AVATAR_COLORS = {
  IB: 'var(--blue-9)', LP: 'var(--green-9)', CC: 'var(--amber-9)', QC: 'var(--pink-9)',
};


const SITUATION_BADGE = {
  no_intervention: { color: 'gray',   label: 'sans intervention' },
  no_action:       { color: 'orange', label: 'sans action'       },
  no_task:         { color: 'orange', label: 'sans tâche'        },
  blocked_piece:   { color: 'orange', label: 'pièces en attente' },
  decision:        { color: 'red',    label: 'décision requise'  },
};

function TypeAndSituationBadges({ typeLabel, typeColor, situationType }) {
  return (
    <Flex gap="1" align="center">
      {typeLabel && <Badge color={typeColor} variant="soft" size="1">{typeLabel}</Badge>}
      {SITUATION_BADGE[situationType] && (
        <Badge color={SITUATION_BADGE[situationType].color} variant="soft" size="1">
          {SITUATION_BADGE[situationType].label}
        </Badge>
      )}
    </Flex>
  );
}
TypeAndSituationBadges.propTypes = {
  typeLabel: PropTypes.string,
  typeColor: PropTypes.string,
  situationType: PropTypes.string,
};

function UrgencyLabel({ nextDueDate, reportedDate }) {
  const { label, color, level } = getInterventionUrgency(nextDueDate, reportedDate);
  return (
    <Text size="1" weight={level === 'overdue' || level === 'urgent' ? 'bold' : 'regular'}
      style={{ color, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  );
}
UrgencyLabel.propTypes = { nextDueDate: PropTypes.string, reportedDate: PropTypes.string };

const TASK_STATUS = {
  in_progress: { color: 'var(--blue-9)',  bg: 'var(--blue-2)',  label: 'En cours', badge: 'blue' },
  todo:        { color: 'var(--gray-6)',  bg: 'transparent',    label: 'À faire',  badge: 'gray' },
  done:        { color: 'var(--green-9)', bg: 'var(--green-2)', label: 'Fait',     badge: 'green' },
  skipped:     { color: 'var(--gray-5)',  bg: 'transparent',    label: 'Ignoré',   badge: 'gray' },
};

const TASK_ORIGIN_ICON = { plan: CalendarClock, resp: UserCog, tech: Wrench };
const TASK_ORIGIN_COLOR = { plan: 'var(--violet-9)', resp: 'var(--orange-9)', tech: 'var(--blue-9)' };

const today = new Date();
today.setHours(0, 0, 0, 0);

function formatDue(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

const MAX_TASKS = 3;

function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) return null;

  const sorted = [...tasks].sort((a, b) => {
    const order = { in_progress: 0, todo: 1, done: 2, skipped: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
  });

  const visible = sorted.slice(0, MAX_TASKS);
  const remaining = sorted.length - MAX_TASKS;

  return (
    <div style={{ borderTop: '1px solid var(--gray-4)' }}>
      {visible.map((task, idx) => {
        const cfg = TASK_STATUS[task.status] ?? TASK_STATUS.todo;
        const OriginIcon = TASK_ORIGIN_ICON[task.origin] ?? null;
        const originColor = TASK_ORIGIN_COLOR[task.origin] ?? 'var(--gray-7)';
        const due = formatDue(task.due_date);
        const overdue = due && new Date(task.due_date) < today && task.status !== 'done' && task.status !== 'skipped';
        const isLast = idx === visible.length - 1 && remaining <= 0;
        const initials = task.assigned_to?.initials ?? task.assigned_to?.initial ?? null;

        return (
          <Flex key={task.id} align="center" gap="2" style={{
            padding: '5px 10px',
            borderBottom: isLast ? 'none' : '1px solid var(--gray-3)',
            background: cfg.bg,
            borderLeft: `3px solid ${cfg.color}`,
          }}>
            {OriginIcon && <OriginIcon size={11} color={originColor} style={{ flexShrink: 0 }} />}
            <Text size="1" style={{ flex: 1, color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.label}
            </Text>
            <Badge color={cfg.badge} variant="soft" size="1" style={{ flexShrink: 0 }}>{cfg.label}</Badge>
            {overdue && due ? (
              <Badge color="red" variant="solid" size="1" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                <AlertTriangle size={9} />{due}
              </Badge>
            ) : due ? (
              <Text size="1" color="gray" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{due}</Text>
            ) : null}
            {initials && (
              <Text size="1" style={{ flexShrink: 0, color: 'var(--gray-10)', fontFamily: 'monospace' }}>{initials.toUpperCase()}</Text>
            )}
          </Flex>
        );
      })}
      {remaining > 0 && (
        <Flex align="center" style={{ padding: '4px 10px', borderTop: '1px solid var(--gray-3)' }}>
          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            … et {remaining} autre{remaining > 1 ? 's' : ''} tâche{remaining > 1 ? 's' : ''}
          </Text>
        </Flex>
      )}
    </div>
  );
}
TaskList.propTypes = { tasks: PropTypes.array };

export function BriefingTile({ item, sectionId }) {
  const barColor = SECTION_BAR_COLOR[sectionId] ?? 'var(--gray-9)';
  const d = normalizeTileData(item, sectionId);
  const isDiSection = sectionId.startsWith('di_');
  const tasks = item.tasks ?? item.tasksLinked ?? [];
  const hasIntervention = isDiSection ? !!item.intervention : true;
  const interCode = isDiSection ? null : (item.code ?? null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-panel-solid)', border: '1px solid var(--gray-4)', borderLeft: `3px solid ${barColor}`, borderRadius: 6, overflow: 'hidden' }}>
      <BriefingTileHeader
        isDiSection={isDiSection}
        diCode={d.diCode}
        machineCode={d.machineCode}
        machineName={d.machineName}
        diStatutLabel={d.diStatutLabel}
        diStatutColor={d.diStatutColor}
        interCode={interCode}
        hasIntervention={hasIntervention}
        typeLabel={d.typeLabel}
        typeColor={d.typeColor}
        situationType={d.situationType}
      />
      <Flex direction="column" gap="2" style={{ padding: '14px 16px', minWidth: 0 }}>
        <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', fontStyle: 'italic' }}>
          &laquo;&nbsp;{d.title ?? '—'}&nbsp;&raquo;
        </Text>
        {(d.demandeurNom || d.serviceLabel || d.isSystem !== undefined) && (
          <Flex align="center" gap="2">
            {d.isSystem
              ? <Bot size={13} style={{ color: 'var(--gray-8)', flexShrink: 0 }} />
              : <User size={13} style={{ color: 'var(--gray-8)', flexShrink: 0 }} />
            }
            {d.demandeurNom && (
              <Text size="1" style={{ color: 'var(--gray-10)' }}>{d.demandeurNom}</Text>
            )}
            {d.serviceLabel && (
              <Badge size="1" variant="outline" color="gray">{d.serviceLabel}</Badge>
            )}
          </Flex>
        )}
      </Flex>
      <TaskList tasks={tasks} />
      <Flex align="center" gap="2" style={{ padding: '3px 12px', borderTop: '1px solid var(--gray-4)', background: 'var(--gray-2)' }}>
        {d.techInitials && (
          <Badge size="1" variant="soft" style={{ background: AVATAR_COLORS[d.techInitials.toUpperCase()] + '33', color: AVATAR_COLORS[d.techInitials.toUpperCase()] ?? 'var(--gray-9)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>
            {d.techInitials.toUpperCase()}
          </Badge>
        )}
        {d.daysOpen !== null && (
          <Flex align="center" gap="1">
            <Clock size={10} style={{ color: 'var(--gray-8)', flexShrink: 0 }} />
            <Text size="1" style={{ color: 'var(--gray-9)' }}>
              {d.daysOpen === 0 ? "aujourd'hui" : `${d.daysOpen}j`}
            </Text>
          </Flex>
        )}
        <div style={{ flex: 1 }} />
        <UrgencyLabel nextDueDate={d.nextDueDate} reportedDate={d.reportedDate} />
      </Flex>
    </div>
  );
}

BriefingTile.propTypes = {
  item: PropTypes.object.isRequired,
  sectionId: PropTypes.string.isRequired,
};
