/**
 * Interventions Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/interventions/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';
import { mapActionToDomain } from '../actions/mapper';

export const interventionsAdapter = {
  async fetchInterventions(filters: any = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionsRaw(filters);
      return raw.map(mapper.mapInterventionToDomain).filter(Boolean);
    }, 'TunnelInterventions.fetchInterventions');
  },

  async fetchIntervention(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionRaw(id);
      const intervention = mapper.mapInterventionToDomain(raw) as any;

      // Map nested actions if present
      if (Array.isArray(raw.actions)) {
        intervention.actions = raw.actions.map(mapActionToDomain).filter(Boolean);
      }

      return intervention;
    }, `TunnelInterventions.fetchIntervention:${id}`);
  },

  async createIntervention(payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapInterventionPayloadToBackend(payload);
      const raw = await datasource.createInterventionRaw(backendPayload);
      return mapper.mapInterventionToDomain(raw);
    }, 'TunnelInterventions.createIntervention');
  },

  async updateIntervention(id: string, updates: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapInterventionPayloadToBackend(updates);
      const raw = await datasource.updateInterventionRaw(id, backendPayload);
      return mapper.mapInterventionToDomain(raw);
    }, `TunnelInterventions.updateIntervention:${id}`);
  },

  async updateStatus(interventionId: string, status: string) {
    return apiCall(async () => {
      const raw = await datasource.updateInterventionRaw(interventionId, { status_actual: status });
      return mapper.mapInterventionToDomain(raw);
    }, `TunnelInterventions.updateStatus:${interventionId}`);
  },

  /**
   * Download intervention PDF report
   * Downloads the PDF file directly to the browser
   * @param interventionId - Intervention ID
   * @returns Promise<{ success: boolean, filename?: string }>
   */
  async downloadInterventionPDF(interventionId: string) {
    return apiCall(async () => {
      const response = await datasource.downloadInterventionPDFRaw(interventionId);
      
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'intervention.pdf';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    }, `TunnelInterventions.downloadInterventionPDF:${interventionId}`);
  },

  /**
   * Fetch intervention PDF as blob (for preview/display)
   * Returns blob URL that can be used in iframe or object tag
   * @param interventionId - Intervention ID
   * @returns Promise<string> - Blob URL (must be revoked when done)
   */
  async fetchInterventionPDFBlob(interventionId: string) {
    return apiCall(async () => {
      const response = await datasource.downloadInterventionPDFRaw(interventionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      return window.URL.createObjectURL(blob);
    }, `TunnelInterventions.fetchInterventionPDFBlob:${interventionId}`);
  },

  /**
   * Get QR code URL for intervention
   * Returns a URL that can be used in an <img> tag
   * @param interventionId - Intervention ID
   * @returns { url: string }
   */
  getQRCodeUrl(interventionId: string) {
    const url = datasource.getInterventionQRCodeUrl(interventionId);
    return { url };
  },

  addAction: undefined,
  addPart: undefined,
};
