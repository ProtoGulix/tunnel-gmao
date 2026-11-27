/**
 * @fileoverview Ligne d'une échéance préventive de la file : plan, équipement, retard.
 * @module components/home/QueuePreventiveRow
 */
import PropTypes from 'prop-types';
import { Badge, Text } from '@radix-ui/themes';
import QueueRow from '@/components/home/QueueRow';

export default function QueuePreventiveRow({ row, isSelected, onSelect }) {
  return (
    <QueueRow
      isSelected={isSelected}
      onSelect={onSelect}
      title={row.plan_label || row.plan_code || 'Plan'}
      subtitle={`Échéance ${row.due_date}`}
    >
      <Text size="1" color="gray">{[row.machine_code, row.machine_name].filter(Boolean).join(' - ')}</Text>
      {row.state === 'overdue' && <Badge color="red" variant="soft">{row.days_overdue} j de retard</Badge>}
    </QueueRow>
  );
}

QueuePreventiveRow.propTypes = {
  row: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
