/**
 * Actions Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/actions/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const actionsAdapter = {
  async fetchActions(interventionId?: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchActionsRaw(interventionId);
      return raw.map(mapper.mapActionToDomain).filter(Boolean);
    }, interventionId ? `TunnelActions.fetchActions:${interventionId}` : 'TunnelActions.fetchActions');
  },

  createAction: undefined,
  updateAction: undefined,
  deleteAction: undefined,
};
