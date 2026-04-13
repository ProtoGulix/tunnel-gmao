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
  deleteIntervention as apiDeleteIntervention,
  fetchInterventionPdf,
} from '@/api/interventions';
import { createActionDirect } from '@/api/planning';
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
  const fetchDataRef = useRef(null);

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

  // Ref stable pour l'auto-refresh
  fetchDataRef.current = fetchData;

  // Chargement initial avec protection React StrictMode
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      fetchData();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh silencieux toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDataRef.current(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

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
    async (payload) => {
      try {
        // Le payload est déjà canonique (construit par ActionForm)
        const created = await createActionDirect({
          ...payload,
          intervention_id: payload.intervention_id ?? id,
        });
        await fetchData(true);
        return created;
      } catch (err) {
        console.error('Erreur ajout action:', err);
        throw err;
      }
    },
    [id, fetchData]
  );

  const deleteIntervention = useCallback(async () => {
    await apiDeleteIntervention(id);
  }, [id]);

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
    deleteIntervention,

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
