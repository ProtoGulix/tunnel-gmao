import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { TYPE_INTER_LABELS } from '@/config/interventionTypes';

// ── Avatar ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = {
  IB: 'var(--blue-9)',
  LP: 'var(--green-9)',
  CC: 'var(--amber-9)',
  QC: 'var(--pink-9)',
};

function getAvatarBg(initials) {
  return AVATAR_COLORS[(initials || '').toUpperCase()] || 'var(--gray-8)';
}

function Avatar({ initials }) {
  const bg = getAvatarBg(initials);
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text size="1" weight="bold" style={{ color: '#fff', lineHeight: 1 }}>
        {initials || '?'}
      </Text>
    </div>
  );
}

Avatar.propTypes = {
  initials: PropTypes.string,
};

Avatar.defaultProps = {
  initials: '',
};

// ── Couleur barre gauche par section ───────────────────────────────────────

const SECTION_BAR_COLOR = {
  now: 'var(--red-9)',
  waiting: 'var(--orange-9)',
  running: 'var(--blue-9)',
};

// ── Formatage délai affiché sous l'avatar ──────────────────────────────────

function formatDelay(situation) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Si une tâche liée a une due_date, on l'affiche en priorité
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

  // Sinon calcul depuis reportedDate
  const reported = new Date(situation.reportedDate);
  reported.setHours(0, 0, 0, 0);
  const diff = Math.round((today - reported) / 86400000);

  if (diff === 0) return { label: 'auj.', color: 'var(--red-11)' };
  if (situation.daysOpen > 30) return { label: `${situation.daysOpen}j`, color: 'var(--red-11)' };
  return { label: `${situation.daysOpen}j`, color: 'var(--gray-11)' };
}

// ── Badges selon type de situation ────────────────────────────────────────

function SituationBadges({ situation }) {
  const { situationType, type } = situation;
  const typeLabel = TYPE_INTER_LABELS[type] || type;

  if (situationType === 'decision') {
    return (
      <Flex gap="1" align="center">
        <Badge color="red" variant="soft" size="1">critique</Badge>
        <Badge color="blue" variant="soft" size="1">décision</Badge>
      </Flex>
    );
  }
  if (situationType === 'blocked_piece' && situation.priority === 'urgent') {
    return (
      <Flex gap="1" align="center">
        <Badge color="red" variant="soft" size="1">urgent</Badge>
        <Badge color="orange" variant="soft" size="1">pièce</Badge>
      </Flex>
    );
  }
  if (situationType === 'blocked_piece') {
    return <Badge color="orange" variant="soft" size="1">pièce</Badge>;
  }
  if (situationType === 'in_progress') {
    return <Badge color="blue" variant="soft" size="1">{typeLabel}</Badge>;
  }
  return null;
}

SituationBadges.propTypes = {
  situation: PropTypes.object.isRequired,
};

// ── Ligne de contexte (ligne 3) ────────────────────────────────────────────

function ContextLine({ situation }) {
  const { situationType, daysOpen, stats, tasksLinked } = situation;
  const ac = stats?.actionCount ?? 0;
  const pc = stats?.purchaseCount ?? 0;
  const tt = stats?.totalTime ?? 0;

  if (situationType === 'decision') {
    const isLong = daysOpen > 30;
    return (
      <Text size="1" style={{ color: isLong ? 'var(--red-11)' : 'var(--gray-11)' }}>
        Aucune action engagée · {daysOpen}j ouvert · décision requise
      </Text>
    );
  }
  if (situationType === 'blocked_piece') {
    return (
      <Text size="1" color="gray">
        {pc} demande{pc > 1 ? 's' : ''} d'achat en attente · {daysOpen}j
      </Text>
    );
  }
  // in_progress
  const linkedTask = tasksLinked?.find((t) => t.status === 'in_progress') || tasksLinked?.[0];
  return (
    <Text size="1" color="gray">
      {ac} action{ac > 1 ? 's' : ''} · {tt}h réalisée{tt > 1 ? 's' : ''}
      {linkedTask ? ` · tâche: ${linkedTask.label}` : ''}
    </Text>
  );
}

ContextLine.propTypes = {
  situation: PropTypes.object.isRequired,
};

// ── Corps expandé ──────────────────────────────────────────────────────────

