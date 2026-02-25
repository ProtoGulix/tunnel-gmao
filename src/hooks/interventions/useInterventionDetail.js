/**
 * Hook pour le détail d'une intervention
 *
 * Gère le fetch de l'intervention complète avec actions et statusLogs,
 * les mutations (updateStatus, updateIntervention, addAction),
 * le lazy loading des données par onglet et l'auto-refresh.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  fetchIntervention,
  updateIntervention as apiUpdateIntervention,
  updateInterventionStatus,
  fetchInterventionPdf,
} from '@/api/interventions';
import { createAction } from '@/api/actions';
import { useAuth } from '@/auth/useAuth';

/**
 * Hook pour gérer le détail d'une intervention
 *
 * @param {string} id - ID de l'intervention
 * @returns {Object} État et méthodes
 */
export function useInterventionDetail(id) {
  const { user } = useAuth();
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);

  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const pdfUrlRef = useRef(null);

  // Fetch intervention
  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const data = await fetchIntervention(id);
        setIntervention(data);
        setError(null);
      } catch (err) {
        console.error('Erreur fetch intervention:', err);
        setError(err.message || "Erreur lors du chargement de l'intervention");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id]
  );

  // Chargement initial avec protection React StrictMode
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchData();
    }
  }, [fetchData]);

  // Auto-refresh silencieux toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Cleanup PDF URL
  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        try {
          window.URL.revokeObjectURL(pdfUrlRef.current);
        } catch {
          // Ignore revoke errors
        }
      }
    };
  }, []);

  // Mutations
  const updateIntervention = useCallback(
    async (updates) => {
      try {
        const updated = await apiUpdateIntervention(id, updates);
        setIntervention(updated);
        return updated;
      } catch (err) {
        console.error('Erreur update intervention:', err);
        throw err;
      }
    },
    [id]
  );

  const updateStatus = useCallback(
    async (newStatus) => {
      try {
        const updated = await updateInterventionStatus(id, newStatus);
        setIntervention(updated);
        return updated;
      } catch (err) {
        console.error('Erreur update status:', err);
        throw err;
      }
    },
    [id]
  );

  const addAction = useCallback(
    async (formData) => {
      try {
        // Transformer les données du formulaire vers le format API
        const actionPayload = {
          interventionId: id,
          technicianId: user?.id, // ID du technicien courant
          description: formData.description || '',
          timeSpent: Number(formData.time) || 0.5, // Quarts d'heure
          subcategoryId: Number(formData.category), // ID sous-catégorie
          complexityScore: Number(formData.complexity) || 5,
          date: formData.date || new Date().toISOString().split('T')[0],
        };

        // Ajouter le facteur de complexité si score > 5 et facteurs fournis
        if (Number(formData.complexity) > 5 && formData.complexityFactors?.length > 0) {
          // Envoyer le premier facteur (singulier) - le backend expect complexity_factor
          actionPayload.complexityFactor = formData.complexityFactors[0];
        }

        await createAction(actionPayload);
        // Refetch pour avoir les données à jour
        await fetchData(true);
      } catch (err) {
        console.error('Erreur ajout action:', err);
        throw err;
      }
    },
    [id, user?.id, fetchData]
  );

  // Chargement du PDF
  const loadPdf = useCallback(async () => {
    try {
      setPdfLoading(true);

      const blobUrl = await fetchInterventionPdf(id);

      // Cleanup old URL if exists
      if (pdfUrlRef.current) {
        try {
          window.URL.revokeObjectURL(pdfUrlRef.current);
        } catch {
          // Ignore revoke errors
        }
      }

      pdfUrlRef.current = blobUrl;
      setPdfUrl(blobUrl);
    } catch (err) {
      console.error('Erreur chargement PDF:', err);
      throw err;
    } finally {
      setPdfLoading(false);
    }
  }, [id]);

  // Computed values
  const statusLog = useMemo(() => intervention?.statusLogs || [], [intervention?.statusLogs]);

  const actions = useMemo(() => intervention?.action || [], [intervention?.action]);

  const ficheFileName = useMemo(() => {
    const base = intervention?.code || id || 'intervention';
    return `${base}.pdf`;
  }, [intervention?.code, id]);

  return {
    intervention,
    loading,
    error,
    refetch: fetchData,
    refetchSilent: () => fetchData(true),

    // Mutations
    updateIntervention,
    updateStatus,
    addAction,

    // Computed
    statusLog,
    actions,

    // PDF
    pdfUrl,
    pdfLoading,
    loadPdf,
    ficheFileName,
  };
}
