/**
 * @fileoverview Suivi préventif d'une machine : échéancier, historique, lancement en avance
 * @module hooks/preventive/usePreventiveFollow
 */

import { useCallback } from 'react';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { usePreventiveSchedule } from '@/hooks/preventive/usePreventiveSchedule';
import { usePreventiveHistory } from '@/hooks/preventive/usePreventiveHistory';
import { useAnticipatePreventive } from '@/hooks/preventive/useAnticipatePreventive';

/** Sans le droit de lecture, aucun appel n'est fait : l'écran n'affiche alors rien de plus. */
export function usePreventiveFollow(machineId) {
  const { can } = usePermissions();
  const canSchedule = can(PERM.preventive.schedule);
  const canHistory = can(PERM.preventive.history);
  const schedule = usePreventiveSchedule({ machine_id: machineId }, canSchedule);
  const history = usePreventiveHistory(machineId, canHistory);
  const { refresh: refreshSchedule } = schedule;
  const { refresh: refreshHistory } = history;
  const refreshAll = useCallback(
    () => Promise.all([refreshSchedule(), refreshHistory()]),
    [refreshSchedule, refreshHistory]
  );
  const anticipate = useAnticipatePreventive(machineId, refreshAll);
  return { schedule, history: canHistory ? history : null, anticipate, canSchedule };
}
