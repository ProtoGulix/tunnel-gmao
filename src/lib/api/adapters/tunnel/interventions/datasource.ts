/**
 * Interventions Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/interventions/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const fetchInterventionRaw = async (id: string) => {
  const response = await tunnelApi.get(`/interventions/${id}`);
  return response.data?.data || response.data || {};
};

export const fetchInterventionsRaw = async (filters: any = {}) => {
  const params: any = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 100,
  };

  if (filters.equipement_id) {
    // Convertir en string si nécessaire
    const equipementId = String(filters.equipement_id);
    params.equipement_id = equipementId;
  }
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;

  const response = await tunnelApi.get('/interventions', { params });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};
