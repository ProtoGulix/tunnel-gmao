/**
 * @fileoverview Ligne d'une intervention de la file : contexte et blocages.
 * @module components/home/QueueInterventionRow
 */
import PropTypes from 'prop-types';
import { Badge, Text } from '@radix-ui/themes';
import QueueRow from '@/components/home/QueueRow';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/config/interventionTypes';
import { interventionNotes } from '@/hooks/home/requestQueue';

export default function QueueInterventionRow({ intervention, isSelected, onSelect }) {
  const { code, title, machine, status, priority } = intervention;
  const priorityCfg = PRIORITY_CONFIG[priority];
  const statusCfg = STATUS_CONFIG[status];
  const subtitle = [title, ...interventionNotes(intervention)].filter(Boolean).join(', ');
  return (
    <QueueRow isSelected={isSelected} onSelect={onSelect} title={code || 'Intervention'} subtitle={subtitle}>
      {machine && <Text size="1" color="gray">{[machine.code, machine.name].filter(Boolean).join(' - ')}</Text>}
      {priorityCfg && priority !== 'normal' && <Badge color={priorityCfg.color} variant="soft">{priorityCfg.label}</Badge>}
      {statusCfg && status !== 'ouvert' && <Badge color={statusCfg.color} variant="soft">{statusCfg.label}</Badge>}
    </QueueRow>
  );
}

QueueInterventionRow.propTypes = {
  intervention: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
