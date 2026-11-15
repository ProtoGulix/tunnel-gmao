/**
 * TaskErrorNotice : message d'erreur d'enregistrement d'une tâche (ADR 0015, décision 6).
 * Affiché par l'écran parent, qui reçoit le message via les callbacks `onError`.
 */

import PropTypes from 'prop-types';
import { Callout, IconButton } from '@radix-ui/themes';
import { AlertCircle, X } from 'lucide-react';

export default function TaskErrorNotice({ message, onClose }) {
  if (!message) return null;
  return (
    <Callout.Root color="red" size="1" role="alert" style={{ margin: '4px 0' }}>
      <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
      <Callout.Text>{message}</Callout.Text>
      <IconButton size="1" variant="ghost" color="red" type="button" title="Fermer" onClick={onClose} style={{ marginLeft: 'auto' }}>
        <X size={12} />
      </IconButton>
    </Callout.Root>
  );
}

TaskErrorNotice.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
