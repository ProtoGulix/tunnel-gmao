import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';

const DOT_COLOR = {
  in_progress: 'var(--blue-9)',
  todo: 'var(--gray-7)',
  done: 'var(--green-9)',
};

export function TasksPane({ tasks }) {
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function formatDue(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  function isDue(iso) {
    return iso && new Date(iso) < today;
  }

  return (
    <div
      style={{
        height: 180,
        flexShrink: 0,
        borderTop: '1px solid var(--gray-4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap="2"
        style={{ padding: '7px 14px 5px', flexShrink: 0, borderBottom: '1px solid var(--gray-3)' }}
      >
        <Text size="2" weight="medium">
          Tâches assignées
        </Text>
        <Badge color="gray" variant="soft" size="1">
          {tasks.length}
        </Badge>
      </Flex>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 8px' }}>
        {tasks.length === 0 && (
          <Text size="1" color="gray" style={{ display: 'block', marginTop: 8 }}>
            Aucune tâche assignée
          </Text>
        )}
        {tasks.map((task) => {
          const due = formatDue(task.due_date);
          const overdue = isDue(task.due_date);
          const dotBg = DOT_COLOR[task.status] || 'var(--gray-7)';
          const createdBy = task.created_by?.initials ?? task.assigned_to?.initials ?? null;

          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 0',
                cursor: task.intervention?.id ? 'pointer' : 'default',
                borderBottom: '1px solid var(--gray-3)',
              }}
              onClick={() =>
                task.intervention?.id && navigate(`/intervention/${task.intervention.id}`)
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                task.intervention?.id &&
                navigate(`/intervention/${task.intervention.id}`)
              }
            >
              {/* Status dot */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: dotBg,
                  flexShrink: 0,
                }}
              />

              {/* Label */}
              <Text
                size="1"
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--gray-12)',
                }}
              >
                {task.label}
              </Text>

              {/* Context */}
              {(task.equipement?.code || createdBy) && (
                <Text size="1" color="gray" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {[task.equipement?.code, createdBy ? `par ${createdBy}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              )}

              {/* Due date */}
              {due && (
                <Text
                  size="1"
                  style={{
                    color: overdue ? 'var(--red-11)' : 'var(--gray-11)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {due}
                </Text>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

TasksPane.propTypes = {
  tasks: PropTypes.array.isRequired,
};
