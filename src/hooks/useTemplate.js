import { useState, useEffect } from 'react';
import { partTemplates } from '@/lib/api/facade';

/**
 * Hook pour charger et gérer un template de pièce
 *
 * @param {number|null} templateId - ID du template à charger
 * @param {number|null} version - Version spécifique (optionnel)
 * @returns {Object} - { template, fields, enums, loading, error, refresh }
 *
 * @example
 * const { template, fields, enums, loading } = useTemplate(templateId);
 *
 * // Template complet avec pattern et fields
 * console.log(template.pattern); // "M{DIAM}x{LONG}-{MAT}"
 * console.log(fields); // [{ field_key: "DIAM", label: "Diamètre", type: "number", ... }]
 * console.log(enums); // { MAT: [{ value: "A2", label: "Acier inox A2" }, ...] }
 */
export function useTemplate(templateId, version = null) {
  const [template, setTemplate] = useState(null);
  const [fields, setFields] = useState([]);
  const [enums, setEnums] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTemplate = async () => {
    if (!templateId) {
      setTemplate(null);
      setFields([]);
      setEnums({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await partTemplates.fetchTemplate(templateId, version);

      setTemplate(data);
      setFields(data.fields || []);

      // Construire la map des enums { field_key: [values...] }
      const enumsMap = {};
      (data.fields || []).forEach((field) => {
        if (field.type === 'enum' && field.enum_values) {
          enumsMap[field.field_key] = field.enum_values;
        }
      });
      setEnums(enumsMap);
    } catch (err) {
      console.error('Erreur chargement template:', err);
      setError(err);
      setTemplate(null);
      setFields([]);
      setEnums({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, version]);

  return {
    template,
    fields,
    enums,
    loading,
    error,
    refresh: loadTemplate,
  };
}

/**
 * Hook pour charger la liste de tous les templates (dernière version)
 *
 * @returns {Object} - { templates, loading, error, refresh }
 */
export function useTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await partTemplates.fetchTemplates();
      setTemplates(data || []);
    } catch (err) {
      console.error('Erreur chargement templates:', err);
      setError(err);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    refresh: loadTemplates,
  };
}
