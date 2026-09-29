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
  const [skipReasonDraft, setSkipReasonDraft] = useState(null); // null = pas en saisie, string = motif en cours
  const timerRef = useRef(null);

  const isDone    = status === 'done';
  const isSkipped = status === 'skipped';
  const hasStatus = isDone || isSkipped;
  const resetStatus = mode === 'live' ? 'todo' : 'in_progress';

  // Nettoyage à l'unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  async function handleStatusChange(newStatus, extra = {}) {
    if (mode === 'live') {
      setSavingStatus(true);
      try { await patchInterventionTask(taskId, { status: newStatus, ...extra }); }
      catch { setSavingStatus(false); return; }
      setSavingStatus(false);
    }
    onStatusChange?.(taskId, newStatus);
  }

  function confirmSkip() {
    if (!skipReasonDraft?.trim()) return;
    handleStatusChange('skipped', { skip_reason: skipReasonDraft.trim() });
    setSkipReasonDraft(null);
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
      ) : skipReasonDraft !== null ? (
        <Flex gap="1" align="center" onClick={(e) => e.stopPropagation()}>
          <input
            autoFocus
            value={skipReasonDraft}
            onChange={(e) => setSkipReasonDraft(e.target.value)}
            placeholder="Motif requis…"
            onKeyDown={(e) => { if (e.key === 'Enter' && skipReasonDraft.trim()) confirmSkip(); if (e.key === 'Escape') setSkipReasonDraft(null); }}
            style={{ width: 120, fontSize: 11, padding: '2px 6px', borderRadius: 4, border: '1px solid var(--amber-7)' }}
          />
          <IconButton size="1" color="amber" variant="soft" type="button" title="Confirmer" disabled={!skipReasonDraft.trim()}
            onClick={confirmSkip}
          >
            <Check size={12} strokeWidth={3} />
          </IconButton>
        </Flex>
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
          <IconButton size="1" color="amber" variant="soft" type="button" title="Ignorer"
            onClick={() => (mode === 'live' ? setSkipReasonDraft('') : handleStatusChange('skipped'))}
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
