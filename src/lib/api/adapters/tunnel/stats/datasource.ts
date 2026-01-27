/**
 * Stats Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/stats/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

/**
 * Converts a Date object or ISO string to YYYY-MM-DD format
 */
const formatDate = (date: string | Date | undefined): string | undefined => {
  if (!date) return undefined;

  const dateObj = date instanceof Date ? date : new Date(date);

  // Check if valid date
  if (isNaN(dateObj.getTime())) return undefined;

  // Format to YYYY-MM-DD
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const fetchServiceStatusRaw = async (startDate?: string | Date, endDate?: string | Date) => {
  const params: any = {};

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  if (formattedStartDate) params.start_date = formattedStartDate;
  if (formattedEndDate) params.end_date = formattedEndDate;

  const response = await tunnelApi.get('/stats/service-status', { params });
  return response.data || {};
};
