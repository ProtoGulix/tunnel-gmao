/**
 * TaskActionButtons — boutons inline de changement de statut + suppression d'une tâche.
 *
 * Deux modes :
 *   - "form"  : changement d'état local (formulaire), retour vers 'in_progress'
 *   - "live"  : appel API direct (patchInterventionTask), retour vers 'todo'
 *
 * Visibilité : masqués par défaut, révélés au survol du parent via `visible`.
 * Quand un statut terminal est actif (done/skipped), le bouton actif reste visible.
 * Suppression : compte à rebours 10s avant envoi, annulable.
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Flex, IconButton, Spinner } from '@radix-ui/themes';
import { Ban, Check, RotateCcw, Trash2 } from 'lucide-react';
import { patchInterventionTask, deleteInterventionTask } from '@/api/interventionTasks';

const COUNTDOWN = 5;

export default function TaskActionButtons({
  taskId,
  status,
  visible,
  mode = 'form',
  canDelete = false,
  onStatusChange,
  onDeleted,
}) {
  const [deleting, setDeleting]       = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [countdown, setCountdown]     = useState(null); // null = inactif, 0..N = en cours
  const timerRef = useRef(null);

  const isDone    = status === 'done';
  const isSkipped = status === 'skipped';
  const hasStatus = isDone || isSkipped;
  const resetStatus = mode === 'live' ? 'todo' : 'in_progress';

  // Nettoyage à l'unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  async function handleStatusChange(newStatus) {
    if (mode === 'live') {
      setSavingStatus(true);
      try { await patchInterventionTask(taskId, { status: newStatus }); }
      catch { setSavingStatus(false); return; }
      setSavingStatus(false);
    }
    onStatusChange?.(taskId, newStatus);
  }

  function startDeleteCountdown() {
    setCountdown(COUNTDOWN);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          execDelete();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function cancelDelete() {
    clearInterval(timerRef.current);
    setCountdown(null);
  }

  async function execDelete() {
    setDeleting(true);
    setCountdown(null);
    try {
      await deleteInterventionTask(taskId);
      onDeleted?.(taskId);
    } catch { /* silencieux */ }
    finally { setDeleting(false); }
  }

  const show = visible || hasStatus || countdown !== null;

  return (
    <Flex
      gap="2" align="center"
      onClick={(e) => e.stopPropagation()}
      style={{ flexShrink: 0, opacity: show ? 1 : 0, transition: 'opacity 0.15s', pointerEvents: show ? 'auto' : 'none' }}
    >
      {savingStatus ? <Spinner size="1" /> : isSkipped ? (
        <IconButton size="1" color="amber" variant="soft" type="button" title="Annuler l'exclusion"
          onClick={() => handleStatusChange(resetStatus)}
        >
          <Ban size={12} strokeWidth={3} />
        </IconButton>
      ) : isDone ? (
        <IconButton size="1" color="gray" variant="soft" type="button" title="Remettre à faire"
          onClick={() => handleStatusChange(resetStatus)}
        >
          <RotateCcw size={12} strokeWidth={3} />
        </IconButton>
      ) : (
        <Flex gap="2" align="center">
          <IconButton size="1" color="green" variant="soft" type="button" title="Marquer terminée"
            onClick={() => handleStatusChange('done')}
          >
            <Check size={12} strokeWidth={3} />
          </IconButton>
          <IconButton size="1" color="amber" variant="soft" type="button" title="Ignorer"
            onClick={() => handleStatusChange('skipped')}
          >
            <Ban size={12} strokeWidth={3} />
          </IconButton>
        </Flex>
      )}

      {onDeleted && (
        deleting ? <Spinner size="1" /> :
        countdown !== null ? (
          <Flex gap="1" align="center"
            style={{ background: 'var(--red-3)', borderRadius: 'var(--radius-2)', padding: '1px 6px 1px 4px', border: '1px solid var(--red-6)', cursor: 'pointer' }}
            onClick={cancelDelete}
            title="Annuler la suppression"
          >
            <Trash2 size={11} strokeWidth={3} color="var(--red-9)" />
            <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'var(--red-11)', minWidth: 10 }}>{countdown}</span>
            <span style={{ fontSize: 10, color: 'var(--red-9)' }}>Annuler</span>
          </Flex>
        ) : (
          <IconButton
            size="1" color="red" variant="soft" type="button"
            title={canDelete ? 'Supprimer' : 'Suppression impossible (actions liées)'}
            disabled={!canDelete}
            onClick={canDelete ? startDeleteCountdown : undefined}
            style={{ opacity: canDelete ? 1 : 0.3 }}
          >
            <Trash2 size={12} strokeWidth={3} />
          </IconButton>
        )
      )}
    </Flex>
  );
}

TaskActionButtons.propTypes = {
  taskId:         PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status:         PropTypes.string.isRequired,
  visible:        PropTypes.bool,
  mode:           PropTypes.oneOf(['form', 'live']),
  canDelete:      PropTypes.bool,
  onStatusChange: PropTypes.func,
  onDeleted:      PropTypes.func,
};
