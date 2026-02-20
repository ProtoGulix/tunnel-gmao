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
  // GET /interventions/{id} - Returns full intervention with actions and stats
  const response = await tunnelApi.get(`/interventions/${id}`);
  return response.data?.data || response.data || {};
};

export const fetchInterventionsRaw = async (filters: any = {}) => {
  // GET /interventions - Returns list with filters, sort, pagination and stats
  // Note: Returns actions: [] (empty), GET /interventions/{id} returns full actions
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
  if (filters.printed !== undefined) params.printed = filters.printed;

  const response = await tunnelApi.get('/interventions/', { params });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

export const createInterventionRaw = async (payload: any) => {
  const response = await tunnelApi.post('/interventions', payload);
  return response.data?.data || response.data || {};
};

export const updateInterventionRaw = async (id: string, payload: any) => {
  const response = await tunnelApi.put(`/interventions/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Download intervention PDF
 * GET /exports/interventions/{id}/pdf
 * @returns Response with blob data and filename in Content-Disposition header
 */
export const downloadInterventionPDFRaw = async (id: string) => {
  return await tunnelApi.get(`/exports/interventions/${id}/pdf`, {
    responseType: 'blob',
  });
};

/**
 * Get QR code URL for intervention
 * GET /exports/interventions/{id}/qrcode
 * @returns URL string for QR code image
 */
export const getInterventionQRCodeUrl = (id: string) => {
  const baseUrl = tunnelApi.defaults.baseURL || '';
  const token = localStorage.getItem('auth_access_token');
  const url = `${baseUrl}/exports/interventions/${id}/qrcode`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
};
