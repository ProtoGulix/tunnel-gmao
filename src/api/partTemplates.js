/**
 * Part Templates API
 *
 * @module api/partTemplates
 */

import { api } from '@/lib/api/client';

/**
 * Fetch all part templates (latest version of each)
 * @returns {Promise<Array>} Array of templates with fields
 */
export async function fetchPartTemplates() {
  const response = await api.get('/part-templates/');
  return response.data || [];
}

/**
 * Fetch a specific template by id
 * @param {string} templateId - Template UUID
 * @param {number} [version] - Specific version (latest if omitted)
 * @returns {Promise<Object>} Template with full fields
 */
export async function fetchPartTemplate(templateId, version) {
  const params = version ? { version } : {};
  const response = await api.get(`/part-templates/${templateId}`, { params });
  return response.data || null;
}

/**
 * Create a new part template (version 1)
 * @param {Object} payload - Template data
 * @param {string} payload.code - Template code (ex: VIS_STANDARD)
 * @param {string} payload.label - Human-readable label
 * @param {string} payload.pattern - Dimension pattern (ex: {DIAM}x{LONG})
 * @param {Array} payload.fields - Template fields
 * @returns {Promise<Object>} Created template
 */
export async function createPartTemplate(payload) {
  const response = await api.post('/part-templates/', payload);
  return response.data || null;
}

/**
 * Create a new version of an existing template
 * @param {string} templateId - Template UUID
 * @param {Object} payload - Updated template data (pattern + fields)
 * @returns {Promise<Object>} New version info
 */
export async function createPartTemplateVersion(templateId, payload) {
  const response = await api.post(`/part-templates/${templateId}/versions`, payload);
  return response.data || null;
}

/**
 * Delete a template or a specific version
 * @param {string} templateId - Template UUID
 * @param {number} [version] - Version to delete (all versions if omitted)
 * @returns {Promise<Object>} Deletion result
 */
export async function deletePartTemplate(templateId, version) {
  const params = version ? { version } : {};
  const response = await api.delete(`/part-templates/${templateId}`, { params });
  return response.data || null;
}
