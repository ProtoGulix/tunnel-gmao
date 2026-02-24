/**
 * Actions API Layer
 *
 * Appels HTTP pour les actions d'intervention.
 */

/* eslint-disable complexity */
import { api } from '@/lib/api/client';

/**
 * Crée une nouvelle action d'intervention
 *
 * @param {Object} actionData - Données de l'action
 * @param {string} actionData.interventionId - ID de l'intervention
 * @param {string} actionData.description - Description de l'action
 * @param {number} actionData.timeSpent - Temps passé (heures)
 * @param {number} actionData.complexityScore - Score de complexité (facultatif)
 * @param {string} actionData.date - Date de l'action (ISO)
 * @param {string} actionData.subcategoryId - ID de la sous-catégorie (facultatif)
 * @param {string} actionData.technicianId - ID du technicien (facultatif)
 * @returns {Promise<Object>} Action créée
 */
export async function createAction(actionData) {
  const payload = {
    intervention_id: actionData.interventionId,
    description: actionData.description,
    time_spent: actionData.timeSpent ?? 0,
    date: actionData.date || new Date().toISOString().split('T')[0],
  };

  if (actionData.complexityScore !== undefined && actionData.complexityScore !== null) {
    payload.complexity_score = actionData.complexityScore;
  }

  if (actionData.subcategoryId) {
    payload.subcategory_id = actionData.subcategoryId;
  }

  if (actionData.technicianId) {
    payload.technician_id = actionData.technicianId;
  }

  const response = await api.post('/intervention-actions', payload);
  return mapActionResponse(response.data);
}

/**
 * Update an existing action
 *
 * @param {string|number} id - Action ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.description] - New description
 * @param {number} [updates.timeSpent] - New time spent
 * @param {number} [updates.complexityScore] - New complexity score
 * @param {string} [updates.date] - New date
 * @param {Object} [updates.subcategory] - New subcategory {id}
 * @param {Object} [updates.technician] - New technician {id}
 * @param {Object} [updates.intervention] - Intervention reference {id}
 * @param {Array} [updates.complexityFactors] - Complexity factors array
 * @returns {Promise<Object>} Updated action
 */
export async function updateAction(id, updates) {
  const payload = {};

  if (updates.description !== undefined) {
    payload.description = updates.description;
  }

  if (updates.timeSpent !== undefined) {
    payload.time_spent = updates.timeSpent;
  }

  if (updates.complexityScore !== undefined) {
    payload.complexity_score = updates.complexityScore;
  }

  if (updates.date !== undefined) {
    payload.date = updates.date;
  }

  if (updates.subcategory?.id) {
    payload.subcategory_id = updates.subcategory.id;
  }

  if (updates.technician?.id) {
    payload.technician_id = updates.technician.id;
  }

  if (updates.intervention?.id) {
    payload.intervention_id = updates.intervention.id;
  }

  if (Array.isArray(updates.complexityFactors)) {
    payload.complexity_factors = updates.complexityFactors;
  }

  const response = await api.patch(`/intervention-actions/${id}`, payload);
  return mapActionResponse(response.data?.data || response.data);
}

/**
 * Mappe une action du backend vers le frontend
 */
/* eslint-disable complexity */
function mapActionResponse(raw = {}) {
  return {
    id: raw.id?.toString() || '',
    description: raw.description || '',
    timeSpent: raw.time_spent ?? 0,
    complexityScore: raw.complexity_score ?? null,
    createdAt: raw.created_at,
    date: raw.date,
    subcategory: raw.subcategory
      ? {
          id: raw.subcategory.id?.toString() || '',
          label: raw.subcategory.label || '',
          code: raw.subcategory.code || '',
        }
      : null,
    technician: raw.technician
      ? {
          id: raw.technician.id?.toString() || '',
          firstName: raw.technician.first_name || '',
          lastName: raw.technician.last_name || '',
        }
      : null,
  };
}
