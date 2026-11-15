/**
 * TaskCloseButtons : « Terminé » et « Annuler » directs sur une tâche à faire ou en cours
 * (ADR 0016, RESP et ADMIN). Visibles sans survol. Chacun envoie seulement le statut
 * (done ou skipped) : le motif est demandé par le mécanisme commun d'audit (le backend
 * répond la demande de motif, l'intercepteur ouvre AuditReasonDialog et rejoue la requête).
 * Si l'utilisateur ferme la fenêtre sans choisir, la tâche reste inchangée, sans message.
 * Le backend vérifie le rôle ; autres erreurs remontées par `onError(message)`.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Flex, Spinner } from '@radix-ui/themes';
import { patchInterventionTask } from '@/api/interventionTasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function TaskCloseButtons({ taskId, onStatusChange, onError }) {
  const [saving, setSaving] = useState(false);

  async function send(status) {
    if (saving) return;
    setSaving(true);
    try {
      await patchInterventionTask(taskId, { status });
    } catch (err) {
      setSaving(false);
      // Abandon de la fenêtre de motif : rien à signaler, la tâche n'a pas changé.
      if (err?.isAuditCancelled) return;
      onError?.(extractApiErrorMessage(err, 'Impossible de modifier la tâche'));
      return;
    }
    setSaving(false);
    onStatusChange?.(taskId, status);
  }

  if (saving) return <Spinner size="1" />;

  return (
    <Flex gap="1" align="center" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
      <Button size="1" color="green" variant="soft" type="button" onClick={() => send('done')}>Terminé</Button>
      <Button size="1" color="amber" variant="soft" type="button" onClick={() => send('skipped')}>Annuler</Button>
    </Flex>
  );
}

TaskCloseButtons.propTypes = {
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onStatusChange: PropTypes.func,
  onError: PropTypes.func,
};
