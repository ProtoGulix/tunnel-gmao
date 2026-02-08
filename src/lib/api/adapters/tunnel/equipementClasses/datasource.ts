/**
 * Equipement Classes Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/equipementClasses/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const fetchEquipementClassesRaw = async () => {
  const response = await tunnelApi.get('/equipement_class/');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

export const fetchEquipementClassRaw = async (id: string) => {
  const response = await tunnelApi.get(`/equipement_class/${id}`);
  return response.data?.data || response.data || {};
};

export const createEquipementClassRaw = async (data: any) => {
  const response = await tunnelApi.post('/equipement_class/', data);
  return response.data?.data || response.data || {};
};

export const updateEquipementClassRaw = async (id: string, data: any) => {
  const response = await tunnelApi.patch(`/equipement_class/${id}`, data);
  return response.data?.data || response.data || {};
};

export const deleteEquipementClassRaw = async (id: string) => {
  await tunnelApi.delete(`/equipement_class/${id}`);
};
