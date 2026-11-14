import { useState, useCallback, useEffect } from 'react';
import { createIntervention } from '@/api/interventions';
import { createInterventionRequest } from '@/api/intervention-requests';
import { fetchEquipements } from '@/api/equipements';
import { fetchActiveUsers } from '@/api/planning';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { useAuth } from '@/auth/useAuth';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';

const getDefaultDateTimeLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

export function useInterventionCreate({ navigate }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    type: 'CUR',
    priority: 'normale',
    equipementId: null,
    equipementLabel: '',
    techId: '',
    reportedBy: '',
    reportedDate: getDefaultDateTimeLocal(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveUsers().then((list) => {
      setUsers(list);
      if (user?.id) {
        const match = list.find((u) => u.id === user.id);
        if (match) setFormData((prev) => ({ ...prev, techId: match.id }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchEquipementsFn = useCallback(
    (search) => fetchEquipements({ search }).then((r) => r.items ?? []),
    []
  );

  const validate = useCallback(() => {
    if (!formData.title.trim()) return 'Le titre est obligatoire';
    if (!formData.equipementId) return 'Veuillez sélectionner un équipement';
    if (!formData.techId) return 'Veuillez sélectionner un technicien';
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
        // Une intervention vient toujours d'une demande (ADR 0019) : sans demande choisie,
        // une demande directe est créée avec l'intervention, comme dans la fenêtre de création.
        let requestId = formData.requestId;
        if (!requestId) {
          const tech = users.find((u) => u.id === formData.techId);
          const techName = tech ? `${tech.first_name ?? ''} ${tech.last_name ?? ''}`.trim() : '';
          const request = await createInterventionRequest({
            machineId: formData.equipementId,
            demandeurNom: formData.reportedBy?.trim() || techName || 'Système',
            description: formData.title.trim(),
            origine: 'directe',
          });
          requestId = request.id;
        }
        const created = await createIntervention({
          ...formData,
          requestId,
          reportedDate: formData.reportedDate
            ? new Date(formData.reportedDate).toISOString()
            : undefined,
        });
        navigate(entityCodeUrl('intervention', created.id));
      } catch (err) {
        setError(extractApiErrorMessage(err, "Erreur lors de la création de l'intervention"));
      } finally {
        setSaving(false);
      }
    },
    [formData, users, validate, navigate]
  );

  return { formData, setFormData, users, fetchEquipementsFn, saving, error, handleSubmit };
}
