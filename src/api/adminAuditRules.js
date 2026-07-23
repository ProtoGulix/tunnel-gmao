/**
 * API Admin — Règles d'audit (routine vs sensible par entité et champ)
 * @module api/adminAuditRules
 */

import { api } from '@/lib/api/client';

export async function fetchAuditRules(entityType) {
  const r = await api.get('/admin/audit-rules', { params: entityType ? { entity_type: entityType } : undefined });
  return r.data?.data || r.data;
}

export async function createAuditRule(data) {
  const r = await api.post('/admin/audit-rules', data);
  return r.data?.data || r.data;
}

export async function updateAuditRule(id, data) {
  const r = await api.patch(`/admin/audit-rules/${id}`, data);
  return r.data?.data || r.data;
}

export async function fetchAuditReasons(entityType) {
  const r = await api.get('/audit/reasons', { params: entityType ? { entity_type: entityType } : undefined });
  return r.data?.data || r.data;
}

export async function fetchAuditKnownFields(entityType) {
  const r = await api.get('/admin/audit-rules/known-fields', { params: { entity_type: entityType } });
  const data = r.data?.data || r.data;
  return data?.fields ?? [];
}
