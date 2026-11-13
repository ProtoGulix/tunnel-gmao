/**
 * TaskActionButtons — boutons inline de changement de statut + suppression d'une tâche.
 *
 * Deux modes :
 *   - "form"  : changement d'état local (formulaire ActionTaskSection), retour vers
 *               'in_progress'. Le bouton "Marquer terminée" y est légitime : le statut
 *               'done' choisi ici n'est appliqué qu'au submit de l'action, via
 *               close_task=true (POST /intervention-actions) — jamais un PATCH isolé.
 *   - "live"  : appel API direct (patchInterventionTask). PATCH /intervention-tasks/{id}
 *               n'accepte que status ∈ {todo, skipped} (voir InterventionTaskPatch côté
 *               tunnel-backend) — 'done' est volontairement exclu, une tâche ne peut être
 *               clôturée qu'en la liant à une action. Bouton "Marquer terminée" donc masqué
 *               ici ; retour au statut précédent limité à 'todo'.
 *
 * Visibilité : masqués par défaut, révélés au survol du parent via `visible`.
 * Quand un statut terminal est actif (done/skipped), le bouton actif reste visible.
 * Ignorer (live) : envoie seulement {status: 'skipped'} ; le motif vient de la fenêtre
 * d'audit (intercepteur auditGuard), skip_reason est rempli par le backend (ADR 0016).
 * Suppression : compte à rebours de COUNTDOWN secondes (5) avant envoi, annulable.
 * Erreurs : le message de l'API est remonté par `onError(message)` (ADR 0015).
 * `canSkip=false` masque « Ignorer » (étape de gamme obligatoire, voir canSkipTask).
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Flex, IconButton, Spinner } from '@radix-ui/themes';
import { Ban, Check, RotateCcw, Trash2 } from 'lucide-react';
import { patchInterventionTask, deleteInterventionTask } from '@/api/interventionTasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const COUNTDOWN = 5;

export default function TaskActionButtons({
  taskId,
  status,
  visible,
  mode = 'form',
  canDelete = false,
  canSkip = true,
  onStatusChange,
  onDeleted,
  onError,
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
      catch (err) {
        setSavingStatus(false);
        if (err?.isAuditCancelled) return; // fenêtre de motif fermée : rien à signaler
        onError?.(extractApiErrorMessage(err, 'Impossible de modifier la tâche'));
        return;
      }
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
    } catch (err) {
      onError?.(extractApiErrorMessage(err, 'Impossible de supprimer la tâche'));
    } finally { setDeleting(false); }
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
          {/* "Marquer terminée" n'existe qu'en mode form : le statut 'done' choisi
              ici n'est appliqué qu'au submit de l'action (close_task=true) — en mode
              live, PATCH direct, 'done' est rejeté par le backend (voir docstring). */}
          {mode !== 'live' && (
            <IconButton size="1" color="green" variant="soft" type="button" title="Marquer terminée"
              onClick={() => handleStatusChange('done')}
            >
              <Check size={12} strokeWidth={3} />
            </IconButton>
          )}
          {canSkip && (
            <IconButton size="1" color="amber" variant="soft" type="button" title="Ignorer"
              onClick={() => handleStatusChange('skipped')}
            >
              <Ban size={12} strokeWidth={3} />
            </IconButton>
          )}
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
  canSkip:        PropTypes.bool,
  onError:        PropTypes.func,
  onStatusChange: PropTypes.func,
  onDeleted:      PropTypes.func,
};