function ExpandedBody({ situation, onNavigate }) {
  const { stats, tasksLinked, hasDecision, hasPiece, daysOpen } = situation;
  const ac = stats?.actionCount ?? 0;
  const pc = stats?.purchaseCount ?? 0;
  const tt = stats?.totalTime ?? 0;

  const hasContent = ac > 0 || (tasksLinked?.length ?? 0) > 0 || pc > 0 || hasDecision;

  const TASK_STATUS_COLOR = {
    done: 'var(--green-9)',
    in_progress: 'var(--blue-9)',
    todo: 'var(--gray-7)',
  };

  const TASK_STATUS_LABEL = {
    done: 'fait',
    in_progress: 'en cours',
    todo: 'à faire',
  };

  function formatTaskDue(dueDate) {
    if (!dueDate) return '';
    const d = new Date(dueDate);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => e.key === 'Enter' && onNavigate(e)}
      style={{
        borderTop: '1px solid var(--gray-4)',
        padding: '8px 12px',
        background: 'var(--gray-2)',
        cursor: 'pointer',
      }}
    >
      <Flex direction="column" gap="1">
        {!hasContent && (
          <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
            Aucun détail disponible — ouvrir l'intervention
          </Text>
        )}

        {/* Actions réalisées */}
        {ac > 0 && (
          <Flex align="center" gap="2">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-9)', flexShrink: 0 }} />
            <Text size="1" style={{ color: 'var(--green-11)' }}>
              {ac} action{ac > 1 ? 's' : ''} · {tt}h réalisée{tt > 1 ? 's' : ''}
            </Text>
          </Flex>
        )}

        {/* Tâches liées */}
        {[...(tasksLinked || [])].sort((a, b) => {
          if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
          if (a.due_date) return -1;
          if (b.due_date) return 1;
          return 0;
        }).map((task) => (
          <Flex key={task.id} align="center" gap="2">
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: TASK_STATUS_COLOR[task.status] || 'var(--gray-7)',
                flexShrink: 0,
              }}
            />
            <Text size="1" color="gray">
              {task.label}
              {task.assigned_to?.initials ? ` · ${task.assigned_to.initials}` : ''}
              {task.due_date ? ` · ${formatTaskDue(task.due_date)}` : ''}
              {' · '}
              <span style={{ color: task.status === 'done' ? 'var(--green-11)' : undefined }}>
                {TASK_STATUS_LABEL[task.status] || task.status}
              </span>
            </Text>
          </Flex>
        ))}

        {/* Pièces en attente */}
        {pc > 0 && (
          <Flex align="center" gap="2">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange-9)', flexShrink: 0 }} />
            <Text size="1" style={{ color: 'var(--orange-11)' }}>
              {pc} demande{pc > 1 ? 's' : ''} d'achat en attente
            </Text>
            <Badge color="orange" variant="soft" size="1">pièce</Badge>
          </Flex>
        )}

        {/* Décision requise */}
        {hasDecision && (
          <Flex align="center" gap="2">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue-9)', flexShrink: 0 }} />
            <Text size="1" style={{ color: 'var(--blue-11)' }}>
              Aucune action engagée depuis {daysOpen}j
            </Text>
            <Badge color="blue" variant="soft" size="1">décision</Badge>
          </Flex>
        )}
      </Flex>
    </div>
  );
}

ExpandedBody.propTypes = {
  situation: PropTypes.object.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

// ── BriefingItem ───────────────────────────────────────────────────────────

export function BriefingItem({ situation, sectionId }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const barColor = SECTION_BAR_COLOR[sectionId] || 'var(--gray-9)';
  const delay = formatDelay(situation);

  function handleCardClick(e) {
    // Ne pas toggler si le clic provient du corps expandé
    if (e.target.closest('[data-expanded-body]')) return;
    setExpanded((prev) => !prev);
  }

  function handleNavigate(e) {
    e.stopPropagation();
    navigate(`/intervention/${situation.id}`);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      style={{
        display: 'flex',
        background: 'var(--color-panel-solid)',
        border: `1px solid var(--gray-4)`,
        borderLeft: `3px solid ${barColor}`,
        borderRadius: 6,
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <Flex direction="column" style={{ flex: 1 }}>
        {/* Corps principal */}
        <Flex justify="between" align="start" style={{ padding: '10px 12px' }}>
          <Flex direction="column" gap="1" style={{ flex: 1, minWidth: 0 }}>
            {/* Ligne 1 : code machine + badges */}
            <Flex align="center" gap="2" wrap="wrap">
              <Text
                size="1"
                weight="medium"
                style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)' }}
              >
                {situation.machine?.code || situation.code}
              </Text>
              <SituationBadges situation={situation} />
            </Flex>

            {/* Ligne 2 : titre intervention */}
            <Text
              size="2"
              weight="medium"
              style={{
                color: 'var(--gray-12)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {situation.title}
            </Text>

            {/* Ligne 3 : texte contextuel */}
            <ContextLine situation={situation} />
          </Flex>

          {/* Droite : avatar + délai */}
          <Flex direction="column" align="center" gap="1" style={{ marginLeft: 12, flexShrink: 0 }}>
            <Avatar initials={situation.techInitials} />
            <Text size="1" weight="medium" style={{ color: delay.color, lineHeight: 1 }}>
              {delay.label}
            </Text>
          </Flex>
        </Flex>

        {/* Corps expandé avec transition CSS */}
        <div
          data-expanded-body
          style={{
            maxHeight: expanded ? '500px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease',
          }}
        >
          <ExpandedBody situation={situation} onNavigate={handleNavigate} />
        </div>
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
    machine: PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
      health: PropTypes.shape({ level: PropTypes.string }),
    }),
    stats: PropTypes.shape({
      actionCount: PropTypes.number,
      totalTime: PropTypes.number,
      purchaseCount: PropTypes.number,
    }),
    daysOpen: PropTypes.number,
    tasksLinked: PropTypes.array,
    hasDecision: PropTypes.bool,
    hasPiece: PropTypes.bool,
    situationType: PropTypes.string,
  }).isRequired,
  sectionId: PropTypes.oneOf(['now', 'waiting', 'running']).isRequired,
};
