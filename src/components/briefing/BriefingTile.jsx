import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { AlertTriangle, Wrench, Clock, Bot, User } from 'lucide-react';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';
import { normalizeTileData, SECTION_BAR_COLOR } from './briefingTileNormalize';
import { BriefingTileHeader } from './BriefingTileHeader';

const AVATAR_COLORS = {
  IB: 'var(--blue-9)', LP: 'var(--green-9)', CC: 'var(--amber-9)', QC: 'var(--pink-9)',
};


const SITUATION_BADGE = {
  no_intervention: { color: 'gray', label: 'sans intervention' },
  no_action: { color: 'orange', label: 'sans action' },
  no_task: { color: 'orange', label: 'sans tâche' },
  blocked_piece: { color: 'orange', label: 'pièces en attente' },
  decision: { color: 'red', label: 'décision requise' },
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


const today = new Date();
today.setHours(0, 0, 0, 0);

function TaskSummary({ tasks }) {
  const hasTasks = tasks && tasks.length > 0;

  if (!hasTasks) {
    return (
      <Flex align="center" gap="1" style={{ padding: '5px 10px', borderTop: '1px solid var(--gray-4)', background: 'var(--gray-2)' }}>
        <Text size="1" style={{ color: 'var(--gray-8)', fontStyle: 'italic' }}>Aucune tâche</Text>
      </Flex>
    );
  }

  const counts = { in_progress: 0, todo: 0, done: 0, skipped: 0 };
  let overdueCount = 0;
  tasks.forEach((task) => {
    const s = task.status ?? 'todo';
    if (s in counts) counts[s]++; else counts.todo++;
    if (task.due_date && new Date(task.due_date) < today && task.status !== 'done' && task.status !== 'skipped') {
      overdueCount++;
    }
  });
  const hasOverdue = overdueCount > 0;
  const parts = [
    counts.in_progress > 0 && { label: `${counts.in_progress} en cours`, color: 'blue' },
    counts.todo > 0 && { label: `${counts.todo} à faire`, color: 'gray' },
    counts.done > 0 && { label: `${counts.done} fait${counts.done > 1 ? 's' : ''}`, color: 'green' },
    counts.skipped > 0 && { label: `${counts.skipped} ignoré${counts.skipped > 1 ? 's' : ''}`, color: 'gray' },
  ].filter(Boolean);

  return (
    <Flex align="center" gap="2" wrap="wrap" style={{
      padding: '6px 10px',
      borderTop: hasOverdue ? '1px solid var(--red-5)' : '1px solid var(--gray-4)',
      background: hasOverdue ? 'var(--red-2)' : 'var(--gray-2)',
    }}>
      {hasOverdue
        ? <AlertTriangle size={12} color="var(--red-9)" style={{ flexShrink: 0 }} />
        : <Wrench size={12} color="var(--gray-8)" style={{ flexShrink: 0 }} />
      }
      <Text size="1" weight="medium" style={{ color: 'var(--gray-11)' }}>
        {tasks.length} tâche{tasks.length > 1 ? 's' : ''}
      </Text>
      <Text size="1" style={{ color: 'var(--gray-7)' }}>·</Text>
      {hasOverdue && (
        <Badge color="red" variant="solid" size="1" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <AlertTriangle size={9} />{overdueCount} en retard
        </Badge>
      )}
      {parts.map((p, i) => (
        <Badge key={i} color={p.color} variant="soft" size="1">{p.label}</Badge>
      ))}
    </Flex>
  );
}
TaskSummary.propTypes = { tasks: PropTypes.array };

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
      <TaskSummary tasks={tasks} />
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
