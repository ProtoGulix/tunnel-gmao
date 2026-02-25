/**
 * @fileoverview Hook de gestion des équipements
 * @module hooks/equipements/useEquipements
 *
 * Gère la liste des équipements avec cache et hiérarchie parent/enfants
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as equipementsApi from '@/api/equipements';

/**
 * Hook pour gérer la liste des équipements
 * @returns {Object} État et fonctions pour gérer les équipements
 */
export function useEquipements() {
  const [equipements, setEquipements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);

  // Cache pour accès rapide par ID
  const equipementsById = useMemo(() => {
    const map = new Map();
    equipements.forEach((eq) => map.set(eq.id, eq));
    return map;
  }, [equipements]);

  // Charger la liste initiale
  const loadEquipements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipementsApi.fetchEquipements();
      setEquipements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des équipements');
      setEquipements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial avec protection React StrictMode
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadEquipements();
    }
  }, [loadEquipements]);

  // Récupérer les infos d'un équipement parent
  const getParentInfo = useCallback(
    (parentId) => {
      if (!parentId) return null;
      return equipementsById.get(parentId) || null;
    },
    [equipementsById]
  );

  // Récupérer les équipements enfants
  const getChildrenInfo = useCallback(
    (parentId) => {
      return equipements.filter((eq) => eq.parent_id === parentId);
    },
    [equipements]
  );

  // Créer un équipement
  const createEquipement = useCallback(
    async (data) => {
      const newEquipement = await equipementsApi.createEquipement(data);
      await loadEquipements(); // Recharger pour avoir l'état complet
      return newEquipement;
    },
    [loadEquipements]
  );

  // Mettre à jour un équipement
  const updateEquipement = useCallback(
    async (id, updates) => {
      const updated = await equipementsApi.updateEquipement(id, updates);
      await loadEquipements();
      return updated;
    },
    [loadEquipements]
  );

  // Supprimer un équipement
  const deleteEquipement = useCallback(
    async (id) => {
      await equipementsApi.deleteEquipement(id);
      await loadEquipements();
    },
    [loadEquipements]
  );

  // Rafraîchir la liste
  const refresh = useCallback(() => {
    loadEquipements();
  }, [loadEquipements]);

  return {
    equipements,
    loading,
    error,
    getParentInfo,
    getChildrenInfo,
    createEquipement,
    updateEquipement,
    deleteEquipement,
    refresh,
  };
}
