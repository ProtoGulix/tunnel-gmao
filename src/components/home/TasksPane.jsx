import PropTypes from 'prop-types';
import { Flex, Text, Badge, IconButton, Button } from '@radix-ui/themes';
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, Clock, UserCog, Wrench } from 'lucide-react';

const ORIGIN_CONFIG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', title: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', title: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   title: 'Technicien' },
};

const STATUS_CONFIG = {
  in_progress: { color: 'var(--blue-9)',  bg: 'var(--blue-2)',  label: 'En cours', badge: 'blue' },
  todo:        { color: 'var(--gray-7)',  bg: 'transparent',    label: 'À faire',  badge: 'gray' },
  done:        { color: 'var(--green-9)', bg: 'var(--green-2)', label: 'Fait',     badge: 'green' },
};

const formatDue = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
};

const SORT_ORDER = { in_progress: 0, todo: 1, done: 2 };

export function TasksPane({ taskGroups, pagination, skip, onPageChange, onAddAction }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  const inProgressCount = taskGroups.reduce((sum, g) => sum + g.tasks.filter((t) => t.status === 'in_progress').length, 0);
  const todoCount = taskGroups.reduce((sum, g) => sum + g.tasks.filter((t) => t.status === 'todo').length, 0);

  const pageSize = pagination?.page_size ?? 20;
  const hasPrev = skip > 0;
  const hasNext = pagination ? skip + pageSize < pagination.total : false;

  return (
    <div>
      {/* Header */}
      <Flex align="center" gap="2" style={{ padding: '10px 14px 8px', flexShrink: 0, borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)' }}>
        <Text size="2" weight="bold" style={{ color: 'var(--gray-12)' }}>Tâches à exécuter</Text>
        {inProgressCount > 0 && (
          <Badge color="blue" variant="solid" size="1" radius="full">{inProgressCount} en cours</Badge>
        )}
        {todoCount > 0 && (
          <Badge color="gray" variant="soft" size="1" radius="full">{todoCount} à faire</Badge>
        )}
        {pagination && (
          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>{pagination.total} inter.</Text>
        )}
      </Flex>

      {/* List */}
      <div style={{ padding: '8px 10px' }}>
        {taskGroups.length === 0 && (
          <Text size="1" color="gray" style={{ display: 'block', marginTop: 8, textAlign: 'center' }}>
            Aucune tâche assignée
          </Text>
        )}

        {taskGroups.map((group) => {
          const machineCode = group.equipement?.code ?? null;
          const interventionCode = group.code ?? null;
          const interventionTitle = group.title ?? null;
          const sortedTasks = [...group.tasks].sort(
            (a, b) => (SORT_ORDER[a.status] ?? 9) - (SORT_ORDER[b.status] ?? 9),
          );

          return (
            <div
              key={group.id}
              style={{
                marginBottom: 12,
                borderRadius: 8,
                border: '1px solid var(--gray-4)',
                overflow: 'hidden',
              }}
            >
              {/* ── En-tête carte intervention ── */}
              <Flex
                align="center"
                gap="2"
                style={{
                  padding: '7px 10px',
                  background: 'var(--gray-3)',
                  borderBottom: '1px solid var(--gray-4)',
                }}
              >
                {interventionCode && (
                  <Badge variant="outline" color="gray" size="2" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                    {interventionCode}
                  </Badge>
                )}
                {interventionTitle && (
                  <Text size="2" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-12)', fontStyle: 'italic' }}>
                    {interventionTitle}
                  </Text>
                )}
                <Text size="1" color="gray" style={{ flexShrink: 0 }}>
                  {sortedTasks.length} tâche{sortedTasks.length > 1 ? 's' : ''}
                </Text>
              </Flex>

              {/* ── Tâches ── */}
              <div style={{ background: 'var(--color-panel-solid)' }}>
                {sortedTasks.map((task, idx) => {
                  const due = formatDue(task.due_date);
                  const overdue = due && new Date(task.due_date) < today;
                  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
                  const originCfg = ORIGIN_CONFIG[task.origin] ?? null;
                  const isLast = idx === sortedTasks.length - 1;

                  return (
                    <Flex
                      key={task.id}
                      align="center"
                      gap="2"
                      style={{
                        padding: '7px 10px',
                        borderBottom: isLast ? 'none' : '1px solid var(--gray-3)',
                        background: cfg.bg,
                        borderLeft: `3px solid ${cfg.color}`,
                      }}
                    >
                      {/* Icône origine */}
                      {originCfg && (
                        <originCfg.Icon size={13} color={originCfg.color} title={originCfg.title} style={{ flexShrink: 0 }} />
                      )}

                      {/* Label tâche */}
                      <Text size="2" style={{ flex: 1, color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.label}
                      </Text>

                      {/* Statut */}
                      <Badge color={cfg.badge} variant="soft" size="1" style={{ flexShrink: 0 }}>
                        {cfg.label}
                      </Badge>

                      {/* Échéance */}
                      {overdue && (
                        <Badge color="red" variant="solid" size="1" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <AlertTriangle size={10} />
                          {due}
                        </Badge>
                      )}
                      {due && !overdue && (
                        <Text size="1" color="gray" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{due}</Text>
                      )}

                      {/* Bouton Logger */}
                      {onAddAction && (
                        <IconButton
                          size="1"
                          variant="soft"
                          color="blue"
                          title="Logger du temps"
                          onClick={() => onAddAction({ date: todayIso, group, task })}
                          style={{ flexShrink: 0 }}
                        >
                          <Clock size={12} />
                        </IconButton>
                      )}
                    </Flex>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Pagination */}
        {(hasPrev || hasNext) && (
          <Flex align="center" justify="center" gap="2" pt="2">
            <Button size="1" variant="soft" color="gray" disabled={!hasPrev} onClick={() => onPageChange(skip - pageSize)}>
              <ChevronLeft size={13} />
            </Button>
            <Text size="1" color="gray">
              {Math.floor(skip / pageSize) + 1} / {pagination?.total_pages ?? '…'}
            </Text>
            <Button size="1" variant="soft" color="gray" disabled={!hasNext} onClick={() => onPageChange(skip + pageSize)}>
              <ChevronRight size={13} />
            </Button>
          </Flex>
        )}
      </div>
    </div>
  );
}

TasksPane.propTypes = {
  taskGroups: PropTypes.array.isRequired,
  pagination: PropTypes.object,
  skip: PropTypes.number,
  onPageChange: PropTypes.func,
  onAddAction: PropTypes.func,
};
