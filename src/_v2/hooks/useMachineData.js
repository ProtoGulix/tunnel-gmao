import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { machines, interventions, actionSubcategories } from '@/lib/api/facade';

const fetchMachine = (id) => machines.fetchMachine(id);

/**
 * Hook personnalisé pour charger les données d'une machine
 * @param {string} machineId - ID de la machine
 * @param {Object} options - Options de chargement
 * @param {boolean} options.includeSubcategories - Charger les sous-catégories d'actions (défaut: false)
 * @returns {object} Données de la machine et états de chargement
 */
export const useMachineData = (machineId, options = {}) => {
  const { includeSubcategories = false } = options;
  const [machine, setMachine] = useState(null);
  const [interventionsList, setInterventionsList] = useState([]);
  const [machineActions, setMachineActions] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Chargement parallèle de toutes les données
      const fetchPromises = [fetchMachine(machineId), interventions.fetchInterventions(machineId)];

      if (includeSubcategories) {
        fetchPromises.push(actionSubcategories.fetchActionSubcategories());
      }

      const results = await Promise.all(fetchPromises);
      const [machineData, machineInterventions, allSubcategories = []] = results;

      // Extraire les actions directement depuis les interventions (expand)
      const aggregatedActions = machineInterventions.flatMap((intervention) =>
        (intervention.action || []).map((action) => ({
          ...action,
          intervention: { id: intervention.id, code: intervention.code, title: intervention.title },
        }))
      );

      setMachine(machineData);
      setInterventionsList(machineInterventions);
      setMachineActions(aggregatedActions);
      if (includeSubcategories) {
        setSubcategories(allSubcategories);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);

      if (err.response?.status === 401) {
        navigate('/login');
        return;
      }

      setError('Impossible de charger les données de la machine');
    } finally {
      setLoading(false);
    }
  }, [machineId, navigate, includeSubcategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    machine,
    interventions: interventionsList,
    actions: machineActions,
    subcategories: includeSubcategories ? subcategories : undefined,
    loading,
    error,
    reload: loadData,
  };
};
