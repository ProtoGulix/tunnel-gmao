/**
 * Machines Datasource - Backend Data Access Layer
 * 
 * Pure backend calls without any domain mapping.
 * Returns raw backend responses for mapper layer to transform.
 * 
 * Rules:
 * - NO domain DTO mapping (done in mapper)
 * - NO business logic
 * - Backend calls only
 * - Raw response passthrough
 * 
 * @module lib/api/adapters/directus/machines/datasource
 */

import { api } from '@/lib/api/client';

/**
 * Fetch all machines from backend
 * Returns raw backend response
 */
export const fetchMachinesRaw = async () => {
  const { data } = await api.get('/items/machine', {
    params: {
      limit: -1,
      fields: [
        'id',
        'code',
        'name',
        'zone_id.id',
        'zone_id.name',
        'atelier_id.id',
        'atelier_id.name',
        'equipement_mere.id',
        'equipement_mere.code',
        'equipement_mere.name',
        'equipement_tree.id',
        'equipement_tree.code',
        'equipement_tree.name',
      ].join(','),
      _t: Date.now(),
    },
  });
  
  return data.data || [];
};

/**
 * Fetch single machine by ID from backend
 * Returns raw backend response
 */
export const fetchMachineRaw = async (id: string) => {
  const { data } = await api.get(`/items/machine/${id}`, {
    params: {
      fields: [
        'id',
        'code',
        'name',
        'equipement_mere.id',
        'equipement_mere.code',
        'equipement_mere.name',
        'equipement_tree.id',
        'equipement_tree.code',
        'equipement_tree.name',
      ].join(','),
      _t: Date.now(),
    },
  });
  
  return data.data;
};

/**
 * Fetch all interventions from backend
 * Returns raw backend response
 */
export const fetchInterventionsRaw = async () => {
  const { data } = await api.get('/items/intervention', {
    params: {
      limit: -1,
      sort: '-reported_date',
      fields: [
        'id',
        'code',
        'title',
        'status_actual.id',
        'status_actual.value',
        'priority',
        'type_inter',
        'reported_date',
        'machine_id.id',
        'machine_id.code',
        'machine_id.name',
      ].join(','),
      _t: Date.now(),
    },
  });
  
  return data.data || [];
};
