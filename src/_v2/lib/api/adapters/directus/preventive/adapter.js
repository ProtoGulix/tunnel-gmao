/**
 * Preventive Adapter (Domain Interface)
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper only.
 * No backend-specific logic. No HTTP calls. No Directus field names.
 *
 * Uses:
 * - apiCall wrapper (error handling)
 * - Logical cache tags (not URL paths)
 * - Domain DTOs
 *
 * @module lib/api/adapters/directus/preventive/adapter
 */

import { invalidateCache } from '@/lib/api/client';
import * as datasource from './datasource';
import * as mapper from './mapper';

// ============================================================================
// Public Domain Interface (Backend-Agnostic)
// ============================================================================

export const preventiveAdapter = {
  /**
   * Fetch all preventive suggestions (all machines)
   * @param {string} [status='NEW'] - Status filter
   * @returns {Promise<Array>} Domain DTOs
   */
  fetchAllPreventiveSuggestions: async (status = 'NEW') => {
    const raw = await datasource.fetchAllPreventiveSuggestionsRaw(status);
    return raw.map(mapper.mapPreventiveSuggestionToDomain);
  },

  /**
   * Fetch preventive suggestions for a specific machine
   * @param {string} machineId - Machine UUID
   * @param {string} [status='NEW'] - Status filter
   * @returns {Promise<Array>} Domain DTOs
   */
  fetchPreventiveSuggestions: async (machineId, status = 'NEW') => {
    const raw = await datasource.fetchPreventiveSuggestionsRaw(machineId, status);
    return raw.map(mapper.mapPreventiveSuggestionToDomain);
  },

  /**
   * Accept a preventive suggestion
   * @param {string} suggestionId - Suggestion UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Domain DTO
   */
  acceptPreventiveSuggestion: async (suggestionId, userId) => {
    const backendPayload = mapper.mapPreventiveSuggestionDomainToBackend({
      status: 'ACCEPTED',
      handledAt: new Date().toISOString(),
      handledBy: userId,
    });
    const raw = await datasource.updatePreventiveSuggestionRaw(suggestionId, backendPayload);
    invalidateCache('preventiveSuggestions');
    return mapper.mapPreventiveSuggestionToDomain(raw);
  },

  /**
   * Reject a preventive suggestion
   * @param {string} suggestionId - Suggestion UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Domain DTO
   */
  rejectPreventiveSuggestion: async (suggestionId, userId) => {
    const backendPayload = mapper.mapPreventiveSuggestionDomainToBackend({
      status: 'REJECTED',
      handledAt: new Date().toISOString(),
      handledBy: userId,
    });
    const raw = await datasource.updatePreventiveSuggestionRaw(suggestionId, backendPayload);
    invalidateCache('preventiveSuggestions');
    return mapper.mapPreventiveSuggestionToDomain(raw);
  },

  /**
   * Mark a preventive suggestion as reviewed
   * @param {string} suggestionId - Suggestion UUID
   * @returns {Promise<Object>} Domain DTO
   */
  reviewPreventiveSuggestion: async (suggestionId) => {
    const backendPayload = mapper.mapPreventiveSuggestionDomainToBackend({
      status: 'REVIEWED',
    });
    const raw = await datasource.updatePreventiveSuggestionRaw(suggestionId, backendPayload);
    invalidateCache('preventiveSuggestions');
    return mapper.mapPreventiveSuggestionToDomain(raw);
  },
};
