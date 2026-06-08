import { Avatar, Badge, Flex, Select, Tabs, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR, TASK_ORIGIN_LABEL, TASK_ORIGIN_COLOR } from '@/config/taskConfig';

function renderTime(value) {
  const number = Number(value || 0);
  return `${number.toFixed(2)} h`;
}

function AssignedAvatar({ row }) {
  if (!row.assignedInitial) return <Text size="1" color="gray">Non assigne</Text>;

  return (
    <Flex align="center" gap="2">
      <Avatar
        fallback={row.assignedInitial}
        size="1"
        radius="full"
        style={{ backgroundColor: 'var(--gray-5)', color: 'var(--gray-12)' }}
      />
      <Text size="1" color="gray">{row.assignedInitial}</Text>
    </Flex>
  );
}

AssignedAvatar.propTypes = {
  row: PropTypes.object.isRequired,
};

export const COLUMNS = [
  {
    header: 'Origine',
    width: 100,
    accessor: (row) => (
      <Badge size="1" variant="soft" color={TASK_ORIGIN_COLOR[row.origin] || 'gray'}>
        {TASK_ORIGIN_LABEL[row.origin] || row.origin || '—'}
      </Badge>
    ),
  },
  {
    header: 'Statut',
    width: 120,
    accessor: (row) => (
      <Badge size="1" variant="soft" color={TASK_STATUS_COLOR[row.status] || 'gray'}>
        {TASK_STATUS_LABEL[row.status] || row.status || '—'}
      </Badge>
    ),
  },
  {
    header: 'Label',
    accessor: (row) => (
      <Text size="2" weight="medium" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.label}
      </Text>
    ),
  },
  {
    header: 'Intervention',
    width: 130,
    accessor: (row) => (
      <Badge size="1" variant="soft" color="blue">{row.interventionCode || '—'}</Badge>
    ),
  },
  {
    header: 'Assigne',
    width: 120,
    accessor: (row) => <AssignedAvatar row={row} />,
  },
  {
    header: 'Temps',
    width: 90,
    accessor: (row) => <Text size="1" color="gray">{renderTime(row.timeSpent)}</Text>,
  },
];

export function TasksFilters({ status, setStatus, origin, setOrigin, assignee, setAssignee, assigneeOptions }) {
  return (
    <Flex gap="2" align="center">
      <Select.Root value={status || '__all__'} onValueChange={(value) => setStatus(value === '__all__' ? '' : value)}>
        <Select.Trigger placeholder="Tous les statuts" variant={status ? 'soft' : 'surface'} color={status ? 'blue' : undefined} />
        <Select.Content>
          <Select.Item value="__all__">Tous les statuts</Select.Item>
          <Select.Item value="todo">En attente</Select.Item>
          <Select.Item value="in_progress">En cours</Select.Item>
          <Select.Item value="done">Validees</Select.Item>
          <Select.Item value="skipped">Ignorees</Select.Item>
        </Select.Content>
      </Select.Root>

      <Select.Root value={origin || '__all__'} onValueChange={(value) => setOrigin(value === '__all__' ? '' : value)}>
        <Select.Trigger placeholder="Toutes origines" variant={origin ? 'soft' : 'surface'} color={origin ? 'blue' : undefined} />
        <Select.Content>
          <Select.Item value="__all__">Toutes origines</Select.Item>
          <Select.Item value="plan">Gamme</Select.Item>
          <Select.Item value="resp">Resp</Select.Item>
          <Select.Item value="tech">Tech</Select.Item>
        </Select.Content>
      </Select.Root>

      <Select.Root value={assignee || '__all__'} onValueChange={(value) => setAssignee(value === '__all__' ? '' : value)}>
        <Select.Trigger placeholder="Tous techniciens" variant={assignee ? 'soft' : 'surface'} color={assignee ? 'blue' : undefined} />
        <Select.Content>
          <Select.Item value="__all__">Tous techniciens</Select.Item>
          {assigneeOptions.map((option) => (
            <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

TasksFilters.propTypes = {
  status: PropTypes.string,
  setStatus: PropTypes.func.isRequired,
  origin: PropTypes.string,
  setOrigin: PropTypes.func.isRequired,
  assignee: PropTypes.string,
  setAssignee: PropTypes.func.isRequired,
  assigneeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export function GroupingTabs({ value, onValueChange }) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
        <Tabs.Trigger value="intervention">Intervention</Tabs.Trigger>
        <Tabs.Trigger value="machine">Machine</Tabs.Trigger>
        <Tabs.Trigger value="status">Etat</Tabs.Trigger>
        <Tabs.Trigger value="technician">Technicien</Tabs.Trigger>
      </Tabs.List>
    </Tabs.Root>
  );
}

GroupingTabs.propTypes = {
  value: PropTypes.oneOf(['intervention', 'machine', 'status', 'technician']).isRequired,
  onValueChange: PropTypes.func.isRequired,
};
