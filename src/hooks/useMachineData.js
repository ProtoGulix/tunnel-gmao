import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { machines, interventions, actions, actionSubcategories } from '@/lib/api/facade';

const fetchMachine = (id) => machines.fetchMachine(id);
const fetchInterventions = () => interventions.fetchInterventions();

/**
 * Hook personnalisé pour charger les données d'une machine
 * @param {string} machineId - ID de la machine
 * @returns {object} Données de la machine et états de chargement
 */
export const useMachineData = (machineId) => {
  const [machine, setMachine] = useState(null);
  const [interventions, setInterventions] = useState([]);
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
      const [machineData, allInterventions, allActions, allSubcategories] = await Promise.all([
        fetchMachine(machineId),
        fetchInterventions(),
        actions.fetchActions(),
        actionSubcategories.fetchActionSubcategories(),
      ]);

      // Filtrer les interventions de cette machine
      const machineInterventions = allInterventions.filter((i) => i.machine?.id === machineId);

      // Extraire les actions directement depuis les interventions (elles contiennent les données expandues)
      const machineActions = machineInterventions.flatMap((intervention) =>
        (intervention.action || []).map((action) => ({
          ...action,
          intervention: { id: intervention.id, code: intervention.code, title: intervention.title },
        }))
      );

      setMachine(machineData);
      setInterventions(machineInterventions);
      setMachineActions(machineActions);
      setSubcategories(allSubcategories);
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
  }, [machineId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    machine,
    interventions,
    actions: machineActions,
    subcategories,
    loading,
    error,
    reload: loadData,
  };
};
