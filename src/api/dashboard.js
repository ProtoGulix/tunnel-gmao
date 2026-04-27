import { api } from '@/lib/api/client';

export async function fetchDashboardSummary() {
  const res = await api.get('/dashboard/summary');
  return res.data?.data || res.data || {};
}
