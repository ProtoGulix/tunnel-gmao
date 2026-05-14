import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { TYPE_INTER_LABELS } from '@/config/interventionTypes';

const AVATAR_COLORS = {
  IB: 'var(--blue-9)',
  LP: 'var(--green-9)',
  CC: 'var(--amber-9)',
  QC: 'var(--pink-9)',
};

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
};

function formatDelay(situation) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taskWithDue = situation.tasksLinked?.find((t) => t.due_date);
  if (taskWithDue) {
    const due = new Date(taskWithDue.due_date);
    const diff = Math.round((due - today) / 86400000);
    if (diff < 0) return { label: 'retard', color: 'var(--red-11)' };
    if (diff === 0) return { label: 'auj.', color: 'var(--red-11)' };
    if (diff <= 3) return { label: `J-${diff}`, color: 'var(--orange-11)' };
    return {
      label: `${due.getDate().toString().padStart(2, '0')}/${(due.getMonth() + 1).toString().padStart(2, '0')}`,
      color: 'var(--gray-11)',
    };
  }

  const diff = situation.daysOpen ?? 0;
  if (diff === 0) return { label: 'auj.', color: 'var(--red-11)' };
  if (diff > 30) return { label: `${diff}j`, color: 'var(--red-11)' };
  return { label: `${diff}j`, color: 'var(--gray-11)' };
}

function SituationBadges({ situation }) {
  const { situationType, type, tasksLinked, stats } = situation;
  const typeLabel = TYPE_INTER_LABELS[type] || type;
  const totalTasks = stats?.tasks?.total ?? stats?.taskProgress?.total ?? 0;
  const isNoTask = totalTasks === 0 && (tasksLinked?.length ?? 0) === 0;

  if (situationType === 'decision') {
    return (
      <Flex gap="1" align="center">
        <Badge color="red" variant="soft" size="1">critique</Badge>
        <Badge color="blue" variant="soft" size="1">décision</Badge>
        {isNoTask && <Badge color="orange" variant="soft" size="1">sans tâche</Badge>}
      </Flex>
    );
  }
  if (situationType === 'blocked_piece' && situation.priority === 'urgent') {
    return (
      <Flex gap="1" align="center">
        <Badge color="red" variant="soft" size="1">urgent</Badge>
        <Badge color="orange" variant="soft" size="1">pièce</Badge>
        {isNoTask && <Badge color="orange" variant="soft" size="1">sans tâche</Badge>}
      </Flex>
    );
  }
  if (situationType === 'blocked_piece') {
    return (
      <Flex gap="1" align="center">
        <Badge color="orange" variant="soft" size="1">pièce</Badge>
        {isNoTask && <Badge color="orange" variant="soft" size="1">sans tâche</Badge>}
      </Flex>
    );
  }
  if (situationType === 'in_progress') {
    return (
      <Flex gap="1" align="center">
        <Badge color="blue" variant="soft" size="1">{typeLabel}</Badge>
        {isNoTask && <Badge color="orange" variant="soft" size="1">sans tâche</Badge>}
      </Flex>
    );
  }
  if (isNoTask) return <Badge color="orange" variant="soft" size="1">sans tâche</Badge>;
  return null;
}

SituationBadges.propTypes = { situation: PropTypes.object.isRequired };

function ContextLine({ situation }) {
  const { situationType, daysOpen, stats, tasksLinked } = situation;
  const ac = stats?.actionCount ?? 0;
  const pc = stats?.purchasePending ?? stats?.purchaseCount ?? 0;
  const tt = stats?.totalTime ?? 0;

  if (situationType === 'decision') {
    return (
      <Text size="1" style={{ color: daysOpen > 30 ? 'var(--red-11)' : 'var(--gray-11)' }}>
        Aucune action engagée · {daysOpen}j ouvert · décision requise
      </Text>
    );
  }
  if (situationType === 'blocked_piece') {
    return (
      <Text size="1" color="gray">
        {pc} demande{pc > 1 ? 's' : ''} d&apos;achat en attente · {daysOpen}j
      </Text>
    );
  }
  const linkedTask = tasksLinked?.find((t) => t.status === 'in_progress') || tasksLinked?.[0];
  return (
    <Text size="1" color="gray">
      {ac} action{ac > 1 ? 's' : ''} · {tt}h réalisée{tt > 1 ? 's' : ''}
      {linkedTask ? ` · ${linkedTask.label}` : ''}
    </Text>
  );
}

ContextLine.propTypes = { situation: PropTypes.object.isRequired };

export function BriefingItem({ situation, sectionId }) {
  const barColor = SECTION_BAR_COLOR[sectionId] || 'var(--gray-9)';
  const delay = formatDelay(situation);

  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-panel-solid)',
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <Flex direction="column" style={{ flex: 1 }}>
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
            {/* Ligne 3 : contexte */}
            <ContextLine situation={situation} />
          </Flex>

          {/* Avatar + délai */}
          <Flex direction="column" align="center" gap="1" style={{ marginLeft: 12, flexShrink: 0 }}>
            <Avatar initials={situation.techInitials} />
            <Text size="1" weight="medium" style={{ color: delay.color, lineHeight: 1 }}>
              {delay.label}
            </Text>
          </Flex>
        </Flex>
      </Flex>
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
    techInitials: PropTypes.string,
    machine: PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
    stats: PropTypes.shape({
      actionCount: PropTypes.number,
      totalTime: PropTypes.number,
      purchaseCount: PropTypes.number,
    }),
    daysOpen: PropTypes.number,
    tasksLinked: PropTypes.array,
    situationType: PropTypes.string,
  }).isRequired,
  sectionId: PropTypes.oneOf(['now', 'waiting', 'running']).isRequired,
};
