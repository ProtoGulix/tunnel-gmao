/**
 * Part Templates Datasource - Tunnel Backend
 *
 * Raw HTTP calls to the backend. No mapping/transformation here.
 *
 * @module lib/api/adapters/tunnel/partTemplates/datasource
 */

import { tunnelApi } from '../client';

/**
 * GET /part-templates
 * Liste des templates (dernière version)
 */
export const fetchPartTemplatesRaw = async (): Promise<any[]> => {
  const response = await tunnelApi.get('/part-templates/');
  const data = response.data;
  return Array.isArray(data) ? data : data?.data || [];
};

/**
 * GET /part-templates/{id}?version=X
 * Template complet avec champs
 */
export const fetchPartTemplateRaw = async (id: number, version?: number): Promise<any> => {
  const params = version ? { version } : {};
  const response = await tunnelApi.get(`/part-templates/${id}`, { params });
  return response.data?.data || response.data || {};
};

/**
 * GET /part-templates/code/{code}
 * Toutes les versions d'un template
 */
export const fetchPartTemplateVersionsRaw = async (code: string): Promise<any[]> => {
  const response = await tunnelApi.get(`/part-templates/code/${code}`);
  const data = response.data;
  return Array.isArray(data) ? data : data?.data || [];
};

/**
 * POST /part-templates
 * Créer un nouveau template (v1)
 */
export const createPartTemplateRaw = async (payload: any): Promise<any> => {
  const response = await tunnelApi.post('/part-templates', payload);
  return response.data?.data || response.data;
};

/**
 * POST /part-templates/{id}/versions
 * Créer une nouvelle version d'un template
 */
export const createPartTemplateVersionRaw = async (id: number, payload: any): Promise<any> => {
  const response = await tunnelApi.post(`/part-templates/${id}/versions`, payload);
  return response.data?.data || response.data;
};

/**
 * DELETE /part-templates/{id}?version=X
 * Supprimer un template ou une version
 */
export const deletePartTemplateRaw = async (id: number, version?: number): Promise<void> => {
  const params = version ? { version } : {};
  await tunnelApi.delete(`/part-templates/${id}`, { params });
};
