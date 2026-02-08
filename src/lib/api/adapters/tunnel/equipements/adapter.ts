/**
 * Equipements Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/equipements/adapter
 */

import { apiCall } from '@/lib/api/errors.js';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const equipementsAdapter = {
  async fetchMachines() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementsRaw();
      const mapped = raw.map(mapper.mapEquipementToDomain).filter(Boolean);
      return mapped;
    }, 'TunnelEquipements.fetchMachines');
  },

  async fetchMachine(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementRaw(id);
      return mapper.mapEquipementDetailToDomain(raw);
    }, `TunnelEquipements.fetchMachine:${id}`);
  },

  async fetchMachinesWithInterventions() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementsRaw();
      const mapped = raw.map(mapper.mapEquipementToDomain).filter(Boolean);
      return mapped;
    }, 'TunnelEquipements.fetchMachinesWithInterventions');
  },

  async fetchEquipements() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementsRaw();
      const mapped = raw.map(mapper.mapEquipementToDomain).filter(Boolean);
      return mapped;
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

  async createEquipement(data: { name: string; code?: string; parent_id?: string | null; equipment_class_id?: string | null }) {
    return apiCall(async () => {
      const raw = await datasource.createEquipementRaw(data);
      return mapper.mapEquipementDetailToDomain(raw);
    }, 'TunnelEquipements.createEquipement');
  },

  async updateEquipement(id: string, data: { name?: string; code?: string; parent_id?: string | null; equipment_class_id?: string | null }) {
    return apiCall(async () => {
      const raw = await datasource.updateEquipementRaw(id, data);
      return mapper.mapEquipementDetailToDomain(raw);
    }, `TunnelEquipements.updateEquipement:${id}`);
  },

  async deleteEquipement(id: string) {
    return apiCall(async () => {
      await datasource.deleteEquipementRaw(id);
    }, `TunnelEquipements.deleteEquipement:${id}`);
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


