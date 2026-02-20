/**
 * Equipement Classes Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/equipementClasses/adapter
 */

import { apiCall } from '@/lib/api/errors.js';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const equipementClassesAdapter = {
  async fetchEquipementClasses() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementClassesRaw();
      return raw.map(mapper.mapEquipementClassToDomain).filter(Boolean);
    }, 'TunnelEquipementClasses.fetchEquipementClasses');
  },

  async fetchEquipementClass(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementClassRaw(id);
      return mapper.mapEquipementClassToDomain(raw);
    }, `TunnelEquipementClasses.fetchEquipementClass:${id}`);
  },

  async createEquipementClass(data: { code: string; label: string; description?: string | null }) {
    return apiCall(async () => {
      const raw = await datasource.createEquipementClassRaw(data);
      return mapper.mapEquipementClassToDomain(raw);
    }, 'TunnelEquipementClasses.createEquipementClass');
  },

  async updateEquipementClass(id: string, data: { code?: string; label?: string; description?: string | null }) {
    return apiCall(async () => {
      const raw = await datasource.updateEquipementClassRaw(id, data);
      return mapper.mapEquipementClassToDomain(raw);
    }, `TunnelEquipementClasses.updateEquipementClass:${id}`);
  },

  async deleteEquipementClass(id: string) {
    return apiCall(async () => {
      await datasource.deleteEquipementClassRaw(id);
    }, `TunnelEquipementClasses.deleteEquipementClass:${id}`);
  },
};
