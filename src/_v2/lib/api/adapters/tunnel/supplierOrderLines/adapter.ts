/**
 * Supplier Order Lines Adapter - Tunnel Backend
 *
 * Orchestrates datasource and mapper for supplier order lines.
 *
 * @module lib/api/adapters/tunnel/supplierOrderLines/adapter
 */

import * as datasource from './datasource';
import * as mapper from './mapper';
import { apiCall } from '@/lib/api/errors';

export const supplierOrderLinesAdapter = {
  async fetchSupplierOrderLines(params?: {
    skip?: number;
    limit?: number;
    supplierOrderId?: string;
    stockItemId?: string;
    isSelected?: boolean;
  }) {
    return apiCall(async () => {
      const backendParams = params ? {
        skip: params.skip,
        limit: params.limit,
        supplier_order_id: params.supplierOrderId,
        stock_item_id: params.stockItemId,
        is_selected: params.isSelected,
      } : undefined;

      const raw = await datasource.fetchSupplierOrderLinesRaw(backendParams);
      return raw.map(mapper.mapSupplierOrderLineToDomain).filter(Boolean);
    }, 'TunnelSupplierOrderLines.fetchSupplierOrderLines');
  },

  async fetchSupplierOrderLine(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchSupplierOrderLineRaw(id);
      return mapper.mapSupplierOrderLineToDomain(raw);
    }, `TunnelSupplierOrderLines.fetchSupplierOrderLine:${id}`);
  },

  async fetchSupplierOrderLinesByOrder(supplierOrderId: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchSupplierOrderLinesByOrderRaw(supplierOrderId);
      return raw.map(mapper.mapSupplierOrderLineToDomain).filter(Boolean);
    }, `TunnelSupplierOrderLines.fetchByOrder:${supplierOrderId}`);
  },

  async createSupplierOrderLine(payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapSupplierOrderLinePayloadToBackend(payload);
      const raw = await datasource.createSupplierOrderLineRaw(backendPayload);
      return mapper.mapSupplierOrderLineToDomain(raw);
    }, 'TunnelSupplierOrderLines.createSupplierOrderLine');
  },

  async updateSupplierOrderLine(id: string, payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapSupplierOrderLinePayloadToBackend(payload);
      const raw = await datasource.updateSupplierOrderLineRaw(id, backendPayload);
      return mapper.mapSupplierOrderLineToDomain(raw);
    }, `TunnelSupplierOrderLines.updateSupplierOrderLine:${id}`);
  },

  async deleteSupplierOrderLine(id: string) {
    return apiCall(async () => {
      await datasource.deleteSupplierOrderLineRaw(id);
    }, `TunnelSupplierOrderLines.deleteSupplierOrderLine:${id}`);
  },

  async linkPurchaseRequest(lineId: string, purchaseRequestId: string, quantity: number) {
    return apiCall(async () => {
      const raw = await datasource.linkPurchaseRequestRaw(lineId, {
        purchase_request_id: purchaseRequestId,
        quantity,
      });
      return raw;
    }, `TunnelSupplierOrderLines.linkPurchaseRequest:${lineId}`);
  },

  async unlinkPurchaseRequest(lineId: string, purchaseRequestId: string) {
    return apiCall(async () => {
      await datasource.unlinkPurchaseRequestRaw(lineId, purchaseRequestId);
    }, `TunnelSupplierOrderLines.unlinkPurchaseRequest:${lineId}`);
  },
};
