/**
 * @fileoverview Hook de gestion des classes d'équipement
 * @module hooks/equipements/useEquipementClasses
 *
 * Gère le CRUD des classes d'équipement (SCIE, EXTRUDEUSE, etc.)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as equipementClassesApi from '@/api/equipementClasses';

/**
 * Hook pour gérer les classes d'équipement
 * @returns {Object} État et fonctions pour gérer les classes
 */
export function useEquipementClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);

  // Charger la liste des classes
  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await equipementClassesApi.fetchEquipementClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadClasses();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Créer une classe
  const createClass = useCallback(
    async (data) => {
      const newClass = await equipementClassesApi.createEquipementClass(data);
      await loadClasses();
      return newClass;
    },
    [loadClasses]
  );

  // Mettre à jour une classe
  const updateClass = useCallback(
    async (id, updates) => {
      const updated = await equipementClassesApi.updateEquipementClass(id, updates);
      await loadClasses();
      return updated;
    },
    [loadClasses]
  );

  // Supprimer une classe
  const deleteClass = useCallback(
    async (id) => {
      await equipementClassesApi.deleteEquipementClass(id);
      await loadClasses();
    },
    [loadClasses]
  );

  // Rafraîchir la liste
  const refresh = useCallback(() => {
    loadClasses();
  }, [loadClasses]);

  return {
    classes,
    loading,
    error,
    createClass,
    updateClass,
    deleteClass,
    refresh,
  };
}
