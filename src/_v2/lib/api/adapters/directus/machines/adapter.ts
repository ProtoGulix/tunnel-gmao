/**
 * Machines Adapter - Domain Interface
 * 
 * Orchestrates datasource and mapper to provide clean domain API.
 * No backend details, no HTTP, no filters - pure domain orchestration.
 * 
 * Rules:
 * - NO backend calls (datasource handles that)
 * - NO DTO mapping (mapper handles that)
 * - Orchestration only: datasource → mapper → return
 * - Use apiCall for error handling
 * - Use logical cache tags
 * 
 * @module lib/api/adapters/directus/machines/adapter
 */

import { apiCall } from '@/lib/api/errors';
import { fetchMachinesRaw, fetchMachineRaw, fetchInterventionsRaw } from './datasource';
import { 
  mapMachineToDomain, 
  mapInterventionToDomain, 
  enrichMachinesWithStats 
} from './mapper';
import type { MachinesNamespace } from '@/lib/api/adapters/ApiAdapter';

/**
 * Machines adapter implementing MachinesNamespace interface
 */
export const machinesAdapter: MachinesNamespace = {
  /**
   * Fetch all machines
   * 
   * @returns Array of domain Machine DTOs
   */
  async fetchMachines() {
    return apiCall(async () => {
      // 1. Get raw data from backend
      const rawMachines = await fetchMachinesRaw();
      
      // 2. Map to domain DTOs
      return rawMachines.map(mapMachineToDomain);
    }, 'Machines.fetchMachines');
  },

  /**
   * Fetch single machine by ID
   * 
   * @param id - Machine ID
   * @returns Domain Machine DTO
   */
  async fetchMachine(id: string) {
    return apiCall(async () => {
      // 1. Get raw data from backend
      const rawMachine = await fetchMachineRaw(id);
      
      // 2. Map to domain DTO
      return mapMachineToDomain(rawMachine);
    }, 'Machines.fetchMachine');
  },

  /**
   * Fetch machines with intervention statistics
   * 
   * @returns Array of MachineWithStats DTOs
   */
  async fetchMachinesWithInterventions() {
    return apiCall(async () => {
      // 1. Get raw data from backend
      const rawMachines = await fetchMachinesRaw();
      
      // Si la requête a été annulée, retourner null immédiatement
      if (!rawMachines) {
        return null;
      }
      
      const rawInterventions = await fetchInterventionsRaw();
      
      // 2. Map to domain DTOs
      const machines = rawMachines.map(mapMachineToDomain);
      const interventions = rawInterventions.map(mapInterventionToDomain);
      
      // 3. Enrich with stats
      return enrichMachinesWithStats(machines, interventions);
    }, 'Machines.fetchMachinesWithInterventions');
  },

  /**
   * Update machine
   * 
   * @returns Updated Machine DTO
   */
  async updateMachine() {
    // TODO: Implement when backend supports machine updates
    throw new Error('Machine updates not yet implemented');
  },
};
