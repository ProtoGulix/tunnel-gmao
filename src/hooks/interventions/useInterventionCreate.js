import { useState, useCallback } from 'react';
import { createIntervention } from '@/api/interventions';
import { fetchEquipements } from '@/api/equipements';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

export function useInterventionCreate({ navigate }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'CUR',
    priority: 'normale',
    equipementId: null,
    equipementLabel: '',
    techInitials: '',
    reportedBy: '',
    reportedDate: getDefaultDateTimeLocal(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const fetchEquipementsFn = useCallback(
    (search) => fetchEquipements({ search }).then((r) => r.items ?? []),
    []
  );

  const validate = useCallback(() => {
    if (!formData.title.trim()) return 'Le titre est obligatoire';
    if (!formData.equipementId) return 'Veuillez sélectionner un équipement';
    if (!formData.techInitials.trim()) return 'Les initiales du technicien sont obligatoires';
    return null;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }
      try {
        setSaving(true);
        const created = await createIntervention({
          ...formData,
          reportedDate: formData.reportedDate
            ? new Date(formData.reportedDate).toISOString()
            : undefined,
        });
        navigate(`/intervention/${created.id}`);
      } catch (err) {
        setError(extractApiErrorMessage(err, "Erreur lors de la création de l'intervention"));
      } finally {
        setSaving(false);
      }
    },
    [formData, validate, navigate]
  );

  return { formData, setFormData, fetchEquipementsFn, saving, error, handleSubmit };
}
