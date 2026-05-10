import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG = {
  in_progress: { color: 'var(--blue-9)', bg: 'var(--blue-2)', label: 'En cours', badge: 'blue' },
  todo:        { color: 'var(--gray-7)', bg: 'var(--gray-2)', label: 'À faire',  badge: 'gray' },
  done:        { color: 'var(--green-9)', bg: 'var(--green-2)', label: 'Fait',   badge: 'green' },
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

  function isOverdue(iso) {
    return iso && new Date(iso) < today;
  }

  // Trier : in_progress en premier, puis todo, puis done
  const SORT_ORDER = { in_progress: 0, todo: 1, done: 2 };
  const sorted = [...tasks].sort(
    (a, b) => (SORT_ORDER[a.status] ?? 9) - (SORT_ORDER[b.status] ?? 9)
  );

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '2px solid var(--gray-5)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '40%',
        minHeight: 160,
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        gap="2"
        style={{
          padding: '8px 14px 6px',
          flexShrink: 0,
          borderBottom: '1px solid var(--gray-4)',
          background: 'var(--gray-2)',
        }}
      >
        <Text size="2" weight="bold" style={{ color: 'var(--gray-12)' }}>
          Tâches à exécuter
        </Text>
        {tasks.filter((t) => t.status === 'in_progress').length > 0 && (
          <Badge color="blue" variant="solid" size="1" radius="full">
            {tasks.filter((t) => t.status === 'in_progress').length} en cours
          </Badge>
        )}
        {tasks.filter((t) => t.status === 'todo').length > 0 && (
          <Badge color="gray" variant="soft" size="1" radius="full">
            {tasks.filter((t) => t.status === 'todo').length} à faire
          </Badge>
        )}
      </Flex>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 8px' }}>
        {sorted.length === 0 && (
          <Text size="1" color="gray" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
            Aucune tâche assignée
          </Text>
        )}
        {sorted.map((task) => {
          const due = formatDue(task.due_date);
          const overdue = isOverdue(task.due_date);
          const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
          const machineCode = task.equipement?.code ?? null;
          const interventionCode = task.intervention?.code ?? null;
          const clickable = !!task.intervention?.id;

          return (
            <div
              key={task.id}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={() => clickable && navigate(`/intervention/${task.intervention.id}`)}
              onKeyDown={(e) =>
                e.key === 'Enter' && clickable && navigate(`/intervention/${task.intervention.id}`)
              }
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: 0,
                marginBottom: 5,
                borderRadius: 6,
                border: '1px solid var(--gray-4)',
                background: cfg.bg,
                borderLeft: `4px solid ${cfg.color}`,
                cursor: clickable ? 'pointer' : 'default',
                overflow: 'hidden',
              }}
            >
              {/* Corps */}
              <div style={{ flex: 1, padding: '6px 10px', minWidth: 0 }}>
                {/* Ligne 1 : code machine · code intervention */}
                {(machineCode || interventionCode) && (
                  <Flex align="center" gap="2" style={{ marginBottom: 2 }}>
                    {machineCode && (
                      <Text
                        size="1"
                        weight="bold"
                        style={{ fontFamily: 'var(--font-mono, monospace)', color: cfg.color }}
                      >
                        {machineCode}
                      </Text>
                    )}
                    {interventionCode && (
                      <Text size="1" color="gray" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                        {interventionCode}
                      </Text>
                    )}
                  </Flex>
                )}
                {/* Ligne 2 : label tâche */}
                <Text
                  size="2"
                  weight="medium"
                  style={{
                    color: 'var(--gray-12)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {task.label}
                </Text>
              </div>

              {/* Droite : badge statut + échéance */}
              <Flex
                direction="column"
                align="end"
                justify="center"
                gap="1"
                style={{ padding: '6px 10px', flexShrink: 0 }}
              >
                <Badge color={cfg.badge} variant="soft" size="1">
                  {cfg.label}
                </Badge>
                {due && (
                  <Text
                    size="1"
                    weight="medium"
                    style={{ color: overdue ? 'var(--red-11)' : 'var(--gray-10)', whiteSpace: 'nowrap' }}
                  >
                    {overdue ? '⚠ ' : ''}{due}
                  </Text>
                )}
              </Flex>
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
