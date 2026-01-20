/**
 * @fileoverview Hook personnalisé pour création d'interventions
 * Gère la logique métier : validation, API calls, state du formulaire
 *
 * @module hooks/useInterventionCreate
 * @requires react
 * @requires hooks/useApiCall
 * @requires lib/api/facade
 */

import { useState, useEffect, useCallback } from 'react';
import { useApiMutation } from '@/hooks/useApiCall';
import { interventions, machines } from '@/lib/api/facade';

/**
 * Détermine la date/heure par défaut (heure locale)
 * @returns {string} Datetime-local formaté (YYYY-MM-DDTHH:mm)
 */
const getDefaultDateTimeLocal = () => {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16);
};

/**
 * Hook personnalisé pour création d'interventions
 * Gère : état du formulaire, validation, API calls, chargement machines
 *
 * @param {Object} options - Options du hook
 * @param {Object} options.user - Utilisateur authentifié
 * @param {Function} options.navigate - Router navigate function
 * @returns {Object} État et handlers du formulaire
 *
 * @example
 * const {
 *   formData,
 *   setFormData,
 *   machinesList,
 *   error,
 *   loading,
 *   handleSubmit,
 * } = useInterventionCreate({ user, navigate });
 */
export function useInterventionCreate({ user, navigate }) {
  // ===== STATE =====
  const [formData, setFormData] = useState({
    title: '',
    type_inter: 'CUR',
    priority: 'normale',
    machine_id: null,
    reportedBy_id: null,
    createdAt: getDefaultDateTimeLocal(),
  });

  const [machinesList, setMachinesList] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [searchTermMachine, setSearchTermMachine] = useState('');

  // ===== API CALLS =====
  const { mutate: createNewIntervention, loading } = useApiMutation(
    interventions.createIntervention,
    {
      onSuccess: (newIntervention) => {
        navigate(`/intervention/${newIntervention.id}`);
      },
      onError: (error) => {
        setLocalError(error.message || 'Erreur lors de la création');
      },
    }
  );

  // ===== EFFECTS =====
  // Charger les machines au montage
  useEffect(() => {
    machines
      .fetchMachines()
      .then(setMachinesList)
      .catch((err) => {
        console.error('Erreur chargement machines:', err);
        setLocalError('Erreur lors du chargement des machines');
      });
  }, []);

  // ===== HANDLERS =====
  /**
   * Valide les données du formulaire
   * @returns {string|null} Message d'erreur ou null si valide
   */
  const validateForm = useCallback(() => {
    if (!formData.title.trim()) {
      return 'Le titre est obligatoire';
    }

    if (!formData.machine_id) {
      return 'Veuillez sélectionner une machine';
    }

    if (!formData.createdAt || Number.isNaN(Date.parse(formData.createdAt))) {
      return 'Veuillez fournir une date de création valide';
    }

    return null;
  }, [formData]);

  /**
   * Gère la soumission du formulaire
   * @param {Event} e - Événement du formulaire
   */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLocalError(null);

      // Validation
      const validationError = validateForm();
      if (validationError) {
        setLocalError(validationError);
        return;
      }

      // Payload - structure DTO conforme API_CONTRACTS.md
      const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');
      const payload = {
        title: formData.title,
        type: formData.type_inter,
        priority: formData.priority,
        machine: { id: formData.machine_id },
        status: 'open',
        createdAt: new Date(formData.createdAt).toISOString(),
        reportedDate: new Date().toISOString(),
        reportedBy: formData.reportedBy_id ? { id: formData.reportedBy_id } : undefined,
        techInitials: initials ? initials.toUpperCase() : undefined,
      };

      await createNewIntervention(payload);
    },
    [formData, user, validateForm, createNewIntervention]
  );

  return {
    formData,
    setFormData,
    machinesList,
    error: localError,
    loading,
    searchTermMachine,
    setSearchTermMachine,
    handleSubmit,
  };
}
