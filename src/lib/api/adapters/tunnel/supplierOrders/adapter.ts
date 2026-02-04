/**
 * Supplier Orders Adapter - Tunnel Backend
 *
 * Orchestrates datasource and mapper for supplier orders.
 *
 * @module lib/api/adapters/tunnel/supplierOrders/adapter
 */

import * as datasource from './datasource';
import * as mapper from './mapper';
import { apiCall } from '@/lib/api/errors';

export const supplierOrdersAdapter = {
  async fetchSupplierOrders(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    supplierId?: string;
  }) {
    return apiCall(async () => {
      const backendParams = params ? {
        skip: params.skip,
        limit: params.limit,
        status: params.status,
        supplier_id: params.supplierId,
      } : undefined;

      const raw = await datasource.fetchSupplierOrdersRaw(backendParams);
      return raw.map(mapper.mapSupplierOrderToDomain).filter(Boolean);
    }, 'TunnelSupplierOrders.fetchSupplierOrders');
  },

  async fetchSupplierOrder(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchSupplierOrderRaw(id);
      return mapper.mapSupplierOrderToDomain(raw);
    }, `TunnelSupplierOrders.fetchSupplierOrder:${id}`);
  },

  async fetchSupplierOrderByNumber(orderNumber: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchSupplierOrderByNumberRaw(orderNumber);
      return mapper.mapSupplierOrderToDomain(raw);
    }, `TunnelSupplierOrders.fetchByNumber:${orderNumber}`);
  },

  async createSupplierOrder(payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapSupplierOrderPayloadToBackend(payload);
      const raw = await datasource.createSupplierOrderRaw(backendPayload);
      return mapper.mapSupplierOrderToDomain(raw);
    }, 'TunnelSupplierOrders.createSupplierOrder');
  },

  async updateSupplierOrder(id: string, payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapSupplierOrderPayloadToBackend(payload);
      const raw = await datasource.updateSupplierOrderRaw(id, backendPayload);
      return mapper.mapSupplierOrderToDomain(raw);
    }, `TunnelSupplierOrders.updateSupplierOrder:${id}`);
  },

  async deleteSupplierOrder(id: string) {
    return apiCall(async () => {
      await datasource.deleteSupplierOrderRaw(id);
    }, `TunnelSupplierOrders.deleteSupplierOrder:${id}`);
  },

  async exportCSV(id: string) {
    return apiCall(async () => {
      return await datasource.exportSupplierOrderCSVRaw(id);
    }, `TunnelSupplierOrders.exportCSV:${id}`);
  },

  async exportEmail(id: string, format: 'text' | 'html' = 'text') {
    return apiCall(async () => {
      const raw = await datasource.exportSupplierOrderEmailRaw(id, format);
      return raw;
    }, `TunnelSupplierOrders.exportEmail:${id}:${format}`);
  },
};
