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
 * @param {string} actionData.technicianId - ID/UUID du technicien (requis)
 * @param {string} actionData.description - Description de l'action
 * @param {number} actionData.timeSpent - Temps passé (quarts d'heure: 0.25, 0.5, 0.75, 1.0...)
 * @param {number} actionData.complexityScore - Score de complexité 1-10
 * @param {string} [actionData.complexityFactor] - Code du facteur de complexité (requis si score > 5)
 * @param {string} [actionData.date] - Date de l'action (ISO format, défaut: now)
 * @param {number} actionData.subcategoryId - ID de la sous-catégorie
 * @returns {Promise<Object>} Action créée
 */
export async function createAction(actionData) {
  const payload = {
    intervention_id: actionData.interventionId,
    tech: actionData.technicianId, // UUID ou ID du technicien
    description: actionData.description,
    time_spent: Number(actionData.timeSpent) || 0.5, // Quarts d'heure minimum 0.25
    action_subcategory: Number(actionData.subcategoryId),
    complexity_score: Number(actionData.complexityScore) || 5,
  };

  // Ajouter la date si fournie
  if (actionData.date) {
    payload.created_at = actionData.date;
  }

  // Ajouter le facteur de complexité si fourni et score > 5
  if (Number(actionData.complexityScore) > 5 && actionData.complexityFactor) {
    // complexityFactor peut être un string (code) ou un objet {code: "PCE"}
    payload.complexity_factor =
      typeof actionData.complexityFactor === 'string'
        ? actionData.complexityFactor
        : actionData.complexityFactor?.code;
  }

  const response = await api.post('/intervention-actions', payload);
  return mapActionResponse(response.data);
}

/**
 * Fetch a single action by ID
 *
 * @param {string|number} id - Action ID
 * @returns {Promise<Object>} Full action data including action_start/action_end
 */
export async function fetchAction(id) {
  const response = await api.get(`/intervention-actions/${id}`);
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

  // Bornes horaires OU time_spent — jamais les deux (ambiguïté API)
  if (updates.actionStart && updates.actionEnd) {
    payload.action_start = updates.actionStart;
    payload.action_end = updates.actionEnd;
  } else if (updates.timeSpent !== undefined) {
    payload.time_spent = updates.timeSpent;
  }

  if (updates.complexityScore !== undefined) {
    payload.complexity_score = updates.complexityScore;
  }

  // `created_at` modifiable (backdating) — `intervention_id` non modifiable

  if (updates.date) {
    payload.created_at = updates.date;
  }

  if (updates.subcategory?.id) {
    payload.action_subcategory = Number(updates.subcategory.id);
  }

  if (updates.technician?.id) {
    payload.tech = updates.technician.id;
  }

  // `intervention_id` non modifiable — non envoyé

  // Envoyer le premier facteur de complexité (singulier) ou null
  if (Array.isArray(updates.complexityFactors) && updates.complexityFactors.length > 0) {
    payload.complexity_factor = updates.complexityFactors[0];
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
    actionStart: raw.action_start ? raw.action_start.slice(0, 5) : null,
    actionEnd: raw.action_end ? raw.action_end.slice(0, 5) : null,
    subcategory: raw.subcategory
      ? {
          id: raw.subcategory.id?.toString() || '',
          label: raw.subcategory.name || '',
          code: raw.subcategory.code || '',
        }
      : null,
    technician:
      raw.tech || raw.technician
        ? {
            id: (raw.tech || raw.technician).id?.toString() || '',
            firstName: (raw.tech || raw.technician).first_name || '',
            lastName: (raw.tech || raw.technician).last_name || '',
          }
        : null,
    complexityFactors: raw.complexity_factor ? [raw.complexity_factor] : [],
    purchaseRequests: raw.purchase_requests || [],
    gammeStepValidations: raw.gamme_step_validations || [],
  };
}
