/**
 * Hook pour la liste des interventions
 *
 * Gère le fetch, le filtrage par recherche, la segmentation en 4 blocs,
 * le tri et l'auto-refresh.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchInterventions } from '@/api/interventions';

/**
 * Hook pour gérer la liste segmentée des interventions
 *
 * @param {string} searchTerm - Terme de recherche (code machine, code intervention, titre)
 * @returns {Object} État et méthodes { blocks, loading, error, refetch }
 */
export function useInterventionsList(searchTerm = '') {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch des interventions
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const interventions = await fetchInterventions({ limit: 1000 });
      setData(interventions);
      setError(null);
    } catch (err) {
      console.error('Erreur fetch interventions:', err);
      setError(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtrage par recherche
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const searchLower = searchTerm.toLowerCase().trim();
    return data.filter((i) => {
      const machineCode = i.machine?.code?.toLowerCase() || '';
      const interventionCode = i.code?.toLowerCase() || '';
      const title = i.title?.toLowerCase() || '';

      return (
        machineCode.includes(searchLower) ||
        interventionCode.includes(searchLower) ||
        title.includes(searchLower)
      );
    });
  }, [data, searchTerm]);

  // Calcul de l'âge en jours
  const calculateAge = useCallback((reportedDate) => {
    if (!reportedDate) return 0;
    const now = new Date();
    const reported = new Date(reportedDate);
    const diffTime = Math.abs(now - reported);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Tri des interventions
  const sortInterventions = useCallback(
    (interventions) => {
      const priorityOrder = { urgent: 0, important: 1, normal: 2, faible: 3 };

      return [...interventions].sort((a, b) => {
        // 1. Priorité
        const priorityA = priorityOrder[a.priority?.toLowerCase()] ?? 2;
        const priorityB = priorityOrder[b.priority?.toLowerCase()] ?? 2;
        if (priorityA !== priorityB) return priorityA - priorityB;

        // 2. Fiches non imprimées en haut (pour faciliter la clôture)
        if (a.printedFiche !== b.printedFiche) {
          return a.printedFiche ? 1 : -1;
        }

        // 3. Âge décroissant (plus récent en haut)
        const ageA = calculateAge(a.reportedDate);
        const ageB = calculateAge(b.reportedDate);
        return ageB - ageA;
      });
    },
    [calculateAge]
  );

  // Segmentation en 4 blocs
  const blocks = useMemo(() => {
    const actionnable = [];
    const bloque = [];
    const projet = [];
    const archive = [];

    // eslint-disable-next-line complexity
    filteredData.forEach((i) => {
      const status = i.status?.toLowerCase();
      const type = i.type?.toUpperCase();
      const priority = i.priority?.toLowerCase();

      // Bloc 4: Archivé (fermé ou annulé)
      if (status === 'ferme' || status === 'cancelled') {
        archive.push(i);
        return;
      }

      // Bloc 2: Bloqué (attente pièces ou attente prod)
      if (status === 'attente_pieces' || status === 'attente_prod') {
        bloque.push(i);
        return;
      }

      // Bloc 3: Projets (PRO, PIL, MES avec priorité non urgente)
      if ((type === 'PRO' || type === 'PIL' || type === 'MES') && priority !== 'urgent') {
        projet.push(i);
        return;
      }

      // Bloc 1: Actionnable (tout le reste)
      actionnable.push(i);
    });

    return {
      actionnable: sortInterventions(actionnable),
      bloque: sortInterventions(bloque),
      projet: sortInterventions(projet),
      archive: sortInterventions(archive),
    };
  }, [filteredData, sortInterventions]);

  // Auto-refresh silencieux toutes les 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true); // silent = true
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    blocks,
    loading,
    error,
    refetch: () => fetchData(false),
    totalOpen: blocks.actionnable.length + blocks.bloque.length + blocks.projet.length,
  };
}
