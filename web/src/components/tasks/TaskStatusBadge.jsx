/**
 * TaskStatusBadge : statut d'une tâche, affiché sans clic (ADR 0015).
 * Une tâche n'avance que par une action ; le statut n'est donc jamais modifiable ici.
 */

import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';
import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/config/taskConfig';

export default function TaskStatusBadge({ status }) {
  return (
    <Badge size="1" color={TASK_STATUS_COLOR[status] ?? 'gray'} variant="soft" style={{ flexShrink: 0 }}>
      {TASK_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

TaskStatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};
