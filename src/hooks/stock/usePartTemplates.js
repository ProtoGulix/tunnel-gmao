/**
 * @fileoverview Hook part templates
 * @module hooks/stock/usePartTemplates
 */

import { useCallback, useEffect, useState } from 'react';
import {
  createPartTemplate,
  createPartTemplateVersion,
  deletePartTemplate,
  fetchPartTemplates,
} from '@/api/partTemplates';

export function usePartTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPartTemplates();
        if (isActive) setTemplates(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isActive) setError(err.message || 'Erreur chargement templates');
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  const addTemplate = useCallback(async (payload) => {
    const created = await createPartTemplate(payload);
    setTemplates((prev) => [...prev, created]);
    return created;
  }, []);

  const addVersion = useCallback(async (templateId, payload) => {
    const updated = await createPartTemplateVersion(templateId, payload);
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, ...updated } : t)));
    return updated;
  }, []);

  const removeTemplate = useCallback(async (templateId, version) => {
    await deletePartTemplate(templateId, version);
    if (!version) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  }, []);

  return {
    templates,
    loading,
    error,
    addTemplate,
    addVersion,
    removeTemplate,
  };
}
