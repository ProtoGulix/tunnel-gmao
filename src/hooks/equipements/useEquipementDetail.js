/**
 * @fileoverview Hook pour le détail d'un équipement
 * @module hooks/equipements/useEquipementDetail
 *
 * Gère le fetch du détail d'un équipement avec stats, santé et hiérarchie
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchEquipementById,
  updateEquipement as apiUpdateEquipement,
  fetchEquipementStats,
  fetchEquipementHealth,
} from '@/api/equipements';

/**
 * Hook pour gérer le détail d'un équipement
 *
 * @param {string} id - ID de l'équipement
 * @returns {Object} État et méthodes
 */
export function useEquipementDetail(id) {
  const [equipement, setEquipement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [health, setHealth] = useState({ level: 'unknown', reason: '' });

  // Fetch détail de l'équipement
  const fetchDetail = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const data = await fetchEquipementById(id);
        setEquipement(data);
        setHealth(
          data.health || {
            level: 'unknown',
            reason: 'Santé inconnue',
            rules_triggered: [],
          }
        );
      } catch (err) {
        console.error('Erreur fetch équipement:', err);
        setError(err.message || "Erreur lors du chargement de l'équipement");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchEquipementStats(id);
      setStats(data);
    } catch (err) {
      console.error('Erreur fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  // Refresh santé (ultra-léger, polling-friendly)
  const refreshHealth = useCallback(async () => {
    try {
      const data = await fetchEquipementHealth(id);
      setHealth(data);
    } catch (err) {
      console.error('Erreur refresh santé:', err);
    }
  }, [id]);

  // Ref stable pour l'auto-refresh (évite de recréer l'interval à chaque render)
  const refreshHealthRef = useRef(refreshHealth);
  refreshHealthRef.current = refreshHealth;

  // Chargement initial + rechargement si l'id change (navigation entre équipements)
  useEffect(() => {
    initialLoadRef.current = true;
    fetchDetail();
    fetchStats();
  }, [fetchDetail, fetchStats]);

  // Auto-refresh santé toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshHealthRef.current();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Refresh manuel
  const manualRefresh = useCallback(async () => {
    await fetchDetail(false);
    await fetchStats();
    await refreshHealth();
  }, [fetchDetail, fetchStats, refreshHealth]);

  // Mutations
  const updateEquipement = useCallback(
    async (updates) => {
      try {
        const updated = await apiUpdateEquipement(id, updates);
        setEquipement(updated);
        return updated;
      } catch (err) {
        console.error('Erreur update équipement:', err);
        throw err;
      }
    },
    [id]
  );

  return {
    equipement,
    loading,
    error,
    health,
    stats,
    statsLoading,
    interventions: equipement?.interventions || { total: 0, items: [] },
    childrenCount: equipement?.children_count || 0,
    parent: equipement?.parent || null,
    updateEquipement,
    manualRefresh,
    refetch: fetchDetail,
    refreshHealth,
  };
}
