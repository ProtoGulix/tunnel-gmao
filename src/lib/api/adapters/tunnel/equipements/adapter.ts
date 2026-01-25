/**
 * Equipements Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/equipements/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const equipementsAdapter = {
  async fetchEquipements() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementsRaw();
      return raw.map(mapper.mapEquipementToDomain).filter(Boolean);
    }, 'TunnelEquipements.fetchEquipements');
  },

  async fetchEquipement(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementRaw(id);
      return mapper.mapEquipementDetailToDomain(raw);
    }, `TunnelEquipements.fetchEquipement:${id}`);
  },

  async fetchEquipementStats(id: string, startDate?: string, endDate?: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementStatsRaw(id, startDate, endDate);
      return mapper.mapEquipementStatsToDomain(raw);
    }, `TunnelEquipements.fetchEquipementStats:${id}`);
  },

  async fetchEquipementHealth(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementHealthRaw(id);
      return {
        level: raw.level || 'ok',
        reason: raw.reason || 'Aucun point bloquant',
      };
    }, `TunnelEquipements.fetchEquipementHealth:${id}`);
  },
};
