/**
 * Interventions Adapter (Domain Interface)
 * 
 * Backend-agnostic domain interface. Orchestrates datasource + mapper only.
 * No backend-specific logic. No HTTP calls. No Directus field names.
 * 
 * Uses:
 * - apiCall wrapper (error handling)
 * - Logical cache tags (not URL paths)
 * - Domain DTOs (as defined in API_CONTRACTS.md)
 * 
 * @module lib/api/adapters/directus/interventions/adapter
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Adapter accepts domain payloads (any shape) - validation happens in apiCall

import { apiCall } from '@/lib/api/errors';
import { invalidateCache } from '@/lib/api/client';
import * as datasource from './datasource';
import * as mapper from './mapper';

// ============================================================================
// Public Domain Interface (Backend-Agnostic)
// ============================================================================

export const interventionsAdapter = {
  /**
   * Fetch a single intervention by ID.
   * @returns {Promise<Intervention>}
   */
  fetchIntervention: async (id: string) => {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionRaw(id);
      return mapper.mapInterventionToDomain(raw);
    }, 'FetchIntervention');
  },

  /**
   * Fetch all interventions.
   * @returns {Promise<Intervention[]>}
   */
  fetchInterventions: async () => {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionsRaw();
      return raw.map(mapper.mapInterventionToDomain);
    }, 'FetchInterventions');
  },

  /**
   * Create a new intervention.
   * @param {Object} payload - Domain Intervention payload
   * @returns {Promise<Intervention>}
   */
  createIntervention: async (payload: any) => {
    return apiCall(async () => {
      const backendPayload = mapper.mapInterventionDomainToBackend(payload);
      const raw = await datasource.createInterventionRaw(backendPayload);
      invalidateCache('interventions');
      return mapper.mapInterventionToDomain(raw);
    }, 'CreateIntervention');
  },

  /**
   * Create an action for an intervention.
   * @param {Object} payload - Domain InterventionAction payload
   * @returns {Promise<InterventionAction>}
   */
  createAction: async (payload: any) => {
    return apiCall(async () => {
      const backendPayload = mapper.mapActionPayloadToBackend(payload);
      const raw = await datasource.createActionRaw(backendPayload);
      invalidateCache(`interventions:${payload.intervention?.id}`);
      invalidateCache('actions');
      return mapper.mapActionToDomain(raw);
    }, 'CreateAction');
  },

  /**
   * Create a part for an intervention.
   * @param {Object} payload - Domain InterventionPart payload
   * @returns {Promise<InterventionPart>}
   */
  createPart: async (payload: any) => {
    return apiCall(async () => {
      const backendPayload = mapper.mapPartPayloadToBackend(payload);
      const raw = await datasource.createPartRaw(backendPayload);
      invalidateCache(`interventions:${payload.intervention?.id}`);
      invalidateCache('parts');
      return mapper.mapPartToDomain(raw);
    }, 'CreatePart');
  },

  /**
   * Update intervention status.
   * @param {string} interventionId
   * @param {string} status - Backend French status ('ouvert' | 'attente_pieces' | 'attente_prod' | 'ferme')
   * @returns {Promise<Intervention>}
   */
  updateStatus: async (interventionId: string, status: string) => {
    return apiCall(async () => {
      const backendPayload = { status_actual: status };
      const raw = await datasource.updateInterventionRaw(interventionId, backendPayload);
      invalidateCache(`interventions:${interventionId}`);
      return mapper.mapInterventionToDomain(raw);
    }, 'UpdateStatus');
  },

  /**
   * Update intervention details.
   * @param {string} interventionId
   * @param {Object} updates - Partial domain Intervention payload
   * @returns {Promise<Intervention>}
   */
  updateIntervention: async (interventionId: string, updates: any) => {
    return apiCall(async () => {
      const backendPayload = mapper.mapInterventionDomainToBackend(updates);
      const raw = await datasource.updateInterventionRaw(interventionId, backendPayload);
      invalidateCache(`interventions:${interventionId}`);
      return mapper.mapInterventionToDomain(raw);
    }, 'UpdateIntervention');
  },

  /**
   * Fetch status change history for an intervention.
   * @param {string} interventionId
   * @returns {Promise<InterventionStatusLog[]>}
   */
  fetchInterventionStatusLog: async (interventionId: string) => {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionStatusLogRaw(interventionId);
      return raw.map(mapper.mapStatusLogToDomain);
    }, 'FetchInterventionStatusLog');
  },

  /**
   * Fetch complexity factors.
   * ⚠️ TODO: Define ComplexityFactor DTO in API_CONTRACTS.md or move out of domain.
   * Currently returns backend raw data (temporary).
   * @returns {Promise<Array>}
   */
  fetchComplexityFactors: async () => {
    return apiCall(async () => {
      return await datasource.fetchComplexityFactorsRaw();
    }, 'FetchComplexityFactors');
  },

  /**
   * Fetch action subcategories.
   * @returns {Promise<Array>}
   */
  fetchActionSubcategories: async () => {
    return apiCall(async () => {
      return await datasource.fetchActionSubcategoriesRaw();
    }, 'FetchActionSubcategories');
  },

  /**
   * Fetch all actions across interventions.
   * @returns {Promise<InterventionAction[]>}
   */
  fetchActions: async () => {
    return apiCall(async () => {
      const raw = await datasource.fetchActionsRaw();
      return raw.map(mapper.mapActionToDomain);
    }, 'FetchActions');
  },

  /**
   * Fetch open and in-progress interventions.
   * @returns {Promise<Intervention[]>}
   */
  fetchOpenInterventions: async () => {
    return apiCall(async () => {
      const raw = await datasource.fetchOpenInterventionsRaw();
      return raw.map(mapper.mapInterventionToDomain);
    }, 'FetchOpenInterventions');
  },
};
