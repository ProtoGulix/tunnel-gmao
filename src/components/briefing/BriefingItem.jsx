import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { TYPE_INTER_LABELS, INTERVENTION_TYPES } from '@/config/interventionTypes';
import { ProgressBar } from './components/ProgressBar';

const AVATAR_COLORS = {
  IB: 'var(--blue-9)',
  LP: 'var(--green-9)',
  CC: 'var(--amber-9)',
  QC: 'var(--pink-9)',
};

const TYPE_COLOR = Object.fromEntries(INTERVENTION_TYPES.map((t) => [t.id, t.color]));

function Avatar({ initials }) {
  const bg = AVATAR_COLORS[(initials || '').toUpperCase()] || 'var(--gray-8)';
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Text size="1" weight="bold" style={{ color: '#fff', lineHeight: 1 }}>
        {initials || '?'}
      </Text>
    </div>
  );
}

Avatar.propTypes = { initials: PropTypes.string };

const SECTION_BAR_COLOR = {
  now: 'var(--red-9)',
  waiting: 'var(--orange-9)',
  running: 'var(--blue-9)',
  open: 'var(--gray-7)',
  archived: 'var(--gray-5)',
};

function UrgencyBadge({ urgency }) {
  const { level, label } = urgency;
  const colorMap = {
    overdue: '#ef4444',
    urgent:  '#f97316',
    planned: '#3b82f6',
  };
  return (
    <Text size="1" weight={level === 'overdue' || level === 'urgent' ? 'bold' : 'regular'}
      style={{ color: colorMap[level] ?? 'var(--gray-10)', lineHeight: 1, whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  );
}

UrgencyBadge.propTypes = {
  urgency: PropTypes.shape({
    level: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
};

function SituationBadges({ situation }) {
  const { situationType, type, tasksLinked, stats } = situation;
  const typeLabel = TYPE_INTER_LABELS[type] || type;
  const typeColor = TYPE_COLOR[type] || 'gray';
  const totalTasks = stats?.tasks?.total ?? stats?.taskProgress?.total ?? 0;
  const isNoTask = totalTasks === 0 && (tasksLinked?.length ?? 0) === 0;

  // Le type est toujours affiché en premier
  const typeBadge = <Badge color={typeColor} variant="soft" size="1">{typeLabel}</Badge>;

  if (situationType === 'decision') {
    return (
      <Flex gap="1" align="center">
        {typeBadge}
        <Badge color="red" variant="soft" size="1">sans action</Badge>
      </Flex>
    );
  }
  if (situationType === 'blocked_piece' && situation.priority === 'urgent') {
    return (
      <Flex gap="1" align="center">
        {typeBadge}
        <Badge color="red" variant="soft" size="1">urgent</Badge>
        <Badge color="orange" variant="soft" size="1">pièces en attente</Badge>
      </Flex>
    );
  }
  if (situationType === 'blocked_piece') {
    return (
      <Flex gap="1" align="center">
        {typeBadge}
        <Badge color="orange" variant="soft" size="1">pièces en attente</Badge>
      </Flex>
    );
  }
  // in_progress et autres
  return (
    <Flex gap="1" align="center">
      {typeBadge}
      {isNoTask && <Badge color="orange" variant="soft" size="1">sans tâche</Badge>}
    </Flex>
  );
}

SituationBadges.propTypes = { situation: PropTypes.object.isRequired };

export function BriefingItem({ situation, sectionId }) {
  const barColor = SECTION_BAR_COLOR[sectionId] || 'var(--gray-9)';
  const urgency = situation.urgency ?? { level: 'pending', label: '—', color: '#9ca3af' };

  const tasks = situation.stats?.tasks;
  const completionPct = tasks && (tasks.total ?? 0) > 0
    ? Math.round(((tasks.done ?? 0) / tasks.total) * 100)
    : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-panel-solid)',
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <Flex justify="between" align="start" style={{ padding: '10px 12px' }}>
        <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
          {/* Ligne 1 : code machine + badges */}
          <Flex align="center" gap="2" wrap="wrap">
            <Text size="1" weight="medium"
              style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)' }}>
              {situation.machine?.code || situation.code}
            </Text>
            <SituationBadges situation={situation} />
          </Flex>
          {/* Ligne 2 : titre */}
          <Text size="2" weight="medium"
            style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {situation.title}
          </Text>
        </Flex>

        {/* Avatar + badge urgence next_due_date */}
        <Flex direction="column" align="center" gap="1" style={{ marginLeft: 12, flexShrink: 0 }}>
          <Avatar initials={situation.techInitials} />
          <UrgencyBadge urgency={urgency} />
        </Flex>
      </Flex>

      {/* Barre de complétion — uniquement si des tâches existent */}
      {completionPct !== null && (
        <ProgressBar percentage={completionPct} height={22} />
      )}
    </div>
  );
}

BriefingItem.propTypes = {
  situation: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    title: PropTypes.string,
    priority: PropTypes.string,
    type: PropTypes.string,
    reportedDate: PropTypes.string,
    next_due_date: PropTypes.string,
    techInitials: PropTypes.string,
    machine: PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
    stats: PropTypes.shape({
      tasks: PropTypes.shape({ total: PropTypes.number, done: PropTypes.number }),
    }),
    daysOpen: PropTypes.number,
    tasksLinked: PropTypes.array,
    situationType: PropTypes.string,
    urgency: PropTypes.object,
  }).isRequired,
  sectionId: PropTypes.oneOf(['now', 'waiting', 'running', 'open', 'archived']).isRequired,
};
