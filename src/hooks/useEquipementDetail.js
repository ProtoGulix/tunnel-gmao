/**
 * @fileoverview Hook pour charger les données d'un équipement détaillé
 * @module hooks/useEquipementDetail
 */

import { useState, useEffect, useMemo } from 'react';
import { useApiCall } from '@/hooks/useApiCall';
import { useEquipements } from '@/hooks/useEquipements';
import { useEquipementHealth } from '@/hooks/useEquipementHealth';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

export function useEquipementDetail(id) {
  const [activeTab, setActiveTab] = useState('interventions');

  const { data: equipement, loading: eqLoading, error: eqError, execute: reloadEquipement } = useApiCall(
    () => (id ? adapter.equipements.fetchEquipement(id) : Promise.resolve(null)),
    { autoExecute: false },
  );

  const { data: rawInterventions, loading: intLoading, error: intError, execute: loadInterventions } = useApiCall(
    () => (id ? adapter.interventions.fetchInterventions({ equipement_id: id, sort: '-priority,-reported_date', limit: 50 }) : Promise.resolve([])),
    { autoExecute: false },
  );

  const { data: stats, loading: statsLoading, error: statsError, execute: loadStats } = useApiCall(
    () => (id ? adapter.equipements.fetchEquipementStats(id) : Promise.resolve(null)),
    { autoExecute: false },
  );

  const { getParentInfo, getChildrenInfo } = useEquipements();
  const { health: polledHealth, manualRefresh } = useEquipementHealth(id, true);

  useEffect(() => {
    if (id) { reloadEquipement(); loadInterventions(); }
  }, [id]);

  useEffect(() => {
    if (activeTab === 'stats' && !stats) loadStats();
  }, [activeTab, stats, loadStats]);

  const interventions = useMemo(
    () => (Array.isArray(rawInterventions) ? rawInterventions : []),
    [rawInterventions],
  );

  const health = useMemo(
    () => polledHealth || equipement?.health || { level: 'ok', reason: '' },
    [polledHealth, equipement?.health],
  );
  const parentInfo = equipement ? getParentInfo(equipement.parentId) : null;
  const childrenInfo = equipement ? getChildrenInfo(equipement.childrenIds) : [];

  return {
    equipement,
    eqLoading,
    eqError,
    health,
    interventions,
    intLoading,
    intError,
    stats,
    statsLoading,
    statsError,
    parentInfo,
    childrenInfo,
    activeTab,
    setActiveTab,
    manualRefresh,
    reloadEquipement,
  };
}
