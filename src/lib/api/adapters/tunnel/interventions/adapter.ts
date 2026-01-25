/**
 * Interventions Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/interventions/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';
import { mapActionToDomain } from '../actions/mapper';

export const interventionsAdapter = {
  async fetchInterventions(filters: any = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionsRaw(filters);
      return raw.map(mapper.mapInterventionToDomain).filter(Boolean);
    }, 'TunnelInterventions.fetchInterventions');
  },

  async fetchIntervention(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionRaw(id);
      const intervention = mapper.mapInterventionToDomain(raw);

      // Map nested actions if present
      if (Array.isArray(raw.actions)) {
        intervention.actions = raw.actions.map(mapActionToDomain).filter(Boolean);
      }

      return intervention;
    }, `TunnelInterventions.fetchIntervention:${id}`);
  },

  createIntervention: undefined,
  updateIntervention: undefined,
  addAction: undefined,
  addPart: undefined,
};
