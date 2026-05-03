/**
 * API Admin — Sécurité (logs, blocklist IP, domaines)
 * @module api/adminSecurity
 */

import { api } from '@/lib/api/client';

// --- Logs de sécurité ---
export async function fetchSecurityLogs(params = {}) {
  const r = await api.get('/admin/security-logs', { params });
  return r.data?.data || r.data;
}

// --- IP Bloquées ---
export async function fetchIpBlocklist() {
  const r = await api.get('/admin/ip-blocklist');
  return r.data?.data || r.data;
}
export async function createIpBlock(data) {
  const r = await api.post('/admin/ip-blocklist', data);
  return r.data?.data || r.data;
}
export async function deleteIpBlock(id) {
  await api.delete(`/admin/ip-blocklist/${id}`);
}

// --- Domaines email autorisés ---
export async function fetchEmailDomainRules() {
  const r = await api.get('/admin/email-domain-rules');
  return r.data?.data || r.data;
}
export async function createEmailDomainRule(data) {
  const r = await api.post('/admin/email-domain-rules', data);
  return r.data?.data || r.data;
}
export async function deleteEmailDomainRule(id) {
  await api.delete(`/admin/email-domain-rules/${id}`);
}
