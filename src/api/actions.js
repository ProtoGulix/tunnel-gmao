/**
 * Actions API Layer
 *
 * Appels HTTP pour les actions d'intervention.
 */

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
