/**
 * Part Templates Adapter - Tunnel Backend
 *
 * Public API for part templates management. Orchestrates datasource and mapper.
 *
 * @module lib/api/adapters/tunnel/partTemplates/adapter
 */

import {
  fetchPartTemplatesRaw,
  fetchPartTemplateRaw,
  fetchPartTemplateVersionsRaw,
  createPartTemplateRaw,
  createPartTemplateVersionRaw,
  deletePartTemplateRaw,
} from './datasource';
import {
  mapPartTemplateToFrontend,
  mapPartTemplateToBackend,
} from './mapper';

export const partTemplatesAdapter = {
  /**
   * Fetch all part templates (latest versions only)
   */
  fetchTemplates: async () => {
    const raw = await fetchPartTemplatesRaw();
    return Array.isArray(raw) ? raw.map(mapPartTemplateToFrontend) : [];
  },

  /**
   * Fetch a specific template with its fields
   */
  fetchTemplate: async (id: number, version?: number) => {
    const raw = await fetchPartTemplateRaw(id, version);
    return mapPartTemplateToFrontend(raw);
  },

  /**
   * Fetch all versions of a template by code
   */
  fetchTemplateVersions: async (code: string) => {
    const raw = await fetchPartTemplateVersionsRaw(code);
    return Array.isArray(raw) ? raw.map(mapPartTemplateToFrontend) : [];
  },

  /**
   * Create a new template (v1)
   */
  createTemplate: async (payload: any) => {
    const backendPayload = mapPartTemplateToBackend(payload);
    const raw = await createPartTemplateRaw(backendPayload);
    return mapPartTemplateToFrontend(raw);
  },

  /**
   * Create a new version of an existing template
   */
  createTemplateVersion: async (id: number, payload: any) => {
    const backendPayload = mapPartTemplateToBackend(payload);
    const raw = await createPartTemplateVersionRaw(id, backendPayload);
    return mapPartTemplateToFrontend(raw);
  },

  /**
   * Delete a template or a specific version
   */
  deleteTemplate: async (id: number, version?: number) => {
    await deletePartTemplateRaw(id, version);
  },
};
